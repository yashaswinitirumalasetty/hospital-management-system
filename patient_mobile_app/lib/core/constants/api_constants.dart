class ApiConstants {
  // Default to your current PC Wi-Fi IP so physical phones connect immediately
  static const String defaultUrl = 'http://192.168.0.7:5000/api';
  static String currentUrl = defaultUrl;

  static String get baseUrl => currentUrl;

  static void setBaseUrl(String newUrl) {
    var clean = newUrl.trim();
    if (clean.endsWith('/')) {
      clean = clean.substring(0, clean.length - 1);
    }
    if (!clean.endsWith('/api')) {
      clean = '$clean/api';
    }
    currentUrl = clean;
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
  static String get health => baseUrl.replaceAll('/api', '/api/health');
}
