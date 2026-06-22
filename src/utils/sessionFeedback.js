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
exports.notifySessionFinished = notifySessionFinished;
const Haptics = __importStar(require("expo-haptics"));
const react_native_1 = require("react-native");
const translations_1 = require("../i18n/translations");
const notificationSettings_1 = require("./notificationSettings");
async function notifySessionFinished(sessionType, language) {
    const settings = await (0, notificationSettings_1.getNotificationSettings)();
    if (settings.vibration) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
    }
    if (!settings.notifications) {
        return;
    }
    const t = (key) => (0, translations_1.translate)(language, key);
    const isWork = sessionType === "work";
    const title = isWork ? t("pomodoroCompleteTitle") : t("breakCompleteTitle");
    const message = isWork
        ? t("pomodoroCompleteMessage")
        : t("breakCompleteMessage");
    react_native_1.Alert.alert(title, message);
}
