import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATION_SETTINGS_KEY = "notification_settings";

export interface NotificationSettings {
  notifications: boolean;
  sound: boolean;
  vibration: boolean;
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);

    if (!raw) {
      return {
        notifications: true,
        sound: true,
        vibration: true,
      };
    }

    const settings = JSON.parse(raw);

    return {
      notifications: Boolean(settings.notifications),
      sound: Boolean(settings.sound),
      vibration: Boolean(settings.vibration),
    };
  } catch {
    return {
      notifications: true,
      sound: true,
      vibration: true,
    };
  }
}
