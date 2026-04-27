<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('client_request_id', 120)->nullable()->after('customer_id');
            $table->unique(['venue_id', 'client_request_id']);
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropUnique(['venue_id', 'client_request_id']);
            $table->dropColumn('client_request_id');
        });
    }
};
