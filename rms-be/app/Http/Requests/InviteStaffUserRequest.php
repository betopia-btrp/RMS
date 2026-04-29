<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class InviteStaffUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:staff_users,email'],
            'role' => ['required', 'in:ADMIN,KITCHEN,WAITER'],
            'password' => ['required', 'string', 'min:6', 'max:255'],
            'venue_id' => ['sometimes', 'uuid', 'exists:venues,venue_id'],
        ];
    }
}
