<?php

namespace App\Http\Resources;

use App\Domain\Governance\Models\ChangeRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ChangeRequest */
class ChangeRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'campaign_id' => $this->campaign_id,
            'status' => $this->status->value,
            'changes' => $this->changes,
            'diff' => $this->diff,
            'failure' => $this->failure,
            'applied' => $this->applied,
            'idempotency_key' => $this->idempotency_key,
            'policy_id' => $this->policy_id,
            'created_at' => $this->created_at?->toIso8601String(),
            'campaign' => $this->whenLoaded('campaign', fn () => ['id' => $this->campaign->id, 'name' => $this->campaign->name]),
            'requester' => $this->whenLoaded('requester', fn () => ['id' => $this->requester->id, 'name' => $this->requester->name]),
            'approver' => $this->whenLoaded('approver', fn () => $this->approver ? ['id' => $this->approver->id, 'name' => $this->approver->name] : null),
        ];
    }
}
