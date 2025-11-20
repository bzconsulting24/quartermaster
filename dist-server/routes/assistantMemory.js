import { Router } from 'express';
import { asyncHandler } from './helpers.js';
import { addMemory, clearMemory, getMemory } from '../utils/aiMemory.js';
const router = Router();
router.get('/', asyncHandler(async (req, res) => {
    const limit = Number(req.query.limit ?? 20);
    const items = getMemory(Math.max(1, Math.min(100, limit)));
    res.json({ items });
}));
router.post('/', asyncHandler(async (req, res) => {
    const { text } = req.body;
    if (!text || !String(text).trim())
        return res.status(400).json({ message: 'text is required' });
    const item = { ts: new Date().toISOString(), by: 'user', text: String(text).trim() };
    addMemory(item);
    res.status(201).json({ ok: true, item });
}));
router.delete('/', asyncHandler(async (_req, res) => {
    clearMemory();
    res.json({ ok: true });
}));
export default router;
