<?php

namespace App\Http\Resources;

use App\Domain\Changelog\Models\ChangelogEntry;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ChangelogEntry */
class ChangelogEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'source' => $this->source->value,
            'field' => $this->field,
            'old_value' => $this->old_value,
            'new_value' => $this->new_value,
            'occurred_at' => $this->occurred_at->toIso8601String(),
            'change_request_id' => $this->change_request_id,
            'campaign' => $this->whenLoaded('campaign', fn () => ['id' => $this->campaign->id, 'name' => $this->campaign->name]),
            'actor' => $this->whenLoaded('actor', fn () => $this->actor ? ['id' => $this->actor->id, 'name' => $this->actor->name] : null),
            'approver' => $this->whenLoaded('approver', fn () => $this->approver ? ['id' => $this->approver->id, 'name' => $this->approver->name] : null),
        ];
    }
}
