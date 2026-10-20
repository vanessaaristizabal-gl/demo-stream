<?php

namespace App\Domain\Advertising\Providers;

use App\Domain\Advertising\Models\AdAccount;
use App\Domain\Advertising\Models\Campaign;
use Illuminate\Support\Facades\Cache;

/** Deterministic in-memory provider for local development and tests. */
class FakeProvider implements AdProvider
{
    /** @var array<string, string> field => error returned by validate() */
    public array $validationErrors = [];

    /** @var array<string, string> field => error returned by mutate() */
    public array $writeFailures = [];

    /** @var list<array{campaign: int, changes: array<string, mixed>, key: string}> */
    public array $writes = [];

    public function fetch(AdAccount $account, string $externalId): array
    {
        return $this->remote($account->id, $externalId)
            ?? Campaign::query()->where('ad_account_id', $account->id)->where('external_id', $externalId)->firstOrFail()->live;
    }

    /** Remote state lives in the cache so the web server, queue worker and scheduler share one fake provider. */
    private function remote(int $accountId, string $externalId): ?array
    {
        return Cache::get("fake_provider.{$accountId}.{$externalId}");
    }

    private function store(Campaign $campaign, array $state): void
    {
        Cache::forever("fake_provider.{$campaign->ad_account_id}.{$campaign->external_id}", $state);
    }

    /** Simulate a change made directly in the provider UI. */
    public function externalEdit(Campaign $campaign, array $changes): void
    {
        $this->store($campaign, array_merge($this->remote($campaign->ad_account_id, $campaign->external_id) ?? $campaign->live, $changes));
    }

    public function validate(Campaign $campaign, array $changes): array
    {
        return array_intersect_key($this->validationErrors, $changes);
    }

    public function mutate(Campaign $campaign, array $changes, string $idempotencyKey): array
    {
        $this->writes[] = ['campaign' => $campaign->id, 'changes' => $changes, 'key' => $idempotencyKey];
        $state = $this->remote($campaign->ad_account_id, $campaign->external_id) ?? $campaign->live;

        $result = [];
        foreach ($changes as $field => $value) {
            if (isset($this->writeFailures[$field])) {
                $result[$field] = ['ok' => false, 'error' => $this->writeFailures[$field]];

                continue;
            }
            $state[$field] = $value;
            $result[$field] = ['ok' => true];
        }

        $this->store($campaign, $state);

        return $result;
    }
}
