<?php

namespace App\Http\Resources;

use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin MenuItem */
class MenuItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $tagNames = $this->tags->pluck('name')->values();
        $gallery = $this->relationLoaded('images') && $this->images->count()
            ? $this->images->sortBy('sort_order')->pluck('image_url')->values()
            : $this->photos->sortBy('sort_order')->pluck('s3_url')->values();
        $photo = $gallery->first();

        return [
            'id' => $this->item_id,
            'venueId' => $this->venue_id,
            'categoryId' => $this->category_id,
            'name' => $this->name,
            'description' => $this->description ?? '',
            'price' => (float) $this->price,
            'category' => $this->category?->name,
            'image' => $photo,
            'imageUrl' => $photo ?? '',
            'imageUrls' => $gallery,
            'tags' => $tagNames,
            'dietaryLabels' => $tagNames,
            'ingredients' => $this->ingredients->pluck('name')->values(),
            'ingredientIds' => $this->ingredients->pluck('ingredient_id')->values(),
            'allergens' => $this->allergens->pluck('name')->values(),
            'allergenIds' => $this->allergens->pluck('allergen_id')->values(),
            'nutritionCalories' => $this->calories,
            'nutritionProtein' => (float) $this->protein_g,
            'nutritionCarbs' => (float) $this->carbs_g,
            'nutritionFat' => (float) $this->fat_g,
            'spicy' => $tagNames->contains('Spicy'),
            'vegetarian' => $tagNames->contains('Vegetarian'),
            'vegan' => $tagNames->contains('Vegan'),
            'halal' => $tagNames->contains('Halal'),
            'glutenFree' => $tagNames->contains('Gluten-Free'),
            'available' => $this->is_available,
            'healthScore' => $this->health_score,
        ];
    }
}
