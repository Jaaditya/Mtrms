<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Tenant;

$tenant = Tenant::first();

echo "--- RESTAURANT SETTINGS VERIFICATION ---\n";
echo "Name: {$tenant->name}\n";
echo "Bill Prefix: {$tenant->bill_prefix}\n";
echo "Currency: {$tenant->currency}\n";
echo "Timezone: {$tenant->timezone}\n";
echo "VAT No: {$tenant->vat_no}\n";
echo "PAN: {$tenant->pan}\n";
echo "Auto Print KOT: " . ($tenant->auto_print_kot ? 'Yes' : 'No') . "\n";
echo "Sound Notifications: " . ($tenant->sound_notifications ? 'Yes' : 'No') . "\n";
echo "Compact View: " . ($tenant->compact_table_view ? 'Yes' : 'No') . "\n";
echo "----------------------------------------\n";
