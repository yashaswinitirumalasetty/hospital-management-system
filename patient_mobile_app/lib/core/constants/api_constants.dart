import 'dart:io';

class ApiConstants {
  // Toggle this to your machine's local IP (e.g. http://192.168.1.100:5000) when testing on a physical phone.
  static String get baseUrl {
    if (Platform.isAndroid) {
      // 10.0.2.2 maps to host machine localhost in standard Android Emulator
      return 'http://10.0.2.2:5000/api';
    } else {
      // iOS Simulator or macOS / desktop
      return 'http://localhost:5000/api';
    }
  }

  // Auth
  static String get login => '$baseUrl/auth/login';

  // Patient Endpoints
  static String get dashboard => '$baseUrl/patient/dashboard';
  static String get journey => '$baseUrl/patient/journey';
  static String get timeline => '$baseUrl/patient/timeline';
  static String get appointments => '$baseUrl/patient/appointments';
  static String get prescriptions => '$baseUrl/patient/prescriptions';

  // Public Endpoints
  static String get hospitalInfo => '$baseUrl/public/info';
  static String get doctors => '$baseUrl/public/doctors';
  static String get departments => '$baseUrl/public/departments';
}
