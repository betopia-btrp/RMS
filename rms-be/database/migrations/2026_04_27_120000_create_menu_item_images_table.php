<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_item_images', function (Blueprint $table) {
            $table->uuid('image_id')->primary();
            $table->foreignUuid('item_id')->constrained('menu_items', 'item_id')->cascadeOnDelete();
            $table->text('image_url');
            $table->unsignedInteger('sort_order')->default(1);
            $table->timestamp('uploaded_at')->nullable();
            $table->timestamps();
            $table->unique(['item_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_item_images');
    }
};
