<?php

namespace App\Http\Resources;

use App\Models\StaffUser;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin StaffUser */
class StaffUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->user_id,
            'venueId' => $this->venue_id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => strtoupper($this->role),
            'invitedAt' => $this->invited_at?->toISOString(),
            'lastLoginAt' => $this->last_login_at?->toISOString(),
        ];
    }
}
