// Central design tokens for Lift 404.
//
// The whole palette is derived from the app's mark — a bright dodger-blue
// "lift" chevron (deep at the apex, light at the legs) on a pale ice-blue
// field — so every surface, control and accent reads as one brand.
export const colors = {
  // Surfaces — the favicon's airy ice-blue field, lightest at the top layer.
  bg: '#EEF6FE', // app background — pale ice blue
  surface: '#FFFFFF', // cards, sheets, the raised layer
  surfaceAlt: '#E7F1FC', // inputs, cells, quiet fills
  border: '#D6E7F6', // hairline separators

  // Text — deep navy slate reads crisply on the light field.
  text: '#0D2B47',
  textDim: '#5E7C99',

  // Brand blue — the chevron gradient, distilled to flat tokens.
  accent: '#1E84E6', // primary — the chevron's mid-tone
  accentDeep: '#0D6FDB', // pressed / gradient apex
  accentSoft: '#D6E9FC', // selected tint (pair with accent-colored text)
  accentDim: '#D6E9FC', // back-compat alias for accentSoft
  onAccent: '#FFFFFF', // text / icons on a solid accent fill

  // Status — tuned a touch deeper so they hold up on white.
  green: '#17B26A',
  greenSoft: '#D6F5E6',
  red: '#E23D5B',
  amber: '#E08600',

  // Overlay scrim behind modals — a soft navy wash, not pure black.
  scrim: 'rgba(13, 43, 71, 0.32)',
};

// Gradient stops for the chevron mark and any hero element: deep at the top,
// bright at the bottom — the same falloff as the icon.
export const gradient = {
  brand: ['#0D6FDB', '#2E90F0', '#7FBEF9'] as const,
};

export const radius = { sm: 8, md: 12, lg: 18, xl: 24, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

// Consistent soft elevation. On a light field, cards lift with shadow rather
// than leaning only on borders — `card` for resting surfaces, `lifted` for the
// primary call-to-action.
export const shadow = {
  card: {
    shadowColor: '#0D2B47',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  lifted: {
    shadowColor: '#0D6FDB',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
} as const;
