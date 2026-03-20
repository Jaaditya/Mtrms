import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/kitchen_notification_service.dart';

class KitchenView extends StatefulWidget {
  const KitchenView({super.key});

  @override
  State<KitchenView> createState() => _KitchenViewState();
}

class _KitchenViewState extends State<KitchenView> {
  List<dynamic> _orders = [];
  Set<int> _knownOrderIds = {};
  bool _isLoading = true;
  String? _error;
  Timer? _pollTimer;
  final Set<int> _updatingItems = {};
  final Set<int> _updatingOrders = {};

  static const Color _amber = Color(0xFFE59F0A);
  static const Color _green = Color(0xFF22C55E);
  static const Color _blue = Color(0xFF3B82F6);
  static const Color _surface = Color(0xFF1A1E2E);
  static const Color _bg = Color(0xFF0F1117);
  static const Color _borderDark = Color(0xFF2C3150);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _fetchOrders());
    _pollTimer = Timer.periodic(
      const Duration(seconds: 10),
      (_) => _fetchOrders(),
    );
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchOrders() async {
    if (!mounted) return;
    final api = Provider.of<ApiService>(context, listen: false);
    try {
      final orders = await api.getKitchenOrders();
      final newOrderIds = orders.map<int>((o) => o['id'] as int).toSet();
      if (_knownOrderIds.isNotEmpty) {
        final incoming = newOrderIds.difference(_knownOrderIds);
        for (final id in incoming) {
          final order = orders.firstWhere((o) => o['id'] == id);
          final tableNum = order['table']?['table_number']?.toString();
          await KitchenNotificationService.showNewOrderNotification(
            id,
            tableNumber: tableNum,
          );
        }
      }
      if (mounted) {
        setState(() {
          _orders = orders;
          _knownOrderIds = newOrderIds;
          _isLoading = false;
          _error = null;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _updateItemStatus(int itemId, String status) async {
    setState(() => _updatingItems.add(itemId));
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      await api.updateItemStatus(itemId, status);
      await _fetchOrders();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _updatingItems.remove(itemId));
    }
  }

  Future<void> _markOrderReady(int orderId) async {
    setState(() => _updatingOrders.add(orderId));
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      await api.markOrderReady(orderId);
      await _fetchOrders();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _updatingOrders.remove(orderId));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _surface,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: _amber.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.restaurant, color: _amber, size: 18),
            ),
            const SizedBox(width: 10),
            const Text(
              'Kitchen Display',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, size: 20),
            onPressed: _fetchOrders,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.wifi_off, size: 48, color: Colors.grey),
                  const SizedBox(height: 12),
                  Text(_error!, style: const TextStyle(color: Colors.grey)),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: _fetchOrders,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Retry'),
                  ),
                ],
              ),
            )
          : _orders.isEmpty
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: _amber.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.restaurant_menu,
                      size: 56,
                      color: _amber,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Kitchen is clear!',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Waiting for new orders...',
                    style: TextStyle(color: Colors.grey[500], fontSize: 13),
                  ),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: _fetchOrders,
              child: ListView.builder(
                padding: const EdgeInsets.all(12),
                itemCount: _orders.length,
                itemBuilder: (context, i) => _buildOrderCard(_orders[i]),
              ),
            ),
    );
  }

  Widget _buildOrderCard(Map<String, dynamic> order) {
    final orderId = order['id'] as int;
    final tableNumber =
        order['table']?['table_number']?.toString() ?? 'Takeaway';
    final items = (order['items'] as List<dynamic>?) ?? [];
    final status = order['status'] as String;
    final isOrderUpdating = _updatingOrders.contains(orderId);
    final activeItems = items.where((item) {
      final s = (item['status'] as String?) ?? '';
      return s != 'Ready' && s != 'Served' && s != 'Cancelled';
    }).toList();
    final statusColor = status == 'Pending' ? _blue : _amber;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: _surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: statusColor.withValues(alpha: 0.3),
          width: 1.5,
        ),
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.08),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(11),
                topRight: Radius.circular(11),
              ),
            ),
            child: Row(
              children: [
                Icon(Icons.tag, size: 14, color: statusColor),
                const SizedBox(width: 4),
                Text(
                  'Order #$orderId',
                  style: TextStyle(
                    color: statusColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    status.toUpperCase(),
                    style: TextStyle(
                      color: statusColor,
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1,
                    ),
                  ),
                ),
                const Spacer(),
                Icon(Icons.table_restaurant, size: 13, color: Colors.grey[400]),
                const SizedBox(width: 3),
                Text(
                  'Table $tableNumber',
                  style: TextStyle(color: Colors.grey[400], fontSize: 12),
                ),
              ],
            ),
          ),

          // Items + Action
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                if (activeItems.isEmpty)
                  const Padding(
                    padding: EdgeInsets.all(8),
                    child: Text(
                      'All items are ready',
                      style: TextStyle(color: Colors.grey, fontSize: 13),
                    ),
                  )
                else
                  ...activeItems.map((item) => _buildItemRow(item)),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _green,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    onPressed: isOrderUpdating
                        ? null
                        : () => _markOrderReady(orderId),
                    icon: isOrderUpdating
                        ? const SizedBox.square(
                            dimension: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.check_circle_outline, size: 18),
                    label: Text(
                      isOrderUpdating ? 'Updating...' : 'Mark Order Ready',
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildItemRow(Map<String, dynamic> item) {
    final itemId = item['id'] as int;
    final name = (item['menu_item']?['name'] as String?) ?? 'Item';
    final qty = (item['quantity'] as int?) ?? 1;
    final instructions = item['instructions'] as String?;
    final status = (item['status'] as String?) ?? 'Pending';
    final isCooking = status == 'Preparing';
    final isUpdating = _updatingItems.contains(itemId);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: _bg,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: _borderDark, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: _amber.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  '$qty\u00d7',
                  style: const TextStyle(
                    color: _amber,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ),
              if (isUpdating)
                const SizedBox.square(
                  dimension: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: _amber,
                  ),
                )
              else if (!isCooking)
                GestureDetector(
                  onTap: () => _updateItemStatus(itemId, 'Preparing'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: _amber.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: _amber.withValues(alpha: 0.4)),
                    ),
                    child: const Text(
                      'Start',
                      style: TextStyle(
                        color: _amber,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                )
              else
                GestureDetector(
                  onTap: () => _updateItemStatus(itemId, 'Ready'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: _green.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: _green.withValues(alpha: 0.4)),
                    ),
                    child: const Text(
                      'Ready ✓',
                      style: TextStyle(
                        color: _green,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          if (instructions != null && instructions.isNotEmpty) ...[
            const SizedBox(height: 6),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
              decoration: BoxDecoration(
                color: _amber.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(5),
                border: Border.all(color: _amber.withValues(alpha: 0.2)),
              ),
              child: Text(
                '📝 $instructions',
                style: const TextStyle(color: _amber, fontSize: 11),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
