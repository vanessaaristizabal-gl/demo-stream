<?php

namespace App\Domain\Advertising\Models;

use Database\Factories\CampaignFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $ad_account_id
 * @property string $external_id
 * @property string $name
 * @property string $type
 * @property string $status
 * @property array<string, mixed>|null $desired
 * @property array<string, mixed> $live
 * @property list<string>|null $locks
 * @property Carbon|null $created_at
 * @property Carbon|null $adopted_at
 * @property AdAccount $account
 */
#[UseFactory(CampaignFactory::class)]
#[Fillable(['ad_account_id', 'external_id', 'name', 'type', 'status', 'desired', 'live', 'locks', 'adopted_at'])]
class Campaign extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'desired' => 'array',
            'live' => 'array',
            'locks' => 'array',
            'adopted_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<AdAccount, $this> */
    public function account(): BelongsTo
    {
        return $this->belongsTo(AdAccount::class, 'ad_account_id');
    }

    /** Replace the mirrored live state, keeping the denormalised columns in step. */
    public function applyLive(array $live): void
    {
        $this->forceFill([
            'live' => $live,
            'name' => $live['name'] ?? $this->name,
            'status' => $live['status'] ?? $this->status,
        ])->save();
    }

    public function isLocked(string $field): bool
    {
        return in_array($field, $this->locks ?? [], true);
    }
}
