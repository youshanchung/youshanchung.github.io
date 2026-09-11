import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Radius, Spacing } from '@/theme/colors';

type Props = {
  icon?: React.ReactNode;
  label: string;
  value: string;
  bg?: string;
  fg?: string;
  labelColor?: string;
  style?: ViewStyle;
};

/**
 * Rounded info card used on runtime screens ("運動 1/10", "回合 1/2")
 * and on the setup screen ("運動 00:40", "休息 00:20").
 */
export default function StatCard({
  icon,
  label,
  value,
  bg = 'rgba(255,255,255,0.22)',
  fg = '#FFFFFF',
  labelColor,
  style,
}: Props) {
  return (
    <View style={[styles.card, { backgroundColor: bg }, style]}>
      <View style={styles.row}>
        {icon}
        <Text style={[styles.label, { color: labelColor ?? fg }]}>{label}</Text>
      </View>
      <Text style={[styles.value, { color: fg }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    minHeight: 92,
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  value: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
