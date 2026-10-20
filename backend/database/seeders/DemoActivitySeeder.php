<?php

namespace Database\Seeders;

use App\Domain\Advertising\Models\Campaign;
use App\Domain\Advertising\Providers\FakeProvider;
use App\Domain\Changelog\ExternalChangePoller;
use App\Domain\Changelog\Models\ChangelogEntry;
use App\Domain\Governance\Enums\ChangeStatus;
use App\Domain\Governance\Models\ChangeRequest;
use App\Domain\Governance\WritePath\GovernedWritePath;
use App\Domain\Identity\Models\User;
use Illuminate\Database\Seeder;

/**
 * Demo activity so Approvals and Changelog are not empty on a fresh install.
 * Everything goes through the real governed write path (policy auto-approval, four-eyes approval, rejection,
 * a compliance block, and edits made directly in the provider), so the receipts are genuine.
 * Safe to run again: it does nothing once the demo requests exist. Only runs with the fake provider.
 */
class DemoActivitySeeder extends Seeder
{
    public function run(GovernedWritePath $path, ExternalChangePoller $poller, FakeProvider $provider): void
    {
        if (config('services.providers_driver') !== 'fake' || ChangeRequest::query()->where('idempotency_key', 'like', 'demo-%')->exists()) {
            return;
        }

        $strategist = User::query()->where('email', 'strategist@example.com')->first();
        $approver = User::query()->where('email', 'approver@example.com')->first();
        $campaigns = Campaign::query()->with('account')->orderBy('id')->get()->filter(fn (Campaign $c) => ! $c->locks)->values();

        if (! $strategist || ! $approver || $campaigns->count() < 7) {
            return;
        }

        [$a, $b, $c, $d, $e, $f, $g] = $campaigns->all();
        $age = [];   // change request id => days ago

        // Dealer of campaign A is a Toyota dealer, so the Toyota rulebook applies to it.
        $a->account->update(['manufacturer' => 'toyota']);

        // 1. Covered by the pre-approved policy (small budget move): applied with no approver.
        $age[$this->settle($path, $path->submit($a, ['daily_budget' => 10500], $strategist, 'demo-1'))->id] = 6;

        // 2. Four-eyes: the strategist asks, the approver approves, the change is written.
        $age[$this->decide($path, $path->submit($b, ['name' => $b->name.' (Spring promo)'], $strategist, 'demo-2'), $approver, true)->id] = 4;

        // 3. Rejected by the approver.
        $age[$this->decide($path, $path->submit($c, ['daily_budget' => 16000], $strategist, 'demo-3'), $approver, false)->id] = 3;

        // 4. Blocked by the manufacturer rulebook (Toyota caps the daily budget at $500).
        $age[$path->submit($a, ['daily_budget' => 60000], $strategist, 'demo-4')->id] = 2;

        // 5 and 6. Waiting for approval.
        $age[$path->submit($d, ['daily_budget' => 20000], $strategist, 'demo-5')->id] = 1;
        $age[$path->submit($e, ['name' => $e->name.' - Fall lease'], $strategist, 'demo-6')->id] = 0;

        foreach ($age as $id => $days) {
            ChangeRequest::query()->whereKey($id)->update(['created_at' => now()->subDays($days)->subHours(2)]);
            ChangelogEntry::query()->where('change_request_id', $id)->update(['occurred_at' => now()->subDays($days)]);
        }

        // 7 and 8. Edits made directly in Google Ads / Meta, mirrored into the changelog by the poller.
        $provider->externalEdit($f, ['daily_budget' => 12000]);
        $poller->poll($f);
        $provider->externalEdit($g, ['status' => 'paused']);
        $poller->poll($g);
        ChangelogEntry::query()->where('source', 'external')->update(['occurred_at' => now()->subHours(5)]);
    }

    private function decide(GovernedWritePath $path, ChangeRequest $request, User $approver, bool $approve): ChangeRequest
    {
        if ($request->status !== ChangeStatus::PendingApproval) {
            return $request;
        }

        return $this->settle($path, $approve ? $path->approve($request, $approver) : $path->reject($request, $approver));
    }

    /** With a real queue an approved change waits for a worker; the demo applies it now (safe: only one claim wins). */
    private function settle(GovernedWritePath $path, ChangeRequest $request): ChangeRequest
    {
        return $request->status === ChangeStatus::Approved ? $path->apply($request) : $request;
    }
}
