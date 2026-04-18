import { DEVICE_ID } from "./api";

let Notifications: any = null;

try {
  Notifications = require("expo-notifications");
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {
  console.log("expo-notifications no disponible");
}

export async function registerForPushNotifications(backendUrl: string): Promise<string | null> {
  if (!Notifications) return null;

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return null;

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "lumi-family",
    });
    const token = tokenData.data;
    console.log("Push token:", token);

    await fetch(`${backendUrl}/api/push-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: DEVICE_ID, push_token: token }),
    }).catch(() => {});

    return token;
  } catch (e) {
    console.log("Push no disponible:", e);
    return null;
  }
}
