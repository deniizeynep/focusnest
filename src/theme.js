"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Shadow = exports.Radius = exports.Spacing = exports.Typography = exports.Colors = exports.LightColors = exports.DarkColors = void 0;
exports.getColors = getColors;
exports.getShadow = getShadow;
exports.DarkColors = {
    bg: "#0B0B10",
    bgSoft: "#11111A",
    bgCard: "#171721",
    bgCardElevated: "#20202C",
    bgMuted: "#2A2A38",
    textPrimary: "#F8F5EF",
    textSecondary: "#B9B5C8",
    textMuted: "#77748A",
    accent: "#FF6B4A",
    accentStrong: "#FF7E5F",
    accentDim: "rgba(255, 107, 74, 0.14)",
    success: "#3DCC7A",
    successDim: "rgba(61, 204, 122, 0.13)",
    warning: "#F5A623",
    warningDim: "rgba(245, 166, 35, 0.13)",
    info: "#6D8DFF",
    infoDim: "rgba(109, 141, 255, 0.13)",
    danger: "#FF4D5E",
    dangerDim: "rgba(255, 77, 94, 0.13)",
    border: "rgba(255,255,255,0.08)",
    borderStrong: "rgba(255,255,255,0.16)",
    overlay: "rgba(0,0,0,0.55)",
    statusBar: "light-content",
};
exports.LightColors = {
    bg: "#F7F3EC",
    bgSoft: "#FFF9F1",
    bgCard: "#FFFFFF",
    bgCardElevated: "#F2EEE7",
    bgMuted: "#E6DED3",
    textPrimary: "#1D1824",
    textSecondary: "#665F73",
    textMuted: "#9A92A5",
    accent: "#E8593C",
    accentStrong: "#C8462E",
    accentDim: "rgba(232, 89, 60, 0.11)",
    success: "#2FA866",
    successDim: "rgba(47, 168, 102, 0.12)",
    warning: "#C97D12",
    warningDim: "rgba(201, 125, 18, 0.12)",
    info: "#3D6FE8",
    infoDim: "rgba(61, 111, 232, 0.12)",
    danger: "#DC3545",
    dangerDim: "rgba(220, 53, 69, 0.12)",
    border: "rgba(29,24,36,0.09)",
    borderStrong: "rgba(29,24,36,0.17)",
    overlay: "rgba(29,24,36,0.28)",
    statusBar: "dark-content",
};
function getColors(mode) {
    return mode === "dark" ? exports.DarkColors : exports.LightColors;
}
exports.Colors = exports.DarkColors;
exports.Typography = {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    "2xl": 32,
    "3xl": 44,
    timerDisplay: 72,
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extraBold: "800",
    mono: "Courier New",
};
exports.Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    "2xl": 32,
    "3xl": 48,
    "4xl": 64,
};
exports.Radius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 22,
    "2xl": 28,
    full: 9999,
};
function getShadow(mode) {
    const isDark = mode === "dark";
    return {
        card: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: isDark ? 10 : 8 },
            shadowOpacity: isDark ? 0.28 : 0.08,
            shadowRadius: isDark ? 22 : 18,
            elevation: isDark ? 8 : 4,
        },
        subtle: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.18 : 0.06,
            shadowRadius: 12,
            elevation: isDark ? 4 : 2,
        },
        accent: {
            shadowColor: "#E8593C",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.32 : 0.22,
            shadowRadius: 18,
            elevation: 8,
        },
    };
}
exports.Shadow = getShadow("dark");
