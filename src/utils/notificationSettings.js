"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotificationSettings = getNotificationSettings;
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const NOTIFICATION_SETTINGS_KEY = "notification_settings";
async function getNotificationSettings() {
    try {
        const raw = await async_storage_1.default.getItem(NOTIFICATION_SETTINGS_KEY);
        if (!raw) {
            return {
                notifications: true,
                sound: true,
                vibration: true,
            };
        }
        const settings = JSON.parse(raw);
        return {
            notifications: Boolean(settings.notifications),
            sound: Boolean(settings.sound),
            vibration: Boolean(settings.vibration),
        };
    }
    catch {
        return {
            notifications: true,
            sound: true,
            vibration: true,
        };
    }
}
