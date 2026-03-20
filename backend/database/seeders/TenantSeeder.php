<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TenantSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tenant = \App\Models\Tenant::create([
            'name' => 'Pizza Palace',
            'slug' => 'pizza-palace',
            'address' => 'Kathmandu, Nepal',
            'status' => 'active',
        ]);

        $roles = [
            ['name' => 'Admin User', 'email' => 'admin@pizzapalace.com', 'role' => 'admin'],
            ['name' => 'Manager User', 'email' => 'manager@pizzapalace.com', 'role' => 'admin'],
            ['name' => 'Waiter One', 'email' => 'waiter1@pizzapalace.com', 'role' => 'waiter'],
            ['name' => 'Waiter Two', 'email' => 'waiter2@pizzapalace.com', 'role' => 'waiter'],
            ['name' => 'Kitchen Staff', 'email' => 'kitchen@pizzapalace.com', 'role' => 'kitchen'],
            ['name' => 'Cashier User', 'email' => 'cashier@pizzapalace.com', 'role' => 'cashier'],
        ];

        foreach ($roles as $roleData) {
            \App\Models\User::create([
                'tenant_id' => $tenant->id,
                'name' => $roleData['name'],
                'email' => $roleData['email'],
                'password' => bcrypt('password'),
                'role' => $roleData['role'],
            ]);
        }

        // --- Floors and Tables ---
        $floorsData = [
            ['name' => 'Ground Floor', 'order_index' => 1, 'tables' => 15],
            ['name' => 'First Floor', 'order_index' => 2, 'tables' => 10],
            ['name' => 'Rooftop', 'order_index' => 3, 'tables' => 8],
        ];

        foreach ($floorsData as $fData) {
            $floor = \App\Models\Floor::create([
                'tenant_id' => $tenant->id,
                'name' => $fData['name'],
                'order_index' => $fData['order_index'],
            ]);

            for ($i = 1; $i <= $fData['tables']; $i++) {
                \App\Models\RestaurantTable::create([
                    'floor_id' => $floor->id,
                    'table_number' => 'T-' . $i,
                    'capacity' => rand(2, 8),
                    'shape' => rand(0, 1) ? 'square' : 'round',
                    'status' => 'available',
                ]);
            }
        }

        // --- Categories ---
        $categories = [
            ['name' => 'Appetizers', 'nepali' => 'खाजा', 'order' => 1],
            ['name' => 'Main Course', 'nepali' => 'मुख्य खाना', 'order' => 2],
            ['name' => 'Beverages', 'nepali' => 'पेय पदार्थ', 'order' => 3],
            ['name' => 'Desserts', 'nepali' => 'मिठाई', 'order' => 4],
            ['name' => 'Specials', 'nepali' => 'विशेष', 'order' => 5],
        ];

        $stations = ['Kitchen', 'Bar', 'Tandoor'];

        foreach ($categories as $catData) {
            $category = \App\Models\Category::create([
                'tenant_id' => $tenant->id,
                'name' => $catData['name'],
                'nepali_name' => $catData['nepali'],
                'order_index' => $catData['order'],
                'is_active' => true,
            ]);

            // Seed items for each category
            if ($catData['name'] === 'Appetizers') {
                \App\Models\MenuItem::create([
                    'category_id' => $category->id,
                    'name' => 'Chicken Momo',
                    'price' => 250,
                    'spicy_level' => 2,
                    'preparation_station' => 'Kitchen',
                    'dietary_tags' => ['non-veg'],
                ]);
                \App\Models\MenuItem::create([
                    'category_id' => $category->id,
                    'name' => 'Buff Sekuwa',
                    'price' => 400,
                    'spicy_level' => 3,
                    'preparation_station' => 'Tandoor',
                    'dietary_tags' => ['non-veg'],
                ]);
            } elseif ($catData['name'] === 'Main Course') {
                \App\Models\MenuItem::create([
                    'category_id' => $category->id,
                    'name' => 'Veg Thali',
                    'price' => 350,
                    'spicy_level' => 1,
                    'preparation_station' => 'Kitchen',
                    'dietary_tags' => ['veg'],
                ]);
                \App\Models\MenuItem::create([
                    'category_id' => $category->id,
                    'name' => 'Dal Bhat',
                    'price' => 300,
                    'spicy_level' => 1,
                    'preparation_station' => 'Kitchen',
                    'dietary_tags' => ['veg'],
                ]);
            } elseif ($catData['name'] === 'Beverages') {
                \App\Models\MenuItem::create([
                    'category_id' => $category->id,
                    'name' => 'Lassi',
                    'price' => 120,
                    'spicy_level' => 0,
                    'preparation_station' => 'Bar',
                    'dietary_tags' => ['veg'],
                ]);
            } elseif ($catData['name'] === 'Desserts') {
                \App\Models\MenuItem::create([
                    'category_id' => $category->id,
                    'name' => 'Gulab Jamun',
                    'price' => 150,
                    'spicy_level' => 0,
                    'preparation_station' => 'Kitchen',
                    'dietary_tags' => ['veg'],
                    'is_available' => false,
                ]);
            }
        }

        // --- Inventory ---
        $materials = [
            ['name' => 'Basmati Rice', 'unit' => 'kg', 'stock' => 15, 'min' => 20],
            ['name' => 'Chicken Breast', 'unit' => 'kg', 'stock' => 3, 'min' => 10],
            ['name' => 'Cooking Oil', 'unit' => 'ltr', 'stock' => 5, 'min' => 8],
            ['name' => 'Flour (Maida)', 'unit' => 'kg', 'stock' => 25, 'min' => 15],
            ['name' => 'Onions', 'unit' => 'kg', 'stock' => 30, 'min' => 10],
            ['name' => 'Tomatoes', 'unit' => 'kg', 'stock' => 8, 'min' => 10],
        ];

        foreach ($materials as $m) {
            $material = \App\Models\RawMaterial::create([
                'tenant_id' => $tenant->id,
                'name' => $m['name'],
                'unit' => $m['unit'],
                'current_stock' => $m['stock'],
                'min_stock_level' => $m['min'],
            ]);

            // Add a sample purchase for each
            \App\Models\Purchase::create([
                'tenant_id' => $tenant->id,
                'raw_material_id' => $material->id,
                'supplier_name' => 'Local Supplier Co.',
                'quantity' => rand(10, 50),
                'cost' => rand(1000, 5000),
                'purchase_date' => now()->subDays(rand(1, 30)),
            ]);
        }
    }
}
