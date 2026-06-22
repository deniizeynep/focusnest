"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTimerStore = exports.SESSION_CONFIGS = void 0;
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const zustand_1 = require("zustand");
const sessionApi = __importStar(require("../api/sessions"));
const translations_1 = require("../i18n/translations");
const sessionFeedback_1 = require("../utils/sessionFeedback");
const appStore_1 = require("./appStore");
const taskStore_1 = require("./taskStore");
const COLORS = {
    accent: "#E8593C",
    success: "#3DBE7A",
    info: "#5B8AF0",
};
exports.SESSION_CONFIGS = {
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
const t = (key) => {
    const language = appStore_1.useAppStore.getState().language;
    return (0, translations_1.translate)(language, key);
};
const getTranslatedSessionConfig = (type) => {
    const config = exports.SESSION_CONFIGS[type];
    return {
        ...config,
        label: t(config.labelKey),
    };
};
async function saveTimerSettings(options) {
    await async_storage_1.default.setItem(TIMER_SETTINGS_KEY, JSON.stringify({
        workMin: exports.SESSION_CONFIGS.work.duration / 60,
        shortMin: exports.SESSION_CONFIGS.short_break.duration / 60,
        longMin: exports.SESSION_CONFIGS.long_break.duration / 60,
        longBreakInterval: options.longBreakInterval,
        autoStartBreaks: options.autoStartBreaks,
        autoStartPomodoros: options.autoStartPomodoros,
    }));
}
// ─── Store ───────────────────────────────────────────────────────────────────
let _intervalId = null;
exports.useTimerStore = (0, zustand_1.create)((set, get) => ({
    sessionType: "work",
    timeLeft: exports.SESSION_CONFIGS.work.duration,
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
        const total = exports.SESSION_CONFIGS[sessionType].duration;
        return 1 - timeLeft / total;
    },
    get config() {
        return getTranslatedSessionConfig(get().sessionType);
    },
    start: () => {
        if (get().isRunning)
            return;
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
            timeLeft: exports.SESSION_CONFIGS[sessionType].duration,
            sessionStartedAt: null,
        });
    },
    tick: () => {
        const { timeLeft } = get();
        if (timeLeft <= 1) {
            get().completeSession();
        }
        else {
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
        }
        catch (error) {
            console.log("Today summary could not be loaded:", error.message);
        }
    },
    loadTimerSettings: async () => {
        try {
            const raw = await async_storage_1.default.getItem(TIMER_SETTINGS_KEY);
            if (!raw)
                return;
            const settings = JSON.parse(raw);
            const workMin = Number(settings.workMin) || 25;
            const shortMin = Number(settings.shortMin) || 5;
            const longMin = Number(settings.longMin) || 15;
            exports.SESSION_CONFIGS.work.duration = workMin * 60;
            exports.SESSION_CONFIGS.short_break.duration = shortMin * 60;
            exports.SESSION_CONFIGS.long_break.duration = longMin * 60;
            const { sessionType, isRunning } = get();
            set({
                longBreakInterval: Number(settings.longBreakInterval) || 4,
                autoStartBreaks: Boolean(settings.autoStartBreaks),
                autoStartPomodoros: Boolean(settings.autoStartPomodoros),
                timeLeft: !isRunning
                    ? exports.SESSION_CONFIGS[sessionType].duration
                    : get().timeLeft,
            });
        }
        catch (error) {
            console.log("Timer settings could not be loaded:", error.message);
        }
    },
    completeSession: () => {
        if (_intervalId) {
            clearInterval(_intervalId);
            _intervalId = null;
        }
        const { sessionType, workSessionCount, completedToday, totalMinutesToday, sessionStartedAt, longBreakInterval, autoStartBreaks, autoStartPomodoros, } = get();
        const durationMin = Math.round(exports.SESSION_CONFIGS[sessionType].duration / 60);
        const completedAt = new Date().toISOString();
        const activeTask = taskStore_1.useTaskStore.getState().activeTask;
        const { language } = appStore_1.useAppStore.getState();
        (0, sessionFeedback_1.notifySessionFinished)(sessionType, language).catch((error) => {
            console.log("Notification could not be sent:", error.message);
        });
        sessionApi
            .createSession({
            taskId: sessionType === "work" ? (activeTask?.id ?? null) : null,
            type: sessionType,
            durationMin,
            startedAt: sessionStartedAt ??
                new Date(Date.now() - durationMin * 60 * 1000).toISOString(),
            completedAt,
            wasInterrupted: false,
        })
            .catch((error) => {
            console.log("Session could not be saved:", error.message);
        });
        if (sessionType === "work" && activeTask) {
            taskStore_1.useTaskStore.getState().incrementTaskPomodoro(activeTask.id);
        }
        if (sessionType === "work") {
            const newWorkCount = workSessionCount + 1;
            const nextSession = newWorkCount % longBreakInterval === 0 ? "long_break" : "short_break";
            set({
                isRunning: autoStartBreaks,
                completedToday: completedToday + 1,
                totalMinutesToday: totalMinutesToday + durationMin,
                workSessionCount: newWorkCount,
                sessionType: nextSession,
                timeLeft: exports.SESSION_CONFIGS[nextSession].duration,
                sessionStartedAt: autoStartBreaks ? new Date().toISOString() : null,
            });
            if (autoStartBreaks) {
                _intervalId = setInterval(() => {
                    get().tick();
                }, 1000);
            }
        }
        else {
            set({
                isRunning: autoStartPomodoros,
                sessionType: "work",
                timeLeft: exports.SESSION_CONFIGS.work.duration,
                sessionStartedAt: autoStartPomodoros ? new Date().toISOString() : null,
            });
            if (autoStartPomodoros) {
                _intervalId = setInterval(() => {
                    get().tick();
                }, 1000);
            }
        }
    },
    switchSession: (type) => {
        if (_intervalId) {
            clearInterval(_intervalId);
            _intervalId = null;
        }
        set({
            sessionType: type,
            timeLeft: exports.SESSION_CONFIGS[type].duration,
            isRunning: false,
        });
    },
    setWorkDuration: (minutes) => {
        exports.SESSION_CONFIGS.work.duration = minutes * 60;
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
    setShortBreakDuration: (minutes) => {
        exports.SESSION_CONFIGS.short_break.duration = minutes * 60;
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
    setLongBreakDuration: (minutes) => {
        exports.SESSION_CONFIGS.long_break.duration = minutes * 60;
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
    setLongBreakInterval: (count) => {
        set({ longBreakInterval: count });
        const state = get();
        saveTimerSettings({
            longBreakInterval: count,
            autoStartBreaks: state.autoStartBreaks,
            autoStartPomodoros: state.autoStartPomodoros,
        });
    },
    setAutoStartBreaks: (value) => {
        set({ autoStartBreaks: value });
        const state = get();
        saveTimerSettings({
            longBreakInterval: state.longBreakInterval,
            autoStartBreaks: value,
            autoStartPomodoros: state.autoStartPomodoros,
        });
    },
    setAutoStartPomodoros: (value) => {
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
            timeLeft: exports.SESSION_CONFIGS.work.duration,
            isRunning: false,
            completedToday: 0,
            totalMinutesToday: 0,
            streak: 0,
            workSessionCount: 0,
            sessionStartedAt: null,
        });
    },
}));
