import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { colors, radius, spacing } from '../lib/theme';

type Props = {
  value: number;
  values: number[];
  onChange: (v: number) => void;
  title?: string;
  done?: boolean;
};

// A compact table cell that shows a number and opens a scrollable picker on
// tap. Used for the weight / reps columns on the active workout screen.
export default function NumberPickerCell({
  value,
  values,
  onChange,
  title,
  done,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        style={[styles.cell, done && styles.cellDone]}
        onPress={() => setOpen(true)}
      >
        <Text style={styles.value}>{value}</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            {title ? <Text style={styles.sheetTitle}>{title}</Text> : null}
            <ScrollView style={styles.list}>
              {values.map((v) => {
                const selected = v === value;
                return (
                  <Pressable
                    key={v}
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => {
                      onChange(v);
                      setOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selected && styles.optionTextSelected,
                      ]}
                    >
                      {v}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  cell: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellDone: { backgroundColor: colors.accentDim },
  value: { color: colors.text, fontSize: 20, fontWeight: '700' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: '70%',
    padding: spacing.lg,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: { flexGrow: 0 },
  option: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  optionSelected: { backgroundColor: colors.accentDim },
  optionText: { color: colors.text, fontSize: 18, textAlign: 'center' },
  optionTextSelected: { fontWeight: '700', color: '#fff' },
});
