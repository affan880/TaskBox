import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import { TaskData } from '../types/task';
import { ProjectData } from '../types/project';
import { 
  loadTasks as loadTasksFromApi, 
  saveTasks as saveTasksToApi,
  createTask,
  updateTask as updateTaskInApi,
  toggleTaskCompletion as toggleTaskCompletionInApi,
  deleteTask as deleteTaskFromApi
} from '../api/tasks-api';
import { useProjectStore } from './project-store';

const storage = new MMKV();

// Error types for better error handling
type TaskError = {
  code: 'LOAD_ERROR' | 'SAVE_ERROR' | 'UPDATE_ERROR' | 'DELETE_ERROR';
  message: string;
};

type TaskState = {
  tasks: TaskData[];
  isLoading: boolean;
  initialized: boolean;
  isUpdating: Record<string, boolean>;
  
  // Actions
  addTask: (task: Omit<TaskData, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Omit<TaskData, 'id' | 'createdAt'>>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleTaskCompletion: (taskId: string) => Promise<void>;
  loadTasks: () => Promise<void>;
  saveTasks: () => Promise<void>;
  getTasksByProject: (projectId: string) => TaskData[];
  setUpdating: (taskId: string, isUpdating: boolean) => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      isLoading: false,
      initialized: false,
      isUpdating: {},
      
      addTask: (taskData) => {
        const newTask = createTask(taskData, get().tasks);
        
        set((state) => ({
          tasks: [...state.tasks, newTask]
        }));
        
        get().saveTasks();
      },
      
      updateTask: async (taskId, updates) => {
        // Optimistic update
        const previousTasks = get().tasks;
        const updatedTasks = updateTaskInApi(get().tasks, taskId, updates);
        
        set((state) => ({
          tasks: updatedTasks,
          isUpdating: { ...state.isUpdating, [taskId]: true }
        }));
        
        try {
          await get().saveTasks();
        } catch (error) {
          // Rollback on failure
          set((state) => ({
            tasks: previousTasks,
            isUpdating: { ...state.isUpdating, [taskId]: false }
          }));
          throw error;
        } finally {
          set((state) => ({
            isUpdating: { ...state.isUpdating, [taskId]: false }
          }));
        }
      },
      
      deleteTask: async (taskId) => {
        const previousTasks = get().tasks;
        const updatedTasks = deleteTaskFromApi(get().tasks, taskId);
        
        set((state) => ({
          tasks: updatedTasks,
          isUpdating: { ...state.isUpdating, [taskId]: true }
        }));
        
        try {
          await get().saveTasks();
        } catch (error) {
          set((state) => ({
            tasks: previousTasks,
            isUpdating: { ...state.isUpdating, [taskId]: false }
          }));
          throw error;
        } finally {
          set((state) => ({
            isUpdating: { ...state.isUpdating, [taskId]: false }
          }));
        }
      },
      
      toggleTaskCompletion: async (taskId) => {
        const previousTasks = get().tasks;
        const updatedTasks = toggleTaskCompletionInApi(get().tasks, taskId);
        
        set((state) => ({
          tasks: updatedTasks,
          isUpdating: { ...state.isUpdating, [taskId]: true }
        }));
        
        try {
          await get().saveTasks();
        } catch (error) {
          set((state) => ({
            tasks: previousTasks,
            isUpdating: { ...state.isUpdating, [taskId]: false }
          }));
          throw error;
        } finally {
          set((state) => ({
            isUpdating: { ...state.isUpdating, [taskId]: false }
          }));
        }
      },
      
      loadTasks: async () => {
        set({ isLoading: true });
        
        try {
          const tasks = await loadTasksFromApi();
          set({ tasks, initialized: true });
        } catch (error) {
          console.error('Failed to load tasks:', error);
          set({ tasks: [], initialized: true });
        } finally {
          set({ isLoading: false });
        }
      },
      
      saveTasks: async () => {
        try {
          const { tasks } = get();
          await saveTasksToApi(tasks);
        } catch (error) {
          console.error('Failed to save tasks:', error);
          throw error;
        }
      },

      getTasksByProject: (projectId: string): TaskData[] => {
        const { tasks } = get();
        const projectStore = useProjectStore.getState();
        const project = projectStore.projects.find((p: ProjectData) => p.id === projectId);
        
        if (!project) return [];
        
        return tasks.filter(task => project.tasks.includes(task.id));
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
      name: 'task-store',
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          const value = storage.getString(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => {
          storage.set(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          storage.delete(name);
        },
      })),
    }
  )
); 