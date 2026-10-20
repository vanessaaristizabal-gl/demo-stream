<?php

use App\Domain\Advertising\Models\Campaign;
use App\Domain\Governance\Models\ChangeRequest;
use App\Domain\Sandbox\Enums\Platform;
use App\Domain\Sandbox\Models\SandboxCampaign;
use App\Domain\Sandbox\Services\MetricsSimulator;
use App\Domain\Sandbox\Services\PlatformCatalog;
use App\Domain\Sandbox\Services\StructureBuilder;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;

use function Tests\fakeProvider;
use function Tests\user;

function sandboxPayload(array $overrides = []): array
{
    return array_merge([
        'platform' => 'google',
        'name' => 'Spring Camry',
        'goal' => 'leads',
        'daily_budget' => 15000,
        'vehicle' => 'Camry',
        'location' => 'Austin',
        'landing_url' => 'https://dealer.example.com/camry',
    ], $overrides);
}

it('requires authentication', function () {
    $this->getJson('/api/sandbox/campaigns')->assertUnauthorized();
    $this->postJson('/api/sandbox/campaigns', sandboxPayload())->assertUnauthorized();
});

it('describes both platforms with their native vocabulary', function () {
    Sanctum::actingAs(user());

    $platforms = collect($this->getJson('/api/sandbox/catalog')->assertOk()->json('data.platforms'))->keyBy('platform');

    expect($platforms->keys()->all())->toBe(['google', 'meta'])
        ->and($platforms['google']['hierarchy'])->toBe(['Campaign', 'Ad group', 'Ad'])
        ->and($platforms['meta']['hierarchy'])->toBe(['Campaign', 'Ad set', 'Ad'])
        ->and(collect($platforms['google']['metrics'])->pluck('native'))->toContain('metrics.cost_micros')
        ->and(collect($platforms['meta']['metrics'])->pluck('native'))->toContain('spend', 'reach');
});

it('creates a Google Ads campaign with ad groups, keywords and ads', function () {
    Sanctum::actingAs(user());

    $data = $this->postJson('/api/sandbox/campaigns', sandboxPayload(), ['Idempotency-Key' => 'g1'])
        ->assertCreated()->json('data');

    expect($data['platform'])->toBe('google')
        ->and($data['structure']['campaign']['advertising_channel_type'])->toBe('SEARCH')
        ->and($data['structure']['campaign']['bidding_strategy_type'])->toBe('MAXIMIZE_CONVERSIONS')
        ->and($data['structure']['campaign']['campaign_budget']['amount_micros'])->toBe(150_000_000)
        ->and($data['structure']['groups'])->toHaveCount(2)
        ->and($data['structure']['groups'][0]['keywords'][0])->toHaveKeys(['text', 'match_type'])
        ->and($data['structure']['groups'][0]['ads'][0]['type'])->toBe('RESPONSIVE_SEARCH_AD')
        ->and($data['daily_metrics'])->toHaveCount(MetricsSimulator::DAYS)
        ->and($data['totals']['reach'])->toBeNull();
});

it('creates a Meta campaign with ad sets, targeting and creatives', function () {
    Sanctum::actingAs(user());

    $data = $this->postJson('/api/sandbox/campaigns', sandboxPayload(['platform' => 'meta', 'goal' => 'traffic']), ['Idempotency-Key' => 'm1'])
        ->assertCreated()->json('data');

    expect($data['structure']['campaign']['objective'])->toBe('OUTCOME_TRAFFIC')
        ->and($data['structure']['groups'][0]['kind'])->toBe('ad_set')
        ->and($data['structure']['groups'][0]['optimization_goal'])->toBe('LINK_CLICKS')
        ->and($data['structure']['groups'][0]['targeting'])->toHaveKeys(['age_min', 'geo_locations', 'publisher_platforms'])
        ->and($data['structure']['groups'][0]['ads'][0]['creative']['object_story_spec']['link_data']['link'])->toBe('https://dealer.example.com/camry')
        ->and(collect($data['structure']['groups'])->sum('daily_budget'))->toBe(15000)
        ->and($data['totals']['reach'])->toBeGreaterThan(0)
        ->and($data['totals']['frequency'])->toBeGreaterThanOrEqual(1.0);
});

it('only accepts goals that exist on the chosen platform', function () {
    Sanctum::actingAs(user());

    // "awareness" is a Meta objective; the Google sandbox does not offer it.
    $this->postJson('/api/sandbox/campaigns', sandboxPayload(['goal' => 'awareness']), ['Idempotency-Key' => 'k'])
        ->assertUnprocessable()->assertJsonValidationErrors('goal');
    $this->postJson('/api/sandbox/campaigns', sandboxPayload(['platform' => 'tiktok']), ['Idempotency-Key' => 'k'])
        ->assertUnprocessable()->assertJsonValidationErrors('platform');
    $this->postJson('/api/sandbox/campaigns', sandboxPayload(['daily_budget' => 5, 'landing_url' => 'javascript:alert(1)']), ['Idempotency-Key' => 'k'])
        ->assertUnprocessable()->assertJsonValidationErrors(['daily_budget', 'landing_url']);
});

it('requires an Idempotency-Key and de-duplicates retries', function () {
    Sanctum::actingAs(user());

    $this->postJson('/api/sandbox/campaigns', sandboxPayload())->assertUnprocessable();

    $first = $this->postJson('/api/sandbox/campaigns', sandboxPayload(), ['Idempotency-Key' => 'same'])->assertCreated()->json('data.id');
    $this->postJson('/api/sandbox/campaigns', sandboxPayload(), ['Idempotency-Key' => 'same'])->assertOk()->assertJsonPath('data.id', $first);
    expect(SandboxCampaign::count())->toBe(1);

    $this->postJson('/api/sandbox/campaigns', sandboxPayload(['name' => 'Different']), ['Idempotency-Key' => 'same'])
        ->assertUnprocessable()->assertJsonPath('error', 'idempotency_conflict');
    expect(SandboxCampaign::count())->toBe(1);
});

it('lists campaigns with 30-day totals that match the daily metrics', function () {
    Sanctum::actingAs(user());
    $id = $this->postJson('/api/sandbox/campaigns', sandboxPayload(), ['Idempotency-Key' => 'a'])->json('data.id');

    $detail = $this->getJson("/api/sandbox/campaigns/{$id}")->assertOk()->json('data');
    $row = collect($this->getJson('/api/sandbox/campaigns')->assertOk()->json('data'))->firstWhere('id', $id);

    expect($row['totals']['clicks'])->toBe(collect($detail['daily_metrics'])->sum('clicks'))
        ->and($row['totals']['cost'])->toBe(collect($detail['daily_metrics'])->sum('cost'))
        ->and($row['totals']['impressions'])->toBe($detail['totals']['impressions'])
        ->and($row)->not->toHaveKey('structure');
});

it('never touches a provider or the governed write path', function () {
    Sanctum::actingAs(user());

    $this->postJson('/api/sandbox/campaigns', sandboxPayload(), ['Idempotency-Key' => 'p'])->assertCreated();

    expect(fakeProvider()->writes)->toBeEmpty()
        ->and(Campaign::count())->toBe(0)
        ->and(ChangeRequest::count())->toBe(0);
});

it('simulates repeatable, plausible numbers', function () {
    $sim = new MetricsSimulator;
    $end = Carbon::parse('2026-10-19');

    $a = $sim->days(Platform::Meta, '123456789012345', 10000, $end);
    $b = $sim->days(Platform::Meta, '123456789012345', 10000, $end);
    $other = $sim->days(Platform::Meta, '999999999999999', 10000, $end);

    expect($a)->toBe($b)
        ->and($a)->not->toBe($other)
        ->and($a)->toHaveCount(30)
        ->and(collect($a)->max('cost'))->toBeLessThanOrEqual(10000)
        ->and(collect($a)->every(fn ($d) => $d['clicks'] <= $d['impressions'] && $d['reach'] <= $d['impressions']))->toBeTrue();
});

it('keeps Google headlines within the 30-character limit', function () {
    $tree = (new StructureBuilder)->build(Platform::Google, '1000000000', sandboxPayload(['vehicle' => 'Extremely Long Vehicle Model Name Edition']), Carbon::now());

    foreach ($tree['groups'] as $group) {
        foreach ($group['ads'][0]['headlines'] as $headline) {
            expect(mb_strlen($headline))->toBeLessThanOrEqual(30);
        }
    }
});

it('offers different goals per platform', function () {
    expect(array_keys(PlatformCatalog::goals(Platform::Google)))->not->toContain('awareness')
        ->and(array_keys(PlatformCatalog::goals(Platform::Meta)))->toContain('awareness');
});
