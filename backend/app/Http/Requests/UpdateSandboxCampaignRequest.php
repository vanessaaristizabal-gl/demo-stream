<?php

namespace App\Http\Requests;

use App\Domain\Sandbox\Models\SandboxCampaign;
use App\Domain\Sandbox\Services\PlatformCatalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSandboxCampaignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // the sandbox is a demo area open to every signed-in user
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        /** @var SandboxCampaign $campaign */
        $campaign = $this->route('sandboxCampaign');

        return [
            'name' => 'sometimes|required|string|max:120',
            'goal' => ['sometimes', 'required', Rule::in(array_keys(PlatformCatalog::goals($campaign->platform)))],
            'status' => ['sometimes', 'required', Rule::in(['active', 'paused'])],
            'daily_budget' => 'sometimes|required|integer|min:100|max:1000000', // cents: $1 to $10,000
            'vehicle' => 'sometimes|required|string|max:60',
            'location' => 'sometimes|required|string|max:80',
            'landing_url' => 'sometimes|required|url:http,https|max:255',
        ];
    }

    public function idempotencyKey(): string
    {
        $key = $this->header('Idempotency-Key');
        abort_if(blank($key), 422, 'Idempotency-Key header is required.');

        return $key;
    }
}
