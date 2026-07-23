import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import { cancelRestDone, scheduleRestDone } from '../lib/notifications';
import { colors, radius, spacing } from '../lib/theme';
import { formatDuration } from '../lib/time';

export const REST_PRESETS = [30, 60, 90, 120, 180];

// Short chip label: 30 -> "30s", 60 -> "1m", 90 -> "1:30".
function restLabel(s: number): string {
  if (s < 60) return `${s}s`;
  return s % 60 === 0 ? `${s / 60}m` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Rest-timer state lives in a hook so the workout screen can auto-start it
// when a set is checked off, while the card below just renders that state.
//
// The countdown is driven off a wall-clock end time (`endsAt`) rather than a
// decrementing counter, so it stays accurate after the app is backgrounded
// (iOS suspends JS timers). A local notification is scheduled for the end
// time so the user is alerted even while in another app.
export function useRestTimer(defaultPreset = 90) {
  const [preset, setPreset] = useState(defaultPreset);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const notifId = useRef<string | null>(null);

  // Tick from the wall clock so a resumed app shows the correct time.
  useEffect(() => {
    if (!running || endsAt == null) return;
    const tick = () => {
      const rem = Math.round((endsAt - Date.now()) / 1000);
      if (rem <= 0) {
        setRemaining(0);
        setRunning(false);
        setEndsAt(null);
        Vibration.vibrate([0, 400, 150, 400]);
      } else {
        setRemaining(rem);
      }
    };
    tick();
    const iv = setInterval(tick, 500);
    return () => clearInterval(iv);
  }, [running, endsAt]);

  // Re-sync the moment the app comes back to the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && running && endsAt != null) {
        const rem = Math.round((endsAt - Date.now()) / 1000);
        if (rem <= 0) {
          setRemaining(0);
          setRunning(false);
          setEndsAt(null);
        } else {
          setRemaining(rem);
        }
      }
    });
    return () => sub.remove();
  }, [running, endsAt]);

  const start = useCallback(
    (secs?: number) => {
      const dur = secs ?? preset;
      setEndsAt(Date.now() + dur * 1000);
      setRemaining(dur);
      setRunning(true);
      cancelRestDone(notifId.current);
      notifId.current = null;
      scheduleRestDone(dur).then((id) => {
        notifId.current = id;
      });
    },
    [preset]
  );

  const stop = useCallback(() => {
    setRunning(false);
    setRemaining(0);
    setEndsAt(null);
    cancelRestDone(notifId.current);
    notifId.current = null;
  }, []);

  const addTime = useCallback((delta: number) => {
    setEndsAt((e) => {
      if (e == null) return e;
      const next = Math.max(Date.now() + 1000, e + delta * 1000);
      cancelRestDone(notifId.current);
      scheduleRestDone(Math.round((next - Date.now()) / 1000)).then((id) => {
        notifId.current = id;
      });
      return next;
    });
  }, []);

  return { preset, setPreset, remaining, running, start, stop, addTime };
}

type Props = ReturnType<typeof useRestTimer>;

export default function RestTimer({
  preset,
  setPreset,
  remaining,
  running,
  start,
  stop,
  addTime,
}: Props) {
  const active = running || remaining > 0;

  if (active) {
    return (
      <View style={[styles.card, styles.cardActive]}>
        <View style={styles.runRow}>
          <Pressable style={styles.adjBtn} onPress={() => addTime(-15)} hitSlop={6}>
            <Text style={styles.adjText}>−15s</Text>
          </Pressable>
          <View style={styles.countWrap}>
            <Text style={styles.countdown}>{formatDuration(remaining)}</Text>
            <Text style={styles.restLabel}>REST</Text>
          </View>
          <Pressable style={styles.adjBtn} onPress={() => addTime(15)} hitSlop={6}>
            <Text style={styles.adjText}>+15s</Text>
          </Pressable>
          <Pressable style={[styles.adjBtn, styles.skipBtn]} onPress={stop} hitSlop={6}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Rest timer</Text>
        <Text style={styles.idle}>{formatDuration(preset)}</Text>
      </View>

      <View style={styles.presets}>
        {REST_PRESETS.map((p) => {
          const selected = preset === p;
          return (
            <Pressable
              key={p}
              style={[styles.preset, selected && styles.presetActive]}
              onPress={() => setPreset(p)}
            >
              <Text
                style={[styles.presetText, selected && styles.presetTextActive]}
              >
                {restLabel(p)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable style={styles.startBtn} onPress={() => start()}>
        <Text style={styles.startText}>Start {formatDuration(preset)}</Text>
      </Pressable>
      <Text style={styles.hint}>Auto-starts when you check off a set.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardActive: { borderColor: colors.amber },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: colors.textDim,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  idle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },

  // Selectable preset chips
  presets: { flexDirection: 'row', gap: spacing.sm },
  preset: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  presetActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  presetText: { color: colors.textDim, fontWeight: '700', fontSize: 13 },
  presetTextActive: { color: colors.accentDeep },

  startBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  startText: { color: colors.onAccent, fontWeight: '700', fontSize: 16 },
  hint: { color: colors.textDim, fontSize: 11, textAlign: 'center' },

  // Running (countdown) view
  runRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  countWrap: { flex: 1, alignItems: 'center' },
  countdown: {
    color: colors.amber,
    fontSize: 30,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  restLabel: {
    color: colors.textDim,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  adjBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  adjText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  skipBtn: { backgroundColor: colors.red, borderColor: colors.red },
  skipText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
