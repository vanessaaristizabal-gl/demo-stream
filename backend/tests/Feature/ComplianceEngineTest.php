<?php

use App\Domain\Compliance\ComplianceEngine;
use App\Domain\Compliance\Models\ComplianceFinding;
use App\Domain\Compliance\Models\Rulebook;

use function Tests\campaign;
use function Tests\toyotaRulebook;

it('flags a state that breaks a rule', function () {
    toyotaRulebook();
    $c = campaign();

    $violations = app(ComplianceEngine::class)->evaluate($c, ['daily_budget' => 90000]);

    expect($violations)->toHaveCount(1)->and($violations[0]->ruleId)->toBe('TOY-001');
});

it('passes a compliant state and accounts without a manufacturer', function () {
    toyotaRulebook();

    expect(app(ComplianceEngine::class)->evaluate(campaign(), ['daily_budget' => 100]))->toBeEmpty()
        ->and(app(ComplianceEngine::class)->evaluate(campaign(manufacturer: null), ['daily_budget' => 999999]))->toBeEmpty();
});

it('uses the rulebook version in force at the evaluation date', function () {
    toyotaRulebook();
    Rulebook::create([
        'manufacturer' => 'toyota', 'version' => 2, 'effective_from' => '2027-01-01',
        'rules' => [['id' => 'TOY-001', 'field' => 'daily_budget', 'operator' => 'max', 'value' => 20000]],
    ]);
    $c = campaign();
    $engine = app(ComplianceEngine::class);

    expect($engine->evaluate($c, ['daily_budget' => 30000], now()->setDate(2026, 6, 1)))->toBeEmpty()
        ->and($engine->evaluate($c, ['daily_budget' => 30000], now()->setDate(2027, 6, 1)))->toHaveCount(1);
});

it('honours applies_to by campaign type', function () {
    Rulebook::create([
        'manufacturer' => 'toyota', 'version' => 1, 'effective_from' => '2026-01-01',
        'rules' => [['id' => 'R1', 'field' => 'status', 'operator' => 'equals', 'value' => 'paused', 'applies_to' => ['pmax']]],
    ]);

    expect(app(ComplianceEngine::class)->evaluate(campaign(['type' => 'search']), ['status' => 'active']))->toBeEmpty()
        ->and(app(ComplianceEngine::class)->evaluate(campaign(['type' => 'pmax']), ['status' => 'active']))->toHaveCount(1);
});

it('sweep opens findings when a rule changes and resolves them when it is fixed', function () {
    $c = campaign(['live' => ['name' => 'x', 'type' => 'search', 'status' => 'active', 'daily_budget' => 30000]]);
    $book = toyotaRulebook();
    $engine = app(ComplianceEngine::class);

    expect($engine->sweep())->toBe(0);

    // Manufacturer tightens the cap: the live campaign is now out of compliance.
    $book->update(['rules' => [['id' => 'TOY-001', 'field' => 'daily_budget', 'operator' => 'max', 'value' => 20000]]]);
    expect($engine->sweep())->toBe(1)
        ->and(ComplianceFinding::whereNull('resolved_at')->count())->toBe(1);

    // A second sweep does not duplicate the finding.
    $engine->sweep();
    expect(ComplianceFinding::count())->toBe(1);

    $c->applyLive([...$c->live, 'daily_budget' => 15000]);
    expect($engine->sweep())->toBe(0)
        ->and(ComplianceFinding::whereNull('resolved_at')->count())->toBe(0);
});
