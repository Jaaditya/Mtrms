import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'kitchen_notification_service.dart';

class FcmService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  static Future<void> initialize() async {
    // Request permissions
    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      if (kDebugMode) {
        print('User granted permission');
      }
      
      // Get the token
      String? token = await _messaging.getToken();
      if (kDebugMode) {
        print('FCM Token: $token');
      }

      // Handle message when app is in foreground
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        _handleMessage(message);
      });

      // Handle message when app is opened from a notification
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        _handleMessage(message);
      });
    }
  }

  static void _handleMessage(RemoteMessage message) {
    if (kDebugMode) {
      print('Handling message: ${message.data}');
    }

    final Map<String, dynamic> data = message.data;
    
    // We expect order_id to be sent in the data payload
    final String? orderIdStr = data['order_id']?.toString();
    final int? orderId = orderIdStr != null ? int.tryParse(orderIdStr) : null;
    
    if (orderId != null) {
      KitchenNotificationService.showNewOrderNotification(
        orderId,
        tableNumber: data['table_number']?.toString(),
      );
    }
  }

  static Future<String?> getToken() async {
    try {
      return await _messaging.getToken();
    } catch (e) {
      if (kDebugMode) {
        print('Error getting FCM token: $e');
      }
      return null;
    }
  }
}
