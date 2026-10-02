import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/api_constants.dart';
import '../core/models/user_model.dart';
import '../core/services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  UserModel? _user;
  bool _isLoading = false;
  String? _errorMessage;

  UserModel? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  // Auto restore session on startup
  Future<void> tryAutoLogin() async {
    final token = await ApiService.getToken();
    if (token == null) return;

    final prefs = await SharedPreferences.getInstance();
    final rawUser = prefs.getString(ApiService.userKey);
    if (rawUser != null) {
      try {
        final userData = jsonDecode(rawUser);
        _user = UserModel.fromJson(userData);
        notifyListeners();
      } catch (_) {
        await logout();
      }
    }
  }

  // Login
  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiService.post(ApiConstants.login, {
        'email': email.trim(),
        'password': password,
      });

      final token = res['token'];
      final userData = res['user'];

      if (userData['role'] != 'PATIENT') {
        throw ApiException('This app is reserved for Patients. Please sign in with a patient account.');
      }

      await ApiService.saveAuthData(token, userData);
      _user = UserModel.fromJson(userData);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Logout
  Future<void> logout() async {
    await ApiService.clearAuthData();
    _user = null;
    notifyListeners();
  }
}
