import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { storageConfig } from '@/lib/storage/storage';
import { Project, ProjectCreateInput, ProjectWithTasks } from '../types/project';
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

type ProjectStore = {
  projects: Project[];
  selectedProjectId: string | null;
  addProject: (project: Project) => Project;
  updateProject: (id: string, project: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => void;
  setSelectedProject: (projectId: string | null) => void;
  getProject: (id: string) => Promise<Project>;
  getAllProjects: () => Project[];
  getAllProjectsWithTasks: () => ProjectWithTasks[];
  addTaskToProject: (projectId: string, taskId: string) => void;
  removeTaskFromProject: (projectId: string, taskId: string) => void;
  getProjectWithTasks: (id: string) => ProjectWithTasks | null;
};

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      selectedProjectId: null,
      addProject: (project) => {
        const newProject = {
          ...project,
          id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          projects: [...state.projects, newProject],
          selectedProjectId: newProject.id,
        }));

        return newProject;
      },
      updateProject: async (id, project) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id
              ? {
                  ...p,
                  ...project,
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
      },
      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          selectedProjectId:
            state.selectedProjectId === id
              ? null
              : state.selectedProjectId
        }));
      },
      setSelectedProject: (projectId) =>
        set(() => ({
          selectedProjectId: projectId,
        })),
      getProject: async (id) => {
        const project = get().projects.find((p) => p.id === id);
        if (!project) {
          throw new Error('Project not found');
        }
        return project;
      },
      getAllProjects: () => {
        return get().projects;
      },
      getAllProjectsWithTasks: () => {
        const { projects } = get();
        const { getTasksByProject } = useTaskStore.getState();
        
        return projects.map(project => ({
          ...project,
          tasks: getTasksByProject(project.id, project.taskIds || [])
        }));
      },
      addTaskToProject: (projectId, taskId) => {
        const state = get();
        const project = state.projects.find(p => p.id === projectId);
        if (!project) return;
        
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { 
                  ...p, 
                  taskIds: [...(p.taskIds || []), taskId],
                  updatedAt: new Date().toISOString()
                }
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
      getProjectWithTasks: (id: string) => {
        const project = get().projects.find((p) => p.id === id);
        if (!project) return null;
        
        const { getTasksByProject } = useTaskStore.getState();
        const tasks = getTasksByProject(id, project.taskIds || []);
        
        return {
          ...project,
          tasks
        };
      },
    }),
    {
      name: 'project-storage',
      storage: storageConfig,
    }
  )
); 