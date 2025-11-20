import { Router } from 'express';
import prisma from '../prismaClient';
import { asyncHandler } from './helpers.js';
const router = Router();
router.get('/', asyncHandler(async (_req, res) => {
    const contacts = await prisma.contact.findMany({
        include: {
            account: true
        },
        orderBy: { updatedAt: 'desc' }
    });
    res.json(contacts);
}));
router.post('/', asyncHandler(async (req, res) => {
    const { name, email, phone, title, owner, accountId } = req.body;
    if (!name || !email || !accountId)
        return res.status(400).json({ message: 'name, email, and accountId are required' });
    const contact = await prisma.contact.create({ data: { name, email, phone, title, owner, accountId } });
    res.status(201).json(contact);
}));
export default router;
router.patch('/:id', asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const contact = await prisma.contact.update({ where: { id }, data: req.body });
    res.json(contact);
}));
