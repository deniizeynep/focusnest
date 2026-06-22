import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const TOKEN_KEY = "pomodoro_token";

if (!API_URL) {
  throw new Error("EXPO_PUBLIC_API_URL eksik. .env dosyasını kontrol et.");
}

export type SessionType = "work" | "short_break" | "long_break";

export interface PomodoroSession {
  id: string;
  userId: string;
  taskId: string | null;
  type: SessionType;
  durationMin: number;
  startedAt: string;
  completedAt: string;
  wasInterrupted: boolean;
  notes?: string;

  task?: {
    title: string;
    tagColor: string | null;
  } | null;
}

export interface NewPomodoroSession {
  taskId?: string | null;
  type: SessionType;
  durationMin: number;
  startedAt: string;
  completedAt: string;
  wasInterrupted: boolean;
  notes?: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string>),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? "Bir hata oluştu.");
  }

  return data as T;
}

export async function createSession(
  session: NewPomodoroSession,
): Promise<PomodoroSession> {
  const data = await request<{ session: PomodoroSession }>("/sessions", {
    method: "POST",
    body: JSON.stringify(session),
  });

  return data.session;
}

export async function fetchSessions(): Promise<PomodoroSession[]> {
  const data = await request<{ sessions: PomodoroSession[] }>("/sessions", {
    method: "GET",
  });

  return data.sessions;
}

export async function fetchTodaySummary(): Promise<{
  count: number;
  totalMinutes: number;
  streak: number;
}> {
  return request<{ count: number; totalMinutes: number; streak: number }>(
    "/sessions/today-summary",
    {
      method: "GET",
    },
  );
}
