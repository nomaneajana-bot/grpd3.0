import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { borderRadius, colors, hairline, typography } from "@/constants/ui";
import { createApiClient, joinClubByCode } from "@/lib/api";
import type { ClubMembership } from "@/types/api";

type ClubCodeFormProps = {
  initialCode?: string;
  onJoined?: (membership: ClubMembership) => void;
  onError?: (message: string) => void;
};

export function ClubCodeForm({
  initialCode = "",
  onJoined,
  onError,
}: ClubCodeFormProps) {
  const [code, setCode] = useState(initialCode);
  const [found, setFound] = useState<ClubMembership | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      onError?.("Entre un code d'invitation.");
      return;
    }
    setIsLoading(true);
    setFound(null);
    try {
      const client = createApiClient();
      const result = await joinClubByCode(client, { code: trimmed });
      setFound(result.membership);
      onJoined?.(result.membership);
    } catch {
      onError?.("Code invalide ou club introuvable.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View>
      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        placeholder="Code club"
        placeholderTextColor={colors.text.tertiary}
        autoCapitalize="characters"
        editable={!isLoading}
      />
      {found ? (
        <View style={styles.successCard}>
          <Text style={styles.successTitle}>Club trouvé</Text>
          <Text style={styles.successSub}>
            {found.club?.name ?? "Bienvenue dans ton club"}
          </Text>
        </View>
      ) : null}
      {/* Parent screen triggers join via primary CTA; expose join for imperative use */}
      <Text style={styles.hint} onPress={() => void handleJoin()}>
        {isLoading ? "Vérification…" : ""}
      </Text>
    </View>
  );
}

export async function joinClubWithCode(
  code: string,
): Promise<ClubMembership> {
  const client = createApiClient();
  const result = await joinClubByCode(client, { code: code.trim() });
  return result.membership;
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface.s2,
    borderRadius: borderRadius.lg,
    borderWidth: hairline,
    borderColor: colors.border.default,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontVariant: ["tabular-nums"],
  },
  successCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.tag.greenBg,
    borderWidth: hairline,
    borderColor: colors.tag.greenText,
  },
  successTitle: {
    color: colors.text.success,
    fontWeight: "700",
    fontSize: typography.sizes.md,
  },
  successSub: {
    color: colors.text.secondary,
    marginTop: 4,
    fontSize: typography.sizes.sm,
  },
  hint: {
    height: 0,
    overflow: "hidden",
  },
});
