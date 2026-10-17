import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

type IconProps = { color: string; size?: number };

/** Accueil — compass / explore (Noa-Stito BottomNav). */
export function TabIconHome({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Circle cx={10} cy={10} r={7.25} stroke={color} strokeWidth={1.5} />
      <Path
        d="M12.8 7.2l-1.55 4.05L7.2 12.8l1.55-4.05L12.8 7.2z"
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <Circle cx={10} cy={10} r={1.15} fill={color} />
    </Svg>
  );
}

export function TabIconSessions({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Rect
        x={3}
        y={3}
        width={14}
        height={14}
        rx={2}
        stroke={color}
        strokeWidth={1.5}
      />
      <Path
        d="M7 7h6M7 10h4"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function TabIconWorkouts({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M4 6h12M4 10h8M4 14h10"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function TabIconClub({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Circle cx={10} cy={7} r={3} stroke={color} strokeWidth={1.5} />
      <Path
        d="M3 17c0-3.3 3.1-6 7-6s7 2.7 7 6"
        stroke={color}
        strokeWidth={1.5}
      />
      <Circle cx={15} cy={6} r={2} stroke={color} strokeWidth={1.2} />
    </Svg>
  );
}

export function TabIconProfile({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Circle cx={10} cy={7} r={3.5} stroke={color} strokeWidth={1.5} />
      <Path
        d="M3 18c0-3.3 3.1-6 7-6s7 2.7 7 6"
        stroke={color}
        strokeWidth={1.5}
      />
    </Svg>
  );
}
