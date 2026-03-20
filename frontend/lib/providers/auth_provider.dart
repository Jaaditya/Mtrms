import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/tenant.dart';
import '../services/api_service.dart';
import '../services/fcm_service.dart';

class AuthProvider with ChangeNotifier {
  String? _token;
  String? _tenantSlug;
  String? _currentTableId; // Database ID (e.g. "1")
  String? _currentTableNumber; // Table Number (e.g. "1" or "T1")
  String? _userId;
  String? _userName;
  String? _userRole;
  List<Tenant> _tenants = [];
  bool _isLoading = false;
  bool _isGuest = false;
  String? _error;

  String? get token => _token;
  String? get tenantSlug => _tenantSlug;
  String? get currentTableId => _currentTableId;
  String? get currentTableNumber => _currentTableNumber;
  String? get userId => _userId;
  String? get userName => _userName;
  String? get userRole => _userRole;
  List<Tenant> get tenants => _tenants;
  bool get isLoading => _isLoading;
  bool get isGuest => _isGuest;
  String? get error => _error;
  bool get isAuthenticated => _token != null || _isGuest;

  AuthProvider() {
    _loadSession();
  }

  Future<void> _loadSession() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    _tenantSlug = prefs.getString('tenant_slug');
    _userId = prefs.getString('user_id');
    _userName = prefs.getString('user_name');
    _userRole = prefs.getString('user_role');
    notifyListeners();

    // Register FCM token if authenticated
    if (_token != null) {
      _registerFcmToken();
    }
  }

  Future<void> _registerFcmToken() async {
    try {
      final fcmToken = await FcmService.getToken();
      if (fcmToken != null && _tenantSlug != null && _token != null) {
        await ApiService(tenantSlug: _tenantSlug!, token: _token).updateFcmToken(fcmToken);
        debugPrint('FCM Token registered automatically');
      }
    } catch (e) {
      debugPrint('Failed to register FCM token automatically: $e');
    }
  }

  Future<bool> login(String email, String password, String tenantSlug) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await http.post(
        Uri.parse('${ApiService.baseUrl}/login'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Tenant-Slug': tenantSlug,
        },
        body: jsonEncode({
          'email': email,
          'password': password,
          'tenant_slug': tenantSlug,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _token = data['token'];
        _tenantSlug = tenantSlug;

        // Extract user info if available
        if (data['user'] != null) {
          _userId = data['user']['id']?.toString();
          _userName = data['user']['name'];
          _userRole = data['user']['role'];
        }

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', _token!);
        await prefs.setString('tenant_slug', _tenantSlug!);
        if (_userId != null) await prefs.setString('user_id', _userId!);
        if (_userName != null) await prefs.setString('user_name', _userName!);
        if (_userRole != null) await prefs.setString('user_role', _userRole!);

        _isLoading = false;
        notifyListeners();
        
        // Register FCM token after successful login
        try {
          final fcmToken = await FcmService.getToken();
          if (fcmToken != null) {
            await ApiService(tenantSlug: _tenantSlug!, token: _token).updateFcmToken(fcmToken);
          }
        } catch (e) {
          debugPrint('Failed to register FCM token: $e');
        }

        return true;
      } else {
        final data = jsonDecode(response.body);
        _error = data['message'] ?? 'Login failed';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'An error occurred. Please check your connection.';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> fetchTenants(ApiService api) async {
    _isLoading = true;
    notifyListeners();
    try {
      _tenants = await api.getTenants();
    } catch (e) {
      _error = 'Failed to load tenants';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> enterGuestMode(
    String tenantSlug, {
    String? tableId,
    String? tableNumber,
  }) async {
    _token = null;
    _tenantSlug = tenantSlug;
    _currentTableId = tableId;
    _currentTableNumber = tableNumber;
    _userId = null;
    _userName = null;
    _userRole = null;
    _isGuest = true;
    notifyListeners();
  }

  void openTableSession(String id, String number) {
    // Waiter keeps token and role, but sets a table ID to simulate being a guest at that table
    _currentTableId = id;
    _currentTableNumber = number;
    notifyListeners();
  }

  void closeTableSession() {
    _currentTableId = null;
    _currentTableNumber = null;
    notifyListeners();
  }

  Future<void> logout() async {
    // ... existing code ...
    _token = null;
    _tenantSlug = null;
    _currentTableId = null;
    _userId = null;
    _userName = null;
    _userRole = null;
    _isGuest = false;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('tenant_slug');
    await prefs.remove('user_id');
    await prefs.remove('user_name');
    await prefs.remove('user_role');
    notifyListeners();
  }
}
