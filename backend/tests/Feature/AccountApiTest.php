<?php

use App\Domain\Advertising\Models\AdAccount;
use App\Domain\Advertising\Models\Campaign;
use App\Domain\Changelog\Models\ChangelogEntry;
use Database\Seeders\DemoAccountsSeeder;
use Laravel\Sanctum\Sanctum;

use function Tests\user;

it('requires authentication', function () {
    $this->getJson('/api/accounts')->assertUnauthorized();
    $this->getJson('/api/accounts/1')->assertUnauthorized();
});

it('lists accounts with their own monthly budget and campaign count', function () {
    Sanctum::actingAs(user());
    $a = AdAccount::factory()->create(['dealer_name' => 'Acme Motors', 'monthly_budget' => 555_000]);
    AdAccount::factory()->create(['dealer_name' => 'Best CDJR', 'monthly_budget' => null]);
    Campaign::factory()->count(2)->for($a, 'account')->create();

    $rows = $this->getJson('/api/accounts')->assertOk()->json('data');

    expect(collect($rows)->pluck('dealer_name')->all())->toBe(['Acme Motors', 'Best CDJR'])
        ->and($rows[0]['monthly_budget'])->toBe(555_000)
        ->and($rows[0]['campaigns_count'])->toBe(2)
        ->and($rows[1]['monthly_budget'])->toBeNull()
        ->and($rows[1]['campaigns_count'])->toBe(0);
});

it('shows one account with only its own campaigns', function () {
    Sanctum::actingAs(user());
    $mine = AdAccount::factory()->create();
    $other = AdAccount::factory()->create();
    Campaign::factory()->for($mine, 'account')->create(['name' => 'B campaign']);
    Campaign::factory()->for($mine, 'account')->create(['name' => 'A campaign']);
    Campaign::factory()->for($other, 'account')->create(['name' => 'Not mine']);

    $data = $this->getJson("/api/accounts/{$mine->id}")->assertOk()->json('data');

    expect($data['id'])->toBe($mine->id)
        ->and($data['campaigns_count'])->toBe(2)
        ->and(collect($data['campaigns'])->pluck('name')->all())->toBe(['A campaign', 'B campaign']);
    $this->getJson('/api/accounts/9999')->assertNotFound();
});

it('filters the changelog by account', function () {
    Sanctum::actingAs(user());
    $mine = AdAccount::factory()->create();
    $other = AdAccount::factory()->create();
    $c1 = Campaign::factory()->for($mine, 'account')->create();
    $c2 = Campaign::factory()->for($other, 'account')->create();
    foreach ([$c1, $c2] as $campaign) {
        ChangelogEntry::query()->create([
            'campaign_id' => $campaign->id, 'source' => 'platform', 'field' => 'name', 'old_value' => 'a', 'new_value' => 'b', 'occurred_at' => now(),
        ]);
    }

    $rows = $this->getJson("/api/changelog?account_id={$mine->id}")->assertOk()->json('data');

    expect($rows)->toHaveCount(1)->and($rows[0]['campaign']['id'])->toBe($c1->id);
});

it('seeds accounts with their own budgets and every campaign state, and only once', function () {
    $this->seed(DemoAccountsSeeder::class);
    $this->seed(DemoAccountsSeeder::class); // idempotent

    expect(AdAccount::query()->where('dealer_name', 'Schrute CDJR')->count())->toBe(1)
        ->and(AdAccount::query()->where('dealer_name', 'Schrute CDJR')->value('monthly_budget'))->toBe(555_000)
        ->and(AdAccount::query()->where('dealer_name', 'Lakeside Toyota')->value('monthly_budget'))->toBeNull()
        ->and(Campaign::query()->pluck('status')->unique()->sort()->values()->all())->toBe(['active', 'ended', 'limited', 'paused']);
});
