<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Tenant;
use App\Models\User;

$user = User::first();
$tenant = $user->tenant;

echo "Original Bill Prefix: {$tenant->bill_prefix}\n";

$tenant->update(['bill_prefix' => 'TEST-']);
$tenant->refresh();

echo "Updated Bill Prefix: {$tenant->bill_prefix}\n";

// Reset back
$tenant->update(['bill_prefix' => 'INV-']);

if ($tenant->bill_prefix === 'INV-') {
    echo "Verification SUCCESS: Settings updated and persistent.\n";
} else {
    echo "Verification FAILED: Could not reset setting.\n";
}
