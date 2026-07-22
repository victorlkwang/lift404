import AsyncStorage from '@react-native-async-storage/async-storage';

// ---- Types -------------------------------------------------------------

export type SetEntry = {
  id: string;
  weight: number; // "volume" — the load lifted
  reps: number;
  done?: boolean; // marked complete via the set's checkmark
};

export type ExerciseEntry = {
  id: string;
  name: string;
  sets: SetEntry[];
};

export type WorkoutSession = {
  id: string;
  date: string; // YYYY-MM-DD (local)
  startedAt: number; // epoch ms
  endedAt: number; // epoch ms
  durationSec: number;
  exercises: ExerciseEntry[];
  notes?: string;
};

export type Routine = {
  id: string;
  name: string;
  exercises: string[]; // exercise names
};

// A workout in progress. Persisted so the running timer survives app restarts.
export type ActiveWorkout = {
  startedAt: number; // epoch ms
  routineName?: string;
  exercises: ExerciseEntry[];
  notes?: string;
};

// ---- Keys --------------------------------------------------------------

const K = {
  sessions: 'lift404:sessions',
  routines: 'lift404:routines',
  active: 'lift404:active',
};

// ---- Generic helpers ---------------------------------------------------

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJSON<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// ---- Sessions ----------------------------------------------------------

export async function getSessions(): Promise<WorkoutSession[]> {
  const list = await readJSON<WorkoutSession[]>(K.sessions, []);
  // newest first
  return list.sort((a, b) => b.startedAt - a.startedAt);
}

export async function getSessionByDate(
  date: string
): Promise<WorkoutSession | undefined> {
  const list = await getSessions();
  return list.find((s) => s.date === date);
}

export async function saveSession(session: WorkoutSession): Promise<void> {
  const list = await readJSON<WorkoutSession[]>(K.sessions, []);
  // If a session already exists for that date, replace it (one per day).
  const idx = list.findIndex((s) => s.date === session.date);
  if (idx >= 0) list[idx] = session;
  else list.push(session);
  await writeJSON(K.sessions, list);
}

// The sets logged for an exercise the last time it was performed, used to
// show the "PREV" column on the active workout screen. Since the in-progress
// workout isn't saved yet, the newest saved session is the previous one.
export async function getPreviousExercise(
  name: string
): Promise<SetEntry[] | undefined> {
  const list = await getSessions(); // newest first
  const target = name.trim().toLowerCase();
  for (const s of list) {
    const ex = s.exercises.find(
      (e) => e.name.trim().toLowerCase() === target
    );
    if (ex && ex.sets.length) return ex.sets;
  }
  return undefined;
}

export async function deleteSession(id: string): Promise<void> {
  const list = await readJSON<WorkoutSession[]>(K.sessions, []);
  await writeJSON(
    K.sessions,
    list.filter((s) => s.id !== id)
  );
}

// ---- Routines ----------------------------------------------------------

export async function getRoutines(): Promise<Routine[]> {
  return readJSON<Routine[]>(K.routines, []);
}

export async function saveRoutine(routine: Routine): Promise<void> {
  const list = await getRoutines();
  const idx = list.findIndex((r) => r.id === routine.id);
  if (idx >= 0) list[idx] = routine;
  else list.push(routine);
  await writeJSON(K.routines, list);
}

export async function deleteRoutine(id: string): Promise<void> {
  const list = await getRoutines();
  await writeJSON(
    K.routines,
    list.filter((r) => r.id !== id)
  );
}

// ---- Active workout ----------------------------------------------------

export async function getActiveWorkout(): Promise<ActiveWorkout | null> {
  return readJSON<ActiveWorkout | null>(K.active, null);
}

export async function setActiveWorkout(
  active: ActiveWorkout | null
): Promise<void> {
  if (active === null) await AsyncStorage.removeItem(K.active);
  else await writeJSON(K.active, active);
}
