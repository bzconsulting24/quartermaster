import fs from 'node:fs';
import path from 'node:path';
import { createClient } from 'ioredis';

export type MemoryItem = { ts: string; by?: string; text: string };

const dataDir = path.resolve(process.cwd(), 'data');
const filePath = path.join(dataDir, 'ai_memory.jsonl');

let cache: MemoryItem[] = [];
let redis:
  | ReturnType<typeof createClient>
  | null = null;
const redisKey = 'quartermaster:ai_memory';

function ensureDir() {
  try { fs.mkdirSync(dataDir, { recursive: true }); } catch {}
}

function initRedis() {
  if (redis || !process.env.REDIS_URL) return;
  try {
    redis = new (createClient as any)(process.env.REDIS_URL!);
  } catch {
    redis = null;
  }
}

export function addMemory(item: MemoryItem) {
  initRedis();
  if (redis) {
    try { (redis as any).lpush(redisKey, JSON.stringify(item)); (redis as any).ltrim(redisKey, 0, 999); } catch {}
  } else {
    ensureDir();
    try { fs.appendFileSync(filePath, JSON.stringify(item) + '\n'); } catch {}
    cache.unshift(item);
    cache = cache.slice(0, 1000);
  }
}

export function getMemory(limit = 20): MemoryItem[] {
  initRedis();
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
  initRedis();
  if (redis) {
    try { (redis as any).del(redisKey); } catch {}
  }
  cache = [];
  try { ensureDir(); fs.writeFileSync(filePath, ''); } catch {}
}