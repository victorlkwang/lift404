// Maps an exercise (by name) to an emoji icon by muscle group. This gives
// every logged exercise and trained day a colorful "image" with no bundled
// assets — emoji render as full-color glyphs on iOS. Swap this mapping for
// real illustrations later by returning image sources instead.

type IconRule = { icon: string; keywords: string[] };

// Order matters: the first rule whose keyword is found in the name wins, so
// more specific groups (legs, arms) are listed before the generic barbell.
const RULES: IconRule[] = [
  {
    icon: '🦵',
    keywords: [
      'squat',
      'lunge',
      'leg',
      'calf',
      'glute',
      'quad',
      'hamstring',
    ],
  },
  { icon: '💪', keywords: ['curl', 'bicep', 'tricep', 'arm', 'preacher', 'hammer'] },
  { icon: '🚣', keywords: ['row'] },
  {
    icon: '🤸',
    keywords: ['pull-up', 'pullup', 'chin-up', 'chinup', 'pulldown', 'lat', 'back'],
  },
  {
    icon: '🧘',
    keywords: ['ab', 'abs', 'core', 'plank', 'crunch', 'sit-up', 'situp', 'oblique'],
  },
  {
    icon: '🏃',
    keywords: ['run', 'treadmill', 'sprint', 'cardio', 'bike', 'cycl', 'elliptical', 'jump'],
  },
  {
    icon: '🏋️',
    keywords: [
      'bench',
      'press',
      'chest',
      'fly',
      'push',
      'dip',
      'shoulder',
      'overhead',
      'deadlift',
      'incline',
      'decline',
    ],
  },
];

const DEFAULT_ICON = '🏋️';

export function iconForExercise(name: string): string {
  const n = name.trim().toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((k) => n.includes(k))) return rule.icon;
  }
  return DEFAULT_ICON;
}

// The icon that represents a whole session — its first exercise, or a
// generic "worked out" icon for an empty session.
export function iconForSession(session: {
  exercises: { name: string }[];
}): string {
  const first = session.exercises[0]?.name;
  return first ? iconForExercise(first) : '💪';
}
