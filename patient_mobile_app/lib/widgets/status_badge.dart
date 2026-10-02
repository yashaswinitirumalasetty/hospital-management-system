import 'package:flutter/material.dart';

class StatusBadge extends StatelessWidget {
  final String status;

  const StatusBadge({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color text;

    switch (status.toUpperCase()) {
      case 'CONFIRMED':
      case 'COMPLETED':
      case 'ISSUED':
      case 'DISPENSED':
        bg = const Color(0xFFDCFCE7); // green-100
        text = const Color(0xFF15803D); // green-700
        break;
      case 'IN_CONSULTATION':
      case 'WAITING_FOR_DOCTOR':
      case 'CHECKED_IN':
        bg = const Color(0xFFDBEAFE); // blue-100
        text = const Color(0xFF1D4ED8); // blue-700
        break;
      case 'APPOINTMENT_REQUESTED':
      case 'RECEPTION_REVIEW':
      case 'WAITING_FOR_PHARMACY':
      case 'PENDING':
        bg = const Color(0xFFFEF3C7); // amber-100
        text = const Color(0xFFB45309); // amber-700
        break;
      case 'CANCELLED':
        bg = const Color(0xFFFEE2E2); // red-100
        text = const Color(0xFFB91C1C); // red-700
        break;
      default:
        bg = const Color(0xFFF1F5F9); // slate-100
        text = const Color(0xFF475569); // slate-600
    }

    final formatted = status
        .replaceAll('_', ' ')
        .toLowerCase()
        .split(' ')
        .map((w) => w.isNotEmpty ? '${w[0].toUpperCase()}${w.substring(1)}' : '')
        .join(' ');

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        formatted,
        style: TextStyle(
          color: text,
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.2,
        ),
      ),
    );
  }
}
