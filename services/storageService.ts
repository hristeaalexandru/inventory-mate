import { Project, InventoryItem } from '../types';

const STORAGE_KEY = 'inventory_mate_projects';

export const getProjects = (): Project[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load projects", error);
    return [];
  }
};

export const saveProjects = (projects: Project[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error("Failed to save projects", error);
  }
};

export const createProject = (name: string, description: string): Project => {
  const projects = getProjects();
  const newProject: Project = {
    id: crypto.randomUUID(),
    name,
    description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isLocked: false,
    items: [],
  };
  saveProjects([...projects, newProject]);
  return newProject;
};

export const deleteProject = (id: string): void => {
  const projects = getProjects().filter(p => p.id !== id);
  saveProjects(projects);
};

export const getProjectById = (id: string): Project | undefined => {
  return getProjects().find(p => p.id === id);
};

export const updateProjectItems = (projectId: string, items: InventoryItem[]): void => {
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === projectId);
  if (index !== -1) {
    projects[index] = {
      ...projects[index],
      items,
      updatedAt: new Date().toISOString(),
      isLocked: items.length > 0
    };
    saveProjects(projects);
  }
};