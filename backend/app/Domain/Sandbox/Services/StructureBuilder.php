<?php

namespace App\Domain\Sandbox\Services;

use App\Domain\Sandbox\Enums\Platform;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * Builds the object tree a real campaign has on each platform, using the platform's own field names.
 * Google Ads: campaign > ad group (keywords) > responsive search ad. Meta: campaign > ad set (targeting) > ad (creative).
 *
 * @phpstan-type Inputs array{platform: string, name: string, goal: string, daily_budget: int, vehicle: string, location: string, landing_url: string}
 */
class StructureBuilder
{
    /**
     * @param  Inputs  $in
     * @return array{campaign: array<string, mixed>, groups: list<array<string, mixed>>}
     */
    public function build(Platform $platform, string $externalId, array $in, Carbon $start): array
    {
        return match ($platform) {
            Platform::Google => $this->google($externalId, $in, $start),
            Platform::Meta => $this->meta($externalId, $in, $start),
        };
    }

    /** @param Inputs $in */
    private function google(string $id, array $in, Carbon $start): array
    {
        $customer = '1234567890';
        $v = $in['vehicle'];
        $loc = $in['location'];

        $group = fn (int $n, string $name, int $bid, array $keywords, array $headlines, array $descriptions) => [
            'kind' => 'ad_group',
            'id' => $this->child($id, $n),
            'resource_name' => "customers/{$customer}/adGroups/".$this->child($id, $n),
            'name' => $name,
            'status' => 'ENABLED',
            'type' => 'SEARCH_STANDARD',
            'cpc_bid_micros' => $bid * 10_000,
            'keywords' => $keywords,
            'ads' => [[
                'id' => $this->child($id, $n + 50),
                'type' => 'RESPONSIVE_SEARCH_AD',
                'status' => 'ENABLED',
                'headlines' => array_map(fn ($h) => Str::limit($h, 30, ''), $headlines),
                'descriptions' => array_map(fn ($d) => Str::limit($d, 90, ''), $descriptions),
                'final_urls' => [$in['landing_url']],
            ]],
        ];

        return [
            'campaign' => [
                'resource_name' => "customers/{$customer}/campaigns/{$id}",
                'id' => $id,
                'name' => $in['name'],
                'status' => 'ENABLED',
                'advertising_channel_type' => 'SEARCH',
                'bidding_strategy_type' => PlatformCatalog::goals(Platform::Google)[$in['goal']],
                'campaign_budget' => [
                    'resource_name' => "customers/{$customer}/campaignBudgets/".$this->child($id, 90),
                    'amount_micros' => $in['daily_budget'] * 10_000,
                    'delivery_method' => 'STANDARD',
                ],
                'network_settings' => ['target_google_search' => true, 'target_search_network' => true, 'target_content_network' => false],
                'geo_targets' => [$loc],
                'negative_keywords' => ['used', 'parts', 'manual', 'jobs', 'free'],
                'start_date' => $start->toDateString(),
            ],
            'groups' => [
                $group(1, "{$v} - Buy", 250, [
                    ['text' => "{$v} for sale", 'match_type' => 'EXACT'],
                    ['text' => "buy {$v}", 'match_type' => 'PHRASE'],
                    ['text' => "new {$v} {$loc}", 'match_type' => 'PHRASE'],
                ], ["New {$v} Deals", "{$v} Near {$loc}", 'Schedule a Test Drive'], ["Explore the {$v} lineup and schedule a test drive today.", 'Trusted local dealer. Great prices and fast service.']),
                $group(2, "{$v} - Offers", 200, [
                    ['text' => "{$v} lease deals", 'match_type' => 'PHRASE'],
                    ['text' => "{$v} price", 'match_type' => 'BROAD'],
                    ['text' => "{$v} incentives", 'match_type' => 'BROAD'],
                ], ["{$v} Lease Offers", 'Limited-Time Incentives', "See {$v} Pricing"], ["Current {$v} offers and incentives at your local dealer.", 'Get an instant quote online in minutes.']),
            ],
        ];
    }

    /** @param Inputs $in */
    private function meta(string $id, array $in, Carbon $start): array
    {
        $v = $in['vehicle'];
        $loc = $in['location'];
        $half = intdiv($in['daily_budget'], 2);

        $adSet = fn (int $n, string $name, int $budget, array $targeting) => [
            'kind' => 'ad_set',
            'id' => $this->child($id, $n),
            'name' => $name,
            'status' => 'ACTIVE',
            'daily_budget' => $budget,
            'optimization_goal' => match ($in['goal']) {
                'traffic' => 'LINK_CLICKS',
                'awareness' => 'REACH',
                'sales' => 'OFFSITE_CONVERSIONS',
                default => 'LEAD_GENERATION',
            },
            'billing_event' => 'IMPRESSIONS',
            'bid_strategy' => 'LOWEST_COST_WITHOUT_CAP',
            'start_time' => $start->toIso8601String(),
            'targeting' => $targeting + ['publisher_platforms' => ['facebook', 'instagram'], 'geo_locations' => ['cities' => [['name' => $loc]]]],
            'ads' => [[
                'id' => $this->child($id, $n + 50),
                'name' => "{$v} - Image ad",
                'status' => 'ACTIVE',
                'creative' => [
                    'object_story_spec' => [
                        'page_id' => '100000000000001',
                        'link_data' => [
                            'message' => "Meet the {$v}. Visit us this week for a test drive.",
                            'link' => $in['landing_url'],
                            'name' => "{$v} at your local dealer",
                            'call_to_action' => ['type' => $in['goal'] === 'leads' ? 'GET_QUOTE' : 'LEARN_MORE'],
                        ],
                    ],
                ],
            ]],
        ];

        return [
            'campaign' => [
                'id' => $id,
                'account_id' => 'act_1234567890',
                'name' => $in['name'],
                'status' => 'ACTIVE',
                'objective' => PlatformCatalog::goals(Platform::Meta)[$in['goal']],
                'buying_type' => 'AUCTION',
                'special_ad_categories' => [],
                'start_time' => $start->toIso8601String(),
            ],
            'groups' => [
                $adSet(1, "Local audience - {$loc}", $in['daily_budget'] - $half, ['age_min' => 25, 'age_max' => 65]),
                $adSet(2, "Interest - {$v} shoppers", $half, [
                    'age_min' => 21,
                    'age_max' => 60,
                    'flexible_spec' => [['interests' => [['id' => '6003139266461', 'name' => 'Automobiles'], ['id' => '6003020834693', 'name' => 'Car shopping']]]],
                ]),
            ],
        ];
    }

    private function child(string $id, int $n): string
    {
        return (string) ((int) $id + $n);
    }
}
