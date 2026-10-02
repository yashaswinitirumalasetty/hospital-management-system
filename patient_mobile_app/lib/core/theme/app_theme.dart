import 'package:flutter/material.dart';

class AppTheme {
  // Brand Colors matching web design system
  static const Color primary = Color(0xFF1D1160);       // Royal Navy
  static const Color primaryLight = Color(0xFF2E1A8A);  // Hover / Accent Navy
  static const Color accent = Color(0xFF3B82F6);        // Blue 500
  static const Color surface = Color(0xFFFFFFFF);       // Pure White
  static const Color background = Color(0xFFF8FAFC);    // Slate 50
  static const Color cardBorder = Color(0xFFE2E8F0);    // Slate 200
  
  // Status Colors
  static const Color success = Color(0xFF10B981);       // Emerald
  static const Color warning = Color(0xFFF59E0B);       // Amber
  static const Color danger = Color(0xFFEF4444);        // Rose/Red
  static const Color textMain = Color(0xFF0F172A);      // Slate 900
  static const Color textMuted = Color(0xFF64748B);     // Slate 500

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: background,
      primaryColor: primary,
      colorScheme: const ColorScheme.light(
        primary: primary,
        secondary: accent,
        surface: surface,
        error: danger,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: primary,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.3,
        ),
      ),
      cardTheme: const CardThemeData(
        color: surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
          side: BorderSide(color: cardBorder, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: cardBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: cardBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: primary, width: 1.5),
        ),
        hintStyle: const TextStyle(color: textMuted, fontSize: 14),
      ),
    );
  }
}
