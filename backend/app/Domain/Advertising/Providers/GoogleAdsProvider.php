<?php

namespace App\Domain\Advertising\Providers;

use App\Domain\Advertising\Models\AdAccount;
use App\Domain\Advertising\Models\Campaign;
use Illuminate\Http\Client\RequestException;

/**
 * Google Ads REST API. Supports name and status only; budget lives on a separate
 * CampaignBudget resource and is rejected by validate() until that mutate is built.
 * NOTE: not yet exercised against a live account; verify with a test account.
 */
class GoogleAdsProvider implements AdProvider
{
    use RetriesRateLimits;

    private const FIELDS = ['name', 'status'];

    public function fetch(AdAccount $account, string $externalId): array
    {
        $query = "SELECT campaign.name, campaign.status, campaign.advertising_channel_type FROM campaign WHERE campaign.id = {$externalId}";
        $row = $this->http($account)->post("customers/{$account->external_id}/googleAds:search", ['query' => $query])->json('results.0.campaign');

        return [
            'name' => $row['name'],
            'type' => strtolower($row['advertisingChannelType']),
            'status' => strtolower($row['status']),
        ];
    }

    public function validate(Campaign $campaign, array $changes): array
    {
        if ($unsupported = array_diff(array_keys($changes), self::FIELDS)) {
            return array_fill_keys($unsupported, 'unsupported_field');
        }

        try {
            $this->mutateRequest($campaign, $changes, validateOnly: true);

            return [];
        } catch (RequestException $e) {
            return array_fill_keys(array_keys($changes), $e->response->json('error.message') ?? $e->getMessage());
        }
    }

    public function mutate(Campaign $campaign, array $changes, string $idempotencyKey): array
    {
        try {
            $this->mutateRequest($campaign, $changes, validateOnly: false);

            return array_map(fn () => ['ok' => true], $changes);
        } catch (RequestException $e) {
            $error = $e->response->json('error.message') ?? $e->getMessage();

            return array_map(fn () => ['ok' => false, 'error' => $error], $changes);
        }
    }

    private function mutateRequest(Campaign $campaign, array $changes, bool $validateOnly): void
    {
        $account = $campaign->account;
        if (isset($changes['status'])) {
            $changes['status'] = strtoupper($changes['status']);
        }

        $this->http($account)->post("customers/{$account->external_id}/campaigns:mutate", [
            'validateOnly' => $validateOnly,
            'operations' => [[
                'updateMask' => implode(',', array_keys($changes)),
                'update' => ['resourceName' => "customers/{$account->external_id}/campaigns/{$campaign->external_id}"] + $changes,
            ]],
        ]);
    }

    private function http(AdAccount $account)
    {
        return $this->client('https://googleads.googleapis.com/'.config('services.google_ads.version'))
            ->withToken(config('services.google_ads.access_token'))
            ->withHeaders(['developer-token' => config('services.google_ads.developer_token')]);
    }
}
