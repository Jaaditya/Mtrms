<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function getSummary()
    {
        $tenantId = auth()->user()->tenant_id;
        
        $startOfWeek = Carbon::now()->startOfWeek();
        $endOfWeek = Carbon::now()->endOfWeek();

        $weeklyRevenue = Order::where('tenant_id', $tenantId)
            ->whereBetween('created_at', [$startOfWeek, $endOfWeek])
            ->where('status', 'Completed')
            ->sum('total');

        $totalOrders = Order::where('tenant_id', $tenantId)
            ->whereBetween('created_at', [$startOfWeek, $endOfWeek])
            ->count();

        $avgOrderValue = $totalOrders > 0 ? $weeklyRevenue / $totalOrders : 0;

        // Mock data for table turnover as it requires more complex seating tracking
        $tableTurnover = 3.5; 

        return response()->json([
            'weekly_revenue' => $weeklyRevenue,
            'total_orders' => $totalOrders,
            'avg_order_value' => round($avgOrderValue, 2),
            'table_turnover' => $tableTurnover,
            'revenue_change' => '+15%', // Mock comparison
            'orders_change' => '+8%'
        ]);
    }

    public function getSalesData()
    {
        $tenantId = auth()->user()->tenant_id;
        $data = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $dayName = $date->format('D');
            
            $revenue = Order::where('tenant_id', $tenantId)
                ->whereDate('created_at', $date)
                ->where('status', 'Completed')
                ->sum('total');
                
            $orders = Order::where('tenant_id', $tenantId)
                ->whereDate('created_at', $date)
                ->count();

            $data[] = [
                'day' => $dayName,
                'revenue' => (float)$revenue,
                'orders' => $orders
            ];
        }

        return response()->json($data);
    }

    public function getCategorySales()
    {
        $tenantId = auth()->user()->tenant_id;

        $sales = DB::table('order_items')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->join('categories', 'menu_items.category_id', '=', 'categories.id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.tenant_id', $tenantId)
            ->where('orders.status', 'Completed')
            ->select('categories.name', DB::raw('SUM(order_items.quantity * order_items.unit_price) as sales'))
            ->groupBy('categories.id', 'categories.name')
            ->orderBy('sales', 'desc')
            ->get();

        return response()->json($sales);
    }

    public function getStaffPerformance()
    {
        $tenantId = auth()->user()->tenant_id;

        $performance = User::where('tenant_id', $tenantId)
            ->withCount(['orders' => function($query) {
                $query->where('status', 'Completed');
            }])
            ->withSum(['orders' => function($query) {
                $query->where('status', 'Completed');
            }], 'total')
            ->get()
            ->map(function($user) {
                return [
                    'name' => $user->name,
                    'orders_count' => $user->orders_count,
                    'total_sales' => $user->orders_sum_total ?: 0,
                ];
            });

        return response()->json($performance);
    }

    public function getDashboardStats()
    {
        $tenantId = auth()->user()->tenant_id;
        $today = Carbon::today();

        // 1. KPI Cards
        $todayRevenue = Order::where('tenant_id', $tenantId)
            ->whereDate('created_at', $today)
            ->where('status', 'Completed')
            ->sum('total');

        $todayOrders = Order::where('tenant_id', $tenantId)
            ->whereDate('created_at', $today)
            ->count();

        $pendingOrders = Order::where('tenant_id', $tenantId)
            ->whereIn('status', ['Pending', 'Preparing', 'Ready'])
            ->count();

        $avgOrderValue = $todayOrders > 0 ? $todayRevenue / $todayOrders : 0;

        $topItem = DB::table('order_items')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.tenant_id', $tenantId)
            ->whereDate('orders.created_at', $today)
            ->select('menu_items.name', DB::raw('COUNT(*) as total_orders'))
            ->groupBy('menu_items.id', 'menu_items.name')
            ->orderBy('total_orders', 'desc')
            ->first();

        $activeStaff = User::where('tenant_id', $tenantId)->count();

        // 2. Hourly Sales
        $hourlySales = [];
        for ($i = 8; $i <= 22; $i++) {
            $hour = str_pad($i, 2, '0', STR_PAD_LEFT);
            $revenue = Order::where('tenant_id', $tenantId)
                ->whereDate('created_at', $today)
                ->whereRaw("HOUR(created_at) = ?", [$i])
                ->where('status', 'Completed')
                ->sum('total');
            
            $label = $i <= 11 ? $i . 'AM' : ($i == 12 ? '12PM' : ($i - 12) . 'PM');
            $hourlySales[] = ['time' => $label, 'sales' => (float)$revenue];
        }

        // 3. Order Distribution
        $distribution = Order::where('tenant_id', $tenantId)
            ->whereDate('created_at', $today)
            ->select('type as name', DB::raw('COUNT(*) as value'))
            ->groupBy('type')
            ->get();

        // 4. Running Orders
        $runningOrders = Order::where('tenant_id', $tenantId)
            ->whereIn('status', ['Pending', 'Preparing', 'Ready', 'Served'])
            ->with(['table', 'items'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(function($order) {
                return [
                    'id' => 'ORD-' . $order->id,
                    'table' => $order->table ? $order->table->table_number : 'N/A',
                    'items' => $order->items->count(),
                    'status' => $order->status,
                    'time' => $order->created_at->diffForHumans(null, true)
                ];
            });

        // 5. Low Stock
        $lowStock = \App\Models\RawMaterial::where('tenant_id', $tenantId)
            ->whereRaw('current_stock <= min_stock_level')
            ->limit(3)
            ->get();

        // 6. Table Status
        $tableStatus = DB::table('tables')
            ->join('floors', 'tables.floor_id', '=', 'floors.id')
            ->where('floors.tenant_id', $tenantId)
            ->select('tables.status as label', DB::raw('COUNT(*) as count'))
            ->groupBy('tables.status')
            ->get();

        return response()->json([
            'kpi' => [
                'today_sales' => (float)$todayRevenue,
                'total_orders' => $todayOrders,
                'avg_order_value' => round((float)$avgOrderValue, 2),
                'pending_orders' => $pendingOrders,
                'top_item' => $topItem ? $topItem->name : 'N/A',
                'active_staff' => $activeStaff
            ],
            'hourly_sales' => $hourlySales,
            'distribution' => $distribution,
            'running_orders' => $runningOrders,
            'low_stock' => $lowStock,
            'table_status' => $tableStatus
        ]);
    }
}
