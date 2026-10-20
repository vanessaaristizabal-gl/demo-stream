<?php

use App\Domain\Playbooks\PlaybookRenderer;

beforeEach(fn () => $this->renderer = new PlaybookRenderer);

it('interpolates placeholders into text', function () {
    $out = $this->renderer->render(
        ['headline' => '{{ dealer.name }} - {{ vehicle.model }}'],
        ['dealer' => ['name' => 'Acme'], 'vehicle' => ['model' => 'Camry']],
    );

    expect($out['headline'])->toBe('Acme - Camry');
});

it('keeps the type when a value is a single placeholder', function () {
    $out = $this->renderer->render(['daily_budget' => '{{ offer.budget }}'], ['offer' => ['budget' => 25000]]);

    expect($out['daily_budget'])->toBe(25000);
});

it('renders nested structures and leaves non-strings alone', function () {
    $out = $this->renderer->render(['a' => ['b' => ['{{ x }}', 7, true]]], ['x' => 'ok']);

    expect($out)->toBe(['a' => ['b' => ['ok', 7, true]]]);
});

it('fails loudly on a missing variable', function () {
    $this->renderer->render(['headline' => '{{ vehicle.model }}'], ['vehicle' => []]);
})->throws(InvalidArgumentException::class, 'Missing template variable [vehicle.model]');

it('refuses to embed non-scalar values in text', function () {
    $this->renderer->render(['t' => 'Cars: {{ list }}'], ['list' => [1, 2]]);
})->throws(InvalidArgumentException::class);
