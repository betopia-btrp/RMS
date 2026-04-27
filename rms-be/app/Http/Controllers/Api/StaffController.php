<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateStaffUserRequest;
use App\Http\Resources\OrderResource;
use App\Http\Resources\StaffUserResource;
use App\Models\Order;
use App\Models\StaffUser;
use App\Models\Venue;
use App\Support\OrderStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class StaffController extends Controller
{
    public function readyOrders(Request $request): JsonResponse
    {
        $venueId = $request->query('venue_id') ?? Venue::query()->value('venue_id');
        $orders = Order::query()
            ->with(['table', 'items.menuItem.category', 'payment'])
            ->where('venue_id', $venueId)
            ->where('status', OrderStatus::READY)
            ->latest()
            ->get();

        return response()->json([
            'venue_id' => $venueId,
            'orders' => OrderResource::collection($orders),
        ]);
    }

    public function serve(Order $order): JsonResponse
    {
        $role = 'WAITER';

        if (! OrderStatus::canTransition($order->status, OrderStatus::SERVED, $role)) {
            $allowedTargets = OrderStatus::transitionTargets($order->status, $role);

            throw ValidationException::withMessages([
                'status' => [
                    'Invalid status transition from '.OrderStatus::publicLabel($order->status)
                    .' to '.OrderStatus::publicLabel(OrderStatus::SERVED)
                    .' for '.$role.'. Allowed next statuses: '
                    .($allowedTargets
                        ? implode(', ', array_map(fn (string $status) => OrderStatus::publicLabel($status), $allowedTargets))
                        : 'none'),
                ],
            ]);
        }

        $order->update([
            'status' => OrderStatus::SERVED,
            'served_at' => now(),
        ]);

        return response()->json(new OrderResource($order->load(['table', 'items.menuItem.category', 'payment'])));
    }

    public function index(Request $request): JsonResponse
    {
        $venueId = $request->query('venue_id') ?? Venue::query()->value('venue_id');
        $staff = StaffUser::query()
            ->where('venue_id', $venueId)
            ->orderBy('role')
            ->orderBy('name')
            ->get();

        return response()->json([
            'venue_id' => $venueId,
            'staff' => StaffUserResource::collection($staff),
        ]);
    }

    public function update(UpdateStaffUserRequest $request, StaffUser $staffUser): JsonResponse
    {
        $staffUser->update($request->validated());

        return response()->json([
            'staff' => new StaffUserResource($staffUser->fresh()),
        ]);
    }
}
