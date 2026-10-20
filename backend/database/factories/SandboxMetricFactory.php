<?php

namespace Database\Factories;

use App\Domain\Sandbox\Models\SandboxCampaign;
use App\Domain\Sandbox\Models\SandboxMetric;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<SandboxMetric> */
class SandboxMetricFactory extends Factory
{
    protected $model = SandboxMetric::class;

    public function definition(): array
    {
        return [
            'sandbox_campaign_id' => SandboxCampaign::factory(),
            'date' => fake()->date(),
            'impressions' => 1000,
            'clicks' => 50,
            'cost' => 8000,
            'conversions' => 4,
            'conversions_value' => 40000,
            'reach' => null,
        ];
    }
}
