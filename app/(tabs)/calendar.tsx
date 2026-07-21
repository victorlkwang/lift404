import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WorkoutSession, getSessions } from '../../lib/storage';
import { colors, radius, spacing } from '../../lib/theme';
import { formatDurationShort, prettyDate, toDateKey } from '../../lib/time';

export default function CalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);

  useFocusEffect(
    useCallback(() => {
      getSessions().then(setSessions);
    }, [])
  );

  const today = toDateKey();

  // Build the marked-days map: every day with a workout gets a dot + highlight.
  const marked: Record<string, any> = {};
  for (const s of sessions) {
    marked[s.date] = {
      marked: true,
      dotColor: colors.green,
      selected: true,
      selectedColor: colors.accentDim,
    };
  }
  if (!marked[today]) {
    marked[today] = { marked: false };
  }
  marked[today] = { ...marked[today], today: true };

  const totalMin = Math.round(
    sessions.reduce((n, s) => n + s.durationSec, 0) / 60
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
    >
      <Calendar
        theme={{
          calendarBackground: colors.bg,
          monthTextColor: colors.text,
          textMonthFontWeight: '800',
          dayTextColor: colors.text,
          textDisabledColor: colors.border,
          todayTextColor: colors.accent,
          arrowColor: colors.accent,
          textSectionTitleColor: colors.textDim,
          selectedDayTextColor: '#fff',
        }}
        markedDates={marked}
        onDayPress={(d) => {
          if (marked[d.dateString]?.marked) {
            router.push(`/session/${d.dateString}`);
          }
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
          No workouts logged yet. Tap a marked day here after you train to
          revisit that session.
        </Text>
      ) : (
        sessions.map((s) => (
          <View
            key={s.id}
            style={styles.histRow}
            onTouchEnd={() => router.push(`/session/${s.date}`)}
          >
            <View style={styles.dot} />
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
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
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
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.green,
  },
  histDate: { color: colors.text, fontWeight: '700', fontSize: 15 },
  histMeta: { color: colors.textDim, fontSize: 13, marginTop: 2 },
  histDur: { color: colors.accent, fontWeight: '800' },
});
