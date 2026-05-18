import React, { createElement } from "react";
import {
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import { welcomeTheme } from "@/components/onboarding/onboardingTheme";

/** Stacked CSS backgrounds — matches Présence HTML export (top layer first). */
const WEB_BACKGROUND_IMAGE = [
  "linear-gradient(to top, rgba(0, 0, 0, 0) 40%, rgb(0, 0, 0) 100%)",
  "radial-gradient(circle at 50% 38%, rgba(47, 123, 255, 0.55) 0%, rgba(0, 0, 0, 0) 62%)",
  "rgb(0, 0, 0)",
].join(", ");

const webLayerStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 0,
  pointerEvents: "none",
  backgroundColor: welcomeTheme.background,
  backgroundImage: WEB_BACKGROUND_IMAGE,
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
};

export function WelcomeBackground() {
  const { width, height } = useWindowDimensions();
  const radial = welcomeTheme.gradientRadial;

  if (Platform.OS === "web") {
    return createElement("div", { style: webLayerStyle });
  }

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
          <Rect x={0} y={0} width={width} height={height} fill="url(#welcomeBloom)" />
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
