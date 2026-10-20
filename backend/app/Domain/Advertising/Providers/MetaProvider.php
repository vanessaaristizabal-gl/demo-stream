<?php

namespace App\Domain\Advertising\Providers;

use App\Domain\Advertising\Models\AdAccount;
use App\Domain\Advertising\Models\Campaign;
use Illuminate\Http\Client\RequestException;

/**
 * Meta Marketing API (Graph). Supports name, status and daily_budget (minor units).
 * NOTE: not yet exercised against a live Meta account; verify with a test ad account.
 */
class MetaProvider implements AdProvider
{
    use RetriesRateLimits;

    private const FIELDS = ['name', 'status', 'daily_budget'];

    public function fetch(AdAccount $account, string $externalId): array
    {
        $data = $this->http()->get($externalId, ['fields' => 'name,status,daily_budget,objective'])->json();

        return [
            'name' => $data['name'],
            'type' => 'social',
            'status' => strtolower($data['status']),
            'daily_budget' => isset($data['daily_budget']) ? (int) $data['daily_budget'] : null,
        ];
    }

    public function validate(Campaign $campaign, array $changes): array
    {
        if ($unsupported = array_diff(array_keys($changes), self::FIELDS)) {
            return array_fill_keys($unsupported, 'unsupported_field');
        }

        try {
            $this->http()->asForm()->post($campaign->external_id, $this->payload($changes) + ['execution_options' => ['validate_only']]);

            return [];
        } catch (RequestException $e) {
            return array_fill_keys(array_keys($changes), $e->response->json('error.message') ?? $e->getMessage());
        }
    }

    public function mutate(Campaign $campaign, array $changes, string $idempotencyKey): array
    {
        try {
            $this->http()->asForm()->post($campaign->external_id, $this->payload($changes));

            return array_map(fn () => ['ok' => true], $changes);
        } catch (RequestException $e) {
            $error = $e->response->json('error.message') ?? $e->getMessage();

            return array_map(fn () => ['ok' => false, 'error' => $error], $changes);
        }
    }

    private function payload(array $changes): array
    {
        if (isset($changes['status'])) {
            $changes['status'] = strtoupper($changes['status']);
        }

        return $changes;
    }

    private function http()
    {
        return $this->client('https://graph.facebook.com/'.config('services.meta.version'))
            ->withToken(config('services.meta.access_token'));
    }
}
