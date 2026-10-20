<?php

namespace App\Domain\Sandbox\Services;

use App\Domain\Sandbox\Enums\Platform;

/**
 * What each platform calls things: the campaign hierarchy, the goals a campaign can have and the metrics it reports.
 * Field names follow the Google Ads API (GAQL `metrics.*`) and the Meta Marketing API (Insights), so the sandbox
 * shows the vocabulary a real integration would meet. Money in this API is integer cents; the providers' own units are noted.
 */
final class PlatformCatalog
{
    /** @return array<string, string> goal => the platform's native setting for it */
    public static function goals(Platform $platform): array
    {
        return match ($platform) {
            Platform::Google => ['leads' => 'MAXIMIZE_CONVERSIONS', 'traffic' => 'MAXIMIZE_CLICKS', 'sales' => 'MAXIMIZE_CONVERSION_VALUE'],
            Platform::Meta => ['leads' => 'OUTCOME_LEADS', 'traffic' => 'OUTCOME_TRAFFIC', 'sales' => 'OUTCOME_SALES', 'awareness' => 'OUTCOME_AWARENESS'],
        };
    }

    /** @return list<array<string, mixed>> */
    public static function all(): array
    {
        return [self::describe(Platform::Google), self::describe(Platform::Meta)];
    }

    /** @return array<string, mixed> */
    public static function describe(Platform $platform): array
    {
        $goals = collect(self::goals($platform))
            ->map(fn (string $native, string $goal) => ['value' => $goal, 'label' => ucfirst($goal), 'native' => $native])
            ->values()->all();

        return match ($platform) {
            Platform::Google => [
                'platform' => 'google',
                'label' => 'Google Ads',
                'hierarchy' => ['Campaign', 'Ad group', 'Ad'],
                'goal_setting' => 'bidding_strategy_type',
                'goals' => $goals,
                'units' => 'The API reports money in micros (1,000,000 = 1 currency unit); this sandbox returns integer cents.',
                'metrics' => [
                    ['key' => 'impressions', 'native' => 'metrics.impressions', 'label' => 'Impressions', 'description' => 'Times an ad was shown on Google Search.'],
                    ['key' => 'clicks', 'native' => 'metrics.clicks', 'label' => 'Clicks', 'description' => 'Clicks on the ad.'],
                    ['key' => 'ctr', 'native' => 'metrics.ctr', 'label' => 'CTR', 'description' => 'Clicks divided by impressions.'],
                    ['key' => 'average_cpc', 'native' => 'metrics.average_cpc', 'label' => 'Average CPC', 'description' => 'Cost divided by clicks.'],
                    ['key' => 'cost', 'native' => 'metrics.cost_micros', 'label' => 'Cost', 'description' => 'Total spend.'],
                    ['key' => 'conversions', 'native' => 'metrics.conversions', 'label' => 'Conversions', 'description' => 'Actions that matter to the dealer (form fills, calls, bookings).'],
                    ['key' => 'conversions_value', 'native' => 'metrics.conversions_value', 'label' => 'Conversion value', 'description' => 'Value assigned to those conversions.'],
                    ['key' => 'cost_per_conversion', 'native' => 'metrics.cost_per_conversion', 'label' => 'Cost per conversion', 'description' => 'Cost divided by conversions.'],
                ],
            ],
            Platform::Meta => [
                'platform' => 'meta',
                'label' => 'Meta Ads',
                'hierarchy' => ['Campaign', 'Ad set', 'Ad'],
                'goal_setting' => 'objective',
                'goals' => $goals,
                'units' => 'The Marketing API reports spend as a decimal string in the account currency; this sandbox returns integer cents.',
                'metrics' => [
                    ['key' => 'impressions', 'native' => 'impressions', 'label' => 'Impressions', 'description' => 'Times an ad was on screen on Facebook or Instagram.'],
                    ['key' => 'reach', 'native' => 'reach', 'label' => 'Reach', 'description' => 'Unique people who saw the ad.'],
                    ['key' => 'frequency', 'native' => 'frequency', 'label' => 'Frequency', 'description' => 'Impressions divided by reach.'],
                    ['key' => 'clicks', 'native' => 'inline_link_clicks', 'label' => 'Link clicks', 'description' => 'Clicks that open the destination.'],
                    ['key' => 'ctr', 'native' => 'inline_link_click_ctr', 'label' => 'CTR', 'description' => 'Link clicks divided by impressions.'],
                    ['key' => 'average_cpc', 'native' => 'cost_per_inline_link_click', 'label' => 'CPC', 'description' => 'Spend divided by link clicks.'],
                    ['key' => 'cpm', 'native' => 'cpm', 'label' => 'CPM', 'description' => 'Cost per 1,000 impressions.'],
                    ['key' => 'cost', 'native' => 'spend', 'label' => 'Spend', 'description' => 'Total spend.'],
                    ['key' => 'conversions', 'native' => 'actions[action_type=lead]', 'label' => 'Results', 'description' => 'Leads or purchases, counted from the actions array.'],
                    ['key' => 'cost_per_conversion', 'native' => 'cost_per_action_type', 'label' => 'Cost per result', 'description' => 'Spend divided by results.'],
                ],
            ],
        };
    }
}
