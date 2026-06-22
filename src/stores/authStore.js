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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuthStore = void 0;
const zustand_1 = require("zustand");
const authApi = __importStar(require("../api/auth"));
const translations_1 = require("../i18n/translations");
const googleSignIn_1 = require("../lib/googleSignIn");
const appStore_1 = require("./appStore");
const taskStore_1 = require("./taskStore");
const timerStore_1 = require("./timerStore");
const t = (key) => {
    const language = appStore_1.useAppStore.getState().language;
    return (0, translations_1.translate)(language, key);
};
exports.useAuthStore = (0, zustand_1.create)((set, get) => ({
    user: null,
    isLoading: false,
    error: null,
    signIn: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const user = await authApi.signIn(email, password);
            taskStore_1.useTaskStore.getState().clearTasks();
            timerStore_1.useTimerStore.getState().clearTimerData();
            set({
                user,
                isLoading: false,
            });
        }
        catch (e) {
            console.log("signIn error:", e.message);
            set({
                error: t("invalidCredentials"),
                isLoading: false,
            });
        }
    },
    signUp: async (email, password, displayName) => {
        set({ isLoading: true, error: null });
        try {
            const user = await authApi.signUp(email, password, displayName);
            taskStore_1.useTaskStore.getState().clearTasks();
            timerStore_1.useTimerStore.getState().clearTimerData();
            set({
                user,
                isLoading: false,
            });
        }
        catch (e) {
            console.log("signUp error:", e.message);
            set({
                error: t("signupFailed"),
                isLoading: false,
            });
        }
    },
    signOut: async () => {
        set({ isLoading: true, error: null });
        try {
            await authApi.signOut();
            await (0, googleSignIn_1.signOutFromGoogle)();
            taskStore_1.useTaskStore.getState().clearTasks();
            timerStore_1.useTimerStore.getState().clearTimerData();
            set({
                user: null,
                isLoading: false,
                error: null,
            });
        }
        catch (e) {
            console.log("signOut error:", e.message);
            set({
                isLoading: false,
                error: t("signOutFailed"),
            });
        }
    },
    loadSession: async () => {
        set({ isLoading: true });
        try {
            const user = await authApi.getSession();
            set({ user, isLoading: false });
        }
        catch {
            set({ user: null, isLoading: false });
        }
    },
    clearError: () => set({ error: null }),
    updateProfile: async (updates) => {
        const { user } = get();
        if (!user)
            return;
        set({ isLoading: true });
        try {
            const updated = await authApi.updateProfile(user.id, updates);
            set({ user: { ...user, ...updated }, isLoading: false });
        }
        catch (e) {
            console.log("updateProfile error:", e.message);
            set({
                error: t("profileUpdateFailed"),
                isLoading: false,
            });
        }
    },
    deleteAccount: async () => {
        set({ isLoading: true, error: null });
        try {
            await authApi.deleteAccount();
            taskStore_1.useTaskStore.getState().clearTasks();
            timerStore_1.useTimerStore.getState().clearTimerData();
            set({
                user: null,
                isLoading: false,
                error: null,
            });
        }
        catch (e) {
            console.log("deleteAccount error:", e.message);
            set({
                isLoading: false,
                error: t("deleteAccountError"),
            });
            throw e;
        }
    },
    signInWithGoogle: async () => {
        set({ isLoading: true, error: null });
        try {
            console.log("GOOGLE LOGIN START");
            const idToken = await (0, googleSignIn_1.getGoogleIdToken)();
            console.log("ID TOKEN EXISTS:", Boolean(idToken));
            if (!idToken) {
                set({ isLoading: false });
                return;
            }
            const user = await authApi.signInWithGoogle(idToken);
            console.log("GOOGLE BACKEND USER:", user);
            taskStore_1.useTaskStore.getState().clearTasks();
            timerStore_1.useTimerStore.getState().clearTimerData();
            set({
                user,
                isLoading: false,
            });
            console.log("GOOGLE USER SETTED");
        }
        catch (e) {
            console.log("googleLogin error:", e.message);
            const message = t("googleLoginError");
            set({
                error: message,
                isLoading: false,
            });
            throw new Error(message);
        }
    },
}));
