<?php

namespace App\Domain\Advertising\Contracts;

use App\Domain\Advertising\Models\Campaign;

/**
 * The only way to change a live account. Only the Governance module may depend on this
 * (enforced by tests/Arch), which is what makes "every write goes through the governed path" structural.
 */
interface CampaignWriter
{
    /**
     * Dry run: ask the provider to validate the changes without applying them.
     *
     * @param  array<string, mixed>  $changes
     * @return array<string, string> field => error message; empty when valid
     */
    public function validate(Campaign $campaign, array $changes): array;

    /**
     * Write the changes. Must be safe to retry with the same idempotency key.
     *
     * @param  array<string, mixed>  $changes
     * @return array<string, array{ok: bool, error?: string}> per-field outcome
     */
    public function mutate(Campaign $campaign, array $changes, string $idempotencyKey): array;
}
