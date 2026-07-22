import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import {
  ActiveWorkout,
  ExerciseEntry,
  SetEntry,
  WorkoutSession,
  getActiveWorkout,
  saveSession,
  setActiveWorkout,
} from '../lib/storage';
import { toDateKey, uid } from '../lib/time';

type WorkoutContextValue = {
  active: ActiveWorkout | null;
  elapsedSec: number;
  loading: boolean;
  startWorkout: (routineName?: string, exerciseNames?: string[]) => void;
  addExercise: (name: string) => void;
  removeExercise: (exerciseId: string) => void;
  renameExercise: (exerciseId: string, name: string) => void;
  moveExercise: (exerciseId: string, dir: -1 | 1) => void;
  addSet: (exerciseId: string, weight?: number, reps?: number) => void;
  updateSet: (
    exerciseId: string,
    setId: string,
    patch: Partial<Omit<SetEntry, 'id'>>
  ) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  setNotes: (notes: string) => void;
  endWorkout: () => Promise<WorkoutSession | null>;
  cancelWorkout: () => Promise<void>;
};

const WorkoutContext = createContext<WorkoutContextValue | undefined>(undefined);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<ActiveWorkout | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [loading, setLoading] = useState(true);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore any in-progress workout on launch (timer keeps running from startedAt).
  useEffect(() => {
    (async () => {
      const restored = await getActiveWorkout();
      setActive(restored);
      setLoading(false);
    })();
  }, []);

  // Drive the elapsed-time counter off wall-clock so it stays accurate.
  useEffect(() => {
    if (tick.current) clearInterval(tick.current);
    if (active) {
      const update = () =>
        setElapsedSec(Math.floor((Date.now() - active.startedAt) / 1000));
      update();
      tick.current = setInterval(update, 1000);
    } else {
      setElapsedSec(0);
    }
    return () => {
      if (tick.current) clearInterval(tick.current);
    };
  }, [active]);

  // Persist helper: update state + storage together.
  const persist = useCallback((next: ActiveWorkout | null) => {
    setActive(next);
    setActiveWorkout(next);
  }, []);

  const startWorkout = useCallback(
    (routineName?: string, exerciseNames: string[] = []) => {
      const next: ActiveWorkout = {
        startedAt: Date.now(),
        routineName,
        exercises: exerciseNames.map((name) => ({
          id: uid(),
          name,
          sets: [],
        })),
      };
      persist(next);
    },
    [persist]
  );

  const addExercise = useCallback(
    (name: string) => {
      setActive((cur) => {
        if (!cur) return cur;
        const entry: ExerciseEntry = { id: uid(), name, sets: [] };
        const next = { ...cur, exercises: [...cur.exercises, entry] };
        setActiveWorkout(next);
        return next;
      });
    },
    []
  );

  const removeExercise = useCallback((exerciseId: string) => {
    setActive((cur) => {
      if (!cur) return cur;
      const next = {
        ...cur,
        exercises: cur.exercises.filter((e) => e.id !== exerciseId),
      };
      setActiveWorkout(next);
      return next;
    });
  }, []);

  const renameExercise = useCallback((exerciseId: string, name: string) => {
    setActive((cur) => {
      if (!cur) return cur;
      const next = {
        ...cur,
        exercises: cur.exercises.map((e) =>
          e.id === exerciseId ? { ...e, name } : e
        ),
      };
      setActiveWorkout(next);
      return next;
    });
  }, []);

  const moveExercise = useCallback((exerciseId: string, dir: -1 | 1) => {
    setActive((cur) => {
      if (!cur) return cur;
      const idx = cur.exercises.findIndex((e) => e.id === exerciseId);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= cur.exercises.length) return cur;
      const exercises = [...cur.exercises];
      [exercises[idx], exercises[target]] = [exercises[target], exercises[idx]];
      const next = { ...cur, exercises };
      setActiveWorkout(next);
      return next;
    });
  }, []);

  const addSet = useCallback(
    (exerciseId: string, weight?: number, reps?: number) => {
      setActive((cur) => {
        if (!cur) return cur;
        const ex = cur.exercises.find((e) => e.id === exerciseId);
        const last = ex?.sets[ex.sets.length - 1];
        const set: SetEntry = {
          id: uid(),
          weight: weight ?? last?.weight ?? 20,
          reps: reps ?? last?.reps ?? 10,
          done: false,
        };
        const next = {
          ...cur,
          exercises: cur.exercises.map((e) =>
            e.id === exerciseId ? { ...e, sets: [...e.sets, set] } : e
          ),
        };
        setActiveWorkout(next);
        return next;
      });
    },
    []
  );

  const updateSet = useCallback(
    (
      exerciseId: string,
      setId: string,
      patch: Partial<Omit<SetEntry, 'id'>>
    ) => {
      setActive((cur) => {
        if (!cur) return cur;
        const next = {
          ...cur,
          exercises: cur.exercises.map((e) =>
            e.id === exerciseId
              ? {
                  ...e,
                  sets: e.sets.map((s) =>
                    s.id === setId ? { ...s, ...patch } : s
                  ),
                }
              : e
          ),
        };
        setActiveWorkout(next);
        return next;
      });
    },
    []
  );

  const removeSet = useCallback((exerciseId: string, setId: string) => {
    setActive((cur) => {
      if (!cur) return cur;
      const next = {
        ...cur,
        exercises: cur.exercises.map((e) =>
          e.id === exerciseId
            ? { ...e, sets: e.sets.filter((s) => s.id !== setId) }
            : e
        ),
      };
      setActiveWorkout(next);
      return next;
    });
  }, []);

  const setNotes = useCallback((notes: string) => {
    setActive((cur) => {
      if (!cur) return cur;
      const next = { ...cur, notes };
      setActiveWorkout(next);
      return next;
    });
  }, []);

  const endWorkout = useCallback(async (): Promise<WorkoutSession | null> => {
    if (!active) return null;
    const endedAt = Date.now();
    const session: WorkoutSession = {
      id: uid(),
      date: toDateKey(new Date(active.startedAt)),
      startedAt: active.startedAt,
      endedAt,
      durationSec: Math.floor((endedAt - active.startedAt) / 1000),
      exercises: active.exercises,
      notes: active.notes,
    };
    await saveSession(session);
    await setActiveWorkout(null);
    setActive(null);
    return session;
  }, [active]);

  const cancelWorkout = useCallback(async () => {
    await setActiveWorkout(null);
    setActive(null);
  }, []);

  return (
    <WorkoutContext.Provider
      value={{
        active,
        elapsedSec,
        loading,
        startWorkout,
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
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout(): WorkoutContextValue {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error('useWorkout must be used within WorkoutProvider');
  return ctx;
}
