<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitChangeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // any authenticated user may propose; approval is the control
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'changes' => 'required|array|min:1',
            'changes.name' => 'sometimes|string|max:255',
            'changes.status' => 'sometimes|in:active,paused',
            'changes.daily_budget' => 'sometimes|integer|min:0',
        ];
    }

    public function idempotencyKey(): string
    {
        $key = $this->header('Idempotency-Key');
        abort_if(blank($key), 422, 'Idempotency-Key header is required.');

        return $key;
    }
}
