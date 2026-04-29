<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStaffUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $staffUser = $this->route('staffUser');

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'email',
                'max:255',
                Rule::unique('staff_users', 'email')->ignore($staffUser?->user_id, 'user_id'),
            ],
            'role' => ['sometimes', 'in:ADMIN,KITCHEN,WAITER'],
        ];
    }
}
