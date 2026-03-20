<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Tenant>
 */
class TenantFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = $this->faker->company;
        return [
            'name' => $name,
            'slug' => \Illuminate\Support\Str::slug($name) . '-' . rand(1000, 9999),
            'address' => $this->faker->address,
            'contact' => $this->faker->phoneNumber,
            'pan' => (string) $this->faker->numberBetween(100000000, 999999999),
            'plan' => $this->faker->randomElement(['Basic', 'Standard', 'Premium']),
            'status' => 'Active',
        ];
    }
}
