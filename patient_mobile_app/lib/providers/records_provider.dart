import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/models/medical_record_model.dart';
import '../core/models/prescription_model.dart';
import '../core/services/api_service.dart';

class RecordsProvider extends ChangeNotifier {
  List<PrescriptionModel> _prescriptions = [];
  List<MedicalTimelineItem> _timeline = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<PrescriptionModel> get prescriptions => _prescriptions;
  List<MedicalTimelineItem> get timeline => _timeline;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  // Fetch prescriptions
  Future<void> fetchPrescriptions() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiService.get(ApiConstants.prescriptions);
      final rawList = res['prescriptions'] as List? ?? [];
      _prescriptions = rawList
          .map((item) => PrescriptionModel.fromJson(item as Map<String, dynamic>))
          .toList();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  // Fetch longitudinal timeline
  Future<void> fetchTimeline() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiService.get(ApiConstants.timeline);
      final rawList = res['timeline'] as List? ?? [];
      _timeline = rawList
          .map((item) => MedicalTimelineItem.fromJson(item as Map<String, dynamic>))
          .toList();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }
}
