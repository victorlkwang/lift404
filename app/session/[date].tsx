import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ExerciseIcon from '../../components/ExerciseIcon';
import { groupForExercise } from '../../lib/exerciseIcons';
import {
  WorkoutSession,
  deleteSession,
  getSessionByDate,
} from '../../lib/storage';
import { colors, radius, spacing } from '../../lib/theme';
import { formatDuration, prettyDate } from '../../lib/time';

export default function SessionDetail() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [session, setSession] = useState<WorkoutSession | null | undefined>(
    undefined
  );

  useFocusEffect(
    useCallback(() => {
      if (date) getSessionByDate(date).then((s) => setSession(s ?? null));
    }, [date])
  );

  const onDelete = () => {
    if (!session) return;
    Alert.alert('Delete workout', 'Remove this session permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteSession(session.id);
          router.back();
        },
      },
    ]);
  };

  if (session === undefined) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.dim}>Loading…</Text>
      </View>
    );
  }

  if (session === null) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Stack.Screen options={{ title: date ? prettyDate(date) : 'Workout' }} />
        <Text style={styles.dim}>No workout logged on this day.</Text>
      </View>
    );
  }

  const totalSets = session.exercises.reduce((n, e) => n + e.sets.length, 0);
  const totalVol = session.exercises.reduce(
    (n, e) => n + e.sets.reduce((m, s) => m + s.weight * s.reps, 0),
    0
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 40 }}
    >
      <Stack.Screen options={{ title: prettyDate(session.date) }} />

      {/* Summary */}
      <View style={styles.summary}>
        <Stat label="Duration" value={formatDuration(session.durationSec)} />
        <Stat label="Exercises" value={String(session.exercises.length)} />
        <Stat label="Sets" value={String(totalSets)} />
        <Stat label="Volume" value={`${totalVol.toLocaleString()}`} />
      </View>

      {session.notes ? (
        <View style={styles.notesCard}>
          <Text style={styles.notesLabel}>NOTES</Text>
          <Text style={styles.notesText}>{session.notes}</Text>
        </View>
      ) : null}

      {session.exercises.map((ex) => (
        <View key={ex.id} style={styles.exCard}>
          <View style={styles.exNameRow}>
            <ExerciseIcon group={groupForExercise(ex.name)} size={28} />
            <Text style={styles.exName}>{ex.name}</Text>
          </View>
          {ex.sets.length === 0 ? (
            <Text style={styles.dim}>No sets logged.</Text>
          ) : (
            ex.sets.map((s, i) => (
              <View key={s.id} style={styles.setRow}>
                <Text style={styles.setIndex}>{i + 1}</Text>
                <Text style={styles.setText}>
                  {s.weight} lb × {s.reps} reps
                </Text>
                <Text style={styles.setVol}>{s.weight * s.reps}</Text>
              </View>
            ))
          )}
        </View>
      ))}

      <Pressable style={styles.deleteBtn} onPress={onDelete}>
        <Text style={styles.deleteText}>Delete this workout</Text>
      </Pressable>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  dim: { color: colors.textDim },
  summary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  stat: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '800' },
  statLabel: { color: colors.textDim, fontSize: 12, marginTop: spacing.xs },
  exCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  exNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  exName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
  },
  notesCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  notesLabel: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  notesText: { color: colors.text, fontSize: 15, lineHeight: 21 },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  setIndex: { color: colors.textDim, fontWeight: '800', width: 20 },
  setText: { color: colors.text, fontSize: 15, flex: 1 },
  setVol: { color: colors.textDim, fontSize: 13 },
  deleteBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.red,
    alignItems: 'center',
  },
  deleteText: { color: colors.red, fontWeight: '700' },
});
