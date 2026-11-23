import React, { useEffect, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { OptionSlider } from "@/components/ui/OptionSlider";
import { stitoTheme as t } from "@/constants/stitoTheme";
import { DEFAULT_LOCATIONS } from "@/lib/moroccoPlaces";
import { addSpot, getSpots } from "@/lib/spotsStore";

type Props = {
  value: string;
  onChange: (location: string) => void;
  /** Extra options (merged, de-duped). */
  options?: readonly string[];
  testID?: string;
  /** Load persisted spots from spotsStore (default true). */
  loadSavedSpots?: boolean;
  /** Show “Autre” + free-text custom location (default true). */
  allowCustom?: boolean;
};

/**
 * Horizontal location chips + optional “Autre” free-text that persists via spotsStore.
 */
export function LocationSlider({
  value,
  onChange,
  options,
  testID = "location-slider",
  loadSavedSpots = true,
  allowCustom = true,
}: Props) {
  const [saved, setSaved] = useState<string[]>([]);
  const [customOpen, setCustomOpen] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!loadSavedSpots) return;
    let alive = true;
    void getSpots().then((list) => {
      if (alive) setSaved(list);
    });
    return () => {
      alive = false;
    };
  }, [loadSavedSpots]);

  const merged = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of [
      ...(options ?? []),
      ...saved,
      ...DEFAULT_LOCATIONS,
    ]) {
      const key = item.trim();
      if (!key) continue;
      const norm = key.toLowerCase();
      if (seen.has(norm)) continue;
      seen.add(norm);
      out.push(key);
    }
    return out;
  }, [options, saved]);

  const selected = value.trim();
  const inList = merged.some(
    (o) => o.toLowerCase() === selected.toLowerCase(),
  );
  const showCustom =
    allowCustom && (customOpen || (selected.length > 0 && !inList));

  const commitCustom = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    onChange(trimmed);
    try {
      const updated = await addSpot(trimmed);
      setSaved(updated);
    } catch {
      // still keep the in-form value even if persist fails
    }
    setCustomOpen(false);
    setDraft("");
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.sliderRow}>
        <View style={styles.sliderFlex}>
          <OptionSlider
            options={merged}
            value={inList ? selected : ""}
            onChange={(next) => {
              setCustomOpen(false);
              setDraft("");
              onChange(next);
            }}
            label="Lieu"
            testID={testID}
            style={styles.sliderNoMargin}
          />
        </View>
        {allowCustom ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Autre lieu"
            accessibilityState={{ selected: showCustom }}
            onPress={() => {
              setCustomOpen(true);
              setDraft(inList ? "" : selected);
            }}
            style={({ pressed }) => [
              styles.autreChip,
              showCustom && styles.autreChipOn,
              pressed && { opacity: 0.9 },
              Platform.OS === "web" && styles.chipWeb,
            ]}
            testID={testID ? `${testID}-autre` : "location-slider-autre"}
          >
            <Text
              style={[styles.autreText, showCustom && styles.autreTextOn]}
            >
              Autre
            </Text>
          </Pressable>
        ) : null}
      </View>

      {showCustom ? (
        <TextInput
          style={styles.customInput}
          value={draft || (!inList ? selected : "")}
          onChangeText={(text) => {
            setDraft(text);
            onChange(text);
          }}
          onBlur={() => {
            void commitCustom(draft || selected);
          }}
          onSubmitEditing={() => {
            void commitCustom(draft || selected);
          }}
          placeholder="Ex. Café Maure, parking Hassan II…"
          placeholderTextColor={t.outline}
          autoCapitalize="sentences"
          returnKeyType="done"
          testID={
            testID ? `${testID}-custom-input` : "location-slider-custom-input"
          }
          accessibilityLabel="Lieu personnalisé"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    gap: 10,
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sliderFlex: {
    flex: 1,
    minWidth: 0,
  },
  sliderNoMargin: {
    marginTop: 0,
  },
  autreChip: {
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: t.radiusChip,
    backgroundColor: t.surfaceContainer,
    borderWidth: 1,
    borderColor: t.surfaceContainerHigh,
    justifyContent: "center",
    flexShrink: 0,
  },
  autreChipOn: {
    backgroundColor: t.primary,
    borderColor: t.primary,
  },
  autreText: {
    ...t.type.labelMd,
    color: t.textSecondary,
    fontFamily: t.font.space.semibold,
    fontSize: 13,
  },
  autreTextOn: {
    color: t.onPrimary,
    fontFamily: t.font.space.bold,
  },
  chipWeb: {
    cursor: "pointer",
  },
  customInput: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: t.surfaceContainerHigh,
    backgroundColor: t.surfaceContainerLow,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: t.text,
    fontFamily: t.font.hanken.regular,
    fontSize: 15,
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : null),
  },
});
