import * as Haptics from "expo-haptics";
import { Alert } from "react-native";
import { translate, type TranslationKey } from "../i18n/translations";
import type { Language } from "../stores/appStore";
import type { SessionType } from "../stores/timerStore";
import { getNotificationSettings } from "./notificationSettings";

export async function notifySessionFinished(
  sessionType: SessionType,
  language: Language,
) {
  const settings = await getNotificationSettings();

  if (settings.vibration) {
    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success,
    ).catch(() => {});
  }

  if (!settings.notifications) {
    return;
  }

  const t = (key: TranslationKey) => translate(language, key);

  const isWork = sessionType === "work";

  const title = isWork ? t("pomodoroCompleteTitle") : t("breakCompleteTitle");

  const message = isWork
    ? t("pomodoroCompleteMessage")
    : t("breakCompleteMessage");

  Alert.alert(title, message);
}
