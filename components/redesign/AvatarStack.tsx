import React from "react";
import { StyleSheet, Text, View } from "react-native";

type AvatarStackProps = {
  initials: string[];
  backgroundColor: string;
  size?: number;
  overlap?: number;
};

export function AvatarStack({
  initials,
  backgroundColor,
  size = 26,
  overlap = 8,
}: AvatarStackProps) {
  return (
    <View style={styles.row}>
      {initials.slice(0, 2).map((initial, index) => (
        <View
          key={`${initial}-${index}`}
          style={[
            styles.avatar,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor,
              marginLeft: index > 0 ? -overlap : 0,
            },
          ]}
        >
          <Text style={[styles.text, { fontSize: size * 0.38 }]}>{initial}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#141414",
  },
  text: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
