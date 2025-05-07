import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storageConfig } from '@/lib/storage';
import type { TaskData } from '@/types/task';
import { 
  loadTasks as loadTasksFromApi, 
  saveTasks as saveTasksToApi,
  createTask,
  updateTask as updateTaskInApi,
  toggleTaskCompletion as toggleTaskCompletionInApi,
  deleteTask as deleteTaskFromApi
} from '../api/tasks-api';

export type TaskState = {
  tasks: TaskData[];
  selectedTask: TaskData | null;
  isLoading: boolean;
  initialized: boolean;
  isUpdating: Record<string, boolean>;
  
  // Actions
  addTask: (task: TaskData) => void;
  updateTask: (taskId: string, updates: Partial<TaskData>) => void;
  deleteTask: (taskId: string) => void;
  toggleTaskCompletion: (id: string) => void;
  loadTasks: () => Promise<void>;
  saveTasks: () => Promise<void>;
  getTasks: () => Promise<TaskData[]>;
  getTasksByProject: (projectId: string, projectTasks: string[]) => TaskData[];
  getAllTasks: () => TaskData[];
  setUpdating: (taskId: string, isUpdating: boolean) => void;
  completeTask: (taskId: string) => void;
  setSelectedTask: (task: TaskData | null) => void;
};

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      selectedTask: null,
      isLoading: false,
      initialized: false,
      isUpdating: {},
      
      addTask: (task) => {
        set((state) => ({ 
          tasks: [...state.tasks, task] 
        }));
        // Save tasks after adding
        get().saveTasks();
      },
      
      updateTask: (taskId, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId ? { ...task, ...updates } : task
          ),
        }));
        // Save tasks after updating
        get().saveTasks();
      },
      
      deleteTask: (taskId) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== taskId),
        }));
        // Save tasks after deleting
        get().saveTasks();
      },
      
      toggleTaskCompletion: async (id) => {
        // First update the UI immediately
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { 
              ...t, 
              isCompleted: !t.isCompleted,
              completedAt: !t.isCompleted ? new Date().toISOString() : undefined,
              updatedAt: new Date().toISOString()
            } : t
          ),
        }));

        try {
          // Then persist the changes
          const tasks = get().tasks;
          await saveTasksToApi(tasks);
        } catch (error) {
          console.error('Failed to persist task completion:', error);
          // Revert the UI change if persistence failed
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === id ? { 
                ...t, 
                isCompleted: !t.isCompleted,
                completedAt: t.isCompleted ? new Date().toISOString() : undefined,
                updatedAt: new Date().toISOString()
              } : t
            ),
          }));
        }
      },
      
      loadTasks: async () => {
        try {
          set({ isLoading: true });
          // First try to load from storage
          const tasks = await loadTasksFromApi();
          if (tasks && tasks.length > 0) {
            // Convert date strings to Date objects and back to ISO strings
            const processedTasks = tasks.map(task => ({
              ...task,
              dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : undefined,
              reminder: task.reminder ? new Date(task.reminder).toISOString() : undefined,
              createdAt: new Date(task.createdAt).toISOString(),
              updatedAt: new Date(task.updatedAt).toISOString(),
              completedAt: task.completedAt ? new Date(task.completedAt).toISOString() : undefined,
              lastWorkedOn: task.lastWorkedOn ? new Date(task.lastWorkedOn).toISOString() : undefined,
            }));
            set({ tasks: processedTasks, initialized: true });
          } else {
            // If no tasks in storage, initialize with empty array
            set({ tasks: [], initialized: true });
          }
        } catch (error) {
          console.error('Failed to load tasks:', error);
          // Initialize with empty array on error
          set({ tasks: [], initialized: true });
        } finally {
          set({ isLoading: false });
        }
      },
      
      saveTasks: async () => {
        try {
          const tasks = get().tasks;
          await saveTasksToApi(tasks);
        } catch (error) {
          console.error('Failed to save tasks:', error);
        }
      },

      getTasks: async () => {
        try {
          const tasks = await loadTasksFromApi();
          if (tasks && tasks.length > 0) {
            // Convert date strings to Date objects and back to ISO strings
            const processedTasks = tasks.map(task => ({
              ...task,
              dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : undefined,
              reminder: task.reminder ? new Date(task.reminder).toISOString() : undefined,
              createdAt: new Date(task.createdAt).toISOString(),
              updatedAt: new Date(task.updatedAt).toISOString(),
              completedAt: task.completedAt ? new Date(task.completedAt).toISOString() : undefined,
              lastWorkedOn: task.lastWorkedOn ? new Date(task.lastWorkedOn).toISOString() : undefined,
            }));
            set({ tasks: processedTasks });
            return processedTasks;
          }
          return get().tasks;
        } catch (error) {
          console.error('Failed to get tasks:', error);
          return get().tasks;
        }
      },

      getTasksByProject: (projectId: string, projectTasks: string[]): TaskData[] => {
        const { tasks } = get();
        if (!projectTasks || !Array.isArray(projectTasks)) {
          return [];
        }
        return tasks.filter(task => projectTasks.includes(task.id));
      },

      getAllTasks: () => {
        const { tasks } = get();
        return tasks;
      },

      setUpdating: (taskId: string, isUpdating: boolean) => {
        set((state) => ({
          isUpdating: {
            ...state.isUpdating,
            [taskId]: isUpdating
          }
        }));
      },

      completeTask: async (taskId) => {
        // First update the UI immediately
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId ? { 
              ...task, 
              isCompleted: true,
              completedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            } : task
          ),
        }));

        try {
          // Then persist the changes
          const tasks = get().tasks;
          await saveTasksToApi(tasks);
        } catch (error) {
          console.error('Failed to persist task completion:', error);
          // Revert the UI change if persistence failed
          set((state) => ({
            tasks: state.tasks.map((task) =>
              task.id === taskId ? { 
                ...task, 
                isCompleted: false,
                completedAt: undefined,
                updatedAt: new Date().toISOString()
              } : task
            ),
          }));
        }
      },

      setSelectedTask: (task) =>
        set(() => ({
          selectedTask: task,
        })),
    }),
    {
      name: 'task-storage',
      storage: createJSONStorage(() => storageConfig),
      onRehydrateStorage: () => (state) => {
        // When storage is rehydrated, ensure we load tasks
        if (state) {
          state.initialized = true;
          // Load tasks after rehydration
          setTimeout(() => {
            state.loadTasks();
          }, 0);
        }
      },
    }
  )
); 