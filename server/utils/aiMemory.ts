import fs from 'node:fs';
import path from 'node:path';

export type MemoryItem = { ts: string; by?: string; text: string };

const dataDir = path.resolve(process.cwd(), 'data');
const filePath = path.join(dataDir, 'ai_memory.jsonl');

let cache: MemoryItem[] = [];

function ensureDir() {
  try { fs.mkdirSync(dataDir, { recursive: true }); } catch {}
}

export function addMemory(item: MemoryItem) {
  ensureDir();
  try { fs.appendFileSync(filePath, JSON.stringify(item) + '\n'); } catch {}
  cache.unshift(item);
  cache = cache.slice(0, 1000);
}

export function getMemory(limit = 20): MemoryItem[] {
  if (!cache.length) {
    try {
      ensureDir();
      if (fs.existsSync(filePath)) {
        const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter(Boolean);
        cache = lines.reverse().map(l => { try { return JSON.parse(l) as MemoryItem; } catch { return null; } }).filter(Boolean) as MemoryItem[];
      }
    } catch {}
  }
  return cache.slice(0, limit);
}

export function clearMemory() {
  cache = [];
  try { ensureDir(); fs.writeFileSync(filePath, ''); } catch {}
}
