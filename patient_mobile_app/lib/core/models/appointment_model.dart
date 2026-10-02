class AppointmentModel {
  final String id;
  final String appointmentDate;
  final String timeSlot;
  final String status;
  final String paymentStatus;
  final int? queueNumber;
  final String? reason;
  final String? departmentName;
  final String? doctorName;

  AppointmentModel({
    required this.id,
    required this.appointmentDate,
    required this.timeSlot,
    required this.status,
    required this.paymentStatus,
    this.queueNumber,
    this.reason,
    this.departmentName,
    this.doctorName,
  });

  factory AppointmentModel.fromJson(Map<String, dynamic> json) {
    String? deptName;
    if (json['department'] != null) {
      deptName = json['department']['name'];
    }

    String? docName;
    if (json['doctor'] != null && json['doctor']['user'] != null) {
      docName = json['doctor']['user']['name'];
    }

    return AppointmentModel(
      id: json['id'] ?? '',
      appointmentDate: json['appointmentDate'] ?? '',
      timeSlot: json['timeSlot'] ?? '',
      status: json['status'] ?? 'PENDING',
      paymentStatus: json['paymentStatus'] ?? 'PENDING',
      queueNumber: json['queueNumber'],
      reason: json['reason'],
      departmentName: deptName,
      doctorName: docName,
    );
  }
}
