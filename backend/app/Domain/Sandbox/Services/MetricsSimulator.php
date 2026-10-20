<?php

namespace App\Domain\Sandbox\Services;

use App\Domain\Sandbox\Enums\Platform;
use Illuminate\Support\Carbon;

/**
 * Produces believable, repeatable daily performance for a simulated campaign: the same campaign id always gives
 * the same numbers. Spend follows the budget (with a ramp-up and a weekend dip); the rest follows typical
 * dealership ranges: Google Search has a high CTR and CPC, Meta has a cheap CPM and a low CTR.
 */
class MetricsSimulator
{
    public const DAYS = 30;

    /**
     * @return list<array{date: string, impressions: int, clicks: int, cost: int, conversions: float, conversions_value: int, reach: int|null}>
     */
    public function days(Platform $platform, string $externalId, int $dailyBudget, Carbon $endingBefore): array
    {
        $seed = crc32("{$platform->value}:{$externalId}");
        $rows = [];

        for ($i = 0; $i < self::DAYS; $i++) {
            $date = $endingBefore->copy()->startOfDay()->subDays(self::DAYS - $i);
            $ramp = min(1.0, 0.45 + $i * 0.04);
            $weekend = $date->isWeekend() ? 0.8 : 1.0;
            $cost = (int) round($dailyBudget * $ramp * $weekend * (0.7 + 0.3 * $this->next($seed)));

            if ($platform === Platform::Google) {
                $cpc = (int) round(180 + 220 * $this->next($seed));          // $1.80 - $4.00
                $clicks = max(1, intdiv($cost, $cpc));
                $impressions = (int) round($clicks / (0.04 + 0.04 * $this->next($seed)));
                $reach = null;
            } else {
                $cpm = (int) round(800 + 800 * $this->next($seed));          // $8 - $16 per 1,000
                $impressions = max(1, intdiv($cost * 1000, $cpm));
                $clicks = (int) round($impressions * (0.008 + 0.008 * $this->next($seed)));
                $reach = (int) round($impressions / (1.1 + 0.5 * $this->next($seed)));
            }

            $conversions = round($clicks * (0.04 + 0.05 * $this->next($seed)), 2);

            $rows[] = [
                'date' => $date->toDateString(),
                'impressions' => $impressions,
                'clicks' => $clicks,
                'cost' => $cost,
                'conversions' => $conversions,
                'conversions_value' => (int) round($conversions * (9000 + 6000 * $this->next($seed))),
                'reach' => $reach,
            ];
        }

        return $rows;
    }

    /** Small linear congruential generator: no global random state, so results are repeatable. */
    private function next(int &$state): float
    {
        $state = ($state * 1103515245 + 12345) & 0x7FFFFFFF;

        return $state / 0x7FFFFFFF;
    }
}
