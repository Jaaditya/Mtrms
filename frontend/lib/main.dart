import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:app_links/app_links.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'services/fcm_service.dart';
import 'providers/auth_provider.dart';
import 'views/category_list_view.dart';
import 'providers/floor_provider.dart';
import 'providers/menu_provider.dart';
import 'providers/order_provider.dart';
import 'services/api_service.dart';
import 'services/kitchen_notification_service.dart';
import 'utils/app_theme.dart';
import 'views/floor_selection_view.dart';
import 'views/login_view.dart';
import 'views/waiter_dashboard_view.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  
  await KitchenNotificationService.initialize();
  await FcmService.initialize();
  
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ProxyProvider<AuthProvider, ApiService>(
          update: (_, auth, __) => ApiService(
            tenantSlug: auth.tenantSlug ?? 'pizza-palace',
            token: auth.token,
          ),
        ),
        ChangeNotifierProxyProvider<ApiService, MenuProvider>(
          create: (context) => MenuProvider(
            apiService: Provider.of<ApiService>(context, listen: false),
          ),
          update: (context, api, previous) =>
              MenuProvider(apiService: api)..fetchCategories(),
        ),
        ChangeNotifierProxyProvider<ApiService, FloorProvider>(
          create: (context) => FloorProvider(
            apiService: Provider.of<ApiService>(context, listen: false),
          ),
          update: (context, api, previous) =>
              FloorProvider(apiService: api)..fetchFloors(),
        ),
        ChangeNotifierProvider(create: (_) => OrderProvider()),
      ],
      child: const MRMSApp(),
    ),
  );
}

class MRMSApp extends StatefulWidget {
  const MRMSApp({super.key});

  @override
  State<MRMSApp> createState() => _MRMSAppState();
}

class _MRMSAppState extends State<MRMSApp> {
  late AppLinks _appLinks;

  @override
  void initState() {
    super.initState();
    _initDeepLinks();
  }

  void _initDeepLinks() {
    _appLinks = AppLinks();
    _appLinks.uriLinkStream.listen((uri) {
      _handleDeepLink(uri);
    });
  }

  void _handleDeepLink(Uri uri) {
    if (uri.scheme == 'mrms' && uri.host == 'scan') {
      final tenant = uri.queryParameters['tenant'];
      final table = uri.queryParameters['table'];

      if (tenant != null) {
        context.read<AuthProvider>().enterGuestMode(tenant, tableId: table);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      // ... existing theme code ...
      debugShowCheckedModeBanner: false,
      title: 'Multi-Restaurant POS',
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: AppColors.background,
        colorScheme: const ColorScheme.dark(
          primary: AppColors.primary,
          onPrimary: AppColors.primaryForeground,
          secondary: AppColors.secondary,
          onSecondary: AppColors.secondaryForeground,
          surface: AppColors.card,
          onSurface: AppColors.cardForeground,
          error: AppColors.destructive,
          outline: AppColors.border,
        ),
        cardTheme: CardThemeData(
          color: AppColors.card,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: AppStyles.cardRadius,
            side: BorderSide(
              color: AppColors.border.withOpacity(0.5),
              width: 1,
            ),
          ),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: AppColors.background,
          foregroundColor: AppColors.foreground,
          elevation: 0,
          centerTitle: true,
          titleTextStyle: TextStyle(
            color: AppColors.foreground,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: AppColors.primaryForeground,
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: AppStyles.cardRadius),
          ),
        ),
      ),
      home: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          if (auth.isAuthenticated) {
            if (auth.isGuest) {
              return const CategoryListView();
            }
            if (auth.userRole == 'waiter' && auth.userId != null) {
              return WaiterDashboardView(waiterId: auth.userId!);
            }
            return const FloorSelectionView();
          }
          return const LoginView();
        },
      ),
    );
  }
}
