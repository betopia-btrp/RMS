<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingredients', function (Blueprint $table) {
            $table->uuid('ingredient_id')->primary();
            $table->string('name')->unique();
            $table->timestamps();
        });

        Schema::create('menu_item_ingredients', function (Blueprint $table) {
            $table->foreignUuid('item_id')->constrained('menu_items', 'item_id')->cascadeOnDelete();
            $table->foreignUuid('ingredient_id')->constrained('ingredients', 'ingredient_id')->cascadeOnDelete();
            $table->primary(['item_id', 'ingredient_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_item_ingredients');
        Schema::dropIfExists('ingredients');
    }
};
