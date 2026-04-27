<?php

namespace App\Models;

use App\Models\Concerns\UsesUuidPrimaryKey;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['venue_id', 'table_id', 'customer_id', 'client_request_id', 'status', 'total_amount', 'estimated_wait_min', 'served_at', 'cancelled_at'])]
class Order extends Model
{
    use UsesUuidPrimaryKey;

    protected $primaryKey = 'order_id';

    protected function casts(): array
    {
        return ['total_amount' => 'decimal:2', 'served_at' => 'datetime', 'cancelled_at' => 'datetime'];
    }

    public function venue(): BelongsTo { return $this->belongsTo(Venue::class, 'venue_id'); }
    public function table(): BelongsTo { return $this->belongsTo(TableUnit::class, 'table_id'); }
    public function customer(): BelongsTo { return $this->belongsTo(Customer::class, 'customer_id'); }
    public function items(): HasMany { return $this->hasMany(OrderItem::class, 'order_id'); }
    public function payment(): HasOne { return $this->hasOne(Payment::class, 'order_id'); }
    public function notifications(): HasMany { return $this->hasMany(Notification::class, 'order_id'); }
}
