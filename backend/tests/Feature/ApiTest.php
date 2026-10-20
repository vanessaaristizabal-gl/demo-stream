<?php

use App\Domain\Governance\Models\Policy;
use App\Domain\Governance\Models\SystemFlag;
use App\Domain\Identity\Enums\UserRole;
use App\Domain\Playbooks\Models\Playbook;
use Laravel\Sanctum\Sanctum;

use function Tests\campaign;
use function Tests\user;

it('requires authentication', function () {
    $this->getJson('/api/campaigns')->assertUnauthorized();
});

it('logs in and returns a token', function () {
    $u = user();

    $this->postJson('/api/login', ['email' => $u->email, 'password' => 'password'])
        ->assertOk()->assertJsonStructure(['token', 'user' => ['id', 'role']]);
    $this->postJson('/api/login', ['email' => $u->email, 'password' => 'nope'])->assertUnprocessable();
});

it('submits a change through the API and requires an Idempotency-Key', function () {
    Sanctum::actingAs(user());
    $c = campaign();

    $this->postJson("/api/campaigns/{$c->id}/changes", ['changes' => ['status' => 'paused']])->assertUnprocessable();

    $this->postJson("/api/campaigns/{$c->id}/changes", ['changes' => ['status' => 'paused']], ['Idempotency-Key' => 'k1'])
        ->assertCreated()->assertJsonPath('data.status', 'pending_approval');

    $this->postJson("/api/campaigns/{$c->id}/changes", ['changes' => ['status' => 'paused']], ['Idempotency-Key' => 'k1'])
        ->assertOk();
});

it('validates the changes payload', function () {
    Sanctum::actingAs(user());
    $c = campaign();

    $this->postJson("/api/campaigns/{$c->id}/changes", ['changes' => ['status' => 'deleted']], ['Idempotency-Key' => 'k'])
        ->assertUnprocessable();
});

it('maps governance errors to HTTP codes', function () {
    Sanctum::actingAs(user());
    $locked = campaign(['locks' => ['name']]);

    $this->postJson("/api/campaigns/{$locked->id}/changes", ['changes' => ['name' => 'x']], ['Idempotency-Key' => 'a'])
        ->assertStatus(409)->assertJsonPath('error', 'field_locked');

    SystemFlag::set(SystemFlag::EMERGENCY_STOP, true);
    $this->postJson('/api/campaigns/'.campaign()->id.'/changes', ['changes' => ['name' => 'x']], ['Idempotency-Key' => 'b'])
        ->assertStatus(423)->assertJsonPath('error', 'emergency_stop');
});

it('only lets approvers decide and applies on approval', function () {
    $c = campaign();
    Sanctum::actingAs(user());
    $id = $this->postJson("/api/campaigns/{$c->id}/changes", ['changes' => ['status' => 'paused']], ['Idempotency-Key' => 'k'])->json('data.id');

    $this->postJson("/api/change-requests/{$id}/approve")->assertForbidden();

    Sanctum::actingAs(user(UserRole::Approver));
    $this->postJson("/api/change-requests/{$id}/approve")->assertOk()->assertJsonPath('data.status', 'applied');
    $this->getJson('/api/changelog')->assertOk()->assertJsonCount(1, 'data');
});

it('restricts the emergency stop to admins', function () {
    Sanctum::actingAs(user(UserRole::Approver));
    $this->postJson('/api/emergency-stop', ['active' => true])->assertForbidden();

    Sanctum::actingAs(user(UserRole::Admin));
    $this->postJson('/api/emergency-stop', ['active' => true])->assertOk();
    $this->getJson('/api/emergency-stop')->assertJson(['active' => true]);
});

it('versions rulebooks and closes the previous one', function () {
    Sanctum::actingAs(user(UserRole::Admin));
    $rules = [['id' => 'R', 'field' => 'daily_budget', 'operator' => 'max', 'value' => 1]];

    $this->postJson('/api/rulebooks', ['manufacturer' => 'ford', 'effective_from' => '2026-01-01', 'rules' => $rules])->assertCreated()->assertJsonPath('version', 1);
    $this->postJson('/api/rulebooks', ['manufacturer' => 'ford', 'effective_from' => '2026-07-01', 'rules' => $rules])->assertCreated()->assertJsonPath('version', 2);

    $v1 = collect($this->getJson('/api/rulebooks')->json())->firstWhere('version', 1);
    expect($v1['effective_to'])->toStartWith('2026-07-01');
});

it('renders a playbook and returns 422 on missing variables', function () {
    Sanctum::actingAs(user(UserRole::Admin));
    $p = Playbook::create(['name' => 'p', 'template' => ['name' => '{{ dealer.name }}']]);

    $this->postJson("/api/playbooks/{$p->id}/render", ['context' => ['dealer' => ['name' => 'Acme']]])->assertOk()->assertJsonPath('config.name', 'Acme');
    $this->postJson("/api/playbooks/{$p->id}/render", ['context' => ['dealer' => []]])->assertUnprocessable();
});

it('reports the final status when a policy auto-approves and applies immediately', function () {
    Policy::create(['name' => 'pause', 'allowed_fields' => ['status']]);
    Sanctum::actingAs(user());
    $c = campaign();

    $this->postJson("/api/campaigns/{$c->id}/changes", ['changes' => ['status' => 'paused']], ['Idempotency-Key' => 'auto'])
        ->assertCreated()->assertJsonPath('data.status', 'applied');
});

it('exposes campaign dates as ISO 8601 with an offset', function () {
    Sanctum::actingAs(user());
    $c = campaign();
    $c->forceFill(['created_at' => '2026-10-01 14:30:00'])->save();

    $created = $this->getJson("/api/campaigns/{$c->id}")->assertOk()->json('data.created_at');

    expect($created)->toBe('2026-10-01T14:30:00+00:00')
        ->and(DateTimeImmutable::createFromFormat(DATE_ATOM, $created))->not->toBeFalse();
});
