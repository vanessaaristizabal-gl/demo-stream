<?php

use Illuminate\Support\Facades\Artisan;

it('serves the OpenAPI document with every API route', function () {
    $spec = $this->getJson('/docs/api.json')->assertOk()->json();

    expect($spec['openapi'])->toStartWith('3.1')
        ->and($spec['paths'])->toHaveKeys(['/login', '/campaigns', '/campaigns/{campaign}/changes', '/change-requests/{changeRequest}/approve', '/changelog', '/emergency-stop']);
});

it('documents every API route with a summary', function () {
    $spec = $this->getJson('/docs/api.json')->json();

    foreach ($spec['paths'] as $path => $operations) {
        foreach ($operations as $method => $operation) {
            expect($operation['summary'] ?? '')->not->toBe('', "{$method} {$path} has no summary: add a docblock to the controller method");
        }
    }
});

it('keeps docs/openapi.json in sync with the code', function () {
    $tmp = tempnam(sys_get_temp_dir(), 'openapi');
    Artisan::call('scramble:export', ['--path' => $tmp]);

    expect(json_decode(file_get_contents($tmp), true))
        ->toEqual(json_decode(file_get_contents(base_path('../docs/openapi.json')), true));
})->note('Run `php artisan scramble:export` and commit docs/openapi.json when the API changes.');
