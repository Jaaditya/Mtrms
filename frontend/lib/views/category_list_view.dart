import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/menu_provider.dart';
import '../services/api_service.dart';
import '../utils/app_theme.dart';
import 'menu_item_list_view.dart';
import 'order_summary_view.dart';

class CategoryListView extends StatelessWidget {
  const CategoryListView({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(
        title: Text(
          auth.currentTableNumber != null
              ? 'TABLE ${auth.currentTableNumber}'
              : 'MENU CATEGORIES',
        ),
        actions: [
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.shopping_cart_outlined),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const OrderSummaryView()),
                  );
                },
              ),
              // Could add a badge here if order provider has count
            ],
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => context.read<MenuProvider>().fetchCategories(),
          ),
          if (auth.isGuest && auth.currentTableId != null)
            IconButton(
              icon: const Icon(Icons.receipt_long_outlined, color: AppColors.primary),
              tooltip: 'Request Bill',
              onPressed: () => _handleRequestBill(context),
            ),
          const SizedBox(width: 8),
        ],
      ),
      body: Consumer<MenuProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            );
          }

          if (provider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.error_outline,
                    size: 48,
                    color: AppColors.destructive,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Error: ${provider.error}',
                    style: const TextStyle(color: AppColors.mutedForeground),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => provider.fetchCategories(),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          if (provider.categories.isEmpty) {
            return const Center(
              child: Text(
                'No categories found.',
                style: TextStyle(color: AppColors.mutedForeground),
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: provider.categories.length,
            itemBuilder: (context, index) {
              final category = provider.categories[index];
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: GestureDetector(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => MenuItemListView(category: category),
                      ),
                    );
                  },
                  child: Container(
                    decoration: AppStyles.glassDecoration,
                    clipBehavior: Clip.antiAlias,
                    child: IntrinsicHeight(
                      child: Row(
                        children: [
                          Container(
                            width: 100,
                            height: 100,
                            decoration: BoxDecoration(
                              color: AppColors.secondary,
                              border: Border(
                                right: BorderSide(
                                  color: AppColors.border.withOpacity(0.5),
                                  width: 1,
                                ),
                              ),
                            ),
                            child: category.image != null
                                ? Image.network(
                                    category.image!,
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, __, ___) => const Icon(
                                      Icons.restaurant_rounded,
                                      color: AppColors.mutedForeground,
                                      size: 32,
                                    ),
                                  )
                                : const Icon(
                                    Icons.restaurant_rounded,
                                    color: AppColors.mutedForeground,
                                    size: 32,
                                  ),
                          ),
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    category.name.toUpperCase(),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                      letterSpacing: 1.1,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  const Text(
                                    'Exquisite selections for you',
                                    style: TextStyle(
                                      color: AppColors.mutedForeground,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const Icon(
                            Icons.chevron_right_rounded,
                            color: AppColors.mutedForeground,
                          ),
                          const SizedBox(width: 16),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  Future<void> _handleRequestBill(BuildContext context) async {
    final api = context.read<ApiService>();
    final auth = context.read<AuthProvider>();
    final tableId = int.tryParse(auth.currentTableId ?? '');

    if (tableId == null) return;

    try {
      await api.requestBillForTable(tableId);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Bill requested! The admin has been notified.'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to request bill: $e'),
            backgroundColor: AppColors.destructive,
          ),
        );
      }
    }
  }
}
