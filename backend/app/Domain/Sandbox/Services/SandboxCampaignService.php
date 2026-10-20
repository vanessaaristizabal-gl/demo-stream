<?php

namespace App\Domain\Sandbox\Services;

use App\Domain\Sandbox\Enums\Platform;
use App\Domain\Sandbox\Exceptions\SandboxException;
use App\Domain\Sandbox\Models\SandboxCampaign;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

/**
 * Creates simulated campaigns. This is a demo sandbox: it never talks to a provider and never touches real accounts,
 * so it is separate from the governed write path (see docs/adr/0006-demo-sandbox.md).
 *
 * @phpstan-import-type Inputs from StructureBuilder
 */
class SandboxCampaignService
{
    public function __construct(private StructureBuilder $structures, private MetricsSimulator $metrics) {}

    /**
     * Idempotent: the same key with the same inputs returns the same campaign (wasRecentlyCreated is false);
     * the same key with different inputs is rejected.
     *
     * @param  Inputs  $inputs
     */
    public function create(array $inputs, string $idempotencyKey, ?int $userId): SandboxCampaign
    {
        $fingerprint = sha1(json_encode($inputs, JSON_THROW_ON_ERROR));

        if ($existing = $this->existing($idempotencyKey, $fingerprint)) {
            return $existing;
        }

        $platform = Platform::from($inputs['platform']);
        $externalId = $this->externalId($platform);
        $now = now();

        try {
            return DB::transaction(function () use ($inputs, $idempotencyKey, $fingerprint, $platform, $externalId, $userId, $now) {
                $campaign = SandboxCampaign::query()->create([
                    'idempotency_key' => $idempotencyKey,
                    'fingerprint' => $fingerprint,
                    'platform' => $platform,
                    'external_id' => $externalId,
                    'name' => $inputs['name'],
                    'goal' => $inputs['goal'],
                    'status' => 'active',
                    'daily_budget' => $inputs['daily_budget'],
                    'inputs' => $inputs,
                    'structure' => $this->structures->build($platform, $externalId, $inputs, $now->copy()),
                    'created_by' => $userId,
                ]);

                $campaign->metrics()->createMany($this->metrics->days($platform, $externalId, $inputs['daily_budget'], $now));

                return $campaign;
            });
        } catch (UniqueConstraintViolationException) {
            // A concurrent request with the same key won the race: return its campaign.
            return $this->existing($idempotencyKey, $fingerprint) ?? throw SandboxException::idempotencyConflict();
        }
    }

    private function existing(string $key, string $fingerprint): ?SandboxCampaign
    {
        $found = SandboxCampaign::query()->where('idempotency_key', $key)->first();

        if ($found && $found->fingerprint !== $fingerprint) {
            throw SandboxException::idempotencyConflict();
        }

        return $found;
    }

    /** Google Ads ids are about 10 digits; Meta ids about 17. */
    private function externalId(Platform $platform): string
    {
        do {
            $id = (string) ($platform === Platform::Google ? random_int(1_000_000_000, 9_999_999_999) : random_int(100_000_000_000_000, 999_999_999_999_999));
        } while (SandboxCampaign::query()->where('platform', $platform)->where('external_id', $id)->exists());

        return $id;
    }
}
