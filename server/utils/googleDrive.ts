import { Readable } from 'node:stream';
import { google, drive_v3 } from 'googleapis';
import fs from 'node:fs';
import path from 'node:path';

const tokenPath = path.resolve(process.cwd(), 'data', 'google_tokens.json');

function ensureDataDir() {
  try { fs.mkdirSync(path.dirname(tokenPath), { recursive: true }); } catch {}
}

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URL || process.env.GOOGLE_REDIRECT;
  if (!clientId || !clientSecret || !redirectUri) return null;
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  try {
    if (fs.existsSync(tokenPath)) {
      const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
      oauth2Client.setCredentials(tokens);
    }
  } catch {}
  return oauth2Client;
}

export function getAuthUrl(): string | null {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) return null;
  const scopes = [
    'https://www.googleapis.com/auth/drive.file',
  ];
  return oauth2Client.generateAuthUrl({ access_type: 'offline', scope: scopes, prompt: 'consent' });
}

export async function handleOAuthCallback(code: string) {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) throw new Error('Drive not configured');
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  ensureDataDir();
  fs.writeFileSync(tokenPath, JSON.stringify(tokens));
  return { ok: true };
}

function getDrive(): drive_v3.Drive | null {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) return null;
  return google.drive({ version: 'v3', auth: oauth2Client });
}

export function hasDriveAuth(): boolean {
  try { return fs.existsSync(tokenPath); } catch { return false; }
}

export async function uploadBuffer(name: string, buf: Buffer, mimeType = 'application/octet-stream') {
  const drive = getDrive();
  if (!drive) throw new Error('Drive not configured');
  const media = { mimeType, body: Readable.from(buf) as any };
  const fileMetadata = { name };
  const res = await drive.files.create({ requestBody: fileMetadata as any, media } as any);
  return res.data;
}