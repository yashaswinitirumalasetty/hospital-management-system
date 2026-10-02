import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/models/appointment_model.dart';
import '../core/services/api_service.dart';

class AppointmentProvider extends ChangeNotifier {
  List<AppointmentModel> _appointments = [];
  List<Map<String, dynamic>> _departments = [];
  List<Map<String, dynamic>> _doctors = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<AppointmentModel> get appointments => _appointments;
  List<Map<String, dynamic>> get departments => _departments;
  List<Map<String, dynamic>> get doctors => _doctors;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  // Fetch appointments list
  Future<void> fetchAppointments() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiService.get(ApiConstants.appointments);
      final rawList = res['appointments'] as List? ?? [];
      _appointments = rawList
          .map((item) => AppointmentModel.fromJson(item as Map<String, dynamic>))
          .toList();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  // Fetch departments & doctors for booking screen
  Future<void> fetchBookingMetadata() async {
    try {
      final infoRes = await ApiService.get(ApiConstants.hospitalInfo);
      if (infoRes['hospital'] != null && infoRes['hospital']['departments'] != null) {
        _departments = List<Map<String, dynamic>>.from(infoRes['hospital']['departments']);
      }

      final docsRes = await ApiService.get(ApiConstants.doctors);
      if (docsRes is List) {
        _doctors = List<Map<String, dynamic>>.from(docsRes);
      }
      notifyListeners();
    } catch (e) {
      debugPrint('Metadata error: $e');
    }
  }

  // Book appointment
  Future<bool> bookAppointment({
    required String departmentId,
    String? doctorId,
    required String appointmentDate,
    required String timeSlot,
    String? reason,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await ApiService.post(ApiConstants.appointments, {
        'departmentId': departmentId,
        'doctorId': doctorId,
        'appointmentDate': appointmentDate,
        'timeSlot': timeSlot,
        'reason': reason ?? 'General consultation',
      });
      _isLoading = false;
      await fetchAppointments();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
}
