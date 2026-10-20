<?php

namespace App\Http\Requests;

use App\Domain\Sandbox\Enums\Platform;
use App\Domain\Sandbox\Services\PlatformCatalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSandboxCampaignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // the sandbox is a demo area open to every signed-in user
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $platform = Platform::tryFrom((string) $this->input('platform'));

        return [
            'platform' => ['required', Rule::enum(Platform::class)],
            'name' => 'required|string|max:120',
            'goal' => ['required', Rule::in($platform ? array_keys(PlatformCatalog::goals($platform)) : [])],
            'daily_budget' => 'required|integer|min:100|max:1000000', // cents: $1 to $10,000
            'vehicle' => 'required|string|max:60',
            'location' => 'required|string|max:80',
            'landing_url' => 'required|url:http,https|max:255',
        ];
    }

    public function idempotencyKey(): string
    {
        $key = $this->header('Idempotency-Key');
        abort_if(blank($key), 422, 'Idempotency-Key header is required.');

        return $key;
    }
}
