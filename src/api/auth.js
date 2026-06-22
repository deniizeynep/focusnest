"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signIn = signIn;
exports.signUp = signUp;
exports.signOut = signOut;
exports.getSession = getSession;
exports.resetPassword = resetPassword;
exports.updateProfile = updateProfile;
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const API_URL = process.env.EXPO_PUBLIC_API_URL;
const TOKEN_KEY = "pomodoro_token";
if (!API_URL) {
    throw new Error("EXPO_PUBLIC_API_URL eksik. .env dosyasını kontrol et.");
}
function normalizeUser(user) {
    return {
        id: user.id,
        email: user.email,
        displayName: user.displayName ?? user.display_name ?? user.name ?? "FocusNest User",
        avatarUrl: user.avatarUrl ?? user.avatar_url ?? undefined,
        createdAt: user.createdAt ?? user.created_at ?? new Date().toISOString(),
    };
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
    const text = await response.text();
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    }
    catch {
        data = null;
    }
    if (!response.ok) {
        throw new Error(data?.message ?? text ?? "Bir hata oluştu.");
    }
    return data;
}
async function signIn(email, password) {
    const data = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({
            email,
            password,
        }),
    });
    await async_storage_1.default.setItem(TOKEN_KEY, data.token);
    console.log("AUTH TOKEN SAVED:", !!data.token);
    return normalizeUser(data.user);
}
async function signUp(email, password, displayName) {
    const data = await request("/auth/register", {
        method: "POST",
        body: JSON.stringify({
            email,
            password,
            displayName,
        }),
    });
    await async_storage_1.default.setItem(TOKEN_KEY, data.token);
    console.log("AUTH TOKEN SAVED:", !!data.token);
    return normalizeUser(data.user);
}
async function signOut() {
    await async_storage_1.default.removeItem(TOKEN_KEY);
}
async function getSession() {
    const token = await async_storage_1.default.getItem(TOKEN_KEY);
    if (!token) {
        return null;
    }
    try {
        const data = await request("/auth/me", {
            method: "GET",
        });
        return normalizeUser(data.user);
    }
    catch {
        await async_storage_1.default.removeItem(TOKEN_KEY);
        return null;
    }
}
async function resetPassword(email) {
    await request("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
    });
}
async function updateProfile(userId, updates) {
    const data = await request(`/auth/profile/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
    });
    return normalizeUser(data.user);
}
