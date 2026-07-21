import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkout } from '../../context/WorkoutContext';
import {
  Routine,
  deleteRoutine,
  getRoutines,
  getSessions,
  saveRoutine,
} from '../../lib/storage';
import { colors, radius, spacing } from '../../lib/theme';
import { prettyDate, uid } from '../../lib/time';

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { active, startWorkout } = useWorkout();

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [sessionCount, setSessionCount] = useState(0);
  const [lastSession, setLastSession] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);

  const reload = useCallback(() => {
    getRoutines().then(setRoutines);
    getSessions().then((s) => {
      setSessionCount(s.length);
      setLastSession(s[0] ? s[0].date : null);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const beginWorkout = (routine?: Routine) => {
    if (active) {
      router.push('/workout');
      return;
    }
    startWorkout(routine?.name, routine?.exercises ?? []);
    router.push('/workout');
  };

  const onDeleteRoutine = (r: Routine) => {
    Alert.alert('Delete routine', `Delete "${r.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteRoutine(r.id);
          reload();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 40 }}
    >
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{sessionCount}</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>
            {lastSession ? prettyDate(lastSession) : '—'}
          </Text>
          <Text style={styles.statLabel}>Last session</Text>
        </View>
      </View>

      {/* Start / resume */}
      {active ? (
        <Pressable
          style={[styles.startBtn, styles.resumeBtn]}
          onPress={() => router.push('/workout')}
        >
          <Text style={styles.startBtnText}>● Resume workout</Text>
          <Text style={styles.startBtnSub}>Timer is running</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.startBtn} onPress={() => beginWorkout()}>
          <Text style={styles.startBtnText}>Start empty workout</Text>
          <Text style={styles.startBtnSub}>Add exercises as you go</Text>
        </Pressable>
      )}

      {/* Routines */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My routines</Text>
        <Pressable onPress={() => setEditorOpen(true)}>
          <Text style={styles.addLink}>+ New</Text>
        </Pressable>
      </View>

      {routines.length === 0 ? (
        <Text style={styles.empty}>
          No routines yet. Create one to start a workout with your exercises
          pre-loaded.
        </Text>
      ) : (
        routines.map((r) => (
          <View key={r.id} style={styles.routineCard}>
            <Pressable
              style={styles.routineMain}
              onPress={() => beginWorkout(r)}
              onLongPress={() => onDeleteRoutine(r)}
            >
              <Text style={styles.routineName}>{r.name}</Text>
              <Text style={styles.routineMeta}>
                {r.exercises.length
                  ? r.exercises.join(' · ')
                  : 'No exercises'}
              </Text>
            </Pressable>
            <Pressable
              style={styles.routineStart}
              onPress={() => beginWorkout(r)}
            >
              <Text style={styles.routineStartText}>Start ▸</Text>
            </Pressable>
          </View>
        ))
      )}

      <Text style={styles.hint}>Long-press a routine to delete it.</Text>

      <RoutineEditor
        visible={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaved={() => {
          setEditorOpen(false);
          reload();
        }}
      />
    </ScrollView>
  );
}

// -- Inline routine creator ---------------------------------------------

function RoutineEditor({
  visible,
  onClose,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<string[]>([]);
  const [draft, setDraft] = useState('');

  const reset = () => {
    setName('');
    setExercises([]);
    setDraft('');
  };

  const addExercise = () => {
    const v = draft.trim();
    if (!v) return;
    setExercises((e) => [...e, v]);
    setDraft('');
  };

  const save = async () => {
    const n = name.trim();
    if (!n) return;
    const routine: Routine = { id: uid(), name: n, exercises };
    await saveRoutine(routine);
    reset();
    onSaved();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.editor}>
          <Text style={styles.editorTitle}>New routine</Text>

          <TextInput
            style={styles.input}
            placeholder="Routine name (e.g. Push Day)"
            placeholderTextColor={colors.textDim}
            value={name}
            onChangeText={setName}
          />

          <View style={styles.addRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Add exercise"
              placeholderTextColor={colors.textDim}
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={addExercise}
              returnKeyType="done"
            />
            <Pressable style={styles.addBtn} onPress={addExercise}>
              <Text style={styles.addBtnText}>Add</Text>
            </Pressable>
          </View>

          <ScrollView style={{ maxHeight: 200 }}>
            {exercises.map((ex, i) => (
              <View key={`${ex}-${i}`} style={styles.exRow}>
                <Text style={styles.exText}>{ex}</Text>
                <Pressable
                  onPress={() =>
                    setExercises((list) => list.filter((_, idx) => idx !== i))
                  }
                >
                  <Text style={styles.exRemove}>✕</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>

          <View style={styles.editorActions}>
            <Pressable
              style={[styles.editorBtn, styles.editorCancel]}
              onPress={() => {
                reset();
                onClose();
              }}
            >
              <Text style={styles.editorBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.editorBtn, styles.editorSave]}
              onPress={save}
            >
              <Text style={styles.editorBtnText}>Save routine</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  statNum: { color: colors.text, fontSize: 20, fontWeight: '800' },
  statLabel: { color: colors.textDim, fontSize: 12, marginTop: spacing.xs },
  startBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  resumeBtn: { backgroundColor: colors.green },
  startBtnText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  startBtnSub: { color: 'rgba(255,255,255,0.85)', marginTop: spacing.xs },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  addLink: { color: colors.accent, fontWeight: '700', fontSize: 15 },
  empty: {
    color: colors.textDim,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  routineCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  routineMain: { flex: 1, padding: spacing.lg },
  routineName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  routineMeta: { color: colors.textDim, marginTop: spacing.xs, fontSize: 13 },
  routineStart: {
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surfaceAlt,
  },
  routineStartText: { color: colors.accent, fontWeight: '800' },
  hint: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  // editor
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  editor: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  editorTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    padding: spacing.md,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  addRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  addBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  addBtnText: { color: '#fff', fontWeight: '700' },
  exRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  exText: { color: colors.text, fontSize: 15 },
  exRemove: { color: colors.red, fontSize: 16, paddingHorizontal: spacing.sm },
  editorActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  editorBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  editorCancel: { backgroundColor: colors.surfaceAlt },
  editorSave: { backgroundColor: colors.accent },
  editorBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
