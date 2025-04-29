import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storageConfig } from '@/lib/storage';
import { TaskData } from '@/types/task';
import { ProjectData } from '../types/project';
import { 
  loadTasks as loadTasksFromApi, 
  saveTasks as saveTasksToApi,
  createTask,
  updateTask as updateTaskInApi,
  toggleTaskCompletion as toggleTaskCompletionInApi,
  deleteTask as deleteTaskFromApi
} from '../api/tasks-api';

type TaskState = {
  tasks: TaskData[];
  isLoading: boolean;
  initialized: boolean;
  isUpdating: Record<string, boolean>;
  
  // Actions
  addTask: (task: TaskData) => void;
  updateTask: (id: string, task: Partial<TaskData>) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompletion: (id: string) => void;
  loadTasks: () => Promise<void>;
  saveTasks: () => Promise<void>;
  getTasks: () => Promise<TaskData[]>;
  getTasksByProject: (projectId: string, projectTasks: string[]) => TaskData[];
  setUpdating: (taskId: string, isUpdating: boolean) => void;
};

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      isLoading: false,
      initialized: false,
      isUpdating: {},
      
      addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
      
      updateTask: (id, task) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...task } : t)),
        })),
      
      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),
      
      toggleTaskCompletion: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, completedAt: t.completedAt ? undefined : new Date().toISOString() } : t
          ),
        })),
      
      loadTasks: async () => {
        try {
          set({ isLoading: true });
          const tasks = await loadTasksFromApi();
          set({ tasks, initialized: true });
        } catch (error) {
          console.error('Failed to load tasks:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      saveTasks: async () => {
        try {
          set({ isLoading: true });
          await saveTasksToApi(get().tasks);
        } catch (error) {
          console.error('Failed to save tasks:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      getTasks: async () => {
        try {
          const tasks = await loadTasksFromApi();
          set({ tasks });
          return tasks;
        } catch (error) {
          console.error('Failed to get tasks:', error);
          throw error;
        }
      },

      getTasksByProject: (projectId: string, projectTasks: string[]): TaskData[] => {
        const { tasks } = get();
        return tasks.filter(task => projectTasks.includes(task.id));
      },

      setUpdating: (taskId: string, isUpdating: boolean) => {
        set((state) => ({
          isUpdating: {
            ...state.isUpdating,
            [taskId]: isUpdating
          }
        }));
      }
    }),
    {
      name: 'task-storage',
      storage: createJSONStorage(() => storageConfig),
    }
  )
); 