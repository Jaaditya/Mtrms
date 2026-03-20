import 'package:flutter/material.dart';
import '../models/floor.dart';
import '../services/api_service.dart';

class FloorProvider with ChangeNotifier {
  final ApiService apiService;
  List<Floor> _floors = [];
  bool _isLoading = false;
  String? _error;

  bool _isDisposed = false;

  FloorProvider({required this.apiService});

  List<Floor> get floors => _floors;
  bool get isLoading => _isLoading;
  String? get error => _error;

  @override
  void dispose() {
    _isDisposed = true;
    super.dispose();
  }

  Future<void> fetchFloors() async {
    _isLoading = true;
    _error = null;
    if (!_isDisposed) notifyListeners();

    try {
      _floors = await apiService.getFloors();
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
