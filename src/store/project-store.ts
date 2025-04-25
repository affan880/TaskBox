import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
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

const storage = new MMKV();

interface ProjectState {
  projects: ProjectData[];
  selectedProjectId: string | null;
  isLoading: boolean;
  initialized: boolean;
  isUpdating: Record<string, boolean>;
  
  // Actions
  addProject: (project: ProjectCreateInput) => string; // Returns the new project ID
  updateProject: (projectId: string, updates: Partial<Omit<ProjectData, 'id' | 'createdAt'>>) => void;
  deleteProject: (projectId: string) => void;
  setSelectedProject: (projectId: string | null) => void;
  addTaskToProject: (projectId: string, taskId: string) => void;
  removeTaskFromProject: (projectId: string, taskId: string) => void;
  loadProjects: () => Promise<void>;
  saveProjects: () => Promise<void>;
  getProjectWithTasks: (projectId: string) => ProjectWithTasks | null;
  getAllProjectsWithTasks: () => ProjectWithTasks[];
  setUpdating: (projectId: string, isUpdating: boolean) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      selectedProjectId: null,
      isLoading: false,
      initialized: false,
      isUpdating: {},
      
      addProject: (projectData) => {
        const newProject = createProject(projectData, get().projects);
        
        set((state) => ({
          projects: [...state.projects, newProject]
        }));
        
        get().saveProjects();
        return newProject.id;
      },
      
      updateProject: async (projectId, updates) => {
        const previousProjects = get().projects;
        const updatedProjects = updateProjectInApi(get().projects, projectId, updates);
        
        set((state) => ({
          projects: updatedProjects,
          isUpdating: { ...state.isUpdating, [projectId]: true }
        }));
        
        try {
          await get().saveProjects();
        } catch (error) {
          set((state) => ({
            projects: previousProjects,
            isUpdating: { ...state.isUpdating, [projectId]: false }
          }));
          throw error;
        } finally {
          set((state) => ({
            isUpdating: { ...state.isUpdating, [projectId]: false }
          }));
        }
      },
      
      deleteProject: async (projectId) => {
        const previousProjects = get().projects;
        const updatedProjects = deleteProjectFromApi(get().projects, projectId);
        
        set((state) => ({
          projects: updatedProjects,
          selectedProjectId: state.selectedProjectId === projectId ? null : state.selectedProjectId,
          isUpdating: { ...state.isUpdating, [projectId]: true }
        }));
        
        try {
          await get().saveProjects();
        } catch (error) {
          set((state) => ({
            projects: previousProjects,
            isUpdating: { ...state.isUpdating, [projectId]: false }
          }));
          throw error;
        } finally {
          set((state) => ({
            isUpdating: { ...state.isUpdating, [projectId]: false }
          }));
        }
      },
      
      setSelectedProject: (projectId) => {
        set({ selectedProjectId: projectId });
      },
      
      addTaskToProject: async (projectId, taskId) => {
        const previousProjects = get().projects;
        const updatedProjects = addTaskToProjectInApi(get().projects, projectId, taskId);
        
        set((state) => ({
          projects: updatedProjects,
          isUpdating: { ...state.isUpdating, [projectId]: true }
        }));
        
        try {
          await get().saveProjects();
        } catch (error) {
          set((state) => ({
            projects: previousProjects,
            isUpdating: { ...state.isUpdating, [projectId]: false }
          }));
          throw error;
        } finally {
          set((state) => ({
            isUpdating: { ...state.isUpdating, [projectId]: false }
          }));
        }
      },
      
      removeTaskFromProject: async (projectId, taskId) => {
        const previousProjects = get().projects;
        const updatedProjects = removeTaskFromProjectInApi(get().projects, projectId, taskId);
        
        set((state) => ({
          projects: updatedProjects,
          isUpdating: { ...state.isUpdating, [projectId]: true }
        }));
        
        try {
          await get().saveProjects();
        } catch (error) {
          set((state) => ({
            projects: previousProjects,
            isUpdating: { ...state.isUpdating, [projectId]: false }
          }));
          throw error;
        } finally {
          set((state) => ({
            isUpdating: { ...state.isUpdating, [projectId]: false }
          }));
        }
      },
      
      loadProjects: async () => {
        set({ isLoading: true });
        
        try {
          const projects = await loadProjectsFromApi();
          set({ projects, initialized: true });
        } catch (error) {
          console.error('Failed to load projects:', error);
          set({ projects: [], initialized: true });
        } finally {
          set({ isLoading: false });
        }
      },
      
      saveProjects: async () => {
        try {
          const { projects } = get();
          await saveProjectsToApi(projects);
        } catch (error) {
          console.error('Failed to save projects:', error);
          throw error;
        }
      },

      getProjectWithTasks: (projectId) => {
        const { projects } = get();
        const project = projects.find(p => p.id === projectId);
        
        if (!project) return null;
        
        const tasks = useTaskStore.getState().tasks;
        const projectTasks = tasks.filter(task => project.tasks.includes(task.id));
        
        return {
          ...project,
          tasks: projectTasks
        };
      },
      
      getAllProjectsWithTasks: () => {
        const { projects } = get();
        const tasks = useTaskStore.getState().tasks;
        
        return projects.map(project => {
          const projectTasks = tasks.filter(task => project.tasks.includes(task.id));
          return {
            ...project,
            tasks: projectTasks
          };
        });
      },

      setUpdating: (projectId: string, isUpdating: boolean) => {
        set((state) => ({
          isUpdating: {
            ...state.isUpdating,
            [projectId]: isUpdating
          }
        }));
      }
    }),
    {
      name: 'project-store',
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