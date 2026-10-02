class PrescriptionModel {
  final String id;
  final String rxNumber;
  final String status;
  final String createdAt;
  final String? instructions;
  final String? doctorName;
  final String? departmentName;
  final List<PrescriptionItem> items;

  PrescriptionModel({
    required this.id,
    required this.rxNumber,
    required this.status,
    required this.createdAt,
    this.instructions,
    this.doctorName,
    this.departmentName,
    this.items = const [],
  });

  factory PrescriptionModel.fromJson(Map<String, dynamic> json) {
    String? docName;
    String? deptName;
    if (json['doctor'] != null) {
      if (json['doctor']['user'] != null) {
        docName = json['doctor']['user']['name'];
      }
      if (json['doctor']['department'] != null) {
        deptName = json['doctor']['department']['name'];
      }
    }

    var rawItems = json['items'] as List? ?? [];
    List<PrescriptionItem> parsedItems = rawItems
        .map((it) => PrescriptionItem.fromJson(it as Map<String, dynamic>))
        .toList();

    return PrescriptionModel(
      id: json['id'] ?? '',
      rxNumber: json['rxNumber'] ?? '',
      status: json['status'] ?? 'ISSUED',
      createdAt: json['createdAt'] ?? '',
      instructions: json['instructions'],
      doctorName: docName,
      departmentName: deptName,
      items: parsedItems,
    );
  }
}

class PrescriptionItem {
  final String id;
  final String medicineName;
  final String dosage;
  final String frequency;
  final String duration;
  final String? notes;

  PrescriptionItem({
    required this.id,
    required this.medicineName,
    required this.dosage,
    required this.frequency,
    required this.duration,
    this.notes,
  });

  factory PrescriptionItem.fromJson(Map<String, dynamic> json) {
    return PrescriptionItem(
      id: json['id'] ?? '',
      medicineName: json['medicineName'] ?? '',
      dosage: json['dosage'] ?? '',
      frequency: json['frequency'] ?? '',
      duration: json['duration'] ?? '',
      notes: json['notes'],
    );
  }
}
