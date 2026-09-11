import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import ProgressRing from '@/components/ProgressRing';
import ControlBar from '@/components/ControlBar';
import StatCard from '@/components/StatCard';
import { Phase, Radius, Spacing } from '@/theme/colors';
import { fmtMMSS } from '@/utils/format';
import { t } from '@/i18n/strings';
import { useSettings } from '@/state/settingsStore';
import { useEngine } from '@/state/timerEngine';
import type { RootStackParamList } from '../../App';

type PhaseKey = 'prepare' | 'work' | 'rest';
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function RuntimeScreen({ expectedKind }: { expectedKind: PhaseKey }) {
  useKeepAwake(); // fool-proof: screen never sleeps mid-workout

  const nav = useNavigation<Nav>();
  const lang = useSettings((s) => s.lang);
  const soundOn = useSettings((s) => s.soundOn);
  const pauseOnBg = useSettings((s) => s.pauseOnBackground);
  const togglePauseOnBg = useSettings((s) => s.togglePauseOnBackground);
  const toggleSound = useSettings((s) => s.toggleSound);

  const schedule = useEngine((s) => s.schedule);
  const phaseIndex = useEngine((s) => s.phaseIndex);
  const remaining = useEngine((s) => s.remaining);
  const totalRemaining = useEngine((s) => s.totalRemaining);
  const running = useEngine((s) => s.running);

  const phase = schedule[phaseIndex];
  const nextP = schedule[phaseIndex + 1];

  useEffect(() => {
    if (!running && phaseIndex === 0 && remaining === schedule[0]?.durationSec) {
      useEngine.getState().start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Route based on current engine phase.
  useEffect(() => {
    if (!phase) {
      nav.navigate('Setup');
      return;
    }
    if (phase.kind === 'done') {
      nav.navigate('Setup');
      return;
    }
    const target: keyof RootStackParamList =
      phase.kind === 'prepare' ? 'Prepare'
      : phase.kind === 'work' ? 'Work'
      : 'Rest'; // rest + cycleRest share the red Rest screen
    const myScreen = expectedKindToScreen(expectedKind);
    if (target !== myScreen) {
      nav.navigate(target as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase?.kind, phaseIndex]);

  if (!phase) return null;

  const themeKey: PhaseKey =
    phase.kind === 'work' ? 'work' : phase.kind === 'prepare' ? 'prepare' : 'rest';
  const theme = Phase[themeKey];

  const progress = phase.durationSec > 0 ? remaining / phase.durationSec : 0;

  const screenW = Dimensions.get('window').width;
  const ringSize = Math.min(screenW - 64, 360);

  const exercisesTotal = countExercisesInOneCycle(schedule);
  const exerciseNum = currentExerciseNumber(schedule, phaseIndex);
  const cyclesTotal = countCycles(schedule);
  const cycleNum = phase.cycleNumber ?? 1;

  const onTogglePause = () => {
    if (running) useEngine.getState().pause();
    else useEngine.getState().resume();
  };

  return (
    <LinearGradient colors={theme.gradient} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {t(themeKey === 'prepare' ? 'prepare' : themeKey === 'work' ? 'work' : 'rest', lang)}
          </Text>
        </View>

        {themeKey === 'prepare' ? (
          <View style={[styles.prepareToggle, { backgroundColor: theme.cardBg }]}>
            <Text style={[styles.prepareToggleText, { color: theme.text }]}>
              {t('pauseOnLeave', lang)}
            </Text>
            <Text
              onPress={togglePauseOnBg}
              style={[
                styles.toggleSwitch,
                {
                  backgroundColor: pauseOnBg ? '#fff' : 'rgba(255,255,255,0.35)',
                  color: pauseOnBg ? theme.gradient[1] : '#fff',
                },
              ]}
            >
              {pauseOnBg ? '●  ' : '  ●'}
            </Text>
          </View>
        ) : (
          <View style={styles.topRow}>
            <StatCard
              icon={<Text style={{ color: theme.text }}>⚡</Text>}
              label={t('exercises', lang)}
              value={`${exerciseNum}/${exercisesTotal}`}
              bg={theme.cardBg}
              fg={theme.text}
              style={{ flex: 1, marginRight: 6 }}
            />
            <StatCard
              icon={<Text style={{ color: theme.text }}>↻</Text>}
              label={t('cycles', lang)}
              value={`${cycleNum}/${cyclesTotal}`}
              bg={theme.cardBg}
              fg={theme.text}
              style={{ flex: 1, marginLeft: 6 }}
            />
          </View>
        )}

        <View style={styles.ringWrap}>
          <ProgressRing
            progress={progress}
            size={ringSize}
            segments={42}
            activeColor={theme.ringActive}
            trackColor={theme.ringTrack}
            thickness={10}
          >
            <Text style={[styles.phaseSmall, { color: theme.text }]}>
              {t(themeKey === 'prepare' ? 'prepare' : themeKey === 'work' ? 'work' : 'rest', lang)}
            </Text>
            <Text style={[styles.bigTime, { color: theme.text }]}>{fmtMMSS(remaining)}</Text>
            {themeKey !== 'prepare' && (
              <View style={styles.totalRow}>
                <Text style={[styles.totalIcon, { color: theme.text }]}>⏱</Text>
                <Text style={[styles.totalText, { color: theme.text }]}>
                  {fmtMMSS(totalRemaining)}
                </Text>
              </View>
            )}
          </ProgressRing>
        </View>

        <View style={styles.bottomLabel}>
          {themeKey === 'work' ? (
            <Text style={[styles.exerciseName, { color: theme.text }]}>{phase.label}</Text>
          ) : (
            <>
              <Text style={[styles.nextLabel, { color: theme.textMuted }]}>{t('next', lang)}</Text>
              <Text style={[styles.exerciseName, { color: theme.text, opacity: 0.85 }]}>
                {nextP?.label ?? ''}
              </Text>
            </>
          )}
        </View>

        <View style={styles.controls}>
          <ControlBar
            paused={!running}
            onTogglePause={onTogglePause}
            onToggleSound={toggleSound}
            onSkip={() => useEngine.getState().skip()}
            soundOn={soundOn}
            tint={theme.gradient[1]}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ---- helpers --------------------------------------------------------------

function expectedKindToScreen(k: PhaseKey): 'Prepare' | 'Work' | 'Rest' {
  if (k === 'prepare') return 'Prepare';
  if (k === 'work') return 'Work';
  return 'Rest';
}

function countCycles(schedule: { cycleNumber?: number }[]): number {
  return schedule.reduce((m, p) => (p.cycleNumber && p.cycleNumber > m ? p.cycleNumber : m), 0) || 1;
}

function countExercisesInOneCycle(schedule: { kind: string; cycleNumber?: number }[]): number {
  return schedule.filter((p) => p.kind === 'work' && p.cycleNumber === 1).length || 1;
}

function currentExerciseNumber(
  schedule: { kind: string; exerciseIndex?: number }[],
  idx: number
): number {
  const p = schedule[idx];
  if (!p || p.exerciseIndex === undefined) return 1;
  return p.exerciseIndex + 1;
}

const styles = StyleSheet.create({
  header: { paddingTop: Spacing.sm, alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '600' },
  topRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  prepareToggle: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prepareToggleText: { flex: 1, fontSize: 15, fontWeight: '500' },
  toggleSwitch: {
    width: 56,
    height: 28,
    borderRadius: 14,
    textAlign: 'center',
    lineHeight: 28,
    overflow: 'hidden',
    fontSize: 12,
  },
  ringWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  phaseSmall: { fontSize: 18, fontWeight: '500', marginBottom: 4 },
  bigTime: { fontSize: 72, fontWeight: '700', letterSpacing: 1 },
  totalRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  totalIcon: { fontSize: 14, marginRight: 4 },
  totalText: { fontSize: 18, fontWeight: '600' },
  bottomLabel: { alignItems: 'center', marginBottom: Spacing.lg },
  nextLabel: { fontSize: 14, marginBottom: 2 },
  exerciseName: { fontSize: 32, fontWeight: '700', letterSpacing: 2 },
  controls: { paddingBottom: Spacing.lg },
});
