<?php

namespace App\Domain\Governance\Models;

use App\Domain\Advertising\Models\Campaign;
use App\Domain\Changelog\Models\ChangelogEntry;
use App\Domain\Governance\Enums\ChangeStatus;
use App\Domain\Identity\Models\User;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $campaign_id
 * @property int $requested_by
 * @property int|null $approved_by
 * @property string $idempotency_key
 * @property array<string, mixed> $changes
 * @property array<string, array{old: mixed, new: mixed}>|null $diff
 * @property ChangeStatus $status
 * @property array<string, mixed>|null $failure
 * @property Campaign $campaign
 */
#[Fillable(['campaign_id', 'requested_by', 'approved_by', 'policy_id', 'idempotency_key', 'changes', 'diff', 'status', 'failure', 'applied'])]
class ChangeRequest extends Model
{
    protected function casts(): array
    {
        return [
            'changes' => 'array',
            'diff' => 'array',
            'failure' => 'array',
            'applied' => 'array',
            'status' => ChangeStatus::class,
        ];
    }

    /** @return BelongsTo<Campaign, $this> */
    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    /** @return BelongsTo<User, $this> */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /** @return BelongsTo<User, $this> */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /** @return HasMany<ChangelogEntry, $this> */
    public function receipts(): HasMany
    {
        return $this->hasMany(ChangelogEntry::class);
    }
}
