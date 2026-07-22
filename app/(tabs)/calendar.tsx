import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ExerciseIcon from '../../components/ExerciseIcon';
import { groupForSession } from '../../lib/exerciseIcons';
import { WorkoutSession, getSessions } from '../../lib/storage';
import { colors, radius, spacing } from '../../lib/theme';
import { formatDurationShort, prettyDate } from '../../lib/time';

export default function CalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);

  useFocusEffect(
    useCallback(() => {
      getSessions().then(setSessions);
    }, [])
  );

  // Map each trained day to its workout icon so the calendar can render an
  // "image of you working out" on that day.
  const marked: Record<string, any> = {};
  for (const s of sessions) {
    marked[s.date] = { trained: true, group: groupForSession(s) };
  }

  const totalMin = Math.round(
    sessions.reduce((n, s) => n + s.durationSec, 0) / 60
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingBottom: insets.bottom + 40,
      }}
    >
      <Text style={styles.screenTitle}>📅 Memories</Text>

      <Calendar
        style={styles.calendar}
        theme={{
          calendarBackground: colors.bg,
          monthTextColor: colors.text,
          textMonthFontWeight: '800',
          textSectionTitleColor: colors.textDim,
          arrowColor: colors.accent,
        }}
        markedDates={marked}
        dayComponent={({ date, state, marking }: any) => {
          const trained = !!marking?.trained;
          const isToday = state === 'today';
          return (
            <Pressable
              disabled={!trained}
              onPress={() =>
                trained && router.push(`/session/${date.dateString}`)
              }
              style={[
                styles.dayCell,
                isToday && styles.dayToday,
                trained && styles.dayTrained,
              ]}
            >
              {trained ? (
                <>
                  <ExerciseIcon group={marking.group} size={24} />
                  <Text style={styles.dayNumSmall}>{date.day}</Text>
                </>
              ) : (
                <Text
                  style={[
                    styles.dayNum,
                    state === 'disabled' && styles.dayNumDim,
                  ]}
                >
                  {date.day}
                </Text>
              )}
            </Pressable>
          );
        }}
      />

      <View style={styles.summary}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNum}>{sessions.length}</Text>
          <Text style={styles.summaryLabel}>Days trained</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNum}>{totalMin}m</Text>
          <Text style={styles.summaryLabel}>Total time</Text>
        </View>
      </View>

      <Text style={styles.listTitle}>History</Text>
      {sessions.length === 0 ? (
        <Text style={styles.empty}>
          No workouts logged yet. Train a day and it shows up here with your
          workout badge — tap it to revisit that session.
        </Text>
      ) : (
        sessions.map((s) => (
          <Pressable
            key={s.id}
            style={styles.histRow}
            onPress={() => router.push(`/session/${s.date}`)}
          >
            <ExerciseIcon group={groupForSession(s)} size={34} />
            <View style={{ flex: 1 }}>
              <Text style={styles.histDate}>{prettyDate(s.date)}</Text>
              <Text style={styles.histMeta}>
                {s.exercises.length} exercises ·{' '}
                {s.exercises.reduce((n, e) => n + e.sets.length, 0)} sets
              </Text>
            </View>
            <Text style={styles.histDur}>
              {formatDurationShort(s.durationSec)}
            </Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  calendar: { backgroundColor: colors.bg, paddingBottom: spacing.md },

  // Memories-style day cell
  dayCell: {
    width: 40,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: { borderColor: colors.accent, borderWidth: 2 },
  dayTrained: { backgroundColor: colors.surfaceAlt },
  dayNum: { color: colors.text, fontSize: 15, fontWeight: '600' },
  dayNumDim: { color: colors.border },
  dayNumSmall: { color: colors.textDim, fontSize: 10, fontWeight: '700' },

  summary: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  summaryNum: { color: colors.text, fontSize: 22, fontWeight: '800' },
  summaryLabel: { color: colors.textDim, fontSize: 12, marginTop: spacing.xs },
  listTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  empty: {
    color: colors.textDim,
    paddingHorizontal: spacing.lg,
    lineHeight: 20,
  },
  histRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  histDate: { color: colors.text, fontWeight: '700', fontSize: 15 },
  histMeta: { color: colors.textDim, fontSize: 13, marginTop: 2 },
  histDur: { color: colors.accent, fontWeight: '800' },
});
