import fs from 'node:fs';
import path from 'node:path';
const tokenPath = path.resolve(process.cwd(), 'data', 'onedrive_tokens.json');
function ensureDir() { try {
    fs.mkdirSync(path.dirname(tokenPath), { recursive: true });
}
catch { } }
export function hasOneDriveAuth() {
    try {
        return fs.existsSync(tokenPath);
    }
    catch {
        return false;
    }
}
export function saveTokens(tokens) {
    ensureDir();
    fs.writeFileSync(tokenPath, JSON.stringify(tokens));
}
export function getTokens() {
    try {
        if (fs.existsSync(tokenPath))
            return JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    }
    catch { }
    return null;
}
