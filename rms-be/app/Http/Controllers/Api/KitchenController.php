<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Venue;
use App\Support\OrderStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KitchenController extends Controller
{
    public function orders(Request $request): JsonResponse
    {
        $venueId = $request->query('venue_id') ?? Venue::query()->value('venue_id');

        $orders = Order::query()
            ->with(['table', 'items.menuItem.category', 'payment'])
            ->where('venue_id', $venueId)
            ->whereIn('status', OrderStatus::kitchenFlow())
            ->orderBy('created_at')
            ->get()
            ->groupBy(fn (Order $order) => $order->table?->label ?? 'Takeaway')
            ->map(fn ($group) => OrderResource::collection($group)->resolve())
            ->sortKeys();

        return response()->json([
            'venue_id' => $venueId,
            'groups' => $orders,
        ]);
    }
}
