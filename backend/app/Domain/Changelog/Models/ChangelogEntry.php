<?php

namespace App\Domain\Changelog\Models;

use App\Domain\Advertising\Models\Campaign;
use App\Domain\Changelog\Enums\ChangeSource;
use App\Domain\Identity\Models\User;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $campaign_id
 * @property ChangeSource $source
 * @property int|null $change_request_id
 * @property string $field
 * @property mixed $old_value
 * @property mixed $new_value
 * @property Carbon $occurred_at
 */
#[Fillable(['campaign_id', 'source', 'actor_id', 'approver_id', 'change_request_id', 'field', 'old_value', 'new_value', 'occurred_at'])]
class ChangelogEntry extends Model
{
    protected function casts(): array
    {
        return [
            'source' => ChangeSource::class,
            'old_value' => 'array',
            'new_value' => 'array',
            'occurred_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Campaign, $this> */
    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    /** @return BelongsTo<User, $this> */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    /** @return BelongsTo<User, $this> */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}
