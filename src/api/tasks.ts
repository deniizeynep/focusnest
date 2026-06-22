import AsyncStorage from "@react-native-async-storage/async-storage";
import type { NewTask, Task } from "../stores/taskStore";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const TOKEN_KEY = "pomodoro_token";

if (!API_URL) {
  throw new Error("EXPO_PUBLIC_API_URL eksik. .env dosyasını kontrol et.");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const headers: Record<string, string> = {
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
        ...(options.headers as Record<string, string>),
      },
    });

    const text = await response.text();

    console.log("TASK STATUS:", response.status);
    console.log("TASK RESPONSE TEXT:", text);

    let data: any = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(data?.message ?? text ?? "Bir hata oluştu.");
    }

    return data as T;
  } catch (error: any) {
    console.log("TASK RAW ERROR:", error);
    console.log("TASK ERROR MESSAGE:", error?.message);

    if (error.name === "AbortError") {
      throw new Error("Sunucuya ulaşılamadı.");
    }

    throw new Error(error.message ?? "Bağlantı hatası oluştu.");
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeTask(task: any): Task {
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

export async function fetchTasks(): Promise<Task[]> {
  const data = await request<{ tasks: Task[] }>("/tasks", {
    method: "GET",
  });

  return data.tasks.map(normalizeTask);
}

export async function createTask(newTask: NewTask): Promise<Task> {
  const data = await request<{ task: Task }>("/tasks", {
    method: "POST",
    body: JSON.stringify(newTask),
  });

  return normalizeTask(data.task);
}

export async function updateTask(
  taskId: string,
  updates: Partial<Task>,
): Promise<Task> {
  const data = await request<{ task: Task }>(`/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });

  return normalizeTask(data.task);
}

export async function deleteTask(taskId: string): Promise<void> {
  await request<{ message: string }>(`/tasks/${taskId}`, {
    method: "DELETE",
  });
}

export async function completeTask(taskId: string): Promise<Task> {
  const completedAt = new Date().toISOString();

  return updateTask(taskId, {
    status: "done",
    completedAt,
  });
}
