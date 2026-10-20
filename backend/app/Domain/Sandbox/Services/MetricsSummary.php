<?php

namespace App\Domain\Sandbox\Services;

use App\Domain\Sandbox\Enums\Platform;

/** Totals and the ratios derived from them. Money is integer cents; ratios are plain numbers (ctr as a fraction). */
final class MetricsSummary
{
    /**
     * @param  array{impressions: int|string|null, clicks: int|string|null, cost: int|string|null, conversions: float|int|string|null, conversions_value: int|string|null, reach?: int|string|null}  $totals
     * @return array<string, int|float|null>
     */
    public static function from(Platform $platform, array $totals): array
    {
        $impressions = (int) ($totals['impressions'] ?? 0);
        $clicks = (int) ($totals['clicks'] ?? 0);
        $cost = (int) ($totals['cost'] ?? 0);
        $conversions = round((float) ($totals['conversions'] ?? 0), 2);
        $value = (int) ($totals['conversions_value'] ?? 0);
        $reach = isset($totals['reach']) ? (int) $totals['reach'] : null;

        return [
            'impressions' => $impressions,
            'clicks' => $clicks,
            'cost' => $cost,
            'conversions' => $conversions,
            'conversions_value' => $value,
            'ctr' => $impressions > 0 ? round($clicks / $impressions, 4) : 0.0,
            'average_cpc' => $clicks > 0 ? (int) round($cost / $clicks) : 0,
            'cost_per_conversion' => $conversions > 0 ? (int) round($cost / $conversions) : 0,
            'roas' => $cost > 0 ? round($value / $cost, 2) : 0.0,
            // Meta only: reach is people, frequency is impressions per person, CPM is cost per 1,000 impressions.
            'reach' => $platform === Platform::Meta ? $reach : null,
            'frequency' => $platform === Platform::Meta && $reach ? round($impressions / $reach, 2) : null,
            'cpm' => $platform === Platform::Meta && $impressions > 0 ? (int) round($cost * 1000 / $impressions) : null,
        ];
    }
}
