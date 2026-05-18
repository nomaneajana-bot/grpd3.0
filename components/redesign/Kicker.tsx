import React from "react";
import { StyleSheet, Text, type TextStyle } from "react-native";

import { monoFontFamily, redesignTheme } from "@/constants/redesignTheme";
import { welcomeFontFamily } from "@/lib/welcomeFonts";

type KickerProps = {
  children: string;
  style?: TextStyle;
  useMono?: boolean;
};

export function Kicker({ children, style, useMono = true }: KickerProps) {
  return (
    <Text
      style={[
        styles.kicker,
        useMono ? styles.mono : styles.inter,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  kicker: {
    ...redesignTheme.type.kicker,
    color: redesignTheme.text.dim,
    textTransform: "uppercase",
  },
  mono: {
    fontFamily: monoFontFamily,
  },
  inter: {
    fontFamily: welcomeFontFamily.semibold,
  },
});
