<?php

namespace App\Models;

use App\Models\Concerns\UsesUuidPrimaryKey;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['venue_id', 'category_id', 'name', 'description', 'price', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'health_score', 'is_available', 'admin_adjusted', 'sort_order'])]
class MenuItem extends Model
{
    use UsesUuidPrimaryKey;

    protected $primaryKey = 'item_id';

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'protein_g' => 'decimal:2',
            'carbs_g' => 'decimal:2',
            'fat_g' => 'decimal:2',
            'is_available' => 'boolean',
            'admin_adjusted' => 'boolean',
        ];
    }

    public function venue(): BelongsTo { return $this->belongsTo(Venue::class, 'venue_id'); }
    public function category(): BelongsTo { return $this->belongsTo(MenuCategory::class, 'category_id'); }
    public function images(): HasMany { return $this->hasMany(MenuItemImage::class, 'item_id')->orderBy('sort_order'); }
    public function photos(): HasMany { return $this->hasMany(MenuItemPhoto::class, 'item_id'); }
    public function tags(): BelongsToMany { return $this->belongsToMany(DietaryTag::class, 'menu_item_tags', 'item_id', 'tag_id'); }
    public function ingredients(): BelongsToMany { return $this->belongsToMany(Ingredient::class, 'menu_item_ingredients', 'item_id', 'ingredient_id'); }
    public function allergens(): BelongsToMany { return $this->belongsToMany(Allergen::class, 'menu_item_allergens', 'item_id', 'allergen_id'); }
}
