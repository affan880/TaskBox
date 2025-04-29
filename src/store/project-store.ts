import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { storageConfig } from '@/lib/storage/storage';
import { ProjectData, ProjectCreateInput, ProjectWithTasks } from '../types/project';
import { TaskData } from '../types/task';
import { 
  loadProjects as loadProjectsFromApi, 
  saveProjects as saveProjectsToApi,
  createProject,
  updateProject as updateProjectInApi,
  addTaskToProject as addTaskToProjectInApi,
  removeTaskFromProject as removeTaskFromProjectInApi,
  deleteProject as deleteProjectFromApi
} from '../api/projects-api';
import { useTaskStore } from './task-store';

type Project = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

type ProjectStore = {
  projects: Project[];
  selectedProjectId: string | null;
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
  setSelectedProject: (projectId: string | null) => void;
  getProject: (projectId: string) => Project | null;
  getProjectWithTasks: (projectId: string) => ProjectWithTasks | null;
  addTaskToProject: (projectId: string, taskId: string) => void;
  removeTaskFromProject: (projectId: string, taskId: string) => void;
};

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      selectedProjectId: null,
      addProject: (project) =>
        set((state) => ({
          projects: [...state.projects, project],
        })),
      updateProject: (project) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === project.id ? project : p
          ),
        })),
      deleteProject: (projectId) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
          selectedProjectId:
            state.selectedProjectId === projectId
              ? null
              : state.selectedProjectId,
        })),
      setSelectedProject: (projectId) =>
        set(() => ({
          selectedProjectId: projectId,
        })),
      getProject: (projectId) => {
        const state = get();
        return state.projects.find(p => p.id === projectId) || null;
      },
      getProjectWithTasks: (projectId) => {
        const state = get();
        const project = state.projects.find(p => p.id === projectId);
        if (!project) return null;
        
        const taskStore = useTaskStore.getState();
        const tasks = taskStore.tasks.filter(t => t.projectId === projectId);
        
        return {
          ...project,
          tasks
        };
      },
      addTaskToProject: (projectId, taskId) => {
        const state = get();
        const project = state.projects.find(p => p.id === projectId);
        if (!project) return;
        
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, taskIds: [...(p.taskIds || []), taskId] }
              : p
          ),
        }));
      },
      removeTaskFromProject: (projectId, taskId) => {
        const state = get();
        const project = state.projects.find(p => p.id === projectId);
        if (!project) return;
        
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, taskIds: p.taskIds?.filter(id => id !== taskId) || [] }
              : p
          ),
        }));
      },
    }),
    {
      name: 'project-storage',
      storage: storageConfig,
    }
  )
); 