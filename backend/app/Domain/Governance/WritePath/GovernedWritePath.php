<?php

namespace App\Domain\Governance\WritePath;

use App\Domain\Advertising\Models\Campaign;
use App\Domain\Advertising\Providers\ProviderManager;
use App\Domain\Advertising\StateDiffer;
use App\Domain\Changelog\Enums\ChangeSource;
use App\Domain\Changelog\Models\ChangelogEntry;
use App\Domain\Compliance\ComplianceEngine;
use App\Domain\Governance\Enums\ChangeStatus;
use App\Domain\Governance\Exceptions\GovernanceException;
use App\Domain\Governance\Jobs\ApplyChangeRequest;
use App\Domain\Governance\Models\ChangeRequest;
use App\Domain\Governance\Models\SystemFlag;
use App\Domain\Identity\Enums\UserRole;
use App\Domain\Identity\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * The single path through which a change reaches a live ad account:
 * resolve against live state -> compliance -> approval (person or policy) -> dry run -> write -> receipt.
 */
class GovernedWritePath
{
    public function __construct(
        private ProviderManager $providers,
        private ComplianceEngine $compliance,
        private PolicyMatcher $policies,
    ) {}

    public function submit(Campaign $campaign, array $changes, User $actor, string $idempotencyKey): ChangeRequest
    {
        if ($existing = $this->existing($idempotencyKey, $campaign, $changes)) {
            return $existing;
        }

        $this->guardWritable($campaign, array_keys($changes));

        $live = $this->live($campaign);
        $diff = StateDiffer::diff($live, $changes);

        $status = ChangeStatus::PendingApproval;
        $failure = null;
        $policyId = null;

        if ($diff === []) {
            $status = ChangeStatus::NoChanges;
        } elseif ($violations = $this->compliance->evaluate($campaign, array_merge($live, $changes))) {
            $status = ChangeStatus::Blocked;
            $failure = ['violations' => array_map(fn ($v) => $v->toArray(), $violations)];
        } elseif ($policy = $this->policies->match($diff)) {
            $status = ChangeStatus::Approved;
            $policyId = $policy->id;
        }

        try {
            $request = ChangeRequest::create([
                'campaign_id' => $campaign->id,
                'requested_by' => $actor->id,
                'policy_id' => $policyId,
                'idempotency_key' => $idempotencyKey,
                'changes' => $changes,
                'diff' => $diff,
                'status' => $status,
                'failure' => $failure,
            ]);
        } catch (UniqueConstraintViolationException) {
            return $this->existing($idempotencyKey, $campaign, $changes) ?? throw GovernanceException::idempotencyConflict();
        }

        if ($status === ChangeStatus::Approved) {
            ApplyChangeRequest::dispatch($request->id);

            return $request->refresh(); // a sync queue may already have applied it
        }

        return $request;
    }

    public function approve(ChangeRequest $request, User $approver): ChangeRequest
    {
        $this->guardDecider($request, $approver);

        $claimed = ChangeRequest::query()->whereKey($request->id)
            ->where('status', ChangeStatus::PendingApproval)
            ->update(['status' => ChangeStatus::Approved, 'approved_by' => $approver->id]);

        if ($claimed === 0) {
            throw GovernanceException::invalidTransition('Only pending changes can be approved.');
        }

        ApplyChangeRequest::dispatch($request->id);

        return $request->refresh();
    }

    public function reject(ChangeRequest $request, User $approver): ChangeRequest
    {
        $this->guardDecider($request, $approver);

        $claimed = ChangeRequest::query()->whereKey($request->id)
            ->where('status', ChangeStatus::PendingApproval)
            ->update(['status' => ChangeStatus::Rejected, 'approved_by' => $approver->id]);

        if ($claimed === 0) {
            throw GovernanceException::invalidTransition('Only pending changes can be rejected.');
        }

        return $request->refresh();
    }

    /** Executes an approved change. Safe to call twice: only one worker wins the claim. */
    public function apply(ChangeRequest $request): ChangeRequest
    {
        $claimed = ChangeRequest::query()->whereKey($request->id)
            ->where('status', ChangeStatus::Approved)
            ->update(['status' => ChangeStatus::Applying]);

        if ($claimed === 0) {
            return $request->refresh();
        }

        $request->refresh();
        $campaign = $request->campaign()->with('account')->first();
        $provider = $this->providers->for($campaign->account);

        if (SystemFlag::isOn(SystemFlag::EMERGENCY_STOP)) {
            return $this->finish($request, ChangeStatus::Blocked, failure: ['reason' => 'emergency_stop']);
        }

        // Live state may have moved since submission: resolve again.
        $live = $provider->fetch($campaign->account, $campaign->external_id);
        $diff = StateDiffer::diff($live, $request->changes);

        if ($diff === []) {
            return $this->finish($request, ChangeStatus::NoChanges, diff: $diff);
        }

        if ($violations = $this->compliance->evaluate($campaign, array_merge($live, $request->changes))) {
            return $this->finish($request, ChangeStatus::Blocked, diff: $diff, failure: ['violations' => array_map(fn ($v) => $v->toArray(), $violations)]);
        }

        $values = array_map(fn ($d) => $d['new'], $diff);

        if ($errors = $provider->validate($campaign, $values)) {
            return $this->finish($request, ChangeStatus::Failed, diff: $diff, failure: ['dry_run' => $errors]);
        }

        try {
            $results = $provider->mutate($campaign, $values, $request->idempotency_key);
        } catch (\Throwable $e) {
            // Outcome unknown: the poller will reconcile whatever actually landed.
            return $this->finish($request, ChangeStatus::Failed, diff: $diff, failure: ['exception' => class_basename($e).': '.Str::limit($e->getMessage(), 200), 'outcome_unknown' => true]);
        }

        $ok = array_keys(array_filter($results, fn ($r) => $r['ok']));
        $errors = collect($results)->reject(fn ($r) => $r['ok'])->map(fn ($r) => $r['error'] ?? 'unknown error')->all();

        DB::transaction(function () use ($request, $campaign, $diff, $ok, $live) {
            foreach ($ok as $field) {
                ChangelogEntry::create([
                    'campaign_id' => $campaign->id,
                    'source' => ChangeSource::Platform,
                    'actor_id' => $request->requested_by,
                    'approver_id' => $request->approved_by,
                    'change_request_id' => $request->id,
                    'field' => $field,
                    'old_value' => $diff[$field]['old'],
                    'new_value' => $diff[$field]['new'],
                    'occurred_at' => now(),
                ]);
                $live[$field] = $diff[$field]['new'];
            }
            $campaign->applyLive($live);
        });

        $status = match (true) {
            $errors === [] => ChangeStatus::Applied,
            $ok === [] => ChangeStatus::Failed,
            default => ChangeStatus::PartiallyFailed,
        };

        return $this->finish($request, $status, diff: $diff, failure: $errors ? ['fields' => $errors] : null, applied: $ok);
    }

    private function finish(ChangeRequest $request, ChangeStatus $status, ?array $diff = null, ?array $failure = null, array $applied = []): ChangeRequest
    {
        $request->update(['status' => $status, 'diff' => $diff ?? $request->diff, 'failure' => $failure, 'applied' => $applied]);

        return $request;
    }

    private function live(Campaign $campaign): array
    {
        return $this->providers->for($campaign->account)->fetch($campaign->account, $campaign->external_id);
    }

    private function guardWritable(Campaign $campaign, array $fields): void
    {
        if (SystemFlag::isOn(SystemFlag::EMERGENCY_STOP)) {
            throw GovernanceException::emergencyStop();
        }
        foreach ($fields as $field) {
            if ($campaign->isLocked($field)) {
                throw GovernanceException::fieldLocked($field);
            }
        }
    }

    private function guardDecider(ChangeRequest $request, User $approver): void
    {
        if (! $approver->hasRole(UserRole::Approver, UserRole::Admin)) {
            throw GovernanceException::notApprover();
        }
        if ($approver->id === $request->requested_by) {
            throw GovernanceException::selfApproval();
        }
    }

    private function existing(string $key, Campaign $campaign, array $changes): ?ChangeRequest
    {
        $request = ChangeRequest::query()->where('idempotency_key', $key)->first();
        if ($request === null) {
            return null;
        }
        if ($request->campaign_id !== $campaign->id || $request->changes != $changes) {
            throw GovernanceException::idempotencyConflict();
        }

        return $request;
    }
}
