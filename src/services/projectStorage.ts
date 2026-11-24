import { ProjectData, ProjectSummary } from '../types';

const DB_NAME = 'SmartCertificateGeneratorDB';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        store.createIndex('name', 'name', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves or updates a project in local IndexedDB
 */
export async function saveProjectToStorage(project: ProjectData): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const projectToStore: ProjectData = {
      ...project,
      updatedAt: Date.now(),
    };

    const request = store.put(projectToStore);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieves a project by ID from local IndexedDB
 */
export async function getProjectFromStorage(id: string): Promise<ProjectData | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Lists all stored project summaries sorted by most recent
 */
export async function listStoredProjects(): Promise<ProjectSummary[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const allProjects: ProjectData[] = request.result || [];
      const summaries: ProjectSummary[] = allProjects
        .map((p) => ({
          id: p.id,
          name: p.name || 'Untitled Certificate Project',
          updatedAt: p.updatedAt || p.createdAt || Date.now(),
          participantCount: p.participants?.length || 0,
          templateCount: p.templates?.length || 1,
          thumbnailUrl: p.templates?.[0]?.previewImageUrl,
        }))
        .sort((a, b) => b.updatedAt - a.updatedAt);

      resolve(summaries);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Deletes a project from local storage
 */
export async function deleteProjectFromStorage(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Exports project as a portable JSON file for external sharing or backup
 */
export function exportProjectFile(project: ProjectData): Blob {
  const jsonStr = JSON.stringify(project, null, 2);
  return new Blob([jsonStr], { type: 'application/json' });
}

/**
 * Validates and imports a project file from JSON string
 */
export function validateAndParseProjectFile(jsonContent: string): ProjectData {
  try {
    const parsed = JSON.parse(jsonContent);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid project file format: root must be an object');
    }
    if (!parsed.name) {
      parsed.name = 'Imported Project';
    }
    if (!parsed.id) {
      parsed.id = `proj-${Date.now()}`;
    }
    if (!Array.isArray(parsed.templates)) {
      parsed.templates = [];
    }
    if (!Array.isArray(parsed.fields)) {
      parsed.fields = [];
    }
    if (!Array.isArray(parsed.participants)) {
      parsed.participants = [];
    }
    return parsed as ProjectData;
  } catch (err: any) {
    throw new Error('Failed to parse project file: ' + err.message);
  }
}
