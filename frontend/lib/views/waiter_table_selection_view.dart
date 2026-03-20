import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';
import '../providers/order_provider.dart';
import '../models/floor.dart';
import '../models/restaurant_table.dart';
import '../utils/app_theme.dart';
import 'category_list_view.dart';

class WaiterTableSelectionView extends StatefulWidget {
  final String waiterId;
  const WaiterTableSelectionView({super.key, required this.waiterId});

  @override
  State<WaiterTableSelectionView> createState() =>
      _WaiterTableSelectionViewState();
}

class _WaiterTableSelectionViewState extends State<WaiterTableSelectionView> {
  List<Floor> _floors = [];
  int? _selectedFloorId;
  bool _isLoading = true;
  String? _error;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _fetchData();
    _pollTimer = Timer.periodic(
      const Duration(seconds: 10),
      (_) => _fetchData(),
    );
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchData() async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final floors = await api.getFloors();
      if (mounted) {
        setState(() {
          _floors = floors;
          if (_floors.isNotEmpty && _selectedFloorId == null) {
            _selectedFloorId = _floors.first.id;
          }
          _isLoading = false;
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

  void _selectTable(RestaurantTable table) {
    Provider.of<OrderProvider>(context, listen: false).selectTable(table);
    Provider.of<AuthProvider>(
      context,
      listen: false,
    ).openTableSession(table.id.toString(), table.tableNumber);
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const CategoryListView()),
    );
  }

  @override
  Widget build(BuildContext context) {
    const Color bg = Color(0xFF0F1117);
    const Color surface = Color(0xFF1A1E2E);
    const Color blue = Color(0xFF3B82F6);
    const Color borderDark = Color(0xFF2C3150);

    final selectedFloor = _floors.isEmpty
        ? null
        : _floors.firstWhere(
            (f) => f.id == _selectedFloorId,
            orElse: () => _floors.first,
          );
    final tables = selectedFloor?.tables ?? [];

    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(
        title: const Text('New Order - Select Table'),
        backgroundColor: surface,
      ),
      body: Column(
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
                      backgroundColor: surface,
                      selectedColor: blue.withOpacity(0.2),
                      labelStyle: TextStyle(
                        color: isSelected ? blue : Colors.white,
                        fontWeight: isSelected
                            ? FontWeight.bold
                            : FontWeight.normal,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                        side: BorderSide(color: isSelected ? blue : borderDark),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                ? Center(
                    child: Text(
                      _error!,
                      style: const TextStyle(color: Colors.red),
                    ),
                  )
                : tables.isEmpty
                ? const Center(
                    child: Text(
                      'No tables found on this floor.',
                      style: TextStyle(color: Colors.grey),
                    ),
                  )
                : GridView.builder(
                    padding: const EdgeInsets.all(16),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 3,
                          mainAxisSpacing: 16,
                          crossAxisSpacing: 16,
                        ),
                    itemCount: tables.length,
                    itemBuilder: (context, i) {
                      final table = tables[i];
                      final status = table.status;
                      final assignedWaiterId = table.assignedWaiterId;
                      final isMyTable = assignedWaiterId == widget.waiterId;
                      final isOccupied = status == 'occupied';
                      final isReserved = status == 'reserved';
                      final isCleaning = status == 'cleaning';
                      final isLocked = isOccupied && !isMyTable;

                      // Use AppColors aligned with Admin Panel
                      final Color statusColor = isMyTable
                          ? AppColors.primary
                          : isReserved
                          ? AppColors.info
                          : isOccupied
                          ? Colors
                                .orange // Occupied fallback
                          : isCleaning
                          ? AppColors.cleaning
                          : Colors.grey;

                      return InkWell(
                        onTap: isLocked
                            ? () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text(
                                      'Table is occupied by another waiter',
                                    ),
                                    backgroundColor: Colors.redAccent,
                                    duration: Duration(seconds: 2),
                                  ),
                                );
                              }
                            : isCleaning
                            ? () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Table is being cleaned'),
                                    backgroundColor: AppColors.cleaning,
                                    duration: Duration(seconds: 2),
                                  ),
                                );
                              }
                            : () => _selectTable(table),
                        borderRadius: BorderRadius.circular(12),
                        child: Opacity(
                          opacity: (isLocked || isCleaning) ? 0.6 : 1.0,
                          child: Ink(
                            decoration: BoxDecoration(
                              color: isMyTable
                                  ? AppColors.primary.withOpacity(0.15)
                                  : statusColor.withOpacity(0.05),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isMyTable
                                    ? AppColors.primary
                                    : statusColor.withOpacity(0.5),
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
                                        isLocked
                                            ? Icons.lock
                                            : isCleaning
                                            ? Icons.cleaning_services
                                            : Icons.table_restaurant,
                                        color: statusColor,
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
                                        textAlign: TextAlign.center,
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        isMyTable
                                            ? 'MY TABLE'
                                            : status.toUpperCase(),
                                        style: TextStyle(
                                          fontSize: 8,
                                          fontWeight: FontWeight.w600,
                                          color: statusColor,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                if (isMyTable)
                                  Positioned(
                                    top: 4,
                                    right: 4,
                                    child: Container(
                                      padding: const EdgeInsets.all(2),
                                      decoration: const BoxDecoration(
                                        color: AppColors.primary,
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        Icons.person,
                                        color: Colors.white,
                                        size: 10,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
