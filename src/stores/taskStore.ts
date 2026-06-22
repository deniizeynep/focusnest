import { create } from "zustand";
import * as taskApi from "../api/tasks";
import { translate, type TranslationKey } from "../i18n/translations";
import { useAppStore } from "./appStore";

const t = (key: TranslationKey) => {
  const language = useAppStore.getState().language;
  return translate(language, key);
};

export type TaskTagKey =
  | "development"
  | "design"
  | "research"
  | "meeting"
  | "other";

export type TaskStatus = "todo" | "in_progress" | "done" | "archived";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  estimatedPomodoros: number;
  completedPomodoros: number;
  priority: number;
  tagKey?: TaskTagKey;
  tagLabel?: string;
  tagColor: string;
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
}

export interface NewTask {
  title: string;
  description?: string;
  estimatedPomodoros: number;
  priority: number;
  tagLabel: string;
  tagColor: string;
  dueDate?: string;
}

interface TaskState {
  tasks: Task[];
  activeTask: Task | null;
  isLoading: boolean;
  error: string | null;

  loadTasks: () => Promise<void>;
  addTask: (newTask: NewTask) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  archiveTask: (id: string) => Promise<void>;
  toggleDone: (id: string) => Promise<void>;
  setActiveTask: (task: Task | null) => Promise<void>;
  incrementTaskPomodoro: (taskId: string) => Promise<void>;
  reorderTasks: (fromIndex: number, toIndex: number) => void;
  clearError: () => void;
  clearTasks: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  activeTask: null,
  isLoading: false,
  error: null,

  loadTasks: async () => {
    set({ isLoading: true, error: null });

    try {
      const tasks = await taskApi.fetchTasks();

      const currentActive = get().activeTask;
      const stillExists = currentActive
        ? tasks.find((task) => task.id === currentActive.id)
        : null;

      set({
        tasks,
        activeTask:
          stillExists ??
          tasks.find(
            (task) => task.status === "in_progress" || task.status === "todo",
          ) ??
          null,
        isLoading: false,
      });
    } catch (e: any) {
      console.log("loadTasks error:", e.message);

      set({
        error: t("tasksLoadError"),
        isLoading: false,
      });
    }
  },

  addTask: async (newTask: NewTask) => {
    set({ isLoading: true, error: null });

    try {
      const task = await taskApi.createTask(newTask);

      set((state) => ({
        tasks: [task, ...state.tasks],
        activeTask: state.activeTask ?? task,
        isLoading: false,
      }));
    } catch (e: any) {
      console.log("addTask error:", e.message);

      set({
        error: t("taskAddError"),
        isLoading: false,
      });
    }
  },

  updateTask: async (id: string, updates: Partial<Task>) => {
    set({ error: null });

    try {
      const updatedTask = await taskApi.updateTask(id, updates);

      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === id ? updatedTask : task)),
        activeTask:
          state.activeTask?.id === id ? updatedTask : state.activeTask,
      }));
    } catch (e: any) {
      console.log("updateTask error:", e.message);

      set({ error: t("taskUpdateError") });
    }
  },

  deleteTask: async (id: string) => {
    set({ error: null });

    try {
      await taskApi.deleteTask(id);

      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
        activeTask: state.activeTask?.id === id ? null : state.activeTask,
      }));
    } catch (e: any) {
      console.log("deleteTask error:", e.message);

      set({ error: t("taskDeleteError") });
    }
  },
  archiveTask: async (id: string) => {
    await get().updateTask(id, { status: "archived" });

    const { activeTask } = get();

    if (activeTask?.id === id) {
      set({ activeTask: null });
    }
  },

  toggleDone: async (id: string) => {
    const task = get().tasks.find((item) => item.id === id);

    if (!task) return;

    const isDone = task.status === "done";

    await get().updateTask(id, {
      status: isDone ? "todo" : "done",
      completedAt: isDone ? undefined : new Date().toISOString(),
      completedPomodoros: isDone
        ? task.completedPomodoros
        : task.estimatedPomodoros,
    });
  },

  setActiveTask: async (task: Task | null) => {
    set({ activeTask: task });

    if (task && task.status === "todo") {
      await get().updateTask(task.id, { status: "in_progress" });
    }
  },

  incrementTaskPomodoro: async (taskId: string) => {
    const task = get().tasks.find((item) => item.id === taskId);

    if (!task) return;

    const newCompleted = Math.min(
      task.completedPomodoros + 1,
      task.estimatedPomodoros,
    );

    await get().updateTask(taskId, {
      completedPomodoros: newCompleted,
    });
  },

  reorderTasks: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const tasks = [...state.tasks];
      const [moved] = tasks.splice(fromIndex, 1);
      tasks.splice(toIndex, 0, moved);

      return { tasks };
    });
  },

  clearError: () => set({ error: null }),

  clearTasks: () => {
    set({
      tasks: [],
      activeTask: null,
      isLoading: false,
      error: null,
    });
  },
}));
