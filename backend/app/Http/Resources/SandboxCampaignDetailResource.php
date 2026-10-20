<?php

namespace App\Http\Resources;

use App\Domain\Sandbox\Models\SandboxCampaign;
use App\Domain\Sandbox\Models\SandboxMetric;
use App\Domain\Sandbox\Services\MetricsSummary;
use Illuminate\Http\Request;

/** @mixin SandboxCampaign */
class SandboxCampaignDetailResource extends SandboxCampaignResource
{
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'inputs' => $this->inputs,
            'structure' => $this->structure,
            'daily_metrics' => $this->metrics->map(fn (SandboxMetric $m) => [
                'date' => $m->date->toDateString(),
                'impressions' => $m->impressions,
                'clicks' => $m->clicks,
                'cost' => $m->cost,
                'conversions' => (float) $m->conversions,
                'conversions_value' => $m->conversions_value,
                'reach' => $m->reach,
            ])->values(),
        ];
    }

    /** @return array<string, int|float|null> */
    protected function totals(): array
    {
        return MetricsSummary::from($this->platform, [
            'impressions' => $this->metrics->sum('impressions'),
            'clicks' => $this->metrics->sum('clicks'),
            'cost' => $this->metrics->sum('cost'),
            'conversions' => $this->metrics->sum('conversions'),
            'conversions_value' => $this->metrics->sum('conversions_value'),
            'reach' => $this->metrics->sum('reach'),
        ]);
    }
}
