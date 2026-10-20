<?php

namespace Database\Factories;

use App\Domain\Advertising\Models\AdAccount;
use App\Domain\Advertising\Models\Campaign;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Campaign> */
class CampaignFactory extends Factory
{
    protected $model = Campaign::class;

    public function definition(): array
    {
        $live = ['name' => fake()->words(3, true), 'type' => 'search', 'status' => 'active', 'daily_budget' => 10000];

        return [
            'ad_account_id' => AdAccount::factory(),
            'external_id' => (string) fake()->unique()->numerify('##########'),
            'name' => $live['name'],
            'type' => $live['type'],
            'status' => $live['status'],
            'live' => $live,
            'desired' => $live,
            'locks' => [],
        ];
    }

    public function locked(string ...$fields): static
    {
        return $this->state(['locks' => $fields]);
    }
}
