<?php

namespace Tests\Feature;

use App\Models\Floor;
use App\Models\Order;
use App\Models\RestaurantTable;
use App\Models\Tenant;
use App\Models\User;
use App\Models\MenuItem;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MergedTableOrderTest extends TestCase
{
    use RefreshDatabase;

    protected $tenant;
    protected $floor;
    protected $parentTable;
    protected $childTable;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create(['name' => 'Test Tenant', 'slug' => 'test-tenant']);
        $this->floor = Floor::create(['tenant_id' => $this->tenant->id, 'name' => 'Ground Floor']);
        
        $this->parentTable = RestaurantTable::create([
            'floor_id' => $this->floor->id,
            'table_number' => 'A1',
            'capacity' => 4,
            'shape' => 'square',
            'status' => 'available'
        ]);

        $this->childTable = RestaurantTable::create([
            'floor_id' => $this->floor->id,
            'table_number' => 'A2',
            'capacity' => 4,
            'shape' => 'square',
            'status' => 'available',
            'merged_with_id' => $this->parentTable->id,
            'is_merged' => false // is_merged is usually for the parent
        ]);

        $this->parentTable->update(['is_merged' => true]);
        
        $category = Category::create(['tenant_id' => $this->tenant->id, 'name' => 'Food', 'slug' => 'food']);
        MenuItem::create([
            'id' => 1,
            'category_id' => $category->id,
            'name' => 'Burger',
            'price' => 10.00,
            'is_available' => true
        ]);
    }

    /** @test */
    public function guest_order_on_child_table_is_linked_to_parent_table()
    {
        $response = $this->post(route('guest.store-order', [
            'tenant' => $this->tenant->slug,
            'table' => $this->childTable->id
        ]), [
            'items' => [
                ['id' => 1, 'price' => 10.00, 'quantity' => 1]
            ]
        ]);

        $response->assertStatus(200);
        
        $order = Order::first();
        $this->assertEquals($this->parentTable->id, $order->table_id);
    }

    /** @test */
    public function guest_menu_on_child_table_shows_parent_table_active_order()
    {
        // Create an order on parent table
        $order = Order::create([
            'tenant_id' => $this->tenant->id,
            'table_id' => $this->parentTable->id,
            'type' => 'dine-in',
            'status' => 'Pending',
            'subtotal' => 10.00,
            'tax' => 1.30,
            'total' => 11.30,
        ]);

        $response = $this->get(route('guest.menu', [
            'tenant' => $this->tenant->slug,
            'table' => $this->childTable->id
        ]));

        $response->assertStatus(200);
        $response->assertViewHas('activeOrder');
        $activeOrder = $response->viewData('activeOrder');
        $this->assertEquals($order->id, $activeOrder->id);
    }
}
