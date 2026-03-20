import 'package:flutter/material.dart';

class AppColors {
  // Admin Panel Colors (Converted from HSL)
  static const Color background = Color(0xFF171A21); // hsl(230, 15%, 10%)
  static const Color foreground = Color(0xFFE2E8F0); // hsl(210, 20%, 92%)

  static const Color card = Color(0xFF1F2229); // hsl(230, 14%, 14%)
  static const Color cardForeground = Color(0xFFE2E8F0);

  static const Color primary = Color(0xFFF97316); // hsl(36, 95%, 55%)
  static const Color primaryForeground = Color(0xFF171A21);

  static const Color secondary = Color(0xFF292C33); // hsl(230, 12%, 20%)
  static const Color secondaryForeground = Color(0xFFCBD5E1);

  static const Color muted = Color(0xFF262930); // hsl(230, 10%, 18%)
  static const Color mutedForeground = Color(0xFF7E8A9A); // hsl(215, 12%, 55%)

  static const Color accent = Color(0xFF2F333B); // hsl(230, 12%, 22%)
  static const Color accentForeground = Color(0xFFE2E8F0);

  static const Color info = Color(0xFF3B82F6); // hsl(210, 80%, 55%) - Reserved
  static const Color cleaning = Color(
    0xFFA855F7,
  ); // hsl(280, 65%, 60%) - Cleaning
  static const Color border = Color(0xFF2F333B); // hsl(230, 10%, 22%)
  static const Color input = Color(0xFF2F333B);
  static const Color ring = Color(0xFFF97316);

  static const Color success = Color(0xFF22C55E); // hsl(152, 60%, 42%)
  static const Color warning = Color(0xFFF59E0B); // hsl(38, 92%, 50%)
  static const Color destructive = Color(0xFFEF4444);
}

class AppStyles {
  static const double borderRadius = 10.0;

  static final BorderRadius cardRadius = BorderRadius.circular(borderRadius);

  static final BoxDecoration glassDecoration = BoxDecoration(
    color: AppColors.card.withOpacity(0.8),
    borderRadius: cardRadius,
    border: Border.all(color: AppColors.border.withOpacity(0.5)),
  );

  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFF97316), Color(0xFFEA580C)],
  );
}
