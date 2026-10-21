<?php

namespace App\Http\Resources;

use App\Domain\Advertising\Models\AdAccount;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property int|null $campaigns_count
 *
 * @mixin AdAccount
 */
class AccountResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'provider' => $this->provider->value,
            'external_id' => $this->external_id,
            'dealer_name' => $this->dealer_name,
            'manufacturer' => $this->manufacturer,
            // Integer cents: this account's own monthly budget; null when it has none yet.
            'monthly_budget' => $this->monthly_budget,
            'campaigns_count' => $this->campaigns_count ?? $this->campaigns()->count(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
