import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { Setup, Radius, Spacing } from '@/theme/colors';
import { t } from '@/i18n/strings';
import { useSettings } from '@/state/settingsStore';
import { useWorkout, type Exercise } from '@/state/workoutStore';

export default function ExercisesScreen() {
  const nav = useNavigation();
  const lang = useSettings((s) => s.lang);
  const exercises = useWorkout((s) => s.workout.exercises);
  const setExercises = useWorkout((s) => s.setExercises);
  const prepareSec = useWorkout((s) => s.workout.prepareSec);
  const setPrepare = useWorkout((s) => s.setPrepare);

  const update = (id: string, patch: Partial<Exercise>) => {
    setExercises(exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const remove = (id: string) => {
    setExercises(exercises.filter((e) => e.id !== id));
  };

  const add = () => {
    setExercises([
      ...exercises,
      { id: `e${Date.now()}`, name: 'NEW', workSec: 30, restSec: 15 },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Setup.background }}>
      <View style={styles.header}>
        <Pressable onPress={() => nav.goBack()}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.title}>{t('editExercises', lang)}</Text>
        <Pressable onPress={() => nav.goBack()}>
          <Text style={styles.save}>{t('save', lang)}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 80 }}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t('prepare', lang)} (sec)</Text>
          <TextInput
            keyboardType="numeric"
            value={String(prepareSec)}
            onChangeText={(v) => setPrepare(parseInt(v || '0', 10) || 0)}
            style={styles.input}
          />
        </View>

        {exercises.map((ex, i) => (
          <View key={ex.id} style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>#{i + 1}</Text>
              <Pressable onPress={() => remove(ex.id)}>
                <Text style={styles.remove}>{t('remove', lang)}</Text>
              </Pressable>
            </View>

            <Text style={styles.cardLabel}>{t('exerciseName', lang)}</Text>
            <TextInput
              value={ex.name}
              onChangeText={(v) => update(ex.id, { name: v })}
              style={styles.input}
              autoCapitalize="characters"
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.cardLabel}>{t('workSeconds', lang)}</Text>
                <TextInput
                  keyboardType="numeric"
                  value={String(ex.workSec)}
                  onChangeText={(v) =>
                    update(ex.id, { workSec: parseInt(v || '0', 10) || 0 })
                  }
                  style={styles.input}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.cardLabel}>{t('restSeconds', lang)}</Text>
                <TextInput
                  keyboardType="numeric"
                  value={String(ex.restSec)}
                  onChangeText={(v) =>
                    update(ex.id, { restSec: parseInt(v || '0', 10) || 0 })
                  }
                  style={styles.input}
                />
              </View>
            </View>
          </View>
        ))}

        <Pressable style={styles.addBtn} onPress={add}>
          <Text style={styles.addBtnText}>{t('addExercise', lang)}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E2E6',
  },
  back: { fontSize: 28, color: Setup.text, width: 40 },
  title: { fontSize: 17, fontWeight: '600', color: Setup.text },
  save: { fontSize: 16, color: Setup.accentWork, fontWeight: '600', width: 40, textAlign: 'right' },
  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.card,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Setup.text },
  cardLabel: { fontSize: 12, color: Setup.textMuted, marginTop: Spacing.sm, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#E0E2E6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Setup.text,
    backgroundColor: '#FAFBFC',
  },
  row: { flexDirection: 'row' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  remove: { color: Setup.accentRest, fontWeight: '600' },
  addBtn: {
    backgroundColor: Setup.primaryButton,
    borderRadius: Radius.button,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
