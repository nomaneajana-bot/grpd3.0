import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { PaceLivePreview } from "@/components/pr/PaceLivePreview";
import { TimeInput } from "@/components/pr/TimeInput";
import { Kicker } from "@/components/redesign/Kicker";
import { redesignTheme } from "@/constants/redesignTheme";
import type { TestMode } from "@/lib/profileStore";
import type { TestRecord } from "@/lib/profileStore";
import {
  calculatePaceSecondsPerKmSafe,
  formatDistanceLabel,
} from "@/lib/testHelpers";
import { welcomeFontFamily } from "@/lib/welcomeFonts";

type PresetId = "5k" | "10k" | "semi" | "marathon" | "other";

const PRESETS: { id: PresetId; label: string; meters: number | null }[] = [
  { id: "5k", label: "5K", meters: 5000 },
  { id: "10k", label: "10K", meters: 10000 },
  { id: "semi", label: "Semi", meters: 21097 },
  { id: "marathon", label: "Marathon", meters: 42195 },
  { id: "other", label: "Autre", meters: null },
];

type PrSheetAProps = {
  visible: boolean;
  test: TestRecord | null;
  isAdding?: boolean;
  onClose: () => void;
  onSave: (test: TestRecord) => void;
};

export function PrSheetA({
  visible,
  test,
  isAdding = false,
  onClose,
  onSave,
}: PrSheetAProps) {
  const [preset, setPreset] = useState<PresetId>("5k");
  const [customDistance, setCustomDistance] = useState("");
  const [customUnit, setCustomUnit] = useState<"km" | "m">("km");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");

  useEffect(() => {
    if (!visible) return;
    if (test) {
      const m = test.distanceMeters;
      let matched: PresetId = "other";
      if (m === 5000) matched = "5k";
      else if (m === 10000) matched = "10k";
      else if (m === 21097) matched = "semi";
      else if (m === 42195) matched = "marathon";
      setPreset(matched);
      if (matched === "other" && m) {
        if (m >= 1000) {
          setCustomDistance(String(m / 1000));
          setCustomUnit("km");
        } else {
          setCustomDistance(String(m));
          setCustomUnit("m");
        }
      }
      if (test.durationSeconds) {
        const t = test.durationSeconds;
        setHours(String(Math.floor(t / 3600)));
        setMinutes(String(Math.floor((t % 3600) / 60)));
        setSeconds(String(t % 60));
      }
    } else {
      setPreset("5k");
      setCustomDistance("");
      setHours("");
      setMinutes("");
      setSeconds("");
    }
  }, [visible, test]);

  const distanceMeters = useMemo(() => {
    const p = PRESETS.find((x) => x.id === preset);
    if (p?.meters) return p.meters;
    const num = parseFloat(customDistance.replace(",", "."));
    if (!isFinite(num) || num <= 0) return null;
    return customUnit === "km" ? Math.round(num * 1000) : Math.round(num);
  }, [preset, customDistance, customUnit]);

  const durationSeconds = useMemo(() => {
    const h = Number(hours) || 0;
    const m = Number(minutes) || 0;
    const s = Number(seconds) || 0;
    const total = h * 3600 + m * 60 + s;
    return total > 0 ? total : null;
  }, [hours, minutes, seconds]);

  const paceSecondsPerKm = useMemo(() => {
    if (!distanceMeters || !durationSeconds) return null;
    return calculatePaceSecondsPerKmSafe({
      distanceMeters,
      durationSeconds,
    });
  }, [distanceMeters, durationSeconds]);

  const valid =
    distanceMeters != null &&
    distanceMeters > 0 &&
    durationSeconds != null &&
    durationSeconds > 0;

  const handleSave = () => {
    if (!valid || !distanceMeters || !durationSeconds || !paceSecondsPerKm) return;

    const mode: TestMode = "time_over_distance";
    const label = formatDistanceLabel(distanceMeters);
    const record: TestRecord = {
      id: test?.id ?? `test_${Date.now()}`,
      kind: "distance",
      mode,
      label,
      distanceMeters,
      durationSeconds,
      paceSecondsPerKm,
      testDate: test?.testDate ?? new Date().toISOString().slice(0, 10),
      testType: "solo",
      createdAt: test?.createdAt ?? Date.now(),
    };
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(record);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.backdrop}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.topbar}>
            <Text style={styles.title}>
              {isAdding ? "Nouveau PR" : "Modifier le PR"}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.close}>Fermer</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.intro}>
              Entre ta distance et ton temps — l&apos;allure est calculée
              automatiquement.
            </Text>

            <Kicker useMono style={styles.sectionKicker}>
              DISTANCE
            </Kicker>
            <View style={styles.presetRow}>
              {PRESETS.map((p) => (
                <Pressable
                  key={p.id}
                  style={[
                    styles.presetChip,
                    preset === p.id && styles.presetChipSelected,
                  ]}
                  onPress={() => {
                    setPreset(p.id);
                    Haptics.selectionAsync();
                  }}
                >
                  <Text
                    style={[
                      styles.presetText,
                      preset === p.id && styles.presetTextSelected,
                    ]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {preset === "other" ? (
              <View style={styles.customRow}>
                <TextInput
                  style={styles.customInput}
                  value={customDistance}
                  onChangeText={setCustomDistance}
                  placeholder="0"
                  placeholderTextColor={redesignTheme.text.faint}
                  keyboardType="decimal-pad"
                />
                <Pressable
                  style={[
                    styles.unitBtn,
                    customUnit === "m" && styles.unitBtnOn,
                  ]}
                  onPress={() => setCustomUnit("m")}
                >
                  <Text style={styles.unitText}>m</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.unitBtn,
                    customUnit === "km" && styles.unitBtnOn,
                  ]}
                  onPress={() => setCustomUnit("km")}
                >
                  <Text style={styles.unitText}>km</Text>
                </Pressable>
              </View>
            ) : null}

            <Kicker useMono style={styles.sectionKicker}>
              TEMPS
            </Kicker>
            <TimeInput
              hours={hours}
              minutes={minutes}
              seconds={seconds}
              onChangeHours={setHours}
              onChangeMinutes={setMinutes}
              onChangeSeconds={setSeconds}
            />

            <View style={styles.previewWrap}>
              <PaceLivePreview
                paceSecondsPerKm={paceSecondsPerKm}
                valid={valid}
              />
            </View>

            <View style={styles.ctaRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.cancelBtn,
                  pressed && styles.btnPressed,
                ]}
                onPress={onClose}
              >
                <Text style={styles.cancelText}>Annuler</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.saveBtn,
                  !valid && styles.saveBtnDisabled,
                  pressed && valid && styles.btnPressed,
                ]}
                onPress={handleSave}
                disabled={!valid}
              >
                <Text
                  style={[
                    styles.saveText,
                    !valid && styles.saveTextDisabled,
                  ]}
                >
                  Enregistrer
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    maxHeight: "92%",
    backgroundColor: redesignTheme.screen.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: redesignTheme.screen.horizontalPadding,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontFamily: welcomeFontFamily.bold,
    ...redesignTheme.type.h2,
    color: redesignTheme.text.primary,
  },
  close: {
    fontFamily: welcomeFontFamily.medium,
    fontSize: 14,
    fontWeight: "500",
    color: redesignTheme.accent.blue,
  },
  scroll: {
    paddingBottom: 32,
  },
  intro: {
    fontFamily: welcomeFontFamily.regular,
    ...redesignTheme.type.bodyS,
    color: redesignTheme.text.dim,
    paddingHorizontal: redesignTheme.screen.horizontalPadding,
    paddingBottom: 12,
  },
  sectionKicker: {
    paddingHorizontal: redesignTheme.screen.horizontalPadding,
    marginTop: 8,
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: redesignTheme.screen.horizontalPadding,
    marginBottom: 12,
  },
  presetChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: redesignTheme.card.radiusMd,
    backgroundColor: redesignTheme.card.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: redesignTheme.card.hairline,
  },
  presetChipSelected: {
    backgroundColor: redesignTheme.accent.blueDim,
    borderColor: redesignTheme.accent.blue,
  },
  presetText: {
    fontFamily: welcomeFontFamily.semibold,
    fontSize: 14,
    fontWeight: "600",
    color: redesignTheme.text.dim,
  },
  presetTextSelected: {
    color: redesignTheme.accent.blue,
  },
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: redesignTheme.screen.horizontalPadding,
    marginBottom: 12,
    padding: 10,
    borderRadius: redesignTheme.card.radiusMd,
    backgroundColor: redesignTheme.card.background,
  },
  customInput: {
    flex: 1,
    fontFamily: welcomeFontFamily.bold,
    fontSize: 18,
    color: redesignTheme.text.primary,
  },
  unitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  unitBtnOn: {
    backgroundColor: redesignTheme.accent.blueDim,
  },
  unitText: {
    color: redesignTheme.text.primary,
    fontWeight: "600",
  },
  previewWrap: {
    paddingHorizontal: redesignTheme.screen.horizontalPadding,
    marginTop: 16,
  },
  ctaRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: redesignTheme.screen.horizontalPadding,
    paddingTop: 20,
  },
  cancelBtn: {
    flex: 1,
    height: redesignTheme.cta.height,
    borderRadius: redesignTheme.cta.radius,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    flex: 1,
    height: redesignTheme.cta.height,
    borderRadius: redesignTheme.cta.radius,
    backgroundColor: redesignTheme.accent.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnDisabled: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  cancelText: {
    fontFamily: welcomeFontFamily.semibold,
    fontSize: 15,
    fontWeight: "600",
    color: redesignTheme.text.primary,
  },
  saveText: {
    fontFamily: welcomeFontFamily.semibold,
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  saveTextDisabled: {
    color: redesignTheme.text.faint,
  },
  btnPressed: {
    opacity: 0.85,
  },
});
