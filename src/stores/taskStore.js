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
exports.useTaskStore = void 0;
const zustand_1 = require("zustand");
const taskApi = __importStar(require("../api/tasks"));
const translations_1 = require("../i18n/translations");
const appStore_1 = require("./appStore");
const t = (key) => {
    const language = appStore_1.useAppStore.getState().language;
    return (0, translations_1.translate)(language, key);
};
exports.useTaskStore = (0, zustand_1.create)((set, get) => ({
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
                activeTask: stillExists ??
                    tasks.find((task) => task.status === "in_progress" || task.status === "todo") ??
                    null,
                isLoading: false,
            });
        }
        catch (e) {
            console.log("loadTasks error:", e.message);
            set({
                error: t("tasksLoadError"),
                isLoading: false,
            });
        }
    },
    addTask: async (newTask) => {
        set({ isLoading: true, error: null });
        try {
            const task = await taskApi.createTask(newTask);
            set((state) => ({
                tasks: [task, ...state.tasks],
                activeTask: state.activeTask ?? task,
                isLoading: false,
            }));
        }
        catch (e) {
            console.log("addTask error:", e.message);
            set({
                error: t("taskAddError"),
                isLoading: false,
            });
        }
    },
    updateTask: async (id, updates) => {
        set({ error: null });
        try {
            const updatedTask = await taskApi.updateTask(id, updates);
            set((state) => ({
                tasks: state.tasks.map((task) => (task.id === id ? updatedTask : task)),
                activeTask: state.activeTask?.id === id ? updatedTask : state.activeTask,
            }));
        }
        catch (e) {
            console.log("updateTask error:", e.message);
            set({ error: t("taskUpdateError") });
        }
    },
    deleteTask: async (id) => {
        set({ error: null });
        try {
            await taskApi.deleteTask(id);
            set((state) => ({
                tasks: state.tasks.filter((task) => task.id !== id),
                activeTask: state.activeTask?.id === id ? null : state.activeTask,
            }));
        }
        catch (e) {
            console.log("deleteTask error:", e.message);
            set({ error: t("taskDeleteError") });
        }
    },
    archiveTask: async (id) => {
        await get().updateTask(id, { status: "archived" });
        const { activeTask } = get();
        if (activeTask?.id === id) {
            set({ activeTask: null });
        }
    },
    toggleDone: async (id) => {
        const task = get().tasks.find((item) => item.id === id);
        if (!task)
            return;
        const isDone = task.status === "done";
        await get().updateTask(id, {
            status: isDone ? "todo" : "done",
            completedAt: isDone ? undefined : new Date().toISOString(),
            completedPomodoros: isDone
                ? task.completedPomodoros
                : task.estimatedPomodoros,
        });
    },
    setActiveTask: async (task) => {
        set({ activeTask: task });
        if (task && task.status === "todo") {
            await get().updateTask(task.id, { status: "in_progress" });
        }
    },
    incrementTaskPomodoro: async (taskId) => {
        const task = get().tasks.find((item) => item.id === taskId);
        if (!task)
            return;
        const newCompleted = Math.min(task.completedPomodoros + 1, task.estimatedPomodoros);
        await get().updateTask(taskId, {
            completedPomodoros: newCompleted,
        });
    },
    reorderTasks: (fromIndex, toIndex) => {
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
