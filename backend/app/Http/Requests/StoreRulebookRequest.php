<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRulebookRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // role:admin middleware guards the route
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'manufacturer' => 'required|string',
            'effective_from' => 'required|date',
            'rules' => 'required|array|min:1',
            'rules.*.id' => 'required|string',
            'rules.*.field' => 'required|string',
            'rules.*.operator' => 'required|in:max,min,in,not_in,equals,required',
        ];
    }
}
