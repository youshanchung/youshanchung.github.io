import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

type Props = {
  /** 0..1 — fraction REMAINING (ring full at start, empty at end). */
  progress: number;
  size: number;
  segments?: number;
  activeColor: string;
  trackColor: string;
  thickness?: number;
  children?: React.ReactNode;
};

/**
 * Dashed circular progress ring matching the reference screenshots.
 * N evenly-spaced arc segments; the first `progress * N` render bright.
 */
export default function ProgressRing({
  progress,
  size,
  segments = 40,
  activeColor,
  trackColor,
  thickness = 8,
  children,
}: Props) {
  const radius = (size - thickness) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const gapDeg = 1.5;
  const segDeg = 360 / segments - gapDeg;

  const filled = Math.round(Math.max(0, Math.min(1, progress)) * segments);

  const segs = useMemo(
    () =>
      Array.from({ length: segments }, (_, i) => {
        const startDeg = -90 + i * (360 / segments);
        return { startDeg, isActive: i < filled };
      }),
    [segments, filled]
  );

  const segLen = (segDeg / 360) * circumference;
  const dashArray = `${segLen} ${circumference}`;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G originX={center} originY={center}>
          {segs.map((s, i) => (
            <Circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              stroke={s.isActive ? activeColor : trackColor}
              strokeWidth={thickness}
              strokeLinecap="butt"
              fill="none"
              strokeDasharray={dashArray}
              strokeDashoffset={0}
              transform={`rotate(${s.startDeg} ${center} ${center})`}
            />
          ))}
        </G>
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
}
