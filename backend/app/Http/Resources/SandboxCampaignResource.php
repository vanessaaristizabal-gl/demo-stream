<?php

namespace App\Http\Resources;

use App\Domain\Sandbox\Models\SandboxCampaign;
use App\Domain\Sandbox\Services\MetricsSummary;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * List shape. The list query adds the `*_total` sums; the detail resource extends this with structure and daily metrics.
 *
 * @mixin SandboxCampaign
 */
class SandboxCampaignResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'platform' => $this->platform->value,
            'external_id' => $this->external_id,
            'name' => $this->name,
            'goal' => $this->goal,
            'status' => $this->status,
            'daily_budget' => $this->daily_budget,
            'created_at' => $this->created_at?->toIso8601String(),
            'totals' => $this->totals(),
        ];
    }

    /** @return array<string, int|float|null> */
    protected function totals(): array
    {
        return MetricsSummary::from($this->platform, [
            'impressions' => $this->getAttribute('impressions_total'),
            'clicks' => $this->getAttribute('clicks_total'),
            'cost' => $this->getAttribute('cost_total'),
            'conversions' => $this->getAttribute('conversions_total'),
            'conversions_value' => $this->getAttribute('conversions_value_total'),
            'reach' => $this->getAttribute('reach_total'),
        ]);
    }
}
