<?php

namespace App\Domain\Advertising\Contracts;

use App\Domain\Advertising\Models\AdAccount;

/** Read-only view of a provider. Safe to use anywhere; it cannot change a live account. */
interface CampaignReader
{
    /**
     * Current live state of a campaign, straight from the provider.
     *
     * @return array<string, mixed> includes at least name, type and status
     */
    public function fetch(AdAccount $account, string $externalId): array;
}
