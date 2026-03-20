<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('currency')->default('npr')->after('plan');
            $table->string('timezone')->default('npt')->after('currency');
            $table->boolean('auto_print_kot')->default(true)->after('timezone');
            $table->boolean('sound_notifications')->default(true)->after('auto_print_kot');
            $table->boolean('compact_table_view')->default(false)->after('sound_notifications');
            $table->string('bill_prefix')->default('INV-')->after('compact_table_view');
            $table->text('footer_note')->nullable()->after('bill_prefix');
            $table->string('kot_printer')->nullable()->after('footer_note');
            $table->string('bill_printer')->nullable()->after('kot_printer');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn([
                'currency', 'timezone', 'auto_print_kot', 'sound_notifications', 
                'compact_table_view', 'bill_prefix', 'footer_note', 'kot_printer', 'bill_printer'
            ]);
        });
    }
};
