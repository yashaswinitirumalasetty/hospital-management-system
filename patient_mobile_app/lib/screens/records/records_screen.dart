import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/records_provider.dart';

class RecordsScreen extends StatefulWidget {
  const RecordsScreen({super.key});

  @override
  State<RecordsScreen> createState() => _RecordsScreenState();
}

class _RecordsScreenState extends State<RecordsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<RecordsProvider>(context, listen: false).fetchTimeline();
    });
  }

  @override
  Widget build(BuildContext context) {
    final recordsProv = Provider.of<RecordsProvider>(context);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Longitudinal Medical Records'),
      ),
      body: recordsProv.isLoading
          ? const Center(child: CircularProgressIndicator())
          : recordsProv.timeline.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(Icons.folder_open_rounded, size: 56, color: AppTheme.textMuted),
                        SizedBox(height: 16),
                        Text(
                          'No Medical History Recorded',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.textMain,
                          ),
                        ),
                        SizedBox(height: 8),
                        Text(
                          'Clinical diagnoses, nurse triage vitals, and physician consultation notes will compile here into a lifetime health record.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
                        ),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: () => recordsProv.fetchTimeline(),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: recordsProv.timeline.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final item = recordsProv.timeline[index];
                      final isConsultation = item.type == 'CONSULTATION';

                      return Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppTheme.cardBorder),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Icon(
                                      isConsultation
                                          ? Icons.medical_information_rounded
                                          : Icons.monitor_heart_rounded,
                                      color: isConsultation
                                          ? AppTheme.primary
                                          : const Color(0xFF10B981),
                                      size: 18,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      isConsultation ? 'Doctor Consultation' : 'Nurse Telemetry Vitals',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                        color: isConsultation
                                            ? AppTheme.primary
                                            : const Color(0xFF047857),
                                      ),
                                    ),
                                  ],
                                ),
                                Text(
                                  item.date.split('T')[0],
                                  style: const TextStyle(
                                    fontSize: 11,
                                    color: AppTheme.textMuted,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              item.title,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.textMain,
                              ),
                            ),
                            const SizedBox(height: 8),

                            // Consultation diagnosis & clinical notes
                            if (isConsultation) ...[
                              if (item.diagnosis != null)
                                Container(
                                  margin: const EdgeInsets.only(bottom: 6),
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFEFF6FF),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Row(
                                    children: [
                                      const Text(
                                        'Diagnosis: ',
                                        style: TextStyle(
                                          fontWeight: FontWeight.w700,
                                          fontSize: 12,
                                          color: Color(0xFF1E40AF),
                                        ),
                                      ),
                                      Expanded(
                                        child: Text(
                                          item.diagnosis!,
                                          style: const TextStyle(
                                            fontSize: 12,
                                            color: Color(0xFF1E3A8A),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              if (item.notes != null)
                                Text(
                                  'Clinical Notes: ${item.notes}',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: AppTheme.textMuted,
                                  ),
                                ),
                            ]
                            // Vitals data
                            else ...[
                              Wrap(
                                spacing: 12,
                                runSpacing: 6,
                                children: [
                                  if (item.bloodPressure != null)
                                    _buildVitalChip('BP: ${item.bloodPressure} mmHg'),
                                  if (item.pulse != null)
                                    _buildVitalChip('Pulse: ${item.pulse} bpm'),
                                  if (item.spO2 != null)
                                    _buildVitalChip('SpO2: ${item.spO2}%'),
                                  if (item.temperature != null)
                                    _buildVitalChip('Temp: ${item.temperature}°F'),
                                  if (item.weight != null)
                                    _buildVitalChip('Weight: ${item.weight} kg'),
                                ],
                              ),
                            ],
                          ],
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  Widget _buildVitalChip(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: AppTheme.textMain,
        ),
      ),
    );
  }
}
