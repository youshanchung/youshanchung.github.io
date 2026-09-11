import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Setup, Radius, Spacing } from '@/theme/colors';
import { t } from '@/i18n/strings';
import { useSettings } from '@/state/settingsStore';
import { useWorkout } from '@/state/workoutStore';
import { useEngine, totalSeconds, buildSchedule } from '@/state/timerEngine';
import { fmtMMSS } from '@/utils/format';
import type { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SetupScreen() {
  const nav = useNavigation<Nav>();
  const lang = useSettings((s) => s.lang);
  const toggleLang = useSettings((s) => s.toggleLang);
  const soundOn = useSettings((s) => s.soundOn);
  const toggleSound = useSettings((s) => s.toggleSound);

  const workout = useWorkout((s) => s.workout);
  const setCycles = useWorkout((s) => s.setCycles);
  const setCycleRest = useWorkout((s) => s.setCycleRest);
  const loadFromStorage = useWorkout((s) => s.loadFromStorage);
  const saveToStorage = useWorkout((s) => s.saveToStorage);

  // Try to load last saved workout on first mount.
  useEffect(() => {
    loadFromStorage().catch(() => {});
  }, [loadFromStorage]);

  const total = totalSeconds(buildSchedule(workout));

  // Header summary: show "first exercise" work/rest as the headline numbers
  // (per-exercise editing happens on the Exercises screen).
  const firstEx = workout.exercises[0];

  const onStart = async () => {
    if (workout.exercises.length === 0) {
      Alert.alert(
        lang === 'zh' ? '無運動項目' : 'No exercises',
        lang === 'zh' ? '請先新增至少一項運動。' : 'Please add at least one exercise.'
      );
      return;
    }
    await saveToStorage();
    useEngine.getState().load(workout);
    const first = buildSchedule(workout)[0];
    if (!first) return;
    nav.navigate(first.kind === 'prepare' ? 'Prepare' : first.kind === 'work' ? 'Work' : 'Rest');
  };

  return (
    <View style={{ flex: 1, backgroundColor: Setup.background }}>
      <LinearGradient colors={Setup.headerGradient} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Pressable onPress={toggleLang} hitSlop={10}>
              <Text style={styles.menu}>≡</Text>
            </Pressable>
            <Text style={styles.headerTitle}>{t('appTitle', lang)}</Text>
            <Text style={[styles.menu, { opacity: 0 }]}>≡</Text>
          </View>
          <Text style={styles.headerTime}>{fmtMMSS(total)}</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 120 }}>
        <Text style={styles.sectionTitle}>{t('routine', lang)}</Text>

        <Pressable
          style={styles.loadRow}
          onPress={async () => {
            const ok = await loadFromStorage();
            if (!ok) {
              Alert.alert(
                lang === 'zh' ? '尚無紀錄' : 'Nothing saved',
                lang === 'zh' ? '還沒有儲存過鍛鍊。' : 'No previous workout saved yet.'
              );
            }
          }}
        >
          <Text style={styles.loadIcon}>📅</Text>
          <Text style={styles.loadText}>{t('loadLast', lang)}</Text>
          <Text style={styles.loadChevron}>»</Text>
        </Pressable>

        {/* Grid of 2x3 stat cards matching screenshot 3 */}
        <View style={styles.grid}>
          <Pressable
            style={styles.gridCard}
            onPress={() => nav.navigate('Exercises')}
          >
            <View style={styles.gridLabelRow}>
              <Text style={[styles.gridIcon, { color: Setup.accentWork }]}>▶</Text>
              <Text style={styles.gridLabel}>{t('workShort', lang)}</Text>
            </View>
            <Text style={[styles.gridValue, { color: Setup.accentWork }]}>
              {firstEx ? fmtMMSS(firstEx.workSec) : '--:--'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.gridCard}
            onPress={() => nav.navigate('Exercises')}
          >
            <View style={styles.gridLabelRow}>
              <Text style={[styles.gridIcon, { color: Setup.accentRest }]}>❚❚</Text>
              <Text style={styles.gridLabel}>{t('restShort', lang)}</Text>
            </View>
            <Text style={[styles.gridValue, { color: Setup.accentRest }]}>
              {firstEx ? fmtMMSS(firstEx.restSec) : '--:--'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.gridCard}
            onPress={() => nav.navigate('Exercises')}
          >
            <View style={styles.gridLabelRow}>
              <Text style={[styles.gridIcon, { color: Setup.textMuted }]}>⚡</Text>
              <Text style={styles.gridLabel}>{t('exercises', lang)}</Text>
            </View>
            <Text style={[styles.gridValue, { color: Setup.text }]}>
              {workout.exercises.length}
            </Text>
          </Pressable>

          <Stepper
            label={t('cycles', lang)}
            icon="↻"
            iconColor={Setup.accentCycles}
            valueColor={Setup.accentCycles}
            value={`${workout.cycles}X`}
            onMinus={() => setCycles(Math.max(1, workout.cycles - 1))}
            onPlus={() => setCycles(workout.cycles + 1)}
          />

          <Stepper
            label={t('cycleResetTime', lang)}
            icon="⏱"
            iconColor={Setup.accentReset}
            valueColor={Setup.accentReset}
            value={fmtMMSS(workout.cycleRestSec)}
            onMinus={() => setCycleRest(Math.max(0, workout.cycleRestSec - 10))}
            onPlus={() => setCycleRest(workout.cycleRestSec + 10)}
          />

          <Pressable style={styles.gridCard} onPress={toggleSound} onLongPress={toggleLang}>
            <View style={styles.gridLabelRow}>
              <Text style={[styles.gridIcon, { color: Setup.accentSound }]}>🔊</Text>
              <Text style={styles.gridLabel}>{t('sound', lang)}</Text>
            </View>
            <Text style={[styles.gridValue, { color: Setup.textMuted }]}>
              {soundOn ? lang.toUpperCase() : 'OFF'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={styles.startBar}>
        <Pressable style={styles.startBtn} onPress={onStart}>
          <Text style={styles.startBtnText}>▶  {t('start', lang)}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Stepper({
  label,
  icon,
  iconColor,
  valueColor,
  value,
  onMinus,
  onPlus,
}: {
  label: string;
  icon: string;
  iconColor: string;
  valueColor: string;
  value: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <View style={styles.gridCard}>
      <View style={styles.gridLabelRow}>
        <Text style={[styles.gridIcon, { color: iconColor }]}>{icon}</Text>
        <Text style={styles.gridLabel}>{label}</Text>
      </View>
      <View style={styles.stepperRow}>
        <Pressable onPress={onMinus} hitSlop={10} style={styles.stepBtn}>
          <Text style={styles.stepBtnText}>−</Text>
        </Pressable>
        <Text style={[styles.gridValue, { color: valueColor, marginHorizontal: 8 }]}>
          {value}
        </Text>
        <Pressable onPress={onPlus} hitSlop={10} style={styles.stepBtn}>
          <Text style={styles.stepBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingBottom: Spacing.md },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  menu: { color: '#fff', fontSize: 26, fontWeight: '300', width: 30 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  headerTime: { color: '#fff', fontSize: 64, fontWeight: '700', textAlign: 'center', marginTop: 4 },

  sectionTitle: { color: Setup.textMuted, fontSize: 13, marginBottom: Spacing.sm },

  loadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8EAEE',
    borderRadius: Radius.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    marginBottom: Spacing.md,
  },
  loadIcon: { fontSize: 18, marginRight: 10 },
  loadText: { flex: 1, color: Setup.textMuted, fontSize: 15 },
  loadChevron: { color: Setup.textMuted, fontSize: 18 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridCard: {
    width: '48%',
    backgroundColor: Setup.cardBg,
    borderRadius: Radius.card,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    minHeight: 100,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  gridLabelRow: { flexDirection: 'row', alignItems: 'center' },
  gridIcon: { fontSize: 16, marginRight: 6 },
  gridLabel: { color: Setup.text, fontSize: 15, fontWeight: '600' },
  gridValue: { fontSize: 28, fontWeight: '700' },

  stepperRow: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#EEF0F3',
    alignItems: 'center', justifyContent: 'center',
  },
  stepBtnText: { fontSize: 18, fontWeight: '700', color: Setup.text, lineHeight: 20 },

  startBar: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    padding: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  startBtn: {
    backgroundColor: Setup.primaryButton,
    borderRadius: Radius.button,
    paddingVertical: 18,
    alignItems: 'center',
  },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
});
