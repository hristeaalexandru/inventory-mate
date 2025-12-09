import { Project, InventoryItem } from '../types';

/**
 * SERVICIU DE STOCARE ASINCRON
 * 
 * Structura este acum pregătită pentru integrarea cu un server extern.
 * Funcțiile returnează Promise-uri, simulând comportamentul unui API real.
 */

const STORAGE_KEY = 'inventory_mate_projects';

// Helper pentru a genera ID-uri unice
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Citire date (GET)
export const getProjects = async (): Promise<Project[]> => {
  return new Promise((resolve) => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      resolve(data ? JSON.parse(data) : []);
    } catch (error) {
      console.error("Failed to load projects", error);
      resolve([]);
    }
  });
};

// Salvare internă (Private helper)
const saveProjectsInternal = (projects: Project[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error("Failed to save projects", error);
  }
};

// Creare Proiect (POST)
export const createProject = async (name: string, description: string): Promise<Project> => {
  const projects = await getProjects();
  const newProject: Project = {
    id: generateId(),
    name,
    description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isLocked: false,
    items: [],
  };
  
  saveProjectsInternal([...projects, newProject]);
  return newProject;
};

// Ștergere Proiect (DELETE)
export const deleteProject = async (id: string): Promise<void> => {
  const projects = await getProjects();
  const filteredProjects = projects.filter(p => p.id !== id);
  
  if (projects.length === filteredProjects.length) {
    // Proiectul nu a fost găsit, dar considerăm operațiunea reușită (idempotent)
    return;
  }
  
  saveProjectsInternal(filteredProjects);
};

// Găsire Proiect după ID (GET single)
export const getProjectById = async (id: string): Promise<Project | undefined> => {
  const projects = await getProjects();
  return projects.find(p => p.id === id);
};

// Actualizare Items (PUT/PATCH)
export const updateProjectItems = async (projectId: string, items: InventoryItem[]): Promise<void> => {
  const projects = await getProjects();
  const index = projects.findIndex(p => p.id === projectId);
  
  if (index !== -1) {
    projects[index] = {
      ...projects[index],
      items,
      updatedAt: new Date().toISOString(),
      // Blocăm proiectul automat dacă am adăugat iteme
      isLocked: items.length > 0 ? true : projects[index].isLocked
    };
    saveProjectsInternal(projects);
  }
};