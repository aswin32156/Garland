import fs from 'fs';
import path from 'path';
import { Garland } from '@/types';
import { MOCK_GARLANDS } from '@/lib/mock-data';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'catalog.json');

// Ensure data directory and file exist
function ensureCatalogFile(): Garland[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(FILE_PATH)) {
      fs.writeFileSync(FILE_PATH, JSON.stringify(MOCK_GARLANDS, null, 2), 'utf-8');
      return MOCK_GARLANDS;
    }

    const raw = fs.readFileSync(FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }

    // Fallback if not an array
    fs.writeFileSync(FILE_PATH, JSON.stringify(MOCK_GARLANDS, null, 2), 'utf-8');
    return MOCK_GARLANDS;
  } catch (error) {
    console.error('Error reading catalog file:', error);
    return MOCK_GARLANDS;
  }
}

export function getStoredGarlands(): Garland[] {
  return ensureCatalogFile();
}

export function saveStoredGarlands(garlands: Garland[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(FILE_PATH, JSON.stringify(garlands, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing catalog file:', error);
  }
}

export function deleteStoredGarland(id: string): Garland[] {
  const current = getStoredGarlands();
  const updated = current.filter((g) => g.id !== id && g.slug !== id);
  saveStoredGarlands(updated);
  return updated;
}

export function addStoredGarland(garland: Garland): Garland[] {
  const current = getStoredGarlands();
  const updated = [garland, ...current.filter((g) => g.id !== garland.id)];
  saveStoredGarlands(updated);
  return updated;
}

export function updateStoredGarland(id: string, updates: Partial<Garland>): Garland[] {
  const current = getStoredGarlands();
  const updated = current.map((g) =>
    g.id === id ? { ...g, ...updates, updated_at: new Date().toISOString() } : g
  );
  saveStoredGarlands(updated);
  return updated;
}

export function resetStoredGarlands(): Garland[] {
  saveStoredGarlands(MOCK_GARLANDS);
  return MOCK_GARLANDS;
}
