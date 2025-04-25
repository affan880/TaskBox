/**
 * API module for project-related operations
 */
import { getItem, setItem } from '../lib/storage/storage';
import { ProjectData, ProjectCreateInput } from '../types/project';

const PROJECTS_STORAGE_KEY = 'projects';

/**
 * Load projects from storage
 * @returns Promise resolving to project data
 */
export async function loadProjects(): Promise<ProjectData[]> {
  try {
    const projects = await getItem<ProjectData[]>(PROJECTS_STORAGE_KEY, []);
    return projects || [];
  } catch (error) {
    console.error('Failed to load projects:', error);
    return [];
  }
}

/**
 * Save projects to storage
 * @param projects Array of projects to save
 */
export async function saveProjects(projects: ProjectData[]): Promise<void> {
  try {
    await setItem(PROJECTS_STORAGE_KEY, projects);
  } catch (error) {
    console.error('Failed to save projects:', error);
    throw error;
  }
}

/**
 * Create a new project
 * @param projectData Project data without ID and timestamps
 * @param existingProjects Current project list
 * @returns New project with ID and timestamps
 */
export function createProject(
  projectData: ProjectCreateInput,
  existingProjects: ProjectData[]
): ProjectData {
  const id = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  const newProject: ProjectData = {
    id,
    title: projectData.title,
    description: projectData.description,
    startDate: projectData.startDate,
    endDate: projectData.endDate,
    labelColor: projectData.labelColor,
    tasks: [],
    isCompleted: false,
    createdAt: now,
    updatedAt: now,
  };
  
  return newProject;
}

/**
 * Update a project
 * @param projects Current project list
 * @param projectId ID of project to update
 * @param updates Updates to apply
 * @returns Updated project list
 */
export function updateProject(
  projects: ProjectData[], 
  projectId: string, 
  updates: Partial<Omit<ProjectData, 'id' | 'createdAt'>>
): ProjectData[] {
  return projects.map((project) => 
    project.id === projectId 
      ? { 
          ...project, 
          ...updates, 
          updatedAt: new Date().toISOString() 
        } 
      : project
  );
}

/**
 * Add task to project
 * @param projects Current project list
 * @param projectId ID of project to update
 * @param taskId ID of task to add
 * @returns Updated project list
 */
export function addTaskToProject(
  projects: ProjectData[],
  projectId: string,
  taskId: string
): ProjectData[] {
  return projects.map((project) => {
    if (project.id === projectId) {
      // Only add if not already in the list
      if (!project.tasks.includes(taskId)) {
        const updatedTasks = [...project.tasks, taskId];
        return {
          ...project,
          tasks: updatedTasks,
          updatedAt: new Date().toISOString()
        };
      }
    }
    return project;
  });
}

/**
 * Remove task from project
 * @param projects Current project list
 * @param projectId ID of project to update
 * @param taskId ID of task to remove
 * @returns Updated project list
 */
export function removeTaskFromProject(
  projects: ProjectData[],
  projectId: string,
  taskId: string
): ProjectData[] {
  return projects.map((project) => {
    if (project.id === projectId) {
      const updatedTasks = project.tasks.filter(id => id !== taskId);
      return {
        ...project,
        tasks: updatedTasks,
        updatedAt: new Date().toISOString()
      };
    }
    return project;
  });
}

/**
 * Delete a project
 * @param projects Current project list
 * @param projectId ID of project to delete
 * @returns Updated project list
 */
export function deleteProject(projects: ProjectData[], projectId: string): ProjectData[] {
  return projects.filter((project) => project.id !== projectId);
} 