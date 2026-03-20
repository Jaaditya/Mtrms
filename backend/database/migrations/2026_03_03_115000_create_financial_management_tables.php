<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->decimal('vat_rate', 5, 2)->default(13.00)->after('status');
            $table->decimal('service_charge_rate', 5, 2)->default(10.00)->after('vat_rate');
            $table->boolean('is_service_charge_enabled')->default(true)->after('service_charge_rate');
            $table->string('tax_type')->default('exclusive')->after('is_service_charge_enabled'); // inclusive, exclusive
        });

        Schema::create('discount_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->enum('type', ['Bill Level', 'Item Level'])->default('Bill Level');
            $table->decimal('value', 10, 2);
            $table->string('conditions')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('promo_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->string('code')->unique();
            $table->decimal('discount_value', 10, 2);
            $table->enum('type', ['percentage', 'fixed'])->default('percentage');
            $table->date('expiry_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promo_codes');
        Schema::dropIfExists('discount_rules');
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['vat_rate', 'service_charge_rate', 'is_service_charge_enabled', 'tax_type']);
        });
    }
};
