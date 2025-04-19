import { create } from 'zustand';
import { TaskData } from '../types/task';
import { 
  loadTasks as loadTasksFromApi, 
  saveTasks as saveTasksToApi,
  createTask,
  updateTask as updateTaskInApi,
  toggleTaskCompletion as toggleTaskCompletionInApi,
  deleteTask as deleteTaskFromApi
} from '../api/tasks-api';

interface TaskState {
  tasks: TaskData[];
  isLoading: boolean;
  initialized: boolean;
  
  // Actions
  addTask: (task: Omit<TaskData, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (taskId: string, updates: Partial<Omit<TaskData, 'id' | 'createdAt'>>) => void;
  deleteTask: (taskId: string) => void;
  toggleTaskCompletion: (taskId: string) => void;
  loadTasks: () => Promise<void>;
  saveTasks: () => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  initialized: false,
  
  addTask: (taskData) => {
    const newTask = createTask(taskData, get().tasks);
    
    set((state) => ({
      tasks: [...state.tasks, newTask]
    }));
    
    get().saveTasks();
  },
  
  updateTask: (taskId, updates) => {
    const updatedTasks = updateTaskInApi(get().tasks, taskId, updates);
    
    set(() => ({
      tasks: updatedTasks
    }));
    
    get().saveTasks();
  },
  
  deleteTask: (taskId) => {
    const updatedTasks = deleteTaskFromApi(get().tasks, taskId);
    
    set(() => ({
      tasks: updatedTasks
    }));
    
    get().saveTasks();
  },
  
  toggleTaskCompletion: (taskId) => {
    const updatedTasks = toggleTaskCompletionInApi(get().tasks, taskId);
    
    set(() => ({
      tasks: updatedTasks
    }));
    
    get().saveTasks();
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
    }
  },
})); 