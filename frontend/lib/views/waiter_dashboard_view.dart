import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import '../services/fcm_service.dart';
import '../services/kitchen_notification_service.dart';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';
import '../models/floor.dart';
import '../utils/app_theme.dart';
import 'waiter_table_selection_view.dart';

enum WaiterSection { dashboard, profile, tables, orders, bills, todayServiced, notifications }

class WaiterDashboardView extends StatefulWidget {
  final String waiterId;
  const WaiterDashboardView({super.key, required this.waiterId});

  @override
  State<WaiterDashboardView> createState() => _WaiterDashboardViewState();
}

class _WaiterDashboardViewState extends State<WaiterDashboardView> {
  List<dynamic> _orders = [];
  List<dynamic> _tables = [];
  List<dynamic> _todayServicedOrders = [];
  final List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = true;
  String? _error;
  Timer? _pollTimer;
  final Set<int> _updatingOrders = {};
  WaiterSection _selectedSection = WaiterSection.dashboard;
  List<Floor> _floors = [];
  int? _selectedFloorId;

  static const Color _amber = AppColors.primary;
  static const Color _green = AppColors.success;
  static const Color _blue = AppColors.info;
  static const Color _surface = AppColors.card;
  static const Color _bg = AppColors.background;
  static const Color _borderDark = AppColors.border;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _fetchOrders());
    _pollTimer = Timer.periodic(
      const Duration(seconds: 10),
      (_) => _fetchOrders(),
    );
    _setupFcmListener();
  }

  void _setupFcmListener() {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      if (!mounted) return;
      setState(() {
        _notifications.insert(0, {
          'title': message.notification?.title ?? 'New Notification',
          'body': message.notification?.body ?? '',
          'time': DateTime.now(),
          'data': message.data,
        });
      });
      // Also show the local notification/toast
      KitchenNotificationService.showNotification(
        message.notification?.title ?? 'Notification',
        message.notification?.body ?? '',
      );
    });
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
      final ordersFuture = api.getWaiterOrders(widget.waiterId);
      final tablesFuture = api.getWaiterTables(widget.waiterId);
      final floorsFuture = api.getFloors();
      final todayServicedFuture = api.getTodayServicedOrders(widget.waiterId);

      final results = await Future.wait([
        ordersFuture,
        tablesFuture,
        floorsFuture,
        todayServicedFuture,
      ]);

      if (mounted) {
        setState(() {
          _orders = results[0];
          _tables = results[1];
          _floors = results[2] as List<Floor>;
          _todayServicedOrders = results[3];
          if (_floors.isNotEmpty && _selectedFloorId == null) {
            _selectedFloorId = _floors.first.id;
          }
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

  Future<void> _markOrderServed(int orderId) async {
    setState(() => _updatingOrders.add(orderId));
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      await api.markOrderServed(orderId);
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

  Future<void> _requestBill(int tableId) async {
    // We use a negative ID or a generic flag so we don't conflict with order IDs in _updatingOrders
    setState(() => _updatingOrders.add(-tableId));
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      await api.requestBillForTable(tableId);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Bill requested successfully!'),
            backgroundColor: Colors.green,
          ),
        );

        // Find the orders for this table to show the summary
        final tableOrders =
            _groupOrdersByTable().firstWhere(
                  (g) => g['tableData']?['id'] == tableId,
                  orElse: () => <String, dynamic>{},
                )['orders']
                as List<Map<String, dynamic>>?;

        if (tableOrders != null && tableOrders.isNotEmpty) {
          _showBillSummaryDialog(tableOrders);
        }
      }
      await _fetchOrders();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _updatingOrders.remove(-tableId));
    }
  }

  Future<void> _settleTable(int tableId, String method) async {
    setState(() => _updatingOrders.add(-tableId));
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      await api.settleTable(tableId, method);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Table settled ($method)! Status: Cleaning'),
            backgroundColor: Colors.green,
          ),
        );
      }
      await _fetchOrders();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _updatingOrders.remove(-tableId));
    }
  }

  Future<void> _markTableCleaned(int tableId) async {
    setState(() => _updatingOrders.add(-tableId));
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      await api.markTableCleaned(tableId);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Table is now available!'),
            backgroundColor: Colors.green,
          ),
        );
      }
      await _fetchOrders();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _updatingOrders.remove(-tableId));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _surface,
        title: _buildAppBarTitle(),
        actions: [
          if (_selectedSection == WaiterSection.dashboard)
            IconButton(
              icon: const Icon(Icons.refresh, size: 20),
              onPressed: _fetchOrders,
              tooltip: 'Refresh',
            ),
          Badge(
            label: Text(_notifications.length.toString()),
            isLabelVisible: _notifications.isNotEmpty,
            child: IconButton(
              icon: const Icon(Icons.notifications_outlined),
              onPressed: () {
                setState(() => _selectedSection = WaiterSection.notifications);
              },
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      drawer: _buildDrawer(),
      body: _buildBody(),
      floatingActionButton: _selectedSection == WaiterSection.dashboard
          ? FloatingActionButton.extended(
              backgroundColor: _blue,
              foregroundColor: Colors.white,
              icon: const Icon(Icons.add_circle_outline),
              label: const Text(
                'Take New Order',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) =>
                        WaiterTableSelectionView(waiterId: widget.waiterId),
                  ),
                );
              },
            )
          : null,
    );
  }

  Widget _buildAppBarTitle() {
    String title;
    IconData icon;
    switch (_selectedSection) {
      case WaiterSection.dashboard:
        title = 'Dashboard';
        icon = Icons.room_service;
        break;
      case WaiterSection.profile:
        title = 'My Profile';
        icon = Icons.person;
        break;
      case WaiterSection.tables:
        title = 'Tables Status';
        icon = Icons.table_restaurant;
        break;
      case WaiterSection.orders:
        title = 'Active Orders';
        icon = Icons.list_alt;
        break;
      case WaiterSection.bills:
        title = 'Pending Bills';
        icon = Icons.receipt_long;
        break;
      case WaiterSection.todayServiced:
        title = 'Today\'s Serviced';
        icon = Icons.check_circle;
        break;
      case WaiterSection.notifications:
        title = 'Notifications';
        icon = Icons.notifications;
        break;
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: _blue.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: _blue, size: 18),
        ),
        const SizedBox(width: 10),
        Text(
          title,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }

  Widget _buildDrawer() {
    return Drawer(
      backgroundColor: _bg,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildDrawerHeader(),
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                _buildDrawerItem(
                  WaiterSection.dashboard,
                  'Dashboard',
                  Icons.dashboard_outlined,
                ),
                _buildDrawerItem(
                  WaiterSection.profile,
                  'Profile',
                  Icons.person_outline,
                ),
                _buildDrawerItem(
                  WaiterSection.tables,
                  'Tables Status',
                  Icons.table_restaurant_outlined,
                ),
                _buildDrawerItem(
                  WaiterSection.orders,
                  'Orders',
                  Icons.list_alt_outlined,
                ),
                _buildDrawerItem(
                  WaiterSection.bills,
                  'Bills',
                  Icons.receipt_long_outlined,
                ),
                _buildDrawerItem(
                  WaiterSection.todayServiced,
                  'Today\'s Serviced',
                  Icons.history_outlined,
                ),
                _buildDrawerItem(
                  WaiterSection.notifications,
                  'Notifications',
                  Icons.notifications_outlined,
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: _borderDark),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.redAccent),
            title: const Text(
              'Logout',
              style: TextStyle(color: Colors.redAccent),
            ),
            onTap: () {
              Provider.of<AuthProvider>(context, listen: false).logout();
            },
          ),
          const SizedBox(height: 10),
        ],
      ),
    );
  }

  Widget _buildDrawerHeader() {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 50, 20, 20),
      decoration: BoxDecoration(
        color: _surface,
        border: Border(
          bottom: BorderSide(color: _blue.withOpacity(0.1), width: 1),
        ),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: _blue.withOpacity(0.15),
            radius: 28,
            child: const Icon(Icons.person_rounded, color: _blue, size: 32),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  auth.userName ?? 'Waiter Profile',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.3,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: _blue.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    auth.userRole?.toUpperCase() ?? 'STAFF',
                    style: const TextStyle(
                      color: _blue,
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.1,
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

  Widget _buildDrawerItem(WaiterSection section, String title, IconData icon) {
    final bool isSelected = _selectedSection == section;
    return ListTile(
      leading: Icon(icon, color: isSelected ? _blue : Colors.grey[400]),
      title: Text(
        title,
        style: TextStyle(
          color: isSelected ? Colors.white : Colors.grey[400],
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
      selected: isSelected,
      selectedTileColor: _blue.withOpacity(0.1),
      onTap: () {
        setState(() {
          _selectedSection = section;
        });
        Navigator.pop(context);
      },
    );
  }

  Widget _buildBody() {
    switch (_selectedSection) {
      case WaiterSection.dashboard:
        return _buildDashboardSection();
      case WaiterSection.profile:
        return _buildProfileSection();
      case WaiterSection.tables:
        return _buildTablesSection();
      case WaiterSection.orders:
        return _buildOrdersSection();
      case WaiterSection.bills:
        return _buildBillsSection();
      case WaiterSection.todayServiced:
        return _buildTodayServicedSection();
      case WaiterSection.notifications:
        return _buildNotificationsSection();
    }
  }

  Widget _buildDashboardSection() {
    return _isLoading
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
                    color: _blue.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.table_restaurant,
                    size: 56,
                    color: _blue,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'No Active Tables',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                Text(
                  'You have no assigned tables with active orders.',
                  style: TextStyle(color: Colors.grey[500], fontSize: 13),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          )
        : RefreshIndicator(
            onRefresh: _fetchOrders,
            child: ListView.builder(
              padding: const EdgeInsets.only(
                left: 12,
                right: 12,
                top: 12,
                bottom: 120,
              ),
              itemCount: _groupOrdersByTable().length,
              itemBuilder: (context, i) {
                final group = _groupOrdersByTable()[i];
                return _buildTableGroup(group);
              },
            ),
          );
  }

  Widget _buildProfileSection() {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          const SizedBox(height: 20),
          Center(
            child: Stack(
              children: [
                CircleAvatar(
                  radius: 60,
                  backgroundColor: _surface,
                  child: const Icon(Icons.person, size: 70, color: _blue),
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(
                      color: _blue,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.edit,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text(
            auth.userId != null ? 'Waiter #${auth.userId}' : 'Waiter Name',
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          Text(
            auth.userRole?.toUpperCase() ?? 'WAITER',
            style: const TextStyle(
              color: _blue,
              letterSpacing: 1.2,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 40),
          _buildInfoTile('User ID', auth.userId ?? 'N/A', Icons.badge_outlined),
          _buildInfoTile(
            'Restaurant',
            auth.tenantSlug ?? 'N/A',
            Icons.restaurant_outlined,
          ),
          _buildInfoTile(
            'Email',
            'waiter@restaurant.com',
            Icons.email_outlined,
          ),
          const SizedBox(height: 40),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => auth.logout(),
              icon: const Icon(Icons.logout),
              label: const Text('LOGOUT'),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                foregroundColor: Colors.redAccent,
                side: const BorderSide(color: Colors.redAccent),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoTile(String label, String value, IconData icon) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _borderDark),
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.grey[400], size: 20),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(color: Colors.grey[500], fontSize: 12),
              ),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTablesSection() {
    if (_isLoading) return const Center(child: CircularProgressIndicator());

    final selectedFloor = _floors.isEmpty
        ? null
        : _floors.firstWhere(
            (f) => f.id == _selectedFloorId,
            orElse: () => _floors.first,
          );
    final tables = selectedFloor?.tables ?? [];

    return Column(
      children: [
        if (_floors.isNotEmpty)
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: _floors.map((floor) {
                final isSelected = floor.id == _selectedFloorId;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(floor.name),
                    selected: isSelected,
                    onSelected: (selected) {
                      if (selected) {
                        setState(() => _selectedFloorId = floor.id);
                      }
                    },
                    backgroundColor: _surface,
                    selectedColor: _blue.withOpacity(0.2),
                    labelStyle: TextStyle(
                      color: isSelected ? _blue : Colors.white,
                      fontWeight: isSelected
                          ? FontWeight.bold
                          : FontWeight.normal,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                      side: BorderSide(color: isSelected ? _blue : _borderDark),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        Expanded(
          child: tables.isEmpty
              ? _buildEmptyState(
                  Icons.table_restaurant,
                  'No Tables Found',
                  'No tables found on this floor.',
                )
              : GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 16,
                  ),
                  itemCount: tables.length,
                  itemBuilder: (context, i) {
                    final table = tables[i];
                    final isMyTable = table.assignedWaiterId == widget.waiterId;
                    final isOccupied = table.status == 'occupied';
                    final isReserved = table.status == 'reserved';
                    final isCleaning = table.status == 'cleaning';

                    return InkWell(
                      onTap: () {
                        // Action could be to view table details or something similar
                      },
                      borderRadius: BorderRadius.circular(12),
                      child: Ink(
                        decoration: BoxDecoration(
                          color: isMyTable
                              ? AppColors.primary.withOpacity(0.1)
                              : isReserved
                              ? AppColors.info.withOpacity(0.05)
                              : isOccupied
                              ? Colors.orange.withOpacity(0.05)
                              : isCleaning
                              ? AppColors.cleaning.withOpacity(0.05)
                              : _surface,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isMyTable
                                ? AppColors.primary
                                : isReserved
                                ? AppColors.info
                                : isOccupied
                                ? Colors.orange.withOpacity(0.5)
                                : isCleaning
                                ? AppColors.cleaning
                                : _borderDark,
                            width: 2,
                          ),
                        ),
                        child: Stack(
                          children: [
                            Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    isOccupied && !isMyTable
                                        ? Icons.lock
                                        : isCleaning
                                        ? Icons.cleaning_services
                                        : Icons.table_restaurant,
                                    color: isMyTable
                                        ? AppColors.primary
                                        : isReserved
                                        ? AppColors.info
                                        : isOccupied
                                        ? Colors.orange
                                        : isCleaning
                                        ? AppColors.cleaning
                                        : Colors.grey,
                                    size: 28,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    table.tableNumber,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                  Text(
                                    isMyTable
                                        ? 'MY TABLE'
                                        : table.status.toUpperCase(),
                                    style: TextStyle(
                                      fontSize: 8,
                                      fontWeight: FontWeight.bold,
                                      color: isMyTable
                                          ? AppColors.primary
                                          : isReserved
                                          ? AppColors.info
                                          : isOccupied
                                          ? Colors.orange
                                          : isCleaning
                                          ? AppColors.cleaning
                                          : Colors.grey[400],
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (isMyTable)
                              const Positioned(
                                top: 4,
                                right: 4,
                                child: Icon(
                                  Icons.person,
                                  color: AppColors.primary,
                                  size: 14,
                                ),
                              ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildOrdersSection() {
    final activeOrders = _orders
        .where((o) => ['Pending', 'Preparing', 'Ready'].contains(o['status']))
        .toList();
    return activeOrders.isEmpty
        ? _buildEmptyState(
            Icons.list_alt,
            'No Active Orders',
            'All orders have been served.',
          )
        : ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: activeOrders.length,
            itemBuilder: (context, index) {
              final order = activeOrders[index];
              return _buildOrderCompactCard(order);
            },
          );
  }

  Widget _buildBillsSection() {
    // Only show groups where bill is requested
    final groupsWithBills = _groupOrdersByTable()
        .where(
          (g) => (g['orders'] as List).any(
            (o) =>
                o['is_bill_requested'] == 1 || o['is_bill_requested'] == true,
          ),
        )
        .toList();

    return groupsWithBills.isEmpty
        ? _buildEmptyState(
            Icons.receipt_long,
            'No Pending Bills',
            'No active bill requests.',
          )
        : ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: groupsWithBills.length,
            itemBuilder: (context, index) {
              final group = groupsWithBills[index];
              return _buildTableGroup(group);
            },
          );
  }

  List<Map<String, dynamic>> _groupOrdersByTable() {
    final Map<String, Map<String, dynamic>> grouped = {};

    // First, process current active orders
    for (var order in _orders) {
      final table = order['table'] as Map<String, dynamic>?;
      final tableId = table?['id']?.toString();
      final tableNumber = table?['table_number']?.toString() ?? 'Takeaway';
      final floorName = table?['floor']?['name']?.toString();

      final String groupKey = tableId != null ? 'table_$tableId' : 'takeaway';

      if (!grouped.containsKey(groupKey)) {
        grouped[groupKey] = {
          'tableNumber': tableNumber,
          'floorName': floorName,
          'orders': <Map<String, dynamic>>[],
          'tableData': table,
          'isCleaning': false,
        };
      }
      (grouped[groupKey]!['orders'] as List<Map<String, dynamic>>).add(
        order as Map<String, dynamic>,
      );
    }

    // Second, ensure all tables assigned to waiter are present (especially those in cleaning)
    for (var table in _tables) {
      final tableId = table['id']?.toString();
      if (tableId == null) continue;

      final tableNumber = table['table_number']?.toString() ?? 'Unknown';
      final floorName = table['floor']?['name']?.toString();
      final status = table['status']?.toString();

      final String groupKey = 'table_$tableId';

      if (status == 'cleaning') {
        if (!grouped.containsKey(groupKey)) {
          grouped[groupKey] = {
            'tableNumber': tableNumber,
            'floorName': floorName,
            'orders': <Map<String, dynamic>>[],
            'tableData': table,
            'isCleaning': true,
          };
        } else {
          grouped[groupKey]!['isCleaning'] = true;
          grouped[groupKey]!['tableData'] = table;
        }
      }
    }

    // Sort by table number (Takeaway last)
    final sortedKeys = grouped.keys.toList()
      ..sort((a, b) {
        if (a == 'takeaway') return 1;
        if (b == 'takeaway') return -1;

        final numA = grouped[a]!['tableNumber'];
        final numB = grouped[b]!['tableNumber'];
        return numA.compareTo(numB);
      });

    return sortedKeys.map((key) {
      final group = grouped[key]!;
      final orders = group['orders'] as List<Map<String, dynamic>>;
      // Sort orders by ID to ensure chronological order
      orders.sort((a, b) => (a['id'] as int).compareTo(b['id'] as int));
      return group;
    }).toList();
  }

  Widget _buildTableGroup(Map<String, dynamic> group) {
    final tableNumber = group['tableNumber'] as String;
    final tableOrders = group['orders'] as List<Map<String, dynamic>>;

    final isCleaning = group['isCleaning'] as bool? ?? false;
    final tableData = group['tableData'] as Map<String, dynamic>?;

    // Determine overall status for color coding
    bool hasReady = tableOrders.any((o) => o['status'] == 'Ready');
    bool hasPreparing = tableOrders.any((o) => o['status'] == 'Preparing');
    bool allServed =
        tableOrders.isNotEmpty &&
        tableOrders.every((o) => o['status'] == 'Served');

    // Check if any order on the table has requested the bill
    bool isBillRequested = tableOrders.any(
      (o) => o['is_bill_requested'] == 1 || o['is_bill_requested'] == true,
    );

    // Calculate total bill for the table by summing up order totals
    double totalBill = 0.0;
    for (var order in tableOrders) {
      if (order['total'] != null) {
        totalBill += double.tryParse(order['total'].toString()) ?? 0.0;
      }
    }

    final statusColor = isCleaning
        ? AppColors.cleaning
        : isBillRequested
        ? Colors.redAccent
        : hasReady
        ? _green
        : hasPreparing
        ? _amber
        : _blue;

    final tableId = tableData?['id'] as int?;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: isCleaning ? AppColors.cleaning.withOpacity(0.05) : _surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: statusColor.withValues(alpha: 0.4),
          width: isBillRequested && !isCleaning ? 2.5 : 1.5,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Table Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.15),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(11),
                topRight: Radius.circular(11),
              ),
            ),
            child: Row(
              children: [
                Icon(Icons.table_restaurant, size: 20, color: statusColor),
                const SizedBox(width: 8),
                Flexible(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Table $tableNumber',
                        style: TextStyle(
                          color: statusColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (group['floorName'] != null)
                        Text(
                          group['floorName'],
                          style: TextStyle(
                            color: statusColor.withValues(alpha: 0.7),
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                    ],
                  ),
                ),
                if (isCleaning) ...[
                  const SizedBox(width: 8),
                  _buildBadge('CLEANING', AppColors.cleaning),
                ] else if (isBillRequested) ...[
                  const SizedBox(width: 8),
                  _buildBadge('BILL REQ.', Colors.redAccent),
                  IconButton(
                    icon: const Icon(
                      Icons.receipt_long,
                      size: 18,
                      color: Colors.redAccent,
                    ),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    onPressed: () => _showBillSummaryDialog(tableOrders),
                    tooltip: 'View Bill Details',
                  ),
                ],
                const Spacer(),
                if (isBillRequested && !isCleaning) ...[
                  Text(
                    'Rs. ${totalBill.toStringAsFixed(0)}',
                    style: const TextStyle(
                      color: Colors.redAccent,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(width: 6),
                ],
                if (!isCleaning)
                  _buildBadge(
                    '${tableOrders.length} TKT${tableOrders.length > 1 ? 'S' : ''}',
                    statusColor,
                    isOutline: true,
                  ),
              ],
            ),
          ),

          // Individual Order Tickets inside the Table Group
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                ...List.generate(tableOrders.length, (index) {
                  return _buildOrderSubCard(tableOrders[index], index == 0);
                }),

                // Action Buttons
                if (isCleaning && tableId != null) ...[
                  const SizedBox(height: 8),
                  _buildActionButton(
                    label: 'Mark as Available',
                    icon: Icons.check_circle_outline,
                    color: _green,
                    isLoading: _updatingOrders.contains(-tableId),
                    onPressed: () => _markTableCleaned(tableId),
                  ),
                ] else if (isBillRequested && tableId != null) ...[
                  const SizedBox(height: 8),
                  _buildActionButton(
                    label: 'Settle Table (Rs. ${totalBill.toStringAsFixed(0)})',
                    icon: Icons.payments_outlined,
                    color: Colors.redAccent,
                    isLoading: _updatingOrders.contains(-tableId),
                    onPressed: () => _showPaymentMethodPicker(tableId),
                  ),
                ] else if (tableId != null && allServed) ...[
                  const SizedBox(height: 8),
                  _buildActionButton(
                    label: 'Request Bill',
                    icon: Icons.receipt_long,
                    color: _blue,
                    isLoading: _updatingOrders.contains(-tableId),
                    onPressed: () => _requestBill(tableId),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBadge(String text, Color color, {bool isOutline = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: isOutline ? color.withValues(alpha: 0.15) : color,
        borderRadius: BorderRadius.circular(isOutline ? 20 : 4),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: isOutline ? color : Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _buildActionButton({
    required String label,
    required IconData icon,
    required Color color,
    required bool isLoading,
    required VoidCallback onPressed,
  }) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          elevation: 0,
        ),
        onPressed: isLoading ? null : onPressed,
        icon: isLoading
            ? const SizedBox.square(
                dimension: 16,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              )
            : Icon(icon, size: 20),
        label: Text(
          isLoading ? 'Processing...' : label,
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  void _showPaymentMethodPicker(int tableId) {
    showModalBottomSheet(
      context: context,
      backgroundColor: _surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Select Payment Method',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 20),
              _buildPaymentOption(tableId, 'Cash', Icons.money),
              _buildPaymentOption(tableId, 'Card', Icons.credit_card),
              _buildPaymentOption(
                tableId,
                'Digital Wallet',
                Icons.account_balance_wallet_outlined,
              ),
              const SizedBox(height: 20),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPaymentOption(int tableId, String method, IconData icon) {
    return ListTile(
      leading: Icon(icon, color: _blue),
      title: Text(method, style: const TextStyle(fontWeight: FontWeight.w600)),
      onTap: () {
        Navigator.pop(context);
        _settleTable(tableId, method);
      },
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    );
  }

  void _showBillSummaryDialog(List<Map<String, dynamic>> tableOrders) {
    if (tableOrders.isEmpty) return;

    // Collect all unique menu items from all orders and their quantities
    final Map<String, Map<String, dynamic>> consolidatedItems = {};
    double subtotal = 0.0;

    // Get tenant specifically from the first order (they should all be the same)
    final tenant = tableOrders[0]['tenant'] as Map<String, dynamic>?;
    final double scRate =
        double.tryParse(tenant?['service_charge_rate']?.toString() ?? '10') ??
        10.0;
    final double vatRate =
        double.tryParse(tenant?['vat_rate']?.toString() ?? '13') ?? 13.0;

    for (var order in tableOrders) {
      final items = order['items'] as List<dynamic>? ?? [];
      for (var item in items) {
        final menuitem = item['menu_item'] as Map<String, dynamic>?;
        if (menuitem == null) continue;

        final name = menuitem['name']?.toString() ?? 'Item';
        final qty = int.tryParse(item['quantity']?.toString() ?? '1') ?? 1;
        final price =
            double.tryParse(item['unit_price']?.toString() ?? '0') ?? 0.0;

        if (consolidatedItems.containsKey(name)) {
          consolidatedItems[name]!['qty'] += qty;
        } else {
          consolidatedItems[name] = {'name': name, 'qty': qty, 'price': price};
        }
        subtotal += (qty * price);
      }
    }

    final double scAmount = subtotal * (scRate / 100);
    final double vatAmount = (subtotal + scAmount) * (vatRate / 100);
    final double total = subtotal + scAmount + vatAmount;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: _surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        titlePadding: EdgeInsets.zero,
        title: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: _blue.withValues(alpha: 0.1),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Bill Summary',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              Text(
                'Table ${tableOrders[0]['table']?['table_number'] ?? 'Dine-in'}',
                style: TextStyle(
                  fontSize: 14,
                  color: _blue,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
        content: SizedBox(
          width: double.maxFinite,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Item List
                ...consolidatedItems.values.map(
                  (item) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            '${item['qty']}x ${item['name']}',
                            style: const TextStyle(fontSize: 14),
                          ),
                        ),
                        Text(
                          'Rs. ${(item['qty'] * item['price']).toStringAsFixed(0)}',
                          style: const TextStyle(fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ),
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 12),
                  child: Divider(),
                ),
                // Totals
                _buildSummaryRow('Subtotal', subtotal),
                _buildSummaryRow(
                  'Service Charge (${scRate.toStringAsFixed(0)}%)',
                  scAmount,
                ),
                _buildSummaryRow(
                  'VAT (${vatRate.toStringAsFixed(0)}%)',
                  vatAmount,
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _blue.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Total Amount',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      Text(
                        'Rs. ${total.toStringAsFixed(0)}',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                          color: _blue,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'CLOSE',
              style: TextStyle(
                color: Colors.grey[600],
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, double amount) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[600], fontSize: 12)),
          Text(
            'Rs. ${amount.toStringAsFixed(0)}',
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderSubCard(Map<String, dynamic> order, bool isFirst) {
    final orderId = order['id'] as int;
    final items = (order['items'] as List<dynamic>?) ?? [];
    final status = order['status'] as String;
    final isOrderUpdating = _updatingOrders.contains(orderId);

    // Color code sub-card based on its specific status
    final ticketColor = status == 'Ready'
        ? _green
        : status == 'Preparing'
        ? _amber
        : _blue;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: _bg,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: _borderDark),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Sub-card Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: ticketColor.withValues(alpha: 0.05),
              border: Border(bottom: BorderSide(color: _borderDark)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    '${isFirst ? 'FIRST' : 'REORDER'} #${order['id']}',
                    style: const TextStyle(
                      color: Colors.grey,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                Text(
                  status.toUpperCase(),
                  style: TextStyle(
                    color: ticketColor,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),

          // Sub-card Items
          Padding(
            padding: const EdgeInsets.all(10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ...items.map((item) {
                  final name =
                      (item['menu_item']?['name'] as String?) ?? 'Item';
                  final qty = (item['quantity'] as int?) ?? 1;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '$qty\u00d7',
                          style: const TextStyle(
                            color: _blue,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            name,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }),

                // Actions corresponding to that exact ticket
                if (status == 'Ready') ...[
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _green,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(6),
                        ),
                      ),
                      onPressed: isOrderUpdating
                          ? null
                          : () => _markOrderServed(orderId),
                      icon: isOrderUpdating
                          ? const SizedBox.square(
                              dimension: 14,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.done_all, size: 16),
                      label: Text(
                        isOrderUpdating ? 'Updating...' : 'Mark as Served',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ] else if (status == 'Pending') ...[
                  const SizedBox(height: 10),
                  const Row(
                    children: [
                      Icon(Icons.access_time, size: 14, color: Colors.grey),
                      SizedBox(width: 6),
                      Text(
                        'Waiting for kitchen...',
                        style: TextStyle(color: Colors.grey, fontSize: 12),
                      ),
                    ],
                  ),
                ] else if (status == 'Preparing') ...[
                  const SizedBox(height: 10),
                  const Row(
                    children: [
                      SizedBox.square(
                        dimension: 12,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: _amber,
                        ),
                      ),
                      SizedBox(width: 6),
                      Text(
                        'Kitchen is preparing...',
                        style: TextStyle(
                          color: _amber,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTodayServicedSection() {
    return _todayServicedOrders.isEmpty
        ? _buildEmptyState(
            Icons.history,
            'No Serviced Orders',
            'No orders served today yet.',
          )
        : ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: _todayServicedOrders.length,
            itemBuilder: (context, index) {
              final order = _todayServicedOrders[index];
              return _buildOrderCompactCard(order);
            },
          );
  }

  Widget _buildNotificationsSection() {
    return _notifications.isEmpty
        ? _buildEmptyState(
            Icons.notifications_none,
            'No Notifications',
            'You haven\'t received any notifications yet.',
          )
        : ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _notifications.length,
            itemBuilder: (context, i) {
              final note = _notifications[i];
              final DateTime time = note['time'];
              return Card(
                color: _surface,
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: _blue.withOpacity(0.1),
                    child: const Icon(Icons.notifications, color: _blue, size: 20),
                  ),
                  title: Text(
                    note['title'],
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 4),
                      Text(note['body'], style: TextStyle(color: Colors.grey[400], fontSize: 12)),
                      const SizedBox(height: 8),
                      Text(
                        '${time.hour}:${time.minute.toString().padLeft(2, '0')}',
                        style: TextStyle(color: Colors.grey[600], fontSize: 10),
                      ),
                    ],
                  ),
                  onTap: () {
                    if (note['data']?['type'] == 'new_order' || note['data']?['type'] == 'order_ready') {
                      setState(() => _selectedSection = WaiterSection.dashboard);
                    }
                  },
                ),
              );
            },
          );
  }

  Widget _buildEmptyState(IconData icon, String title, String message) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 64, color: Colors.grey[800]),
          const SizedBox(height: 16),
          Text(
            title,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderCompactCard(Map<String, dynamic> order) {
    final statusColor = order['status'] == 'Ready'
        ? _green
        : order['status'] == 'Preparing'
        ? _amber
        : order['status'] == 'Pending'
        ? _blue
        : Colors.grey;

    return Card(
      color: _surface,
      margin: const EdgeInsets.only(bottom: 12),
      child: ExpansionTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: statusColor.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(Icons.receipt, color: statusColor, size: 20),
        ),
        title: Text(
          'Order #${order['id']} \u2022 Table ${order['table']?['table_number'] ?? 'T/A'}',
        ),
        subtitle: Text(
          '${(order['items'] as List).length} items \u2022 Rs. ${order['total']}',
        ),
        trailing: _buildBadge(
          order['status'].toString().toUpperCase(),
          statusColor,
        ),
        children: [
          // Simplified item list
          ...(order['items'] as List).map(
            (item) => ListTile(
              dense: true,
              title: Text('${item['quantity']}x ${item['menu_item']?['name']}'),
              trailing: Text('Rs. ${item['total']}'),
            ),
          ),
          if (order['status'] == 'Ready')
            Padding(
              padding: const EdgeInsets.all(12),
              child: _buildActionButton(
                label: 'Mark as Served',
                icon: Icons.check,
                color: _green,
                isLoading: _updatingOrders.contains(order['id']),
                onPressed: () => _markOrderServed(order['id']),
              ),
            ),
        ],
      ),
    );
  }
}
