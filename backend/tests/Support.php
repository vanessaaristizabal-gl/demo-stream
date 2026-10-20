<?php

namespace Tests;

use App\Domain\Advertising\Models\AdAccount;
use App\Domain\Advertising\Models\Campaign;
use App\Domain\Advertising\Providers\FakeProvider;
use App\Domain\Compliance\Models\Rulebook;
use App\Domain\Identity\Enums\UserRole;
use App\Domain\Identity\Models\User;

function user(UserRole $role = UserRole::Strategist): User
{
    return User::factory()->role($role)->create();
}

function campaign(array $attributes = [], ?string $manufacturer = 'toyota'): Campaign
{
    $account = AdAccount::factory()->create(['manufacturer' => $manufacturer]);

    return Campaign::factory()->for($account, 'account')->create($attributes);
}

function toyotaRulebook(): Rulebook
{
    return Rulebook::create([
        'manufacturer' => 'toyota', 'version' => 1, 'effective_from' => '2026-01-01',
        'rules' => [['id' => 'TOY-001', 'field' => 'daily_budget', 'operator' => 'max', 'value' => 50000]],
    ]);
}

function fakeProvider(): FakeProvider
{
    return app(FakeProvider::class);
}
