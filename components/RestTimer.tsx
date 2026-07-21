import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import { colors, radius, spacing } from '../lib/theme';
import { formatDuration } from '../lib/time';

const PRESETS = [30, 60, 90, 120, 180];

// A countdown rest timer for between sets. Pick a preset, it counts down,
// and buzzes when it hits zero.
export default function RestTimer() {
  const [target, setTarget] = useState(90); // selected preset (seconds)
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
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
    }
    return () => {
      if (interval.current) clearInterval(interval.current);
    };
  }, [running]);

  const start = (secs: number) => {
    setTarget(secs);
    setRemaining(secs);
    setRunning(true);
  };

  const stop = () => {
    setRunning(false);
    setRemaining(0);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Rest timer</Text>
        {running || remaining > 0 ? (
          <Text style={styles.countdown}>{formatDuration(remaining)}</Text>
        ) : (
          <Text style={styles.idle}>{formatDuration(target)}</Text>
        )}
      </View>

      <View style={styles.presets}>
        {PRESETS.map((p) => (
          <Pressable
            key={p}
            style={[styles.preset, target === p && styles.presetActive]}
            onPress={() => start(p)}
          >
            <Text
              style={[
                styles.presetText,
                target === p && styles.presetTextActive,
              ]}
            >
              {p < 60 ? `${p}s` : `${p / 60}m`}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.actions}>
        {running ? (
          <Pressable style={[styles.btn, styles.btnStop]} onPress={stop}>
            <Text style={styles.btnText}>Stop</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.btn, styles.btnStart]}
            onPress={() => start(target)}
          >
            <Text style={styles.btnText}>Start {formatDuration(target)}</Text>
          </Pressable>
        )}
      </View>
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
  countdown: {
    color: colors.amber,
    fontSize: 26,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  idle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
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
  presetActive: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  presetText: { color: colors.textDim, fontWeight: '600' },
  presetTextActive: { color: '#fff' },
  actions: { flexDirection: 'row' },
  btn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  btnStart: { backgroundColor: colors.accent },
  btnStop: { backgroundColor: colors.red },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
