<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('staff_users')->whereIn('role', ['owner', 'manager'])->update(['role' => 'ADMIN']);
        DB::table('staff_users')->where('role', 'cashier')->update(['role' => 'WAITER']);
    }

    public function down(): void
    {
        DB::table('staff_users')->where('role', 'ADMIN')->update(['role' => 'manager']);
        DB::table('staff_users')->where('role', 'WAITER')->update(['role' => 'cashier']);
    }
};
