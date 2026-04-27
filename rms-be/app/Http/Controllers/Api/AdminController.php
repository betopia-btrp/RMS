<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StaffLoginRequest;
use App\Http\Requests\UpdateStaffUserRequest;
use App\Http\Resources\AuthStaffResource;
use App\Http\Resources\MenuItemResource;
use App\Http\Resources\OrderResource;
use App\Http\Resources\StaffUserResource;
use App\Models\Allergen;
use App\Models\Ingredient;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\SalesReport;
use App\Models\StaffUser;
use App\Models\Venue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    public function login(StaffLoginRequest $request): JsonResponse
    {
        $data = $request->validated();
        $staff = StaffUser::where('email', $data['email'])->first();

        abort_if(! $staff || ! Hash::check($data['password'], $staff->pin_hash), 401, 'Invalid credentials.');

        $staff->update(['last_login_at' => now(), 'failed_logins' => 0]);
        $token = $staff->createToken('staff-auth')->plainTextToken;

        return response()->json([
            'token' => $token,
            'staff' => new AuthStaffResource($staff->load('venue')),
        ]);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $venueId = $request->query('venue_id') ?? Venue::query()->value('venue_id');
        $orders = Order::with(['table', 'items.menuItem.category', 'payment'])->where('venue_id', $venueId)->latest()->get();
        $menuItems = MenuItem::with(['category', 'images', 'photos', 'tags', 'ingredients', 'allergens'])->where('venue_id', $venueId)->orderBy('sort_order')->get();
        $staff = StaffUser::where('venue_id', $venueId)->orderBy('name')->get();
        $venue = Venue::find($venueId);

        return response()->json([
            'venue_id' => $venueId,
            'venue' => $venue,
            'totalOrders' => $orders->count(),
            'revenue' => round($orders->where('status', '!=', 'CANCELLED')->sum(fn ($order) => (float) $order->total_amount), 2),
            'activeOrders' => $orders->whereIn('status', ['ORDER_TAKEN', 'IN_KITCHEN', 'READY'])->count(),
            'completed' => $orders->where('status', 'SERVED')->count(),
            'cancelled' => $orders->where('status', 'CANCELLED')->count(),
            'orders' => OrderResource::collection($orders),
            'menuItems' => MenuItemResource::collection($menuItems),
            'staff' => StaffUserResource::collection($staff),
            'categories' => MenuCategory::where('venue_id', $venueId)->orderBy('sort_order')->get(),
            'dietaryTags' => \App\Models\DietaryTag::orderBy('name')->get(),
            'allergens' => Allergen::orderBy('name')->get(),
            'ingredients' => Ingredient::orderBy('name')->get(),
        ]);
    }

    public function orders(Request $request): JsonResponse
    {
        $venueId = $request->query('venue_id') ?? Venue::query()->value('venue_id');
        $orders = Order::with(['table', 'items.menuItem.category', 'payment'])
            ->where('venue_id', $venueId)
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->when($request->filled('table'), fn ($query) => $query->whereHas('table', fn ($table) => $table->where('label', 'ilike', '%'.$request->string('table')->toString().'%')))
            ->when($request->filled('date'), fn ($query) => $query->whereDate('created_at', $request->string('date')->toString()))
            ->when($request->filled('payment_method'), fn ($query) => $query->whereHas('payment', fn ($payment) => $payment->where('method', $request->string('payment_method')->toString())))
            ->latest()
            ->get();

        return response()->json([
            'venue_id' => $venueId,
            'filters' => [
                'status' => $request->query('status'),
                'table' => $request->query('table'),
                'date' => $request->query('date'),
                'payment_method' => $request->query('payment_method'),
            ],
            'orders' => OrderResource::collection($orders),
        ]);
    }

    public function analytics(Request $request): JsonResponse
    {
        $venueId = $request->query('venue_id') ?? Venue::query()->value('venue_id');
        $orders = Order::with(['items.menuItem'])->where('venue_id', $venueId)->get();
        $popularItems = $orders
            ->flatMap->items
            ->groupBy('item_id')
            ->map(function ($items) {
                $first = $items->first();

                return [
                    'menuItemId' => $first->item_id,
                    'name' => $first->menuItem?->name,
                    'quantity' => $items->sum('quantity'),
                    'revenue' => round($items->sum(fn ($item) => (float) $item->unit_price * $item->quantity), 2),
                ];
            })
            ->sortByDesc('quantity')
            ->values()
            ->take(5)
            ->values();

        return response()->json([
            'venue_id' => $venueId,
            'totalOrders' => $orders->count(),
            'revenue' => round($orders->where('status', '!=', 'CANCELLED')->sum(fn ($order) => (float) $order->total_amount), 2),
            'popularItems' => $popularItems,
        ]);
    }

    public function settings(Request $request): JsonResponse
    {
        $venueId = $request->query('venue_id') ?? Venue::query()->value('venue_id');

        return response()->json([
            'venue' => Venue::findOrFail($venueId),
            'staff' => StaffUserResource::collection(StaffUser::where('venue_id', $venueId)->orderBy('name')->get()),
        ]);
    }

    public function updateStaff(UpdateStaffUserRequest $request, StaffUser $staffUser): JsonResponse
    {
        $staffUser->update($request->validated());

        return response()->json([
            'staff' => new StaffUserResource($staffUser->fresh()),
        ]);
    }

    public function exportReport(Request $request): JsonResponse
    {
        $venueId = $request->query('venue_id') ?? Venue::query()->value('venue_id');
        $period = strtolower($request->query('period', 'daily'));
        $format = strtolower($request->query('format', 'pdf'));
        abort_unless(in_array($period, ['daily', 'weekly', 'monthly'], true), 422, 'Invalid report period.');
        abort_unless(in_array($format, ['pdf', 'json'], true), 422, 'Invalid report format.');

        $today = now();
        [$from, $to] = match ($period) {
            'weekly' => [$today->copy()->subDays(6)->startOfDay(), $today->copy()->endOfDay()],
            'monthly' => [$today->copy()->subDays(29)->startOfDay(), $today->copy()->endOfDay()],
            default => [$today->copy()->startOfDay(), $today->copy()->endOfDay()],
        };

        $orders = Order::with(['table', 'payment'])
            ->where('venue_id', $venueId)
            ->whereBetween('created_at', [$from, $to])
            ->latest()
            ->get();
        $revenue = round($orders->where('status', '!=', 'CANCELLED')->sum(fn ($order) => (float) $order->total_amount), 2);
        $activeOrders = $orders->whereIn('status', ['ORDER_TAKEN', 'IN_KITCHEN', 'READY'])->count();
        $completedOrders = $orders->where('status', 'SERVED')->count();
        $cancelledOrders = $orders->where('status', 'CANCELLED')->count();

        SalesReport::create([
            'venue_id' => $venueId,
            'generated_by' => $request->user()?->user_id,
            'period_type' => $period,
            'date_from' => $from->toDateString(),
            'date_to' => $to->toDateString(),
            'format' => $format,
            'file_url' => "generated://{$period}-report.{$format}",
            'created_at' => now(),
        ]);

        return response()->json([
            'venue_id' => $venueId,
            'venue' => Venue::find($venueId),
            'period' => $period,
            'generated_at' => now()->toIso8601String(),
            'date_from' => $from->toDateString(),
            'date_to' => $to->toDateString(),
            'totalOrders' => $orders->count(),
            'activeOrders' => $activeOrders,
            'completedOrders' => $completedOrders,
            'cancelledOrders' => $cancelledOrders,
            'revenue' => $revenue,
            'orders' => OrderResource::collection($orders),
        ]);
    }
}
