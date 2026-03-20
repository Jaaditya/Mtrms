<?php

namespace Database\Seeders;

use App\Models\DiscountRule;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class TaxDiscountSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::first();
        if (!$tenant) return;

        // Default settings are already in migration, but we can update them here
        $tenant->update([
            'vat_rate' => 13.00,
            'service_charge_rate' => 10.00,
            'is_service_charge_enabled' => true,
            'tax_type' => 'exclusive',
        ]);

        // Create some discount rules
        DiscountRule::create([
            'tenant_id' => $tenant->id,
            'name' => 'Happy Hour',
            'type' => 'Bill Level',
            'value' => 15.00,
            'conditions' => '4PM - 6PM Daily',
            'is_active' => true,
        ]);

        DiscountRule::create([
            'tenant_id' => $tenant->id,
            'name' => 'Early Bird',
            'type' => 'Bill Level',
            'value' => 10.00,
            'conditions' => 'Before 12PM',
            'is_active' => false,
        ]);
    }
}
