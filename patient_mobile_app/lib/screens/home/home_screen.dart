import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/journey_provider.dart';
import '../../widgets/vitals_card.dart';
import '../appointments/book_appointment_screen.dart';
import '../auth/login_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final journeyProv = Provider.of<JourneyProvider>(context, listen: false);
      journeyProv.fetchDashboard();
      journeyProv.fetchJourney();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final journeyProv = Provider.of<JourneyProvider>(context);
    final user = auth.user;
    final patient = user?.patientProfile;
    final dashboard = journeyProv.dashboardData;

    final activeApt = dashboard != null ? dashboard['activeAppointment'] : null;
    final recentVitalsList = dashboard != null && dashboard['recentVitals'] is List
        ? dashboard['recentVitals'] as List
        : [];
    final latestVital = recentVitalsList.isNotEmpty ? recentVitalsList[0] : null;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Apex Hospital & Research'),
        actions: [
          IconButton(
            tooltip: 'Sign Out',
            icon: const Icon(Icons.logout_rounded, size: 20),
            onPressed: () async {
              await auth.logout();
              if (context.mounted) {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              }
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await journeyProv.fetchDashboard();
          await journeyProv.fetchJourney();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Patient ID Identification Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppTheme.primary, AppTheme.primaryLight],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.primary.withOpacity(0.3),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'PATIENT HEALTH IDENTIFIER',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 10,
                            letterSpacing: 1.2,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            patient?.bloodGroup ?? 'O+',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      patient != null ? patient.fullName : (user?.name ?? 'Valued Patient'),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'UHID: ${patient?.patientId ?? 'P-100245'}',
                      style: const TextStyle(
                        color: Color(0xFF93C5FD),
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 14),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.warning_amber_rounded, color: Color(0xFFFDE047), size: 16),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Allergies: ${patient?.allergies ?? "None recorded"}',
                              style: const TextStyle(color: Colors.white, fontSize: 11),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 18),

              // Active Appointment / Live Care Journey Card
              if (activeApt != null)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFBFDBFE)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.radar_rounded, color: Color(0xFF2563EB), size: 18),
                              SizedBox(width: 6),
                              Text(
                                'ACTIVE HOSPITAL JOURNEY',
                                style: TextStyle(
                                  color: Color(0xFF1E40AF),
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                          if (activeApt['queueNumber'] != null)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: const Color(0xFF2563EB),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                'Token #${activeApt['queueNumber']}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        activeApt['department']?['name'] ?? 'Outpatient OPD',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textMain,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Scheduled: ${activeApt['appointmentDate']} (${activeApt['timeSlot']})',
                        style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
                      ),
                    ],
                  ),
                ),

              const SizedBox(height: 20),

              // Quick Action - Book Appointment
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const BookAppointmentScreen(),
                          ),
                        );
                      },
                      icon: const Icon(Icons.add_circle_outline, size: 18),
                      label: const Text('Book Appointment'),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // Telemetry Vitals Grid
              const Text(
                'Recent Recorded Telemetry',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textMain,
                ),
              ),
              const SizedBox(height: 12),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                childAspectRatio: 1.8,
                children: [
                  VitalsCard(
                    label: 'Blood Pressure',
                    value: latestVital != null ? (latestVital['bloodPressure'] ?? '120/80') : '120/80',
                    unit: 'mmHg',
                    icon: Icons.favorite_rounded,
                    color: const Color(0xFFEF4444),
                  ),
                  VitalsCard(
                    label: 'Pulse Rate',
                    value: latestVital != null ? '${latestVital['pulse'] ?? 72}' : '72',
                    unit: 'bpm',
                    icon: Icons.monitor_heart_rounded,
                    color: const Color(0xFF3B82F6),
                  ),
                  VitalsCard(
                    label: 'Oxygen SpO2',
                    value: latestVital != null ? '${latestVital['spO2'] ?? 98}' : '98',
                    unit: '%',
                    icon: Icons.air_rounded,
                    color: const Color(0xFF10B981),
                  ),
                  VitalsCard(
                    label: 'Body Temp',
                    value: latestVital != null ? '${latestVital['temperature'] ?? 98.6}' : '98.6',
                    unit: '°F',
                    icon: Icons.thermostat_rounded,
                    color: const Color(0xFFF59E0B),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
