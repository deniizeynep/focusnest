import { create } from "zustand";
import * as authApi from "../api/auth";
import { translate, type TranslationKey } from "../i18n/translations";
import { getGoogleIdToken, signOutFromGoogle } from "../lib/googleSignIn";
import { useAppStore } from "./appStore";
import { useTaskStore } from "./taskStore";
import { useTimerStore } from "./timerStore";

const t = (key: TranslationKey) => {
  const language = useAppStore.getState().language;
  return translate(language, key);
};

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;

  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  loadSession: () => Promise<void>;
  clearError: () => void;
  updateProfile: (
    updates: Partial<Pick<User, "displayName" | "avatarUrl">>,
  ) => Promise<void>;
  deleteAccount: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authApi.signIn(email, password);

      useTaskStore.getState().clearTasks();
      useTimerStore.getState().clearTimerData();

      set({
        user,
        isLoading: false,
      });
    } catch (e: any) {
      console.log("signIn error:", e.message);

      set({
        error: t("invalidCredentials"),
        isLoading: false,
      });
    }
  },

  signUp: async (email: string, password: string, displayName: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authApi.signUp(email, password, displayName);

      useTaskStore.getState().clearTasks();
      useTimerStore.getState().clearTimerData();

      set({
        user,
        isLoading: false,
      });
    } catch (e: any) {
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
      await signOutFromGoogle();

      useTaskStore.getState().clearTasks();
      useTimerStore.getState().clearTimerData();

      set({
        user: null,
        isLoading: false,
        error: null,
      });
    } catch (e: any) {
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
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return;
    set({ isLoading: true });
    try {
      const updated = await authApi.updateProfile(user.id, updates);
      set({ user: { ...user, ...updated }, isLoading: false });
    } catch (e: any) {
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

      useTaskStore.getState().clearTasks();
      useTimerStore.getState().clearTimerData();

      set({
        user: null,
        isLoading: false,
        error: null,
      });
    } catch (e: any) {
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

      const idToken = await getGoogleIdToken();

      console.log("ID TOKEN EXISTS:", Boolean(idToken));

      if (!idToken) {
        set({ isLoading: false });
        return;
      }

      const user = await authApi.signInWithGoogle(idToken);

      console.log("GOOGLE BACKEND USER:", user);

      useTaskStore.getState().clearTasks();
      useTimerStore.getState().clearTimerData();

      set({
        user,
        isLoading: false,
      });

      console.log("GOOGLE USER SETTED");
    } catch (e: any) {
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
