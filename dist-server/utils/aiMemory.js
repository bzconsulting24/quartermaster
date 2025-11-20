import fs from 'node:fs';
import path from 'node:path';
const dataDir = path.resolve(process.cwd(), 'data');
const filePath = path.join(dataDir, 'ai_memory.jsonl');
let cache = [];
function ensureDir() {
    try {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    catch { }
}
export function addMemory(item) {
    ensureDir();
    try {
        fs.appendFileSync(filePath, JSON.stringify(item) + '\n');
    }
    catch { }
    cache.unshift(item);
    cache = cache.slice(0, 1000);
}
export function getMemory(limit = 20) {
    if (!cache.length) {
        try {
            ensureDir();
            if (fs.existsSync(filePath)) {
                const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter(Boolean);
                cache = lines.reverse().map(l => { try {
                    return JSON.parse(l);
                }
                catch {
                    return null;
                } }).filter(Boolean);
            }
        }
        catch { }
    }
    return cache.slice(0, limit);
}
export function clearMemory() {
    cache = [];
    try {
        ensureDir();
        fs.writeFileSync(filePath, '');
    }
    catch { }
}
