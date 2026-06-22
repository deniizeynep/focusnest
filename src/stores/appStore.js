"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAppStore = void 0;
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const zustand_1 = require("zustand");
const middleware_1 = require("zustand/middleware");
exports.useAppStore = (0, zustand_1.create)()((0, middleware_1.persist)((set) => ({
    themeMode: "dark",
    language: "tr",
    setTheme: (themeMode) => set({ themeMode }),
    toggleTheme: () => set((state) => ({
        themeMode: state.themeMode === "dark" ? "light" : "dark",
    })),
    setLanguage: (language) => set({ language }),
    toggleLanguage: () => set((state) => ({
        language: state.language === "tr" ? "en" : "tr",
    })),
}), {
    name: "focusnest-app-settings",
    storage: (0, middleware_1.createJSONStorage)(() => async_storage_1.default),
    partialize: (state) => ({
        themeMode: state.themeMode,
        language: state.language,
    }),
}));
