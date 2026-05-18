import React from "react";
import { StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";

import { colors, typography } from "@/constants/ui";

export type TagVariant = "tb" | "tg" | "to" | "tp" | "tpk" | "tgr";

type TagProps = {
  label: string;
  variant: TagVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

const variantStyles: Record<
  TagVariant,
  { wrap: ViewStyle; text: TextStyle }
> = {
  tb: {
    wrap: { backgroundColor: colors.tag.blueBg },
    text: { color: colors.tag.blueText },
  },
  tg: {
    wrap: { backgroundColor: colors.tag.greenBg },
    text: { color: colors.tag.greenText },
  },
  to: {
    wrap: { backgroundColor: colors.tag.orangeBg },
    text: { color: colors.tag.orangeText },
  },
  tp: {
    wrap: { backgroundColor: colors.tag.purpleBg },
    text: { color: colors.tag.purpleText },
  },
  tpk: {
    wrap: { backgroundColor: colors.tag.pinkBg },
    text: { color: colors.tag.pinkText },
  },
  tgr: {
    wrap: { backgroundColor: colors.tag.grayBg },
    text: { color: colors.tag.grayText },
  },
};

export function Tag({ label, variant, style, textStyle }: TagProps) {
  const v = variantStyles[variant];
  return (
    <View style={[styles.wrap, v.wrap, style]}>
      <Text style={[styles.text, v.text, textStyle]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  text: {
    fontSize: typography.sizes.xs,
    fontWeight: "600",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
});
