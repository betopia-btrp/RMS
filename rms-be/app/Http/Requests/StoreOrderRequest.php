<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_request_id' => ['nullable', 'string', 'max:120'],
            'venue_id' => ['required', 'uuid', 'exists:venues,venue_id'],
            'table_id' => ['nullable', 'uuid', 'exists:table_units,table_id'],
            'table_label' => ['nullable', 'string', 'max:120'],
            'customer_phone' => ['nullable', 'string', 'max:40'],
            'payment_method' => ['required', 'string', 'max:40'],
            'payment_status' => ['required', 'string', 'max:40'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_id' => ['required', 'uuid', 'exists:menu_items,item_id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.special_instruction' => ['nullable', 'string'],
        ];
    }
}
