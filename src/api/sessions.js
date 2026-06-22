"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSession = createSession;
exports.fetchSessions = fetchSessions;
exports.fetchTodaySummary = fetchTodaySummary;
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const API_URL = process.env.EXPO_PUBLIC_API_URL;
const TOKEN_KEY = "pomodoro_token";
if (!API_URL) {
    throw new Error("EXPO_PUBLIC_API_URL eksik. .env dosyasını kontrol et.");
}
async function request(path, options = {}) {
    const token = await async_storage_1.default.getItem(TOKEN_KEY);
    const headers = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            ...headers,
            ...options.headers,
        },
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(data?.message ?? "Bir hata oluştu.");
    }
    return data;
}
async function createSession(session) {
    const data = await request("/sessions", {
        method: "POST",
        body: JSON.stringify(session),
    });
    return data.session;
}
async function fetchSessions() {
    const data = await request("/sessions", {
        method: "GET",
    });
    return data.sessions;
}
async function fetchTodaySummary() {
    return request("/sessions/today-summary", {
        method: "GET",
    });
}
