import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/models/journey_model.dart';
import '../core/services/api_service.dart';

class JourneyProvider extends ChangeNotifier {
  JourneyModel? _journey;
  Map<String, dynamic>? _dashboardData;
  bool _isLoading = false;
  String? _errorMessage;

  JourneyModel? get journey => _journey;
  Map<String, dynamic>? get dashboardData => _dashboardData;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchJourney() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiService.get(ApiConstants.journey);
      _journey = JourneyModel.fromJson(res);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchDashboard() async {
    try {
      final res = await ApiService.get(ApiConstants.dashboard);
      _dashboardData = res;
      notifyListeners();
    } catch (e) {
      debugPrint('Dashboard error: $e');
    }
  }
}
