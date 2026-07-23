import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect } from 'react-native-svg';
import { MuscleGroup } from '../lib/exerciseIcons';

// A drawn (SVG) badge per muscle group — original vector art, no image assets.
// Each group gets its own color and glyph so workouts read at a glance.

const COLORS: Record<MuscleGroup, string> = {
  legs: '#17B26A',
  arms: '#6C7BFF',
  back: '#1E84E6',
  core: '#F2A007',
  cardio: '#FF5C8A',
  chest: '#F4506A',
};

const W = '#ffffff';

function Glyph({ group }: { group: MuscleGroup }) {
  switch (group) {
    case 'arms': // dumbbell
      return (
        <>
          <Circle cx={6} cy={12} r={3.6} fill={W} />
          <Circle cx={18} cy={12} r={3.6} fill={W} />
          <Rect x={7} y={10.8} width={10} height={2.4} rx={1.2} fill={W} />
        </>
      );
    case 'chest': // flat barbell
      return (
        <>
          <Line x1={2} y1={8} x2={2} y2={16} stroke={W} strokeWidth={3} strokeLinecap="round" />
          <Line x1={5} y1={6} x2={5} y2={18} stroke={W} strokeWidth={3} strokeLinecap="round" />
          <Line x1={5} y1={12} x2={19} y2={12} stroke={W} strokeWidth={2.4} strokeLinecap="round" />
          <Line x1={19} y1={6} x2={19} y2={18} stroke={W} strokeWidth={3} strokeLinecap="round" />
          <Line x1={22} y1={8} x2={22} y2={16} stroke={W} strokeWidth={3} strokeLinecap="round" />
        </>
      );
    case 'legs': // squat rack
      return (
        <>
          <Line x1={4} y1={6} x2={20} y2={6} stroke={W} strokeWidth={2.4} strokeLinecap="round" />
          <Line x1={6} y1={3.5} x2={6} y2={8.5} stroke={W} strokeWidth={2.6} strokeLinecap="round" />
          <Line x1={18} y1={3.5} x2={18} y2={8.5} stroke={W} strokeWidth={2.6} strokeLinecap="round" />
          <Line x1={7.5} y1={6} x2={7.5} y2={20} stroke={W} strokeWidth={2.2} strokeLinecap="round" />
          <Line x1={16.5} y1={6} x2={16.5} y2={20} stroke={W} strokeWidth={2.2} strokeLinecap="round" />
          <Line x1={5} y1={20} x2={10} y2={20} stroke={W} strokeWidth={2.2} strokeLinecap="round" />
          <Line x1={14} y1={20} x2={19} y2={20} stroke={W} strokeWidth={2.2} strokeLinecap="round" />
        </>
      );
    case 'back': // lat pulldown (bar + cables + down chevrons)
      return (
        <>
          <Line x1={5} y1={5} x2={19} y2={5} stroke={W} strokeWidth={2.4} strokeLinecap="round" />
          <Line x1={9} y1={5} x2={9} y2={12} stroke={W} strokeWidth={2} strokeLinecap="round" />
          <Line x1={15} y1={5} x2={15} y2={12} stroke={W} strokeWidth={2} strokeLinecap="round" />
          <Line x1={9} y1={12} x2={15} y2={12} stroke={W} strokeWidth={2.4} strokeLinecap="round" />
          <Polyline points="9.5,15 12,17.5 14.5,15" fill="none" stroke={W} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Polyline points="9.5,18 12,20.5 14.5,18" fill="none" stroke={W} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case 'core': // abs grid
      return (
        <>
          <Rect x={8} y={4} width={8} height={16} rx={3} fill="none" stroke={W} strokeWidth={2} />
          <Line x1={12} y1={5} x2={12} y2={19} stroke={W} strokeWidth={1.8} strokeLinecap="round" />
          <Line x1={8.5} y1={9.5} x2={15.5} y2={9.5} stroke={W} strokeWidth={1.8} strokeLinecap="round" />
          <Line x1={8.5} y1={14.5} x2={15.5} y2={14.5} stroke={W} strokeWidth={1.8} strokeLinecap="round" />
        </>
      );
    case 'cardio': // heartbeat / ECG line
      return (
        <Polyline
          points="2,12 8,12 10,6.5 13,17.5 16,12 22,12"
          fill="none"
          stroke={W}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    default:
      return null;
  }
}

export default function ExerciseIcon({
  group,
  size = 36,
}: {
  group: MuscleGroup;
  size?: number;
}) {
  const inner = Math.round(size * 0.64);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        backgroundColor: COLORS[group],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={inner} height={inner} viewBox="0 0 24 24">
        <Glyph group={group} />
      </Svg>
    </View>
  );
}
