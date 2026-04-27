<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpsertMenuItemRequest;
use App\Http\Resources\MenuItemResource;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\TableUnit;
use App\Models\Venue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    public function currentMenu(): JsonResponse
    {
        $venue = Venue::query()->where('is_active', true)->firstOrFail();

        return $this->venueMenu($venue);
    }

    public function venueMenu(Venue $venue): JsonResponse
    {
        return response()->json([
            'venue' => $venue,
            'categories' => MenuCategory::query()
                ->where('venue_id', $venue->venue_id)
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get(),
            'items' => MenuItem::query()
                ->with(['category', 'images', 'photos', 'tags', 'ingredients', 'allergens'])
                ->where('venue_id', $venue->venue_id)
                ->where('is_available', true)
                ->orderBy('sort_order')
                ->get()
                ->map(fn (MenuItem $item) => (new MenuItemResource($item))->resolve()),
        ]);
    }

    public function tableMenu(TableUnit $table): JsonResponse
    {
        $table->load(['venue', 'qrCode']);

        return response()->json([
            'table' => $table,
            'menu' => $this->venueMenu($table->venue)->getData(true),
        ]);
    }

    public function store(UpsertMenuItemRequest $request): JsonResponse
    {
        $item = MenuItem::create($request->safe()->except(['tag_ids', 'ingredient_ids', 'allergen_ids', 'image_url', 'image_urls']));
        $this->syncLabels($item, $request);
        $this->syncImages($item, $request);

        return response()->json(new MenuItemResource($item->load(['category', 'images', 'photos', 'tags', 'ingredients', 'allergens'])), 201);
    }

    public function update(UpsertMenuItemRequest $request, MenuItem $menuItem): JsonResponse
    {
        $menuItem->update($request->safe()->except(['tag_ids', 'ingredient_ids', 'allergen_ids', 'image_url', 'image_urls']));
        $this->syncLabels($menuItem, $request);
        $this->syncImages($menuItem, $request);

        return response()->json(new MenuItemResource($menuItem->load(['category', 'images', 'photos', 'tags', 'ingredients', 'allergens'])));
    }

    public function destroy(MenuItem $menuItem): JsonResponse
    {
        $menuItem->delete();

        return response()->json(['deleted' => true]);
    }

    public function toggle(MenuItem $menuItem): JsonResponse
    {
        $menuItem->update(['is_available' => ! $menuItem->is_available]);

        return response()->json(new MenuItemResource($menuItem->load(['category', 'images', 'photos', 'tags', 'ingredients', 'allergens'])));
    }

    private function syncLabels(MenuItem $item, Request $request): void
    {
        if ($request->has('tag_ids')) {
            $item->tags()->sync($request->array('tag_ids'));
        }

        if ($request->has('ingredient_ids')) {
            $item->ingredients()->sync($request->array('ingredient_ids'));
        }

        if ($request->has('allergen_ids')) {
            $item->allergens()->sync($request->array('allergen_ids'));
        }
    }

    private function syncImages(MenuItem $item, Request $request): void
    {
        $imageUrls = collect($request->input('image_urls', []))
            ->filter(fn ($value) => is_string($value) && filled($value))
            ->values();

        if ($imageUrls->isEmpty() && $request->filled('image_url')) {
            $imageUrls = collect([$request->string('image_url')->toString()]);
        }

        if ($imageUrls->isEmpty()) {
            return;
        }

        $item->images()->delete();

        $imageUrls->take(5)->values()->each(function (string $url, int $index) use ($item) {
            $item->images()->create([
                'image_url' => $url,
                'sort_order' => $index + 1,
                'uploaded_at' => now(),
            ]);
        });

        $primaryUrl = $imageUrls->first();
        $photo = $item->photos()->orderBy('sort_order')->first();

        if ($photo) {
            $photo->update(['s3_url' => $primaryUrl, 'sort_order' => 1, 'uploaded_at' => now()]);
        } else {
            $item->photos()->create([
                's3_url' => $primaryUrl,
                'sort_order' => 1,
                'uploaded_at' => now(),
            ]);
        }
    }
}
