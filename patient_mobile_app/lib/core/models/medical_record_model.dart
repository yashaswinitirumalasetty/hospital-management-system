class MedicalTimelineItem {
  final String id;
  final String date;
  final String type; // 'CONSULTATION' or 'VITALS'
  final String title;
  final String? doctorName;
  final String? nurseName;
  final String? department;
  final String? diagnosis;
  final String? symptoms;
  final String? notes;
  final String? instructions;
  
  // Vitals specifics
  final String? bloodPressure;
  final int? pulse;
  final double? temperature;
  final int? spO2;
  final double? weight;

  MedicalTimelineItem({
    required this.id,
    required this.date,
    required this.type,
    required this.title,
    this.doctorName,
    this.nurseName,
    this.department,
    this.diagnosis,
    this.symptoms,
    this.notes,
    this.instructions,
    this.bloodPressure,
    this.pulse,
    this.temperature,
    this.spO2,
    this.weight,
  });

  factory MedicalTimelineItem.fromJson(Map<String, dynamic> json) {
    return MedicalTimelineItem(
      id: json['id'] ?? '',
      date: json['date'] ?? '',
      type: json['type'] ?? '',
      title: json['title'] ?? '',
      doctorName: json['doctorName'],
      nurseName: json['nurseName'],
      department: json['department'],
      diagnosis: json['diagnosis'],
      symptoms: json['symptoms'],
      notes: json['notes'],
      instructions: json['instructions'],
      bloodPressure: json['bloodPressure'],
      pulse: json['pulse'] != null ? (json['pulse'] as num).toInt() : null,
      temperature: json['temperature'] != null ? (json['temperature'] as num).toDouble() : null,
      spO2: json['spO2'] != null ? (json['spO2'] as num).toInt() : null,
      weight: json['weight'] != null ? (json['weight'] as num).toDouble() : null,
    );
  }
}
