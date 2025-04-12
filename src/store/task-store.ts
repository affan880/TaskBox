import { create } from 'zustand';
import { TaskData, TaskPriority } from '../types/task';
import { setItem, getItem } from 'src/lib/storage/storage';

const TASKS_STORAGE_KEY = 'tasks';

interface TaskState {
  tasks: TaskData[];
  isLoading: boolean;
  initialized: boolean;
  
  // Actions
  addTask: (task: Omit<TaskData, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (taskId: string, updates: Partial<TaskData>) => void;
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
    const id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const newTask: TaskData = {
      id,
      title: taskData.title,
      description: taskData.description,
      isCompleted: false,
      dueDate: taskData.dueDate,
      priority: taskData.priority || 'medium',
      tags: taskData.tags || [],
      createdAt: now,
      updatedAt: now,
    };
    
    set((state) => ({
      tasks: [...state.tasks, newTask]
    }));
    
    get().saveTasks();
  },
  
  updateTask: (taskId, updates) => {
    set((state) => ({
      tasks: state.tasks.map((task) => 
        task.id === taskId 
          ? { ...task, ...updates, updatedAt: new Date().toISOString() } 
          : task
      )
    }));
    
    get().saveTasks();
  },
  
  deleteTask: (taskId) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId)
    }));
    
    get().saveTasks();
  },
  
  toggleTaskCompletion: (taskId) => {
    set((state) => ({
      tasks: state.tasks.map((task) => 
        task.id === taskId 
          ? { 
              ...task, 
              isCompleted: !task.isCompleted, 
              updatedAt: new Date().toISOString() 
            } 
          : task
      )
    }));
    
    get().saveTasks();
  },
  
  loadTasks: async () => {
    set({ isLoading: true });
    
    try {
      const savedTasks = await getItem<TaskData[]>(TASKS_STORAGE_KEY, []);
      set({ tasks: savedTasks, initialized: true });
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
      await setItem(TASKS_STORAGE_KEY, tasks);
    } catch (error) {
      console.error('Failed to save tasks:', error);
    }
  },
})); 