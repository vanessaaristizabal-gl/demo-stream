<?php

namespace Database\Seeders;

use App\Domain\Advertising\Enums\Provider;
use App\Domain\Advertising\Models\AdAccount;
use App\Domain\Advertising\Models\Campaign;
use App\Domain\Compliance\Models\Rulebook;
use App\Domain\Governance\Models\Policy;
use App\Domain\Identity\Enums\UserRole;
use App\Domain\Identity\Models\User;
use App\Domain\Playbooks\Models\Playbook;
use App\Domain\Sandbox\Services\SandboxCampaignService;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /** Realistic campaign names for the demo, three per dealer. */
    private const NAMES = [
        ['Camry - Spring sales event', 'RAV4 - Hybrid lease offers', 'Tacoma - Truck month'],
        ['Silverado - Work truck deals', 'Equinox - Family SUV', 'Malibu - Certified pre-owned'],
        ['Civic - Commuter offers', 'CR-V - Weekend test drive', 'Accord - Year-end clearance'],
    ];

    public function run(): void
    {
        foreach (UserRole::cases() as $role) {
            User::factory()->role($role)->create([
                'name' => ucfirst($role->value),
                'email' => "{$role->value}@example.com", // password: "password"
            ]);
        }

        Rulebook::create([
            'manufacturer' => 'toyota',
            'version' => 1,
            'effective_from' => '2026-01-01',
            'rules' => [
                ['id' => 'TOY-001', 'field' => 'daily_budget', 'operator' => 'max', 'value' => 50000, 'message' => 'Daily budget cannot exceed $500.'],
                ['id' => 'TOY-002', 'field' => 'name', 'operator' => 'required', 'message' => 'Campaign name is required.'],
            ],
        ]);

        Policy::create(['name' => 'Pause/resume + small budget moves', 'allowed_fields' => ['status', 'daily_budget'], 'max_budget_delta_pct' => 10]);

        Playbook::create([
            'name' => 'New inventory search',
            'template' => ['name' => '{{ dealer.name }} - {{ vehicle.model }}', 'status' => 'paused', 'daily_budget' => '{{ offer.daily_budget }}'],
        ]);

        foreach (range(1, 3) as $i) {
            $account = AdAccount::factory()->create([
                'provider' => $i % 2 ? Provider::Google : Provider::Meta,
                'dealer_name' => "Dealer {$i}",
                'monthly_budget' => 300_000 + $i * 100_000,
            ]);
            foreach (array_slice(self::NAMES[$i - 1], 0, 3) as $name) {
                Campaign::factory()->for($account, 'account')->create(['name' => $name, 'live' => ['name' => $name, 'type' => 'search', 'status' => 'active', 'daily_budget' => 10000], 'desired' => ['name' => $name, 'type' => 'search', 'status' => 'active', 'daily_budget' => 10000]]);
            }
            if ($i === 1) {
                Campaign::factory()->locked('name')->for($account, 'account')->create(['name' => 'Dealer brand campaign (locked)', 'live' => ['name' => 'Dealer brand campaign (locked)', 'type' => 'search', 'status' => 'active', 'daily_budget' => 10000]]);
            }
        }

        // Demo sandbox: one simulated campaign per platform so the page is not empty.
        $sandbox = app(SandboxCampaignService::class);
        $sandbox->create(['platform' => 'google', 'name' => 'Camry - Search leads', 'goal' => 'leads', 'daily_budget' => 15000, 'vehicle' => 'Camry', 'location' => 'Austin', 'landing_url' => 'https://dealer.example.com/camry'], 'seed-google-camry', null);
        $sandbox->create(['platform' => 'meta', 'name' => 'RAV4 - Local awareness', 'goal' => 'awareness', 'daily_budget' => 9000, 'vehicle' => 'RAV4', 'location' => 'Dallas', 'landing_url' => 'https://dealer.example.com/rav4'], 'seed-meta-rav4', null);

        $this->call(DemoAccountsSeeder::class);
        $this->call(DemoActivitySeeder::class);
    }
}
