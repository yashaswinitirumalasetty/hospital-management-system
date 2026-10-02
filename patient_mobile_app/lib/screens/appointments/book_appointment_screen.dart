import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/appointment_provider.dart';

class BookAppointmentScreen extends StatefulWidget {
  const BookAppointmentScreen({super.key});

  @override
  State<BookAppointmentScreen> createState() => _BookAppointmentScreenState();
}

class _BookAppointmentScreenState extends State<BookAppointmentScreen> {
  String? _selectedDepartmentId;
  String? _selectedDoctorId;
  DateTime _selectedDate = DateTime.now().add(const Duration(days: 1));
  String _selectedTimeSlot = '09:00 - 10:00 AM';
  final _reasonController = TextEditingController();

  final List<String> _timeSlots = [
    '09:00 - 10:00 AM',
    '10:00 - 11:00 AM',
    '11:00 - 12:00 PM',
    '02:00 - 03:00 PM',
    '03:00 - 04:00 PM',
    '05:00 - 06:00 PM',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final aptProv = Provider.of<AppointmentProvider>(context, listen: false);
      aptProv.fetchBookingMetadata();
    });
  }

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  void _handleSubmit() async {
    if (_selectedDepartmentId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a clinical department.')),
      );
      return;
    }

    final aptProv = Provider.of<AppointmentProvider>(context, listen: false);
    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);

    final success = await aptProv.bookAppointment(
      departmentId: _selectedDepartmentId!,
      doctorId: _selectedDoctorId,
      appointmentDate: dateStr,
      timeSlot: _selectedTimeSlot,
      reason: _reasonController.text.trim(),
    );

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Appointment requested! Reception will verify your slot.'),
          backgroundColor: AppTheme.success,
        ),
      );
      Navigator.pop(context);
    } else if (mounted && aptProv.errorMessage != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(aptProv.errorMessage!),
          backgroundColor: AppTheme.danger,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final aptProv = Provider.of<AppointmentProvider>(context);

    // Auto set first department if not chosen
    if (_selectedDepartmentId == null && aptProv.departments.isNotEmpty) {
      _selectedDepartmentId = aptProv.departments.first['id'];
    }

    // Filter doctors by selected department
    final filteredDoctors = aptProv.doctors.where((doc) {
      if (_selectedDepartmentId == null) return true;
      return doc['departmentId'] == _selectedDepartmentId;
    }).toList();

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Schedule Consultation'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Department Selection
            const Text(
              'Select Clinical Department',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppTheme.textMain,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppTheme.cardBorder),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  isExpanded: true,
                  value: _selectedDepartmentId,
                  hint: const Text('Choose Department'),
                  items: aptProv.departments.map((dept) {
                    return DropdownMenuItem<String>(
                      value: dept['id'],
                      child: Text(dept['name'] ?? ''),
                    );
                  }).toList(),
                  onChanged: (val) {
                    setState(() {
                      _selectedDepartmentId = val;
                      _selectedDoctorId = null; // reset doctor
                    });
                  },
                ),
              ),
            ),

            const SizedBox(height: 18),

            // Doctor Selection
            const Text(
              'Preferred Clinician / Doctor (Optional)',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppTheme.textMain,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppTheme.cardBorder),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  isExpanded: true,
                  value: _selectedDoctorId,
                  hint: const Text('Any available specialist'),
                  items: [
                    const DropdownMenuItem<String>(
                      value: null,
                      child: Text('Any available specialist'),
                    ),
                    ...filteredDoctors.map((doc) {
                      final name = doc['user']?['name'] ?? 'Doctor';
                      final spec = doc['specialty'] ?? '';
                      return DropdownMenuItem<String>(
                        value: doc['id'],
                        child: Text('$name ($spec)'),
                      );
                    }),
                  ],
                  onChanged: (val) {
                    setState(() {
                      _selectedDoctorId = val;
                    });
                  },
                ),
              ),
            ),

            const SizedBox(height: 18),

            // Date Picker
            const Text(
              'Consultation Date',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppTheme.textMain,
              ),
            ),
            const SizedBox(height: 8),
            InkWell(
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _selectedDate,
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 60)),
                );
                if (picked != null) {
                  setState(() {
                    _selectedDate = picked;
                  });
                }
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppTheme.cardBorder),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      DateFormat('EEE, dd MMM yyyy').format(_selectedDate),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textMain,
                      ),
                    ),
                    const Icon(Icons.calendar_today_rounded,
                        size: 18, color: AppTheme.primary),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 18),

            // Time Slot Selection
            const Text(
              'Select Preferred Time Slot',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppTheme.textMain,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _timeSlots.map((slot) {
                final isSelected = _selectedTimeSlot == slot;
                return ChoiceChip(
                  label: Text(slot),
                  selected: isSelected,
                  selectedColor: AppTheme.primary,
                  backgroundColor: Colors.white,
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : AppTheme.textMain,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                    fontSize: 12,
                  ),
                  onSelected: (selected) {
                    if (selected) {
                      setState(() {
                        _selectedTimeSlot = slot;
                      });
                    }
                  },
                );
              }).toList(),
            ),

            const SizedBox(height: 18),

            // Reason for Visit
            const Text(
              'Reason for Visit / Chief Symptoms',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppTheme.textMain,
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _reasonController,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'e.g. Mild headache, fever for 2 days, routine follow-up...',
              ),
            ),

            const SizedBox(height: 28),

            // Submit Button
            ElevatedButton(
              onPressed: aptProv.isLoading ? null : _handleSubmit,
              child: aptProv.isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text('Confirm & Request Slot'),
            ),
          ],
        ),
      ),
    );
  }
}
