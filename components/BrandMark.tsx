import React from 'react';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { gradient } from '../lib/theme';

// The Lift 404 mark: an upward chevron ("lift") drawn as one rounded stroke.
// Defaults to the brand blue gradient — deep at the apex, bright at the legs,
// matching the app icon. Pass `tint` for a flat single-color version (the tab
// bar uses this so the icon can follow the active/inactive tint).
export default function BrandMark({
  size = 40,
  tint,
  strokeWidth = 7,
}: {
  size?: number;
  tint?: string;
  strokeWidth?: number;
}) {
  const gradId = 'liftMarkGrad';
  const stroke = tint ?? `url(#${gradId})`;
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {!tint && (
        <Defs>
          <LinearGradient
            id={gradId}
            x1="24"
            y1="12"
            x2="24"
            y2="38"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={gradient.brand[0]} />
            <Stop offset="0.5" stopColor={gradient.brand[1]} />
            <Stop offset="1" stopColor={gradient.brand[2]} />
          </LinearGradient>
        </Defs>
      )}
      <Path
        d="M11 35 L24 15 L37 35"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
