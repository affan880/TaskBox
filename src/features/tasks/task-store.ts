import { create } from 'zustand';
import type { TaskData } from '@/types/task';

type TaskStore = {
  tasks: TaskData[];
  addTask: (task: TaskData) => void;
  updateTask: (id: string, task: Partial<TaskData>) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompletion: (id: string) => void;
};

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, task],
    })),
  updateTask: (id, updatedTask) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, ...updatedTask } : task
      ),
    })),
  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    })),
  toggleTaskCompletion: (id) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, isCompleted: !task.isCompleted } : task
      ),
    })),
})); 