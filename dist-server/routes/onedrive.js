import { Router } from 'express';
import { asyncHandler } from './helpers.js';
import { hasOneDriveAuth, saveTokens } from '../utils/oneDrive.js';
const router = Router();
router.get('/status', asyncHandler(async (_req, res) => {
    res.json({ connected: hasOneDriveAuth() });
}));
router.get('/auth-url', asyncHandler(async (_req, res) => {
    const clientId = process.env.MS_CLIENT_ID;
    const redirectUri = process.env.MS_REDIRECT_URI || process.env.MS_REDIRECT_URL || process.env.MS_REDIRECT;
    const tenant = process.env.MS_TENANT_ID || 'common';
    if (!clientId || !redirectUri)
        return res.status(400).json({ message: 'OneDrive not configured' });
    const scope = encodeURIComponent('Files.ReadWrite.AppFolder offline_access');
    const url = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?client_id=${encodeURIComponent(clientId)}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&response_mode=query&scope=${scope}`;
    res.json({ url });
}));
router.get('/callback', asyncHandler(async (req, res) => {
    const code = String(req.query.code ?? '');
    const clientId = process.env.MS_CLIENT_ID;
    const clientSecret = process.env.MS_CLIENT_SECRET;
    const redirectUri = process.env.MS_REDIRECT_URI || process.env.MS_REDIRECT_URL || process.env.MS_REDIRECT;
    const tenant = process.env.MS_TENANT_ID || 'common';
    if (!code || !clientId || !clientSecret || !redirectUri)
        return res.status(400).json({ message: 'Missing config/code' });
    const tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
    });
    const r = await fetch(tokenUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    if (!r.ok)
        return res.status(400).json({ message: 'Token exchange failed' });
    const j = await r.json();
    saveTokens(j);
    res.json({ ok: true });
}));
router.post('/upload/invoice/:id', asyncHandler(async (_req, res) => {
    if (!hasOneDriveAuth())
        return res.status(400).json({ message: 'Connect OneDrive first' });
    res.status(501).json({ message: 'Upload not yet implemented' });
}));
export default router;
