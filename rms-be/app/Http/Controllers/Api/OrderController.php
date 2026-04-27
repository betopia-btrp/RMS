<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\Customer;
use App\Models\MenuItem;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Receipt;
use App\Models\TableUnit;
use App\Models\Venue;
use App\Support\OrderStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orders = Order::query()
            ->with(['table', 'items.menuItem.category', 'payment'])
            ->when($request->query('venue_id'), fn ($query, $venueId) => $query->where('venue_id', $venueId))
            ->latest()
            ->get();

        return response()->json(['orders' => OrderResource::collection($orders)]);
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $data = $request->validated();
        $existingOrder = null;

        if (! empty($data['client_request_id'])) {
            $existingOrder = Order::query()
                ->with(['table', 'items.menuItem.category', 'payment'])
                ->where('venue_id', $data['venue_id'])
                ->where('client_request_id', $data['client_request_id'])
                ->first();
        }

        if ($existingOrder) {
            return response()->json(new OrderResource($existingOrder));
        }

        $order = DB::transaction(function () use ($data) {
            $venue = Venue::findOrFail($data['venue_id']);
            $tableId = $data['table_id'] ?? null;

            if (! $tableId && ! empty($data['table_label'])) {
                $tableId = TableUnit::firstOrCreate(
                    ['venue_id' => $venue->venue_id, 'label' => $data['table_label']],
                    ['section' => 'Dining', 'is_active' => true]
                )->table_id;
            }

            $customer = null;
            if (! empty($data['customer_phone'])) {
                $customer = Customer::create([
                    'venue_id' => $venue->venue_id,
                    'phone_number' => $data['customer_phone'],
                    'created_at' => now(),
                ]);
            }

            $items = collect($data['items'])->map(function (array $input) {
                $menuItem = MenuItem::findOrFail($input['item_id']);

                return [
                    'menu_item' => $menuItem,
                    'quantity' => $input['quantity'],
                    'special_instruction' => $input['special_instruction'] ?? null,
                    'line_total' => (float) $menuItem->price * $input['quantity'],
                ];
            });

            $subtotal = $items->sum('line_total');
            $total = round($subtotal + ($subtotal * ((float) $venue->service_charge_pct / 100)), 2);

            $order = Order::create([
                'venue_id' => $venue->venue_id,
                'table_id' => $tableId,
                'customer_id' => $customer?->customer_id,
                'client_request_id' => $data['client_request_id'] ?? null,
                'status' => OrderStatus::PENDING,
                'total_amount' => $total,
                'estimated_wait_min' => 18,
            ]);

            foreach ($items as $item) {
                $order->items()->create([
                    'item_id' => $item['menu_item']->item_id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['menu_item']->price,
                    'special_instruction' => $item['special_instruction'],
                ]);
            }

            Payment::create([
                'order_id' => $order->order_id,
                'amount' => $total,
                'currency' => $venue->currency,
                'method' => $data['payment_method'],
                'status' => $data['payment_status'],
                'paid_at' => $data['payment_status'] === 'PAID' ? now() : null,
            ]);

            Notification::create([
                'venue_id' => $venue->venue_id,
                'order_id' => $order->order_id,
                'recipient_type' => 'kitchen',
                'delivery_method' => 'web',
                'content_snapshot' => 'New order received for table '.$order->table?->label,
                'sent_at' => now(),
            ]);

            return $order->load(['table', 'items.menuItem', 'payment']);
        });

        return response()->json(new OrderResource($order->load(['table', 'items.menuItem.category', 'payment'])), 201);
    }

    public function show(Order $order): JsonResponse
    {
        return response()->json(new OrderResource($order->load(['table', 'items.menuItem.category', 'payment'])));
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): JsonResponse
    {
        $normalizedStatus = OrderStatus::normalize($request->validated('status'));
        abort_unless(in_array($normalizedStatus, OrderStatus::all(), true), 422, 'Invalid order status.');
        $role = strtoupper((string) $request->user()?->role);

        if (! OrderStatus::canTransition($order->status, $normalizedStatus, $role)) {
            $allowedTargets = OrderStatus::transitionTargets($order->status, $role);
            throw ValidationException::withMessages([
                'status' => [
                    'Invalid status transition from '.OrderStatus::publicLabel($order->status)
                    .' to '.OrderStatus::publicLabel($normalizedStatus)
                    .' for '.$role.'. Allowed next statuses: '
                    .($allowedTargets
                        ? implode(', ', array_map(fn (string $status) => OrderStatus::publicLabel($status), $allowedTargets))
                        : 'none'),
                ],
            ]);
        }

        $timestamps = [
            'served_at' => $normalizedStatus === OrderStatus::SERVED ? now() : null,
            'cancelled_at' => $order->cancelled_at,
        ];

        $order->update(['status' => $normalizedStatus] + $timestamps);

        return response()->json(new OrderResource($order->load(['table', 'items.menuItem.category', 'payment'])));
    }

    public function cancel(Order $order): JsonResponse
    {
        abort_if(
            $order->created_at->diffInMinutes(now()) > 5 || $order->status !== OrderStatus::PENDING,
            422,
            'Order can no longer be cancelled.'
        );

        $order->update(['status' => OrderStatus::CANCELLED, 'cancelled_at' => now()]);

        return response()->json(new OrderResource($order->load(['table', 'items.menuItem.category', 'payment'])));
    }

    public function receipt(Payment $payment): JsonResponse
    {
        $receipt = Receipt::firstOrCreate(
            ['payment_id' => $payment->payment_id],
            ['delivery_channel' => 'screen', 'delivered_at' => now()]
        );

        return response()->json($receipt->load('payment.order'));
    }
}
