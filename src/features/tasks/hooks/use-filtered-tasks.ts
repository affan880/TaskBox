import { useMemo } from 'react';
import { format } from 'date-fns';
import type { TaskData } from '@/types/task';

type FilterOptions = {
  date?: Date;
  showCompleted?: boolean;
  priority?: 'high' | 'medium' | 'low';
  searchQuery?: string;
  tags?: string[];
};

export function useFilteredTasks(tasks: TaskData[], options: FilterOptions) {
  return useMemo(() => {
    let filteredTasks = [...tasks];

    // Filter by date if provided
    if (options.date) {
      const dateStr = format(options.date, 'yyyy-MM-dd');
      filteredTasks = filteredTasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = format(new Date(task.dueDate), 'yyyy-MM-dd');
        return taskDate === dateStr;
      });
    }

    // Filter by completion status
    if (options.showCompleted !== undefined) {
      filteredTasks = filteredTasks.filter(task => task.isCompleted === options.showCompleted);
    }

    // Filter by priority
    if (options.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === options.priority);
    }

    // Filter by search query
    if (options.searchQuery) {
      const query = options.searchQuery.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
    }

    // Filter by tags
    if (options.tags?.length) {
      filteredTasks = filteredTasks.filter(task => 
        task.tags?.some(tag => options.tags?.includes(tag))
      );
    }

    // Sort tasks
    return filteredTasks.sort((a, b) => {
      // Sort by priority first
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by completion status
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;

      // Finally by title
      return a.title.localeCompare(b.title);
    });
  }, [tasks, options]);
} 