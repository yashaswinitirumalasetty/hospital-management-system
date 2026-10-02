import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/api_constants.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, [this.statusCode]);

  @override
  String toString() => message;
}

class ApiService {
  static const String tokenKey = 'patient_auth_token';
  static const String userKey = 'patient_user_data';
  static const String serverUrlKey = 'custom_server_base_url';

  // Load configured server URL from storage
  static Future<void> loadServerUrl() async {
    final prefs = await SharedPreferences.getInstance();
    final savedUrl = prefs.getString(serverUrlKey);
    if (savedUrl != null && savedUrl.isNotEmpty) {
      ApiConstants.setBaseUrl(savedUrl);
    }
  }

  // Save server URL
  static Future<void> saveServerUrl(String newUrl) async {
    ApiConstants.setBaseUrl(newUrl);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(serverUrlKey, ApiConstants.baseUrl);
  }

  // Test server connectivity
  static Future<bool> testConnection(String url) async {
    try {
      var clean = url.trim();
      if (clean.endsWith('/')) clean = clean.substring(0, clean.length - 1);
      final healthEndpoint = clean.endsWith('/api') ? '$clean/health' : '$clean/api/health';

      final res = await http.get(Uri.parse(healthEndpoint)).timeout(
        const Duration(seconds: 4),
      );
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  // Get stored token
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(tokenKey);
  }

  // Save auth data
  static Future<void> saveAuthData(String token, Map<String, dynamic> userData) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(tokenKey, token);
    await prefs.setString(userKey, jsonEncode(userData));
  }

  // Clear auth data (Logout)
  static Future<void> clearAuthData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(tokenKey);
    await prefs.remove(userKey);
  }

  // Headers with Auth Token
  static Future<Map<String, String>> _getHeaders() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // GET Request
  static Future<dynamic> get(String url) async {
    try {
      final headers = await _getHeaders();
      final response = await http
          .get(Uri.parse(url), headers: headers)
          .timeout(const Duration(seconds: 10));
      return _processResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Cannot reach hospital server at ${ApiConstants.baseUrl}. Please check Wi-Fi connection.');
    }
  }

  // POST Request
  static Future<dynamic> post(String url, Map<String, dynamic> body) async {
    try {
      final headers = await _getHeaders();
      final response = await http
          .post(
            Uri.parse(url),
            headers: headers,
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 10));
      return _processResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Cannot reach hospital server at ${ApiConstants.baseUrl}. Please check Wi-Fi connection.');
    }
  }

  // Response handler
  static dynamic _processResponse(http.Response response) {
    dynamic jsonBody;
    try {
      jsonBody = jsonDecode(response.body);
    } catch (_) {
      jsonBody = null;
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonBody;
    } else {
      final errorMessage = jsonBody is Map && jsonBody['error'] != null
          ? jsonBody['error']
          : 'Request failed (${response.statusCode})';
      throw ApiException(errorMessage, response.statusCode);
    }
  }
}
