<?php

namespace Database\Factories;

use App\Domain\Advertising\Enums\Provider;
use App\Domain\Advertising\Models\AdAccount;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<AdAccount> */
class AdAccountFactory extends Factory
{
    protected $model = AdAccount::class;

    public function definition(): array
    {
        return [
            'provider' => fake()->randomElement(Provider::cases()),
            'external_id' => (string) fake()->unique()->numerify('##########'),
            'dealer_name' => fake()->company().' Motors',
            'manufacturer' => 'toyota',
        ];
    }
}
