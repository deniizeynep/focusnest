import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "../stores/authStore";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const TOKEN_KEY = "pomodoro_token";

if (!API_URL) {
  throw new Error("EXPO_PUBLIC_API_URL eksik. .env dosyasını kontrol et.");
}

function normalizeUser(user: any): User {
  return {
    id: user.id,
    email: user.email,
    displayName:
      user.displayName ?? user.display_name ?? user.name ?? "FocusNest User",
    avatarUrl: user.avatarUrl ?? user.avatar_url ?? undefined,
    createdAt: user.createdAt ?? user.created_at ?? new Date().toISOString(),
  };
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

  const text = await response.text();

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
}

export async function signIn(email: string, password: string): Promise<User> {
  const data = await request<{ token: string; user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });

  await AsyncStorage.setItem(TOKEN_KEY, data.token);

  console.log("AUTH TOKEN SAVED:", !!data.token);

  return normalizeUser(data.user);
}

export async function signUp(
  email: string,
  password: string,
  displayName: string,
): Promise<User> {
  const data = await request<{ token: string; user: User }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      displayName,
    }),
  });

  await AsyncStorage.setItem(TOKEN_KEY, data.token);

  console.log("AUTH TOKEN SAVED:", !!data.token);

  return normalizeUser(data.user);
}

export async function signOut(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function getSession(): Promise<User | null> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);

  if (!token) {
    return null;
  }

  try {
    const data = await request<{ user: User }>("/auth/me", {
      method: "GET",
    });

    return normalizeUser(data.user);
  } catch {
    await AsyncStorage.removeItem(TOKEN_KEY);
    return null;
  }
}

export async function resetPassword(email: string): Promise<void> {
  await request<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<User, "displayName" | "avatarUrl">>,
): Promise<Partial<User>> {
  const data = await request<{ user: User }>(`/auth/profile/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });

  return normalizeUser(data.user);
}
