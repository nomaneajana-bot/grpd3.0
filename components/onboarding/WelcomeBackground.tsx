import React from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import { welcomeTheme } from "@/components/onboarding/onboardingTheme";

export function WelcomeBackground() {
  const { width, height } = useWindowDimensions();
  const radial = welcomeTheme.gradientRadial;

  const cx = width * 0.5;
  const cy = height * 0.32;
  const rx = width * 0.55;
  const ry = height * 0.4;

  return (
    <View
      style={[styles.wrap, { backgroundColor: welcomeTheme.background }]}
      pointerEvents="none"
    >
      {width > 0 && height > 0 ? (
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient
              id="welcomeBloom"
              cx={cx}
              cy={cy}
              rx={rx}
              ry={ry}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor={radial.centerColor} />
              <Stop offset="62%" stopColor={radial.edgeColor} />
            </RadialGradient>
          </Defs>
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill="url(#welcomeBloom)"
          />
        </Svg>
      ) : null}
      <LinearGradient
        colors={["rgba(0, 0, 0, 0)", "#000000"]}
        locations={[0.5, 1]}
        style={styles.linear}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  linear: {
    ...StyleSheet.absoluteFillObject,
  },
});
