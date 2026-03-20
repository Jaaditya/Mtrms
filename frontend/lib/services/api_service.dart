import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/category.dart';
import '../models/floor.dart';
import '../models/menu_item.dart';
import '../models/tenant.dart';

class ApiService {
  // Use 10.0.2.2 for Android Emulator, localhost for others
  static const String baseUrl = 'http://192.168.1.103:8080/api';
  final String tenantSlug;
  final String? token;

  ApiService({required this.tenantSlug, this.token});

  Map<String, String> get _headers {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Tenant-Slug': tenantSlug,
    };
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Future<List<Category>> getCategories() async {
    final url = token == null
        ? '$baseUrl/public/categories'
        : '$baseUrl/categories';
    final response = await http.get(Uri.parse(url), headers: _headers);
    if (response.statusCode == 200) {
      List data = json.decode(response.body);
      return data.map((json) => Category.fromJson(json)).toList();
    }
    throw Exception('Failed to load categories: ${response.statusCode}');
  }

  Future<List<Floor>> getFloors() async {
    final response = await http.get(
      Uri.parse('$baseUrl/floors'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      List data = json.decode(response.body);
      return data.map((json) => Floor.fromJson(json)).toList();
    }
    throw Exception('Failed to load floors: ${response.statusCode}');
  }

  Future<List<MenuItem>> getMenuItems({int? categoryId}) async {
    String endpoint = token == null ? '/public/menu-items' : '/menu-items';
    String url = '$baseUrl$endpoint';
    if (categoryId != null) url += '?category_id=$categoryId';

    final response = await http.get(Uri.parse(url), headers: _headers);
    if (response.statusCode == 200) {
      List data = json.decode(response.body);
      return data.map((json) => MenuItem.fromJson(json)).toList();
    }
    throw Exception('Failed to load menu items');
  }

  Future<List<Tenant>> getTenants() async {
    final response = await http.get(
      Uri.parse('$baseUrl/tenant-list'),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    );
    if (response.statusCode == 200) {
      List data = json.decode(response.body);
      return data.map((json) => Tenant.fromJson(json)).toList();
    }
    throw Exception('Failed to load tenants');
  }

  Future<List<dynamic>> getKitchenOrders() async {
    final response = await http.get(
      Uri.parse('$baseUrl/orders?status=Pending,Preparing'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      return json.decode(response.body) as List<dynamic>;
    }
    throw Exception('Failed to load kitchen orders: ${response.statusCode}');
  }

  Future<void> updateItemStatus(int itemId, String status) async {
    final response = await http.patch(
      Uri.parse('$baseUrl/order-items/$itemId/status'),
      headers: _headers,
      body: jsonEncode({'status': status}),
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to update item status: ${response.statusCode}');
    }
  }

  Future<void> markOrderReady(int orderId) async {
    final response = await http.patch(
      Uri.parse('$baseUrl/orders/$orderId'),
      headers: _headers,
      body: jsonEncode({'status': 'Ready'}),
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to update order: ${response.statusCode}');
    }
  }

  Future<List<dynamic>> getWaiterOrders(String waiterId) async {
    final response = await http.get(
      Uri.parse(
        '$baseUrl/orders?status=Pending,Preparing,Ready,Served&waiter_id=$waiterId',
      ),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      return json.decode(response.body) as List<dynamic>;
    }
    throw Exception('Failed to load waiter orders: ${response.statusCode}');
  }

  Future<List<dynamic>> getTodayServicedOrders(String waiterId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/waiters/$waiterId/today-serviced'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      return json.decode(response.body) as List<dynamic>;
    }
    throw Exception(
      'Failed to load today\'s serviced orders: ${response.statusCode}',
    );
  }

  Future<void> markOrderServed(int orderId) async {
    final response = await http.patch(
      Uri.parse('$baseUrl/orders/$orderId'),
      headers: _headers,
      body: jsonEncode({'status': 'Served'}),
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to mark order served: ${response.statusCode}');
    }
  }

  Future<void> requestBillForTable(int tableId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/tables/$tableId/request-bill'),
      headers: _headers,
    );
    if (response.statusCode != 200) {
      throw Exception(
        'Failed to request bill for table: ${response.statusCode}',
      );
    }
  }

  Future<void> settleTable(int tableId, String method) async {
    final response = await http.post(
      Uri.parse('$baseUrl/tables/$tableId/settle'),
      headers: _headers,
      body: jsonEncode({'method': method}),
    );
    if (response.statusCode != 201 && response.statusCode != 200) {
      throw Exception('Failed to settle table: ${response.statusCode}');
    }
  }

  Future<void> markTableCleaned(int tableId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/tables/$tableId/mark-cleaned'),
      headers: _headers,
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to mark table cleaned: ${response.statusCode}');
    }
  }

  Future<List<dynamic>> getWaiterTables(String waiterId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/tables?waiter_id=$waiterId'),
      headers: _headers,
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body) as List<dynamic>;
    }
    throw Exception('Failed to load tables: ${response.statusCode}');
  }

  Future<Map<String, dynamic>> createOrder(
    Map<String, dynamic> orderData,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/orders'),
      headers: _headers,
      body: jsonEncode(orderData),
    );
    if (response.statusCode == 201 || response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to create order: ${response.statusCode}');
  }

  Future<void> updateFcmToken(String fcmToken) async {
    final response = await http.put(
      Uri.parse('$baseUrl/user/fcm-token'),
      headers: _headers,
      body: jsonEncode({'fcm_token': fcmToken}),
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to update FCM token: ${response.statusCode}');
    }
  }
}
