import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import * as sessionApi from "../api/sessions";
import { translate, type TranslationKey } from "../i18n/translations";
import { notifySessionFinished } from "../utils/sessionFeedback";
import { useAppStore } from "./appStore";
import { useTaskStore } from "./taskStore";

export type SessionType = "work" | "short_break" | "long_break";

export interface SessionConfig {
  labelKey: TranslationKey;
  duration: number;
  color: string;
}

export interface TranslatedSessionConfig extends SessionConfig {
  label: string;
}

const COLORS = {
  accent: "#E8593C",
  success: "#3DBE7A",
  info: "#5B8AF0",
};

export const SESSION_CONFIGS: Record<SessionType, SessionConfig> = {
  work: {
    labelKey: "work",
    duration: 25 * 60,
    color: COLORS.accent,
  },
  short_break: {
    labelKey: "short_break",
    duration: 5 * 60,
    color: COLORS.success,
  },
  long_break: {
    labelKey: "long_break",
    duration: 15 * 60,
    color: COLORS.info,
  },
};

const LONG_BREAK_INTERVAL = 4;

const TIMER_SETTINGS_KEY = "timer_settings";

const t = (key: TranslationKey) => {
  const language = useAppStore.getState().language;
  return translate(language, key);
};

const getTranslatedSessionConfig = (
  type: SessionType,
): TranslatedSessionConfig => {
  const config = SESSION_CONFIGS[type];

  return {
    ...config,
    label: t(config.labelKey),
  };
};

async function saveTimerSettings(options: {
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
}) {
  await AsyncStorage.setItem(
    TIMER_SETTINGS_KEY,
    JSON.stringify({
      workMin: SESSION_CONFIGS.work.duration / 60,
      shortMin: SESSION_CONFIGS.short_break.duration / 60,
      longMin: SESSION_CONFIGS.long_break.duration / 60,
      longBreakInterval: options.longBreakInterval,
      autoStartBreaks: options.autoStartBreaks,
      autoStartPomodoros: options.autoStartPomodoros,
    }),
  );
}

interface TimerState {
  sessionType: SessionType;
  timeLeft: number;
  isRunning: boolean;
  completedToday: number;
  totalMinutesToday: number;
  streak: number;
  workSessionCount: number;
  sessionStartedAt: string | null;
  progress: number;
  config: TranslatedSessionConfig;

  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;

  loadTodaySummary: () => Promise<void>;
  loadTimerSettings: () => Promise<void>;

  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
  switchSession: (type: SessionType) => void;
  completeSession: () => void;
  clearTimerData: () => void;

  setWorkDuration: (minutes: number) => void;
  setShortBreakDuration: (minutes: number) => void;
  setLongBreakDuration: (minutes: number) => void;

  setLongBreakInterval: (count: number) => void;
  setAutoStartBreaks: (value: boolean) => void;
  setAutoStartPomodoros: (value: boolean) => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

let _intervalId: ReturnType<typeof setInterval> | null = null;

export const useTimerStore = create<TimerState>((set, get) => ({
  sessionType: "work",
  timeLeft: SESSION_CONFIGS.work.duration,
  isRunning: false,
  completedToday: 0,
  totalMinutesToday: 0,
  streak: 0,
  workSessionCount: 0,
  sessionStartedAt: null,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,

  get progress() {
    const { timeLeft, sessionType } = get();
    const total = SESSION_CONFIGS[sessionType].duration;
    return 1 - timeLeft / total;
  },

  get config() {
    return getTranslatedSessionConfig(get().sessionType);
  },

  start: () => {
    if (get().isRunning) return;

    set((state) => ({
      isRunning: true,
      sessionStartedAt: state.sessionStartedAt ?? new Date().toISOString(),
    }));

    _intervalId = setInterval(() => {
      get().tick();
    }, 1000);
  },

  pause: () => {
    if (_intervalId) {
      clearInterval(_intervalId);
      _intervalId = null;
    }
    set({ isRunning: false });
  },

  reset: () => {
    if (_intervalId) {
      clearInterval(_intervalId);
      _intervalId = null;
    }

    const { sessionType } = get();

    set({
      isRunning: false,
      timeLeft: SESSION_CONFIGS[sessionType].duration,
      sessionStartedAt: null,
    });
  },
  tick: () => {
    const { timeLeft } = get();
    if (timeLeft <= 1) {
      get().completeSession();
    } else {
      set({ timeLeft: timeLeft - 1 });
    }
  },

  loadTodaySummary: async () => {
    try {
      const summary = await sessionApi.fetchTodaySummary();

      set({
        completedToday: summary.count,
        totalMinutesToday: summary.totalMinutes,
        streak: summary.streak,
        workSessionCount: summary.count,
      });
    } catch (error: any) {
      console.log("Today summary could not be loaded:", error.message);
    }
  },

  loadTimerSettings: async () => {
    try {
      const raw = await AsyncStorage.getItem(TIMER_SETTINGS_KEY);

      if (!raw) return;

      const settings = JSON.parse(raw);

      const workMin = Number(settings.workMin) || 25;
      const shortMin = Number(settings.shortMin) || 5;
      const longMin = Number(settings.longMin) || 15;

      SESSION_CONFIGS.work.duration = workMin * 60;
      SESSION_CONFIGS.short_break.duration = shortMin * 60;
      SESSION_CONFIGS.long_break.duration = longMin * 60;

      const { sessionType, isRunning } = get();

      set({
        longBreakInterval: Number(settings.longBreakInterval) || 4,
        autoStartBreaks: Boolean(settings.autoStartBreaks),
        autoStartPomodoros: Boolean(settings.autoStartPomodoros),
        timeLeft: !isRunning
          ? SESSION_CONFIGS[sessionType].duration
          : get().timeLeft,
      });
    } catch (error: any) {
      console.log("Timer settings could not be loaded:", error.message);
    }
  },

  completeSession: () => {
    if (_intervalId) {
      clearInterval(_intervalId);
      _intervalId = null;
    }

    const {
      sessionType,
      workSessionCount,
      completedToday,
      totalMinutesToday,
      sessionStartedAt,
      longBreakInterval,
      autoStartBreaks,
      autoStartPomodoros,
    } = get();

    const durationMin = Math.round(SESSION_CONFIGS[sessionType].duration / 60);
    const completedAt = new Date().toISOString();

    const activeTask = useTaskStore.getState().activeTask;

    const { language } = useAppStore.getState();

    notifySessionFinished(sessionType, language).catch((error) => {
      console.log("Notification could not be sent:", error.message);
    });

    sessionApi
      .createSession({
        taskId: sessionType === "work" ? (activeTask?.id ?? null) : null,
        type: sessionType,
        durationMin,
        startedAt:
          sessionStartedAt ??
          new Date(Date.now() - durationMin * 60 * 1000).toISOString(),
        completedAt,
        wasInterrupted: false,
      })
      .catch((error) => {
        console.log("Session could not be saved:", error.message);
      });

    if (sessionType === "work" && activeTask) {
      useTaskStore.getState().incrementTaskPomodoro(activeTask.id);
    }

    if (sessionType === "work") {
      const newWorkCount = workSessionCount + 1;

      const nextSession: SessionType =
        newWorkCount % longBreakInterval === 0 ? "long_break" : "short_break";

      set({
        isRunning: autoStartBreaks,
        completedToday: completedToday + 1,
        totalMinutesToday: totalMinutesToday + durationMin,
        workSessionCount: newWorkCount,
        sessionType: nextSession,
        timeLeft: SESSION_CONFIGS[nextSession].duration,
        sessionStartedAt: autoStartBreaks ? new Date().toISOString() : null,
      });

      if (autoStartBreaks) {
        _intervalId = setInterval(() => {
          get().tick();
        }, 1000);
      }
    } else {
      set({
        isRunning: autoStartPomodoros,
        sessionType: "work",
        timeLeft: SESSION_CONFIGS.work.duration,
        sessionStartedAt: autoStartPomodoros ? new Date().toISOString() : null,
      });

      if (autoStartPomodoros) {
        _intervalId = setInterval(() => {
          get().tick();
        }, 1000);
      }
    }
  },

  switchSession: (type: SessionType) => {
    if (_intervalId) {
      clearInterval(_intervalId);
      _intervalId = null;
    }
    set({
      sessionType: type,
      timeLeft: SESSION_CONFIGS[type].duration,
      isRunning: false,
    });
  },

  setWorkDuration: (minutes: number) => {
    SESSION_CONFIGS.work.duration = minutes * 60;

    const { sessionType } = get();

    if (sessionType === "work") {
      set({ timeLeft: minutes * 60, isRunning: false });
    }

    const state = get();

    saveTimerSettings({
      longBreakInterval: state.longBreakInterval,
      autoStartBreaks: state.autoStartBreaks,
      autoStartPomodoros: state.autoStartPomodoros,
    });
  },

  setShortBreakDuration: (minutes: number) => {
    SESSION_CONFIGS.short_break.duration = minutes * 60;

    const { sessionType } = get();

    if (sessionType === "short_break") {
      set({ timeLeft: minutes * 60, isRunning: false });
    }

    const state = get();

    saveTimerSettings({
      longBreakInterval: state.longBreakInterval,
      autoStartBreaks: state.autoStartBreaks,
      autoStartPomodoros: state.autoStartPomodoros,
    });
  },

  setLongBreakDuration: (minutes: number) => {
    SESSION_CONFIGS.long_break.duration = minutes * 60;

    const { sessionType } = get();

    if (sessionType === "long_break") {
      set({ timeLeft: minutes * 60, isRunning: false });
    }

    const state = get();

    saveTimerSettings({
      longBreakInterval: state.longBreakInterval,
      autoStartBreaks: state.autoStartBreaks,
      autoStartPomodoros: state.autoStartPomodoros,
    });
  },
  setLongBreakInterval: (count: number) => {
    set({ longBreakInterval: count });

    const state = get();

    saveTimerSettings({
      longBreakInterval: count,
      autoStartBreaks: state.autoStartBreaks,
      autoStartPomodoros: state.autoStartPomodoros,
    });
  },

  setAutoStartBreaks: (value: boolean) => {
    set({ autoStartBreaks: value });

    const state = get();

    saveTimerSettings({
      longBreakInterval: state.longBreakInterval,
      autoStartBreaks: value,
      autoStartPomodoros: state.autoStartPomodoros,
    });
  },

  setAutoStartPomodoros: (value: boolean) => {
    set({ autoStartPomodoros: value });

    const state = get();

    saveTimerSettings({
      longBreakInterval: state.longBreakInterval,
      autoStartBreaks: state.autoStartBreaks,
      autoStartPomodoros: value,
    });
  },
  clearTimerData: () => {
    if (_intervalId) {
      clearInterval(_intervalId);
      _intervalId = null;
    }

    set({
      sessionType: "work",
      timeLeft: SESSION_CONFIGS.work.duration,
      isRunning: false,
      completedToday: 0,
      totalMinutesToday: 0,
      streak: 0,
      workSessionCount: 0,
      sessionStartedAt: null,
    });
  },
}));
