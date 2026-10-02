import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/journey_provider.dart';
import '../../widgets/status_badge.dart';

class JourneyScreen extends StatefulWidget {
  const JourneyScreen({super.key});

  @override
  State<JourneyScreen> createState() => _JourneyScreenState();
}

class _JourneyScreenState extends State<JourneyScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<JourneyProvider>(context, listen: false).fetchJourney();
    });
  }

  @override
  Widget build(BuildContext context) {
    final journeyProv = Provider.of<JourneyProvider>(context);
    final journey = journeyProv.journey;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Live Care Journey'),
        actions: [
          IconButton(
            tooltip: 'Refresh Status',
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => journeyProv.fetchJourney(),
          ),
        ],
      ),
      body: journeyProv.isLoading
          ? const Center(child: CircularProgressIndicator())
          : journey == null || !journey.hasActiveJourney
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(Icons.check_circle_outline_rounded,
                            size: 64, color: AppTheme.textMuted),
                        SizedBox(height: 16),
                        Text(
                          'No Active Hospital Journey',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.textMain,
                          ),
                        ),
                        SizedBox(height: 8),
                        Text(
                          'When you book an appointment or check in at the hospital, your real-time live journey and queue token will appear here.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
                        ),
                      ],
                    ),
                  ),
                )
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Active Queue Banner
                      Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppTheme.cardBorder),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEFF6FF),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.timer_rounded,
                                  color: Color(0xFF2563EB), size: 28),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'OPD Queue Token',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: AppTheme.textMuted,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    journey.queueNumber != null
                                        ? 'TOKEN #${journey.queueNumber}'
                                        : 'Awaiting Reception Check-in',
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w800,
                                      color: AppTheme.primary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (journey.currentStatus != null)
                              StatusBadge(status: journey.currentStatus!),
                          ],
                        ),
                      ),

                      const SizedBox(height: 24),

                      const Text(
                        'Journey Milestone Progression',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textMain,
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Stepper Cards
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppTheme.cardBorder),
                        ),
                        child: ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: journey.stages.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 8),
                          itemBuilder: (context, index) {
                            final stage = journey.stages[index];
                            final isPassed = index < journey.currentStageIndex;
                            final isCurrent = index == journey.currentStageIndex;

                            Color iconBg;
                            Color iconColor;
                            IconData iconData;

                            if (isPassed) {
                              iconBg = const Color(0xFFDCFCE7);
                              iconColor = const Color(0xFF16A34A);
                              iconData = Icons.check_circle_rounded;
                            } else if (isCurrent) {
                              iconBg = const Color(0xFFDBEAFE);
                              iconColor = const Color(0xFF2563EB);
                              iconData = Icons.radio_button_checked_rounded;
                            } else {
                              iconBg = const Color(0xFFF1F5F9);
                              iconColor = const Color(0xFF94A3B8);
                              iconData = Icons.radio_button_unchecked_rounded;
                            }

                            return Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Padding(
                                  padding: const EdgeInsets.only(top: 2),
                                  child: Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: BoxDecoration(
                                      color: iconBg,
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(iconData, size: 18, color: iconColor),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Container(
                                    padding: const EdgeInsets.only(bottom: 8),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          stage.label,
                                          style: TextStyle(
                                            fontSize: 14,
                                            fontWeight: isCurrent
                                                ? FontWeight.w800
                                                : FontWeight.w600,
                                            color: isCurrent
                                                ? AppTheme.primary
                                                : (isPassed
                                                    ? AppTheme.textMain
                                                    : AppTheme.textMuted),
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          stage.desc,
                                          style: const TextStyle(
                                            fontSize: 12,
                                            color: AppTheme.textMuted,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }
}
