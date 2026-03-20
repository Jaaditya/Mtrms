import 'package:flutter/material.dart';
import '../models/category.dart';
import '../services/api_service.dart';

class MenuProvider with ChangeNotifier {
  final ApiService apiService;
  List<Category> _categories = [];
  bool _isLoading = false;
  String? _error;

  bool _isDisposed = false;

  MenuProvider({required this.apiService});

  List<Category> get categories => _categories;
  bool get isLoading => _isLoading;
  String? get error => _error;

  @override
  void dispose() {
    _isDisposed = true;
    super.dispose();
  }

  Future<void> fetchCategories() async {
    _isLoading = true;
    _error = null;
    if (!_isDisposed) notifyListeners();

    try {
      _categories = await apiService.getCategories();
    } catch (e) {
      if (e.toString().contains('401')) {
        _error = 'Unauthorized: Please login again';
      } else {
        _error = e.toString().replaceFirst('Exception: ', '');
      }
    } finally {
      _isLoading = false;
      if (!_isDisposed) notifyListeners();
    }
  }
}
