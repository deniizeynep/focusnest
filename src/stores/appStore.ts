import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ThemeMode } from "../theme";

export type Language = "tr" | "en";

interface AppState {
  themeMode: ThemeMode;
  language: Language;

  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;

  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      themeMode: "dark",
      language: "tr",

      setTheme: (themeMode) => set({ themeMode }),

      toggleTheme: () =>
        set((state) => ({
          themeMode: state.themeMode === "dark" ? "light" : "dark",
        })),

      setLanguage: (language) => set({ language }),

      toggleLanguage: () =>
        set((state) => ({
          language: state.language === "tr" ? "en" : "tr",
        })),
    }),
    {
      name: "focusnest-app-settings",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        themeMode: state.themeMode,
        language: state.language,
      }),
    },
  ),
);
