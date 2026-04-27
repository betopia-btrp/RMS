<?php

namespace App\Models;

use App\Models\Concerns\UsesUuidPrimaryKey;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['venue_id', 'name', 'email', 'role', 'pin_hash', 'failed_logins', 'locked_until', 'invited_at', 'last_login_at'])]
class StaffUser extends Authenticatable
{
    use HasApiTokens;
    use UsesUuidPrimaryKey;

    protected $primaryKey = 'user_id';

    protected $hidden = ['pin_hash'];

    protected function casts(): array
    {
        return ['locked_until' => 'datetime', 'invited_at' => 'datetime', 'last_login_at' => 'datetime'];
    }

    public function venue(): BelongsTo { return $this->belongsTo(Venue::class, 'venue_id'); }
    public function reports(): HasMany { return $this->hasMany(SalesReport::class, 'generated_by'); }
}
