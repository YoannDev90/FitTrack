// ============================================================================
// CARD GLASS - Composant de base avec effet glassmorphism (Optimisé)
// ============================================================================

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: 'default' | 'teal' | 'solid';
}

export const GlassCard = React.memo(function GlassCard({ children, style, variant = 'default' }: GlassCardProps) {
  return (
    <View style={[
      styles.card,
      variant === 'teal' && styles.tealCard,
      variant === 'solid' && styles.solidCard,
      style,
    ]}>
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.stroke,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  tealCard: {
    backgroundColor: Colors.tealLight,
    borderColor: Colors.stroke,
  },
  solidCard: {
    backgroundColor: Colors.cardSolid,
  },
});
