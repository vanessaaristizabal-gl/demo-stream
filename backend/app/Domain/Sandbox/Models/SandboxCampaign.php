<?php

namespace App\Domain\Sandbox\Models;

use App\Domain\Sandbox\Enums\Platform;
use Database\Factories\SandboxCampaignFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * A campaign in the simulated Google Ads / Meta sandbox. Not connected to real accounts or the governed write path.
 *
 * @property int $id
 * @property string $idempotency_key
 * @property string $fingerprint
 * @property Platform $platform
 * @property string $external_id
 * @property string $name
 * @property string $goal
 * @property string $status
 * @property int $daily_budget
 * @property array<string, mixed> $inputs
 * @property array<string, mixed> $structure
 * @property int|null $created_by
 * @property Carbon|null $created_at
 */
#[UseFactory(SandboxCampaignFactory::class)]
#[Fillable(['idempotency_key', 'fingerprint', 'platform', 'external_id', 'name', 'goal', 'status', 'daily_budget', 'inputs', 'structure', 'created_by'])]
class SandboxCampaign extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'platform' => Platform::class,
            'inputs' => 'array',
            'structure' => 'array',
        ];
    }

    /** @return HasMany<SandboxMetric, $this> */
    public function metrics(): HasMany
    {
        return $this->hasMany(SandboxMetric::class)->orderBy('date');
    }
}
