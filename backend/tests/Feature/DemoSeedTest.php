<?php

use App\Domain\Changelog\Models\ChangelogEntry;
use App\Domain\Governance\Enums\ChangeStatus;
use App\Domain\Governance\Models\ChangeRequest;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\DemoActivitySeeder;
use Laravel\Sanctum\Sanctum;

use function Tests\user;

it('seeds approvals and changelog that show every kind of outcome', function () {
    $this->seed(DatabaseSeeder::class);

    expect(ChangeRequest::pluck('status')->map->value->unique()->sort()->values()->all())
        ->toBe(['applied', 'blocked', 'pending_approval', 'rejected'])
        ->and(ChangelogEntry::where('source', 'platform')->count())->toBeGreaterThanOrEqual(2)
        ->and(ChangelogEntry::where('source', 'external')->count())->toBe(2);
});

it('records who acted and who approved on the seeded receipts', function () {
    $this->seed(DatabaseSeeder::class);

    $viaApprover = ChangeRequest::where('idempotency_key', 'demo-2')->first();
    $viaPolicy = ChangeRequest::where('idempotency_key', 'demo-1')->first();
    $blocked = ChangeRequest::where('idempotency_key', 'demo-4')->first();

    expect($viaApprover->status)->toBe(ChangeStatus::Applied)
        ->and($viaApprover->approved_by)->not->toBeNull()
        ->and($viaApprover->approved_by)->not->toBe($viaApprover->requested_by)
        ->and($viaPolicy->status)->toBe(ChangeStatus::Applied)
        ->and($viaPolicy->policy_id)->not->toBeNull()
        ->and($blocked->status)->toBe(ChangeStatus::Blocked)
        ->and($blocked->failure['violations'][0]['rule_id'] ?? null)->toBe('TOY-001');
});

it('shows the seeded data through the API', function () {
    $this->seed(DatabaseSeeder::class);
    Sanctum::actingAs(user());

    $this->getJson('/api/change-requests?status=pending_approval')->assertOk()->assertJsonCount(2, 'data');
    expect($this->getJson('/api/changelog')->assertOk()->json('data'))->not->toBeEmpty();
});

it('does not duplicate the demo activity when run again', function () {
    $this->seed(DatabaseSeeder::class);
    $requests = ChangeRequest::count();
    $entries = ChangelogEntry::count();

    $this->seed(DemoActivitySeeder::class);

    expect(ChangeRequest::count())->toBe($requests)->and(ChangelogEntry::count())->toBe($entries);
});
