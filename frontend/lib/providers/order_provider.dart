import 'package:flutter/material.dart';
import '../models/menu_item.dart';
import '../models/restaurant_table.dart';

class OrderItem {
  final MenuItem item;
  int quantity;
  String? instructions;

  OrderItem({required this.item, this.quantity = 1, this.instructions});
}

class OrderProvider with ChangeNotifier {
  RestaurantTable? _selectedTable;
  final List<OrderItem> _items = [];

  RestaurantTable? get selectedTable => _selectedTable;
  List<OrderItem> get items => _items;

  void selectTable(RestaurantTable table) {
    _selectedTable = table;
    _items.clear();
    notifyListeners();
  }

  void addItem(MenuItem item) {
    // Check if item already exists
    final index = _items.indexWhere((i) => i.item.id == item.id);
    if (index != -1) {
      _items[index].quantity++;
    } else {
      _items.add(OrderItem(item: item));
    }
    notifyListeners();
  }

  void removeItem(MenuItem item) {
    _items.removeWhere((i) => i.item.id == item.id);
    notifyListeners();
  }

  double get subtotal =>
      _items.fold(0.0, (sum, item) => sum + (item.item.price * item.quantity));

  void clear() {
    _items.clear();
    _selectedTable = null;
    notifyListeners();
  }
}
