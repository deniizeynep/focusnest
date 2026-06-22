"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchTasks = fetchTasks;
exports.createTask = createTask;
exports.updateTask = updateTask;
exports.deleteTask = deleteTask;
exports.completeTask = completeTask;
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const API_URL = process.env.EXPO_PUBLIC_API_URL;
const TOKEN_KEY = "pomodoro_token";
if (!API_URL) {
    throw new Error("EXPO_PUBLIC_API_URL eksik. .env dosyasını kontrol et.");
}
async function request(path, options = {}) {
    const token = await async_storage_1.default.getItem(TOKEN_KEY);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const headers = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    const url = `${API_URL}${path}`;
    console.log("TASK API URL:", url);
    console.log("TASK TOKEN EXISTS:", !!token);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                ...headers,
                ...options.headers,
            },
        });
        const text = await response.text();
        console.log("TASK STATUS:", response.status);
        console.log("TASK RESPONSE TEXT:", text);
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
    catch (error) {
        console.log("TASK RAW ERROR:", error);
        console.log("TASK ERROR MESSAGE:", error?.message);
        if (error.name === "AbortError") {
            throw new Error("Sunucuya ulaşılamadı.");
        }
        throw new Error(error.message ?? "Bağlantı hatası oluştu.");
    }
    finally {
        clearTimeout(timeoutId);
    }
}
function normalizeTask(task) {
    return {
        id: task.id,
        title: task.title,
        description: task.description ?? "",
        status: task.status,
        estimatedPomodoros: task.estimatedPomodoros,
        completedPomodoros: task.completedPomodoros,
        priority: task.priority,
        tagLabel: task.tagLabel,
        tagColor: task.tagColor,
        dueDate: task.dueDate ?? undefined,
        createdAt: task.createdAt,
        completedAt: task.completedAt ?? undefined,
    };
}
async function fetchTasks() {
    const data = await request("/tasks", {
        method: "GET",
    });
    return data.tasks.map(normalizeTask);
}
async function createTask(newTask) {
    const data = await request("/tasks", {
        method: "POST",
        body: JSON.stringify(newTask),
    });
    return normalizeTask(data.task);
}
async function updateTask(taskId, updates) {
    const data = await request(`/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
    });
    return normalizeTask(data.task);
}
async function deleteTask(taskId) {
    await request(`/tasks/${taskId}`, {
        method: "DELETE",
    });
}
async function completeTask(taskId) {
    const completedAt = new Date().toISOString();
    return updateTask(taskId, {
        status: "done",
        completedAt,
    });
}
