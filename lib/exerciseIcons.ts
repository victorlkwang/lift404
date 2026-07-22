// Classifies an exercise (by name) into a muscle group. The group drives a
// drawn vector badge (see components/ExerciseIcon.tsx) — original artwork, so
// no image assets or licensing are needed. Swap the renderer for real
// illustrations later without touching this classification.

export type MuscleGroup =
  | 'legs'
  | 'arms'
  | 'back'
  | 'core'
  | 'cardio'
  | 'chest';

type GroupRule = { group: MuscleGroup; keywords: string[] };

// Order matters: the first rule whose keyword is found in the name wins, so
// more specific groups (legs, arms) are listed before the generic push/press.
const RULES: GroupRule[] = [
  {
    group: 'legs',
    keywords: ['squat', 'lunge', 'leg', 'calf', 'glute', 'quad', 'hamstring'],
  },
  { group: 'arms', keywords: ['curl', 'bicep', 'tricep', 'arm', 'preacher', 'hammer'] },
  { group: 'back', keywords: ['row', 'pull-up', 'pullup', 'chin-up', 'chinup', 'pulldown', 'lat', 'back', 'deadlift'] },
  {
    group: 'core',
    keywords: ['ab', 'abs', 'core', 'plank', 'crunch', 'sit-up', 'situp', 'oblique'],
  },
  {
    group: 'cardio',
    keywords: ['run', 'treadmill', 'sprint', 'cardio', 'bike', 'cycl', 'elliptical', 'jump'],
  },
  {
    group: 'chest',
    keywords: ['bench', 'press', 'chest', 'fly', 'push', 'dip', 'shoulder', 'overhead', 'incline', 'decline'],
  },
];

const DEFAULT_GROUP: MuscleGroup = 'chest';

export function groupForExercise(name: string): MuscleGroup {
  const n = name.trim().toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((k) => n.includes(k))) return rule.group;
  }
  return DEFAULT_GROUP;
}

// The group that represents a whole session — its first exercise.
export function groupForSession(session: {
  exercises: { name: string }[];
}): MuscleGroup {
  const first = session.exercises[0]?.name;
  return first ? groupForExercise(first) : DEFAULT_GROUP;
}
