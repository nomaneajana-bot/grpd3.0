import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const ANDROID_CHANNEL_ID = "default";

// Check if running in Expo Go (push notifications not supported)
function isExpoGo(): boolean {
  return Constants.executionEnvironment === "storeClient";
}

function getProjectId(): string | undefined {
  return (
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.expoConfig?.extra?.projectId
  );
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;

  try {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2081FF",
    });
  } catch (error) {
    // Silently fail in Expo Go
    console.warn(
      "Notification channel setup failed (expected in Expo Go):",
      error,
    );
  }
}

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  // Push notifications don't work in Expo Go - return null gracefully
  if (isExpoGo()) {
    console.log(
      "Push notifications not available in Expo Go. Use a development build for full functionality.",
    );
    return null;
  }

  if (Platform.OS === "web") return null;
  if (!Device.isDevice) return null;

  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    const projectId = getProjectId();
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );

    await ensureAndroidChannel();

    return tokenResponse.data ?? null;
  } catch (error) {
    // Gracefully handle errors (e.g., in Expo Go or when permissions denied)
    console.warn("Push notification registration failed:", error);
    return null;
  }
}
