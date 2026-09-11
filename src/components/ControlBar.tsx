import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Radius, Spacing } from '@/theme/colors';

type Props = {
  paused: boolean;
  onTogglePause: () => void;
  onToggleSound: () => void;
  onSkip: () => void;
  soundOn: boolean;
  tint: string;
};

/** Bottom row: [sound] [play/pause big] [skip] */
export default function ControlBar({
  paused,
  onTogglePause,
  onToggleSound,
  onSkip,
  soundOn,
  tint,
}: Props) {
  return (
    <View style={styles.row}>
      <SideButton onPress={onToggleSound}>
        <Text style={[styles.icon, { color: tint }]}>{soundOn ? '🔊' : '🔇'}</Text>
      </SideButton>

      <Pressable
        onPress={onTogglePause}
        style={({ pressed }) => [styles.main, pressed && { transform: [{ scale: 0.96 }] }]}
      >
        <Text style={[styles.mainIcon, { color: tint }]}>{paused ? '▶' : '❚❚'}</Text>
      </Pressable>

      <SideButton onPress={onSkip}>
        <Text style={[styles.icon, { color: tint }]}>⏭</Text>
      </SideButton>
    </View>
  );
}

function SideButton({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.side, pressed && { opacity: 0.7 }]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    width: '100%',
  },
  side: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: {
    width: 84,
    height: 84,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  icon: { fontSize: 24 },
  mainIcon: { fontSize: 30, fontWeight: '700' },
});
