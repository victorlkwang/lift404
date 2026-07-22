import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
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
export function useRestTimer(defaultPreset = 90) {
  const [preset, setPreset] = useState(defaultPreset);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    interval.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          Vibration.vibrate([0, 400, 150, 400]);
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (interval.current) clearInterval(interval.current);
    };
  }, [running]);

  const start = useCallback(
    (secs?: number) => {
      setRemaining(secs ?? preset);
      setRunning(true);
    },
    [preset]
  );

  const stop = useCallback(() => {
    setRunning(false);
    setRemaining(0);
  }, []);

  const addTime = useCallback((delta: number) => {
    setRemaining((r) => Math.max(0, r + delta));
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
    backgroundColor: colors.accentDim,
    borderColor: colors.accent,
  },
  presetText: { color: colors.textDim, fontWeight: '700', fontSize: 13 },
  presetTextActive: { color: '#fff' },

  startBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  startText: { color: '#fff', fontWeight: '700', fontSize: 16 },
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
