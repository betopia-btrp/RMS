<?php

namespace App\Http\Resources;

use App\Models\StaffUser;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin StaffUser */
class StaffUserResource extends JsonResource
{
    private function accessScope(string $role): string
    {
        return match ($role) {
            'KITCHEN' => 'KDS',
            'WAITER' => 'ALERTS',
            default => 'FULL',
        };
    }

    public function toArray(Request $request): array
    {
        $role = strtoupper($this->role);

        return [
            'id' => $this->user_id,
            'venueId' => $this->venue_id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $role,
            'accessScope' => $this->accessScope($role),
            'invitedAt' => $this->invited_at?->toISOString(),
            'lastLoginAt' => $this->last_login_at?->toISOString(),
        ];
    }
}
