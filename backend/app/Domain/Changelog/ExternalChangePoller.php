<?php

namespace App\Domain\Changelog;

use App\Domain\Advertising\Models\Campaign;
use App\Domain\Advertising\Providers\ProviderManager;
use App\Domain\Advertising\StateDiffer;
use App\Domain\Changelog\Enums\ChangeSource;
use App\Domain\Changelog\Models\ChangelogEntry;
use Illuminate\Support\Facades\DB;

/** Mirrors changes made directly in Google Ads / Meta into the changelog. */
class ExternalChangePoller
{
    public function __construct(private ProviderManager $providers) {}

    /** @return int number of changelog entries written */
    public function poll(Campaign $campaign): int
    {
        $remote = $this->providers->reader($campaign->account)->fetch($campaign->account, $campaign->external_id);
        $diff = StateDiffer::diff($campaign->live, array_diff_key($remote, ['type' => 1]));

        if ($diff === []) {
            return 0;
        }

        DB::transaction(function () use ($campaign, $diff, $remote) {
            foreach ($diff as $field => $change) {
                ChangelogEntry::create([
                    'campaign_id' => $campaign->id,
                    'source' => ChangeSource::External,
                    'field' => $field,
                    'old_value' => $change['old'],
                    'new_value' => $change['new'],
                    'occurred_at' => now(),
                ]);
            }
            $campaign->applyLive(array_merge($campaign->live, $remote));
        });

        return count($diff);
    }
}
