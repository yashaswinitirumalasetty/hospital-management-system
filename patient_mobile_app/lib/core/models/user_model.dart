class UserModel {
  final String id;
  final String email;
  final String name;
  final String role;
  final PatientProfile? patientProfile;

  UserModel({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.patientProfile,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      name: json['name'] ?? '',
      role: json['role'] ?? '',
      patientProfile: json['patientProfile'] != null
          ? PatientProfile.fromJson(json['patientProfile'])
          : null,
    );
  }
}

class PatientProfile {
  final String id;
  final String patientId;
  final String firstName;
  final String lastName;
  final String? bloodGroup;
  final String? allergies;
  final String? chronicConditions;

  PatientProfile({
    required this.id,
    required this.patientId,
    required this.firstName,
    required this.lastName,
    this.bloodGroup,
    this.allergies,
    this.chronicConditions,
  });

  String get fullName => '$firstName $lastName'.trim();

  factory PatientProfile.fromJson(Map<String, dynamic> json) {
    return PatientProfile(
      id: json['id'] ?? '',
      patientId: json['patientId'] ?? '',
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      bloodGroup: json['bloodGroup'],
      allergies: json['allergies'],
      chronicConditions: json['chronicConditions'],
    );
  }
}
