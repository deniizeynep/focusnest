import { useCallback, useEffect, useRef } from "react";
import { translate, type TranslationKey } from "../i18n/translations";
import { useAppStore } from "../stores/appStore";
import { useTaskStore } from "../stores/taskStore";
import type { SessionType } from "../stores/timerStore";
import { useTimerStore } from "../stores/timerStore";

const Haptics = {
  notificationAsync: async (type?: string) => {},
  impactAsync: async (style?: string) => {},
  NotificationFeedbackType: { Success: "success", Warning: "warning" },
  ImpactFeedbackStyle: { Medium: "medium", Light: "light" },
};

const Notifications = {
  scheduleNotificationAsync: async (opts: object) => {},
  cancelAllScheduledNotificationsAsync: async () => {},
  requestPermissionsAsync: async () => ({ status: "granted" }),
};

export function usePomodoro() {
  const timer = useTimerStore();
  const { activeTask } = useTaskStore();
  const { language } = useAppStore();

  const t = useCallback(
    (key: TranslationKey) => translate(language, key),
    [language],
  );

  const getSessionLabel = useCallback(
    (type: SessionType) => {
      return t(type);
    },
    [t],
  );

  const prevIsRunning = useRef(false);
  const prevTimeLeft = useRef(timer.timeLeft);
  const prevSessionType = useRef<SessionType>(timer.sessionType);

  const handleSessionComplete = useCallback(
    async (completedType: SessionType) => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const completedLabel = getSessionLabel(completedType);
      const nextSessionType = timer.sessionType;

      const nextLabel =
        nextSessionType === "work"
          ? t("focusStartTitle")
          : `${getSessionLabel(nextSessionType)} ${t("sessionStarting")}`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${completedLabel} ${t("sessionCompleted")}`,
          body: nextLabel,
          sound: true,
        },
        trigger: null,
      });
    },
    [timer.sessionType, getSessionLabel, t],
  );

  useEffect(() => {
    Notifications.requestPermissionsAsync().catch(() => {});
  }, []);

  useEffect(() => {
    const justFinished =
      prevIsRunning.current && !timer.isRunning && prevTimeLeft.current > 0;

    if (justFinished) {
      handleSessionComplete(prevSessionType.current);
    }

    prevIsRunning.current = timer.isRunning;
    prevTimeLeft.current = timer.timeLeft;
    prevSessionType.current = timer.sessionType;
  }, [
    timer.isRunning,
    timer.timeLeft,
    timer.sessionType,
    handleSessionComplete,
  ]);

  const start = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    timer.start();
  }, [timer.start]);

  const pause = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    timer.pause();
  }, [timer.pause]);

  const reset = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    timer.reset();
  }, [timer.reset]);

  return {
    ...timer,
    start,
    pause,
    reset,
    activeTask,
  };
}
