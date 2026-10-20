<?php

namespace Database\Factories;

use App\Domain\Sandbox\Enums\Platform;
use App\Domain\Sandbox\Models\SandboxCampaign;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<SandboxCampaign> */
class SandboxCampaignFactory extends Factory
{
    protected $model = SandboxCampaign::class;

    public function definition(): array
    {
        return [
            'idempotency_key' => fake()->uuid(),
            'fingerprint' => fake()->sha1(),
            'platform' => Platform::Google,
            'external_id' => (string) fake()->unique()->numerify('###########'),
            'name' => fake()->words(3, true),
            'goal' => 'leads',
            'status' => 'active',
            'daily_budget' => 10000,
            'inputs' => [],
            'structure' => ['campaign' => [], 'groups' => []],
        ];
    }
}
