<?php

namespace App\Domain\Advertising\Services;

use App\Domain\Advertising\Models\AdAccount;
use App\Domain\Advertising\Models\Campaign;
use App\Domain\Advertising\Providers\ProviderManager;

/** Adopts an existing campaign in place: same external ID, no pause, no rebuild. */
class CampaignAdopter
{
    public function __construct(private ProviderManager $providers) {}

    public function adopt(AdAccount $account, string $externalId): Campaign
    {
        $live = $this->providers->reader($account)->fetch($account, $externalId);

        return Campaign::query()->updateOrCreate(
            ['ad_account_id' => $account->id, 'external_id' => $externalId],
            ['name' => $live['name'], 'type' => $live['type'], 'status' => $live['status'], 'live' => $live, 'desired' => $live, 'adopted_at' => now()],
        );
    }
}
