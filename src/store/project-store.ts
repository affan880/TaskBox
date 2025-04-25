import { create } from 'zustand';
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

interface ProjectState {
  projects: ProjectData[];
  selectedProjectId: string | null;
  isLoading: boolean;
  initialized: boolean;
  
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
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  selectedProjectId: null,
  isLoading: false,
  initialized: false,
  
  addProject: (projectData) => {
    const newProject = createProject(projectData, get().projects);
    
    set((state) => ({
      projects: [...state.projects, newProject]
    }));
    
    get().saveProjects();
    return newProject.id;
  },
  
  updateProject: (projectId, updates) => {
    const updatedProjects = updateProjectInApi(get().projects, projectId, updates);
    
    set(() => ({
      projects: updatedProjects
    }));
    
    get().saveProjects();
  },
  
  deleteProject: (projectId) => {
    const updatedProjects = deleteProjectFromApi(get().projects, projectId);
    
    set((state) => ({
      projects: updatedProjects,
      selectedProjectId: state.selectedProjectId === projectId ? null : state.selectedProjectId
    }));
    
    get().saveProjects();
  },
  
  setSelectedProject: (projectId) => {
    set({ selectedProjectId: projectId });
  },
  
  addTaskToProject: (projectId, taskId) => {
    const updatedProjects = addTaskToProjectInApi(get().projects, projectId, taskId);
    
    set(() => ({
      projects: updatedProjects
    }));
    
    get().saveProjects();
  },
  
  removeTaskFromProject: (projectId, taskId) => {
    const updatedProjects = removeTaskFromProjectInApi(get().projects, projectId, taskId);
    
    set(() => ({
      projects: updatedProjects
    }));
    
    get().saveProjects();
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
    }
  },

  // Helper function to get a project with its tasks populated
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
  
  // Helper function to get all projects with their tasks populated
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
  }
})); 