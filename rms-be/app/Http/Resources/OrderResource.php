<?php

namespace App\Http\Resources;

use App\Models\Order;
use App\Support\OrderStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Order */
class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $payment = $this->payment;

        return [
            'id' => $this->order_id,
            'venueId' => $this->venue_id,
            'tableId' => $this->table_id,
            'tableNumber' => $this->table?->label ?? 'Takeaway',
            'total' => (float) $this->total_amount,
            'status' => $this->status,
            'workflowStatus' => OrderStatus::publicLabel($this->status),
            'paymentStatus' => $payment?->status ?? 'PAY_ON_TABLE',
            'paymentMethod' => $payment?->method ?? 'CASH',
            'estimatedReadyAt' => $this->created_at->copy()->addMinutes($this->estimated_wait_min)->toISOString(),
            'createdAt' => $this->created_at->toISOString(),
            'servedAt' => $this->served_at?->toISOString(),
            'cancelledAt' => $this->cancelled_at?->toISOString(),
            'items' => $this->items->map(fn ($item) => [
                'id' => $item->order_item_id,
                'menuItemId' => $item->item_id,
                'name' => $item->menuItem?->name,
                'price' => (float) $item->unit_price,
                'quantity' => $item->quantity,
                'specialInstructions' => $item->special_instruction,
                'category' => $item->menuItem?->category?->name,
            ])->values(),
        ];
    }
}
