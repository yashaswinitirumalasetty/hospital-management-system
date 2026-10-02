class JourneyModel {
  final bool hasActiveJourney;
  final String? currentStatus;
  final int currentStageIndex;
  final int? queueNumber;
  final List<JourneyStage> stages;
  final Map<String, dynamic>? appointment;

  JourneyModel({
    required this.hasActiveJourney,
    this.currentStatus,
    this.currentStageIndex = 0,
    this.queueNumber,
    this.stages = const [],
    this.appointment,
  });

  factory JourneyModel.fromJson(Map<String, dynamic> json) {
    var rawStages = json['stages'] as List? ?? [];
    List<JourneyStage> parsedStages = rawStages
        .map((s) => JourneyStage.fromJson(s as Map<String, dynamic>))
        .toList();

    return JourneyModel(
      hasActiveJourney: json['hasActiveJourney'] ?? false,
      currentStatus: json['currentStatus'],
      currentStageIndex: json['currentStageIndex'] ?? 0,
      queueNumber: json['queueNumber'],
      stages: parsedStages,
      appointment: json['appointment'] as Map<String, dynamic>?,
    );
  }
}

class JourneyStage {
  final String key;
  final String label;
  final String desc;

  JourneyStage({
    required this.key,
    required this.label,
    required this.desc,
  });

  factory JourneyStage.fromJson(Map<String, dynamic> json) {
    return JourneyStage(
      key: json['key'] ?? '',
      label: json['label'] ?? '',
      desc: json['desc'] ?? '',
    );
  }
}
