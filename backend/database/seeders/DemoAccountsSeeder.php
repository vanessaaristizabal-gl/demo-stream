<?php

namespace Database\Seeders;

use App\Domain\Advertising\Enums\Provider;
use App\Domain\Advertising\Models\AdAccount;
use App\Domain\Advertising\Models\Campaign;
use Illuminate\Database\Seeder;

/**
 * More accounts so the Accounts and Campaigns lists are worth browsing and filtering: each account has its own monthly
 * budget, and the campaigns cover every state a provider reports (active, paused, limited by budget, ended).
 * Idempotent: it only adds what is missing, so it can run on an existing database
 * (`php artisan db:seed --class=DemoAccountsSeeder`).
 */
class DemoAccountsSeeder extends Seeder
{
    public function run(): void
    {
        // The first three accounts come from DatabaseSeeder: give any that has none its own budget.
        foreach (AdAccount::query()->whereNull('monthly_budget')->whereIn('dealer_name', ['Dealer 1', 'Dealer 2', 'Dealer 3'])->get() as $account) {
            $account->update(['monthly_budget' => 300_000 + $account->id * 100_000]);
        }

        foreach ([
            ['Schrute CDJR', Provider::Google, 'stellantis', 555_000, [['New CX-5 - Search', 'active'], ['Used - Search', 'paused'], ['Brand - Search', 'limited'], ['Fall clearance 2025', 'ended']]],
            ['Andy Mohr CDJR', Provider::Meta, 'stellantis', 420_000, [['Jeep Wrangler - Leads', 'active'], ['Ram 1500 - Awareness', 'limited']]],
            ['Lakeside Toyota', Provider::Google, 'toyota', null, [['Corolla - Lease offers', 'paused']]],
        ] as [$dealer, $provider, $make, $budget, $campaigns]) {
            if (AdAccount::query()->where('dealer_name', $dealer)->exists()) {
                continue;
            }
            $account = AdAccount::factory()->create(['provider' => $provider, 'dealer_name' => $dealer, 'manufacturer' => $make, 'monthly_budget' => $budget]);
            foreach ($campaigns as [$name, $status]) {
                $live = ['name' => $name, 'type' => 'search', 'status' => $status, 'daily_budget' => 12000];
                Campaign::factory()->for($account, 'account')->create(['name' => $name, 'status' => $status, 'live' => $live, 'desired' => $live]);
            }
        }
    }
}
