<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Laravel\Sanctum\Sanctum;

class TenantApiTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    public function test_can_list_tenants()
    {
        Tenant::factory()->count(3)->create();

        $response = $this->getJson('/api/tenants');

        $response->assertStatus(200)
                 ->assertJsonCount(3);
    }

    public function test_can_create_tenant()
    {
        $data = [
            'name' => 'Test Restaurant',
            'address' => '123 Test St',
            'contact' => '1234567890',
            'pan' => 'PAN123',
            'plan' => 'Premium',
            'status' => 'Active'
        ];

        $response = $this->postJson('/api/tenants', $data);

        $response->assertStatus(201)
                 ->assertJsonFragment(['name' => 'Test Restaurant']);
        
        $this->assertDatabaseHas('tenants', ['name' => 'Test Restaurant']);
    }

    public function test_can_update_tenant()
    {
        $tenant = Tenant::factory()->create(['name' => 'Old Name']);

        $data = ['name' => 'New Name'];

        $response = $this->putJson("/api/tenants/{$tenant->id}", $data);

        $response->assertStatus(200)
                 ->assertJsonFragment(['name' => 'New Name']);
    }

    public function test_can_delete_tenant()
    {
        $tenant = Tenant::factory()->create();

        $response = $this->deleteJson("/api/tenants/{$tenant->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('tenants', ['id' => $tenant->id]);
    }
}
