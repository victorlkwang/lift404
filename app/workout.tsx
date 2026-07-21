import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NumberDropdown from '../components/NumberDropdown';
import RestTimer from '../components/RestTimer';
import { useWorkout } from '../context/WorkoutContext';
import { colors, radius, spacing } from '../lib/theme';
import { formatDuration } from '../lib/time';

// Dropdown option ranges.
const WEIGHTS = Array.from({ length: 121 }, (_, i) => i * 5); // 0..600 by 5
const REPS = Array.from({ length: 50 }, (_, i) => i + 1); // 1..50

export default function WorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    active,
    elapsedSec,
    addExercise,
    removeExercise,
    addSet,
    removeSet,
    endWorkout,
    cancelWorkout,
  } = useWorkout();

  const [newExercise, setNewExercise] = useState('');

  // If there's no active workout (e.g. opened directly), bounce home.
  if (!active) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.dim}>No active workout.</Text>
        <Pressable style={styles.linkBtn} onPress={() => router.replace('/')}>
          <Text style={styles.linkBtnText}>Back home</Text>
        </Pressable>
      </View>
    );
  }

  const onAddExercise = () => {
    const v = newExercise.trim();
    if (!v) return;
    addExercise(v);
    setNewExercise('');
  };

  const onEnd = () => {
    const totalSets = active.exercises.reduce((n, e) => n + e.sets.length, 0);
    Alert.alert(
      'End workout?',
      `${formatDuration(elapsedSec)} · ${active.exercises.length} exercises · ${totalSets} sets`,
      [
        { text: 'Keep going', style: 'cancel' },
        {
          text: 'End & save',
          style: 'default',
          onPress: async () => {
            await endWorkout();
            router.replace('/');
          },
        },
      ]
    );
  };

  const onCancel = () => {
    Alert.alert('Discard workout?', 'This session will not be saved.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          await cancelWorkout();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header: live workout timer */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>
            {active.routineName ?? 'Workout'}
          </Text>
          <Text style={styles.timer}>{formatDuration(elapsedSec)}</Text>
        </View>
        <Pressable style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>Discard</Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: insets.bottom + 120,
          gap: spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <RestTimer />

        {active.exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            name={ex.name}
            sets={ex.sets}
            onRemoveExercise={() => removeExercise(ex.id)}
            onAddSet={(w, r) => addSet(ex.id, w, r)}
            onRemoveSet={(setId) => removeSet(ex.id, setId)}
          />
        ))}

        {/* Add a new exercise manually */}
        <View style={styles.addExercise}>
          <TextInput
            style={styles.addInput}
            placeholder="Exercise name (e.g. Bench Press)"
            placeholderTextColor={colors.textDim}
            value={newExercise}
            onChangeText={setNewExercise}
            onSubmitEditing={onAddExercise}
            returnKeyType="done"
          />
          <Pressable style={styles.addExerciseBtn} onPress={onAddExercise}>
            <Text style={styles.addExerciseBtnText}>+ Add exercise</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* End workout */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable style={styles.endBtn} onPress={onEnd}>
          <Text style={styles.endBtnText}>End workout</Text>
        </Pressable>
      </View>
    </View>
  );
}

// -- Exercise card with per-set logging ---------------------------------

function ExerciseCard({
  name,
  sets,
  onRemoveExercise,
  onAddSet,
  onRemoveSet,
}: {
  name: string;
  sets: { id: string; weight: number; reps: number }[];
  onRemoveExercise: () => void;
  onAddSet: (weight: number, reps: number) => void;
  onRemoveSet: (setId: string) => void;
}) {
  // Prefill from the last logged set so repeated sets are one tap.
  const last = sets[sets.length - 1];
  const [weight, setWeight] = useState(last ? last.weight : 60);
  const [reps, setReps] = useState(last ? last.reps : 10);

  return (
    <View style={styles.exCard}>
      <View style={styles.exHeader}>
        <Text style={styles.exName}>{name}</Text>
        <Pressable onPress={onRemoveExercise} hitSlop={8}>
          <Text style={styles.exRemove}>Remove</Text>
        </Pressable>
      </View>

      {sets.length > 0 && (
        <View style={styles.setList}>
          {sets.map((s, i) => (
            <Pressable
              key={s.id}
              style={styles.setRow}
              onLongPress={() => onRemoveSet(s.id)}
            >
              <Text style={styles.setIndex}>{i + 1}</Text>
              <Text style={styles.setText}>
                {s.weight} lb × {s.reps} reps
              </Text>
              <Text style={styles.setVol}>{s.weight * s.reps} vol</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.pickers}>
        <NumberDropdown
          label="Weight"
          value={weight}
          values={WEIGHTS}
          suffix="lb"
          onChange={setWeight}
        />
        <NumberDropdown
          label="Reps"
          value={reps}
          values={REPS}
          onChange={setReps}
        />
      </View>

      <Pressable style={styles.addSetBtn} onPress={() => onAddSet(weight, reps)}>
        <Text style={styles.addSetText}>+ Log set</Text>
      </Pressable>
      {sets.length > 0 && (
        <Text style={styles.setHint}>Long-press a set to delete it.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  dim: { color: colors.textDim },
  linkBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  linkBtnText: { color: '#fff', fontWeight: '700' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLabel: {
    color: colors.textDim,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timer: {
    color: colors.green,
    fontSize: 34,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  cancelBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: { color: colors.textDim, fontWeight: '600' },
  exCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  exHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exName: { color: colors.text, fontSize: 18, fontWeight: '800', flex: 1 },
  exRemove: { color: colors.red, fontWeight: '600', fontSize: 13 },
  setList: { gap: spacing.sm },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  setIndex: {
    color: colors.textDim,
    fontWeight: '800',
    width: 20,
  },
  setText: { color: colors.text, fontSize: 15, fontWeight: '600', flex: 1 },
  setVol: { color: colors.textDim, fontSize: 13 },
  pickers: { flexDirection: 'row', gap: spacing.md },
  addSetBtn: {
    backgroundColor: colors.accentDim,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  addSetText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  setHint: { color: colors.textDim, fontSize: 11, textAlign: 'center' },
  addExercise: { gap: spacing.md },
  addInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    padding: spacing.md,
    fontSize: 16,
  },
  addExerciseBtn: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  addExerciseBtnText: { color: colors.accent, fontWeight: '700', fontSize: 15 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  endBtn: {
    backgroundColor: colors.red,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  endBtnText: { color: '#fff', fontWeight: '800', fontSize: 18 },
});
