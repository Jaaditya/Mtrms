import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/floor.dart';
import '../providers/order_provider.dart';
import '../utils/app_theme.dart';
import 'category_list_view.dart';

class TableGridView extends StatelessWidget {
  final Floor floor;
  const TableGridView({super.key, required this.floor});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('${floor.name.toUpperCase()} TABLES')),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: Row(
              children: [
                _buildStatusIndicator('Available', AppColors.success),
                _buildStatusIndicator('Occupied', AppColors.destructive),
                _buildStatusIndicator('Reserved', AppColors.info),
                _buildStatusIndicator('Cleaning', AppColors.warning),
              ],
            ),
          ),
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 0.85,
              ),
              itemCount: floor.tables.length,
              itemBuilder: (context, index) {
                final table = floor.tables[index];
                Color statusColor;
                switch (table.status) {
                  case 'occupied':
                    statusColor = AppColors.destructive;
                    break;
                  case 'reserved':
                    statusColor = AppColors.info;
                    break;
                  case 'cleaning':
                    statusColor = AppColors.warning;
                    break;
                  default:
                    statusColor = AppColors.success;
                }

                return GestureDetector(
                  onTap: () {
                    context.read<OrderProvider>().selectTable(table);
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const CategoryListView(),
                      ),
                    );
                  },
                  child: Container(
                    decoration: AppStyles.glassDecoration.copyWith(
                      border: Border.all(
                        color: statusColor.withOpacity(0.5),
                        width: 1.5,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: statusColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'T-${table.tableNumber}',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                              color: statusColor,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'CAP: ${table.capacity}',
                          style: const TextStyle(
                            fontSize: 10,
                            color: AppColors.mutedForeground,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          table.status.toUpperCase(),
                          style: TextStyle(
                            color: statusColor,
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
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
      ),
    );
  }

  Widget _buildStatusIndicator(String label, Color color) {
    return Padding(
      padding: const EdgeInsets.only(right: 12),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              color: AppColors.mutedForeground,
            ),
          ),
        ],
      ),
    );
  }
}
