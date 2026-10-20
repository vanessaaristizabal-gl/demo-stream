<?php

namespace App\Http\Resources;

use App\Domain\Advertising\Models\Campaign;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Campaign */
class CampaignResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'external_id' => $this->external_id,
            'name' => $this->name,
            'type' => $this->type,
            'status' => $this->status,
            'live' => $this->live,
            'locks' => $this->locks ?? [],
            // Dates leave the API as ISO 8601 with an offset; the UI owns display formatting (see .claude/rules/dates-and-formats.md).
            'created_at' => $this->created_at?->toIso8601String(),
            'adopted_at' => $this->adopted_at?->toIso8601String(),
            'account' => $this->whenLoaded('account', fn () => [
                'id' => $this->account->id,
                'provider' => $this->account->provider->value,
                'external_id' => $this->account->external_id,
                'dealer_name' => $this->account->dealer_name,
                'manufacturer' => $this->account->manufacturer,
            ]),
        ];
    }
}
