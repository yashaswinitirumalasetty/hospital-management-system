import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'providers/auth_provider.dart';
import 'providers/journey_provider.dart';
import 'providers/appointment_provider.dart';
import 'providers/records_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/navigation/main_nav_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final authProvider = AuthProvider();
  await authProvider.tryAutoLogin();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: authProvider),
        ChangeNotifierProvider(create: (_) => JourneyProvider()),
        ChangeNotifierProvider(create: (_) => AppointmentProvider()),
        ChangeNotifierProvider(create: (_) => RecordsProvider()),
      ],
      child: const HospitalPatientApp(),
    ),
  );
}

class HospitalPatientApp extends StatelessWidget {
  const HospitalPatientApp({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);

    return MaterialApp(
      title: 'Apex Patient Care',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: auth.isAuthenticated ? const MainNavScreen() : const LoginScreen(),
    );
  }
}
