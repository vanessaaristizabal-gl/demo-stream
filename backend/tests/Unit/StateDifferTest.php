<?php

use App\Domain\Advertising\StateDiffer;

it('returns only fields that differ from live state', function () {
    $diff = StateDiffer::diff(['name' => 'A', 'status' => 'active'], ['name' => 'A', 'status' => 'paused']);

    expect($diff)->toBe(['status' => ['old' => 'active', 'new' => 'paused']]);
});

it('treats a missing live field as null', function () {
    expect(StateDiffer::diff([], ['daily_budget' => 100]))->toBe(['daily_budget' => ['old' => null, 'new' => 100]]);
});

it('is strict about types', function () {
    expect(StateDiffer::diff(['daily_budget' => 100], ['daily_budget' => '100']))->not->toBeEmpty();
});
