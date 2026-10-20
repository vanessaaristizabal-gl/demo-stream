<?php

use App\Domain\Advertising\Providers\FakeProvider;
use App\Domain\Changelog\Enums\ChangeSource;
use App\Domain\Changelog\ExternalChangePoller;
use App\Domain\Changelog\Models\ChangelogEntry;
use App\Domain\Governance\Enums\ChangeStatus;
use App\Domain\Governance\Exceptions\GovernanceException;
use App\Domain\Governance\Models\ChangeRequest;
use App\Domain\Governance\Models\Policy;
use App\Domain\Governance\Models\SystemFlag;
use App\Domain\Governance\WritePath\GovernedWritePath;
use App\Domain\Identity\Enums\UserRole;

use function Tests\campaign;
use function Tests\fakeProvider;
use function Tests\toyotaRulebook;
use function Tests\user;

beforeEach(function () {
    $this->path = app(GovernedWritePath::class);
    $this->strategist = user();
    $this->approver = user(UserRole::Approver);
});

it('queues a change for approval, then writes it and leaves a receipt', function () {
    $c = campaign();

    $req = $this->path->submit($c, ['status' => 'paused'], $this->strategist, 'key-1');
    expect($req->status)->toBe(ChangeStatus::PendingApproval)->and(fakeProvider()->writes)->toBeEmpty();

    $this->path->approve($req, $this->approver); // sync queue in tests

    $req->refresh();
    expect($req->status)->toBe(ChangeStatus::Applied)
        ->and($c->refresh()->live['status'])->toBe('paused')
        ->and($c->status)->toBe('paused');

    $receipt = ChangelogEntry::where('change_request_id', $req->id)->sole();
    expect($receipt->actor_id)->toBe($this->strategist->id)
        ->and($receipt->approver_id)->toBe($this->approver->id)
        ->and($receipt->old_value)->toBe('active')
        ->and($receipt->new_value)->toBe('paused');
});

it('is idempotent on the key: same request returns the same change, no second write', function () {
    $c = campaign();
    $a = $this->path->submit($c, ['status' => 'paused'], $this->strategist, 'dup');
    $b = $this->path->submit($c, ['status' => 'paused'], $this->strategist, 'dup');

    expect($b->id)->toBe($a->id)->and(ChangeRequest::count())->toBe(1);
});

it('rejects reuse of a key for a different change', function () {
    $c = campaign();
    $this->path->submit($c, ['status' => 'paused'], $this->strategist, 'dup');

    $this->path->submit($c, ['name' => 'Other'], $this->strategist, 'dup');
})->throws(GovernanceException::class, 'already used');

it('does not apply the same approved change twice', function () {
    $c = campaign();
    $req = $this->path->submit($c, ['status' => 'paused'], $this->strategist, 'once');
    $this->path->approve($req, $this->approver);

    $this->path->apply($req->refresh());
    $this->path->apply($req->refresh());

    expect(fakeProvider()->writes)->toHaveCount(1);
});

it('records no-op changes without writing', function () {
    $req = $this->path->submit(campaign(), ['status' => 'active'], $this->strategist, 'noop');

    expect($req->status)->toBe(ChangeStatus::NoChanges)->and(fakeProvider()->writes)->toBeEmpty();
});

it('blocks changes that break a manufacturer rule', function () {
    toyotaRulebook();
    $req = $this->path->submit(campaign(), ['daily_budget' => 90000], $this->strategist, 'bad');

    expect($req->status)->toBe(ChangeStatus::Blocked)
        ->and($req->failure['violations'][0]['rule_id'])->toBe('TOY-001');
});

it('re-checks compliance at apply time when the rule changed after approval', function () {
    $c = campaign();
    $req = $this->path->submit($c, ['daily_budget' => 60000], $this->strategist, 'late');
    toyotaRulebook(); // rule appears while the request waits for approval

    $this->path->approve($req, $this->approver);

    expect($req->refresh()->status)->toBe(ChangeStatus::Blocked)->and(fakeProvider()->writes)->toBeEmpty();
});

it('refuses writes to locked fields', function () {
    $c = campaign(['locks' => ['name']]);

    $this->path->submit($c, ['name' => 'New'], $this->strategist, 'lock');
})->throws(GovernanceException::class, 'locked');

it('refuses writes during an emergency stop and blocks already-approved work', function () {
    $c = campaign();
    $req = $this->path->submit($c, ['status' => 'paused'], $this->strategist, 'stop-1');

    SystemFlag::set(SystemFlag::EMERGENCY_STOP, true);
    $this->path->approve($req, $this->approver);
    expect($req->refresh()->status)->toBe(ChangeStatus::Blocked)->and($req->failure['reason'])->toBe('emergency_stop');

    expect(fn () => $this->path->submit($c, ['name' => 'X'], $this->strategist, 'stop-2'))
        ->toThrow(GovernanceException::class, 'Emergency stop');
});

it('enforces four-eyes and role on approval', function () {
    $req = $this->path->submit(campaign(), ['status' => 'paused'], $this->approver, 'eyes');

    expect(fn () => $this->path->approve($req, $this->approver))->toThrow(GovernanceException::class, 'requested it')
        ->and(fn () => $this->path->approve($req, $this->strategist))->toThrow(GovernanceException::class, 'Only approvers');
});

it('cannot approve or reject a change twice', function () {
    $req = $this->path->submit(campaign(), ['status' => 'paused'], $this->strategist, 'twice');
    $this->path->reject($req, $this->approver);

    expect(fn () => $this->path->approve($req, $this->approver))->toThrow(GovernanceException::class);
    expect($req->refresh()->status)->toBe(ChangeStatus::Rejected);
});

it('auto-approves when a pre-approved policy covers the change', function () {
    Policy::create(['name' => 'pause', 'allowed_fields' => ['status'], 'max_budget_delta_pct' => null]);
    $c = campaign();

    $req = $this->path->submit($c, ['status' => 'paused'], $this->strategist, 'policy');

    expect($req->refresh()->status)->toBe(ChangeStatus::Applied)
        ->and($req->approved_by)->toBeNull()
        ->and($req->policy_id)->not->toBeNull();
});

it('does not auto-approve a budget move beyond the policy limit', function () {
    Policy::create(['name' => 'small', 'allowed_fields' => ['daily_budget'], 'max_budget_delta_pct' => 10]);

    $small = $this->path->submit(campaign(), ['daily_budget' => 10500], $this->strategist, 's');
    $big = $this->path->submit(campaign(), ['daily_budget' => 20000], $this->strategist, 'b');

    expect($small->refresh()->status)->toBe(ChangeStatus::Applied)
        ->and($big->status)->toBe(ChangeStatus::PendingApproval);
});

it('fails on dry run without writing anything', function () {
    fakeProvider()->validationErrors = ['name' => 'too long'];
    $req = $this->path->submit(campaign(), ['name' => 'X'], $this->strategist, 'dry');
    $this->path->approve($req, $this->approver);

    expect($req->refresh()->status)->toBe(ChangeStatus::Failed)
        ->and($req->failure['dry_run'])->toBe(['name' => 'too long'])
        ->and(fakeProvider()->writes)->toBeEmpty();
});

it('handles partial failure: logs only what landed and reports the rest', function () {
    fakeProvider()->writeFailures = ['daily_budget' => 'quota exceeded'];
    $c = campaign();
    $req = $this->path->submit($c, ['status' => 'paused', 'daily_budget' => 10500], $this->strategist, 'partial');
    $this->path->approve($req, $this->approver);

    $req->refresh();
    expect($req->status)->toBe(ChangeStatus::PartiallyFailed)
        ->and($req->applied)->toBe(['status'])
        ->and($req->failure['fields'])->toBe(['daily_budget' => 'quota exceeded'])
        ->and(ChangelogEntry::where('change_request_id', $req->id)->pluck('field')->all())->toBe(['status'])
        ->and($c->refresh()->live['daily_budget'])->toBe(10000);
});

it('marks the outcome unknown when the provider throws', function () {
    $this->instance(FakeProvider::class, new class extends FakeProvider
    {
        public function mutate($campaign, array $changes, string $idempotencyKey): array
        {
            throw new RuntimeException('timeout');
        }
    });
    $path = app(GovernedWritePath::class);
    $req = $path->submit(campaign(), ['status' => 'paused'], $this->strategist, 'boom');
    $path->approve($req, $this->approver);

    expect($req->refresh()->status)->toBe(ChangeStatus::Failed)->and($req->failure['outcome_unknown'])->toBeTrue();
});

it('mirrors changes made directly in the provider into the changelog', function () {
    $c = campaign();
    fakeProvider()->externalEdit($c, ['daily_budget' => 77700, 'status' => 'paused']);

    $count = app(ExternalChangePoller::class)->poll($c->load('account'));

    expect($count)->toBe(2)
        ->and(ChangelogEntry::where('source', ChangeSource::External)->count())->toBe(2)
        ->and($c->refresh()->live['daily_budget'])->toBe(77700);

    // Polling again finds nothing new.
    expect(app(ExternalChangePoller::class)->poll($c))->toBe(0);
});

it('does not log platform writes again as external changes', function () {
    $c = campaign();
    $req = $this->path->submit($c, ['status' => 'paused'], $this->strategist, 'mine');
    $this->path->approve($req, $this->approver);

    expect(app(ExternalChangePoller::class)->poll($c->refresh()))->toBe(0);
});

it('only approvers can reject, and nobody rejects their own request', function () {
    $req = $this->path->submit(campaign(), ['status' => 'paused'], $this->approver, 'rej-own');

    expect(fn () => $this->path->reject($req, $this->strategist))->toThrow(GovernanceException::class, 'Only approvers')
        ->and(fn () => $this->path->reject($req, $this->approver))->toThrow(GovernanceException::class, 'requested it');
    expect($req->refresh()->status)->toBe(ChangeStatus::PendingApproval);
});

it('rejects reuse of a key for the same change on a different campaign', function () {
    $this->path->submit(campaign(), ['status' => 'paused'], $this->strategist, 'shared-key');

    $this->path->submit(campaign(), ['status' => 'paused'], $this->strategist, 'shared-key');
})->throws(GovernanceException::class, 'already used');

it('does not auto-approve when a policy covers only some of the changed fields', function () {
    Policy::create(['name' => 'status only', 'allowed_fields' => ['status']]);

    $req = $this->path->submit(campaign(), ['status' => 'paused', 'name' => 'Renamed'], $this->strategist, 'partial-policy');

    expect($req->status)->toBe(ChangeStatus::PendingApproval)->and($req->policy_id)->toBeNull();
});

it('records no changes at apply time when live state already matches (drifted while waiting)', function () {
    $c = campaign();
    $req = $this->path->submit($c, ['status' => 'paused'], $this->strategist, 'drift');
    fakeProvider()->externalEdit($c, ['status' => 'paused']); // someone paused it directly meanwhile

    $this->path->approve($req, $this->approver);

    expect($req->refresh()->status)->toBe(ChangeStatus::NoChanges)
        ->and(fakeProvider()->writes)->toBeEmpty()
        ->and(ChangelogEntry::where('change_request_id', $req->id)->count())->toBe(0);
});

it('stores a short, class-qualified failure for provider exceptions instead of the raw message', function () {
    $this->instance(FakeProvider::class, new class extends FakeProvider
    {
        public function mutate($campaign, array $changes, string $idempotencyKey): array
        {
            throw new RuntimeException(str_repeat('provider response body with details ', 40));
        }
    });
    $path = app(GovernedWritePath::class);
    $req = $path->submit(campaign(), ['status' => 'paused'], $this->strategist, 'long-error');
    $path->approve($req, $this->approver);

    $stored = $req->refresh()->failure['exception'];
    expect($stored)->toStartWith('RuntimeException: ')->and(strlen($stored))->toBeLessThanOrEqual(225);
});
