/**
 * src/hooks/useTimer.ts
 * Zamanlayıcı ile ilgili yardımcı hook.
 * Ekrandan bağımsız hesaplamalar, formatlamalar ve yan etkiler burada.
 */

import { useCallback, useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useTaskStore } from "../stores/taskStore";
import { useTimerStore } from "../stores/timerStore";

export function useTimer() {
  const store = useTimerStore();
  const { activeTask, incrementTaskPomodoro } = useTaskStore();

  // ── AppState izleme: arka plana geçince duraklat (isteğe bağlı) ──
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        // Gerçek projede expo-background-task ile arka planda devam eder
        // Şimdilik arka plana geçince sadece log'la
        if (nextState === "background") {
          console.log("[useTimer] Uygulama arka plana geçti.");
        }
      },
    );
    return () => subscription.remove();
  }, []);

  // ── Seans tamamlandığında görev pomodoro sayısını artır ──
  useEffect(() => {
    if (
      !store.isRunning &&
      store.timeLeft === 0 &&
      store.sessionType === "work"
    ) {
      if (activeTask) {
        incrementTaskPomodoro(activeTask.id);
      }
    }
  }, [store.isRunning, store.timeLeft]);

  // ── Yüzde ilerleme (0-100) ──
  const progressPercent = Math.round(store.progress * 100);

  // ── Kalan süre formatı ──
  const formattedTime = useCallback(() => {
    const m = Math.floor(store.timeLeft / 60)
      .toString()
      .padStart(2, "0");
    const s = (store.timeLeft % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [store.timeLeft]);

  // ── Döngüde kaçıncı pomodoroda olduğunu hesapla ──
  const pomodoroInCycle = store.workSessionCount % 4 || 4;

  return {
    ...store,
    progressPercent,
    formattedTime,
    pomodoroInCycle,
    activeTask,
  };
}
