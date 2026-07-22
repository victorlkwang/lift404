import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import NumberPickerCell from '../components/NumberPickerCell';
import RestTimer from '../components/RestTimer';
import { useWorkout } from '../context/WorkoutContext';
import { getPreviousExercise, SetEntry } from '../lib/storage';
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
    renameExercise,
    moveExercise,
    addSet,
    updateSet,
    removeSet,
    setNotes,
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
        {/* Workout notes */}
        <TextInput
          style={styles.notes}
          placeholder="Your workout notes..."
          placeholderTextColor={colors.textDim}
          value={active.notes ?? ''}
          onChangeText={setNotes}
          multiline
        />

        <RestTimer />

        {active.exercises.map((ex, i) => (
          <ExerciseCard
            key={ex.id}
            ex={ex}
            canMoveUp={i > 0}
            canMoveDown={i < active.exercises.length - 1}
            onRemove={() => removeExercise(ex.id)}
            onRename={(name) => renameExercise(ex.id, name)}
            onMove={(dir) => moveExercise(ex.id, dir)}
            onAddSet={() => addSet(ex.id)}
            onUpdateSet={(setId, patch) => updateSet(ex.id, setId, patch)}
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

type Ex = { id: string; name: string; sets: SetEntry[] };

function ExerciseCard({
  ex,
  canMoveUp,
  canMoveDown,
  onRemove,
  onRename,
  onMove,
  onAddSet,
  onUpdateSet,
  onRemoveSet,
}: {
  ex: Ex;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onRemove: () => void;
  onRename: (name: string) => void;
  onMove: (dir: -1 | 1) => void;
  onAddSet: () => void;
  onUpdateSet: (setId: string, patch: Partial<Omit<SetEntry, 'id'>>) => void;
  onRemoveSet: (setId: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [prev, setPrev] = useState<SetEntry[] | undefined>();

  // Load the last time this exercise was performed, for the PREV column.
  useEffect(() => {
    let alive = true;
    getPreviousExercise(ex.name).then((p) => {
      if (alive) setPrev(p);
    });
    return () => {
      alive = false;
    };
  }, [ex.name]);

  const prevText = (i: number) => {
    if (!prev || prev.length === 0) return '—';
    const p = prev[i] ?? prev[prev.length - 1];
    return `${p.weight} × ${p.reps}`;
  };

  const doneCount = ex.sets.filter((s) => s.done).length;

  const doRename = () => {
    setMenuOpen(false);
    Alert.prompt?.(
      'Rename exercise',
      undefined,
      (text?: string) => {
        const v = text?.trim();
        if (v) onRename(v);
      },
      'plain-text',
      ex.name
    );
  };

  return (
    <View style={styles.exCard}>
      <View style={styles.exHeader}>
        <Pressable
          onPress={() => setCollapsed((c) => !c)}
          hitSlop={8}
          style={styles.chevBtn}
        >
          <Text style={styles.chev}>{collapsed ? '▾' : '▴'}</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.exName} numberOfLines={1}>
            {ex.name}
          </Text>
          {ex.sets.length > 0 && (
            <Text style={styles.exSub}>
              {doneCount}/{ex.sets.length} sets
            </Text>
          )}
        </View>
        <Pressable onPress={() => setMenuOpen(true)} hitSlop={8}>
          <Text style={styles.kebab}>⋮</Text>
        </Pressable>
      </View>

      {!collapsed && (
        <>
          {/* Column headers */}
          <View style={styles.tableHead}>
            <Text style={[styles.th, styles.colSet]}>SET</Text>
            <Text style={[styles.th, styles.colPrev]}>PREV</Text>
            <Text style={[styles.th, styles.colNum]}>LB</Text>
            <Text style={[styles.th, styles.colNum]}>REPS</Text>
            <View style={styles.colCheck} />
          </View>

          {ex.sets.map((s, i) => (
            <View key={s.id} style={styles.setRow}>
              <Text style={[styles.setIndex, styles.colSet]}>{i + 1}</Text>
              <Text
                style={[styles.prevText, styles.colPrev]}
                numberOfLines={1}
              >
                {prevText(i)}
              </Text>
              <View style={styles.colNum}>
                <NumberPickerCell
                  value={s.weight}
                  values={WEIGHTS}
                  title="Weight (lb)"
                  done={s.done}
                  onChange={(v) => onUpdateSet(s.id, { weight: v })}
                />
              </View>
              <View style={styles.colNum}>
                <NumberPickerCell
                  value={s.reps}
                  values={REPS}
                  title="Reps"
                  done={s.done}
                  onChange={(v) => onUpdateSet(s.id, { reps: v })}
                />
              </View>
              <View style={styles.colCheck}>
                <Pressable
                  onPress={() => onUpdateSet(s.id, { done: !s.done })}
                  onLongPress={() => onRemoveSet(s.id)}
                  hitSlop={8}
                  style={[styles.check, s.done && styles.checkDone]}
                >
                  <Text
                    style={[styles.checkMark, s.done && styles.checkMarkDone]}
                  >
                    ✓
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}

          <Pressable style={styles.addSetBtn} onPress={onAddSet}>
            <Text style={styles.addSetText}>+ ADD SET</Text>
          </Pressable>
          {ex.sets.length > 0 && (
            <Text style={styles.setHint}>
              Tap ✓ to complete a set · long-press ✓ to delete it.
            </Text>
          )}
        </>
      )}

      {/* ⋮ menu */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          style={styles.menuBackdrop}
          onPress={() => setMenuOpen(false)}
        >
          <Pressable
            style={styles.menuSheet}
            onPress={(e) => e.stopPropagation()}
          >
            <MenuItem label="Rename" onPress={doRename} />
            {canMoveUp && (
              <MenuItem
                label="Move up"
                onPress={() => {
                  setMenuOpen(false);
                  onMove(-1);
                }}
              />
            )}
            {canMoveDown && (
              <MenuItem
                label="Move down"
                onPress={() => {
                  setMenuOpen(false);
                  onMove(1);
                }}
              />
            )}
            <MenuItem
              label="Delete exercise"
              destructive
              onPress={() => {
                setMenuOpen(false);
                onRemove();
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function MenuItem({
  label,
  destructive,
  onPress,
}: {
  label: string;
  destructive?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <Text style={[styles.menuText, destructive && styles.menuTextDanger]}>
        {label}
      </Text>
    </Pressable>
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
  notes: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    padding: spacing.lg,
    fontSize: 15,
    minHeight: 56,
    textAlignVertical: 'top',
  },
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
    alignItems: 'center',
    gap: spacing.md,
  },
  chevBtn: {
    width: 24,
    alignItems: 'center',
  },
  chev: { color: colors.accent, fontSize: 18, fontWeight: '800' },
  exName: { color: colors.text, fontSize: 18, fontWeight: '800' },
  exSub: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  kebab: { color: colors.textDim, fontSize: 22, fontWeight: '800', width: 20, textAlign: 'center' },

  // Sets table
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  th: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  colSet: { width: 30, textAlign: 'center' },
  colPrev: { flex: 1.4, textAlign: 'center' },
  colNum: { flex: 1.2 },
  colCheck: { width: 40, alignItems: 'center' },
  setIndex: { color: colors.text, fontWeight: '800', fontSize: 16 },
  prevText: { color: colors.textDim, fontSize: 13 },
  check: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: colors.green, borderColor: colors.green },
  checkMark: { color: colors.textDim, fontSize: 16, fontWeight: '800' },
  checkMarkDone: { color: '#08130C' },
  addSetBtn: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  addSetText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  setHint: { color: colors.textDim, fontSize: 11, textAlign: 'center' },

  // ⋮ menu
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  menuSheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  menuTextDanger: { color: colors.red },

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
