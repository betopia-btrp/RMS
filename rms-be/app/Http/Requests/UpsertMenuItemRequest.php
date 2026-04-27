<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpsertMenuItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'venue_id' => [$required, 'uuid', 'exists:venues,venue_id'],
            'category_id' => [$required, 'uuid', 'exists:menu_categories,category_id'],
            'name' => [$required, 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => [$required, 'numeric', 'min:0'],
            'calories' => ['sometimes', 'integer', 'min:0'],
            'protein_g' => ['sometimes', 'numeric', 'min:0'],
            'carbs_g' => ['sometimes', 'numeric', 'min:0'],
            'fat_g' => ['sometimes', 'numeric', 'min:0'],
            'health_score' => ['sometimes', 'integer', 'between:0,100'],
            'is_available' => ['sometimes', 'boolean'],
            'admin_adjusted' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'image_url' => ['sometimes', 'url', 'max:2048'],
            'image_urls' => ['sometimes', 'array', 'max:5'],
            'image_urls.*' => ['url', 'max:2048'],
            'ingredient_ids' => ['sometimes', 'array'],
            'ingredient_ids.*' => ['uuid', 'exists:ingredients,ingredient_id'],
            'allergen_ids' => ['sometimes', 'array'],
            'allergen_ids.*' => ['uuid', 'exists:allergens,allergen_id'],
            'tag_ids' => ['sometimes', 'array'],
            'tag_ids.*' => ['uuid', 'exists:dietary_tags,tag_id'],
        ];
    }
}
