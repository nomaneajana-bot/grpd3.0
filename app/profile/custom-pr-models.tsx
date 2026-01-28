import * as Haptics from "expo-haptics";
import { router, Stack, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
    deleteCustomPrModel,
    getCustomPrModels,
    type CustomPrModel,
} from "../../lib/profileStore";

export default function CustomPrModelsScreen() {
  const [customModels, setCustomModels] = useState<CustomPrModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadModels = async () => {
    setIsLoading(true);
    try {
      const models = await getCustomPrModels();
      // Sort by updatedAt descending (most recently used first)
      const sorted = [...models].sort(
        (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0),
      );
      setCustomModels(sorted);
    } catch (error) {
      console.warn("Failed to load custom models:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadModels();
    }, []),
  );

  const handleDelete = async (modelId: string) => {
    try {
      await deleteCustomPrModel(modelId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadModels();
      setDeletingId(null);
    } catch (error) {
      console.warn("Failed to delete custom model:", error);
    }
  };

  const renderModelRow = ({ item: model }: { item: CustomPrModel }) => {
    return (
      <View style={styles.modelRow}>
        <Text style={styles.modelLabel}>{model.label}</Text>
        <Pressable
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.deleteButtonPressed,
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setDeletingId(model.id);
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.deleteIcon}>🗑</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backRow}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backLabel}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Tes modèles de PR</Text>
      </View>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Supprimer le modèle</Text>
            <Text style={styles.modalMessage}>
              Es-tu sûr de vouloir supprimer ce modèle ? Cette action est
              irréversible.
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => {
                  setDeletingId(null);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirmButton}
                onPress={() => handleDelete(deletingId)}
              >
                <Text style={styles.modalConfirmText}>Supprimer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : customModels.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Tu n'as pas encore de modèles personnalisés.{"\n"}
            Ils apparaîtront ici après que tu aies enregistré un PR avec un
            label qui n'est pas dans les modèles classiques.
          </Text>
        </View>
      ) : (
        <FlatList
          data={customModels}
          renderItem={renderModelRow}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          style={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#0B0B0B",
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 24,
  },
  backIcon: {
    color: "#2081FF",
    fontSize: 18,
    marginRight: 4,
  },
  backLabel: {
    color: "#2081FF",
    fontSize: 16,
    fontWeight: "500",
  },
  screenTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "700",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  modelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#131313",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  modelLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonPressed: {
    opacity: 0.7,
  },
  deleteIcon: {
    fontSize: 18,
  },
  separator: {
    height: 12,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    color: "#BFBFBF",
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    color: "#8A8A8A",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#131313",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  modalMessage: {
    color: "#BFBFBF",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  modalCancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  modalCancelText: {
    color: "#BFBFBF",
    fontSize: 15,
    fontWeight: "600",
  },
  modalConfirmButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#FF3B30",
  },
  modalConfirmText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
