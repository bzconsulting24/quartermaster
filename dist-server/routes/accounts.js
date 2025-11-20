import { Router } from 'express';
import prisma from '../prismaClient';
import { asyncHandler } from './helpers.js';
const router = Router();
router.get('/', asyncHandler(async (_req, res) => {
    const accounts = await prisma.account.findMany({
        include: {
            _count: {
                select: {
                    contacts: true,
                    opportunities: true,
                    invoices: true
                }
            }
        },
        orderBy: { name: 'asc' }
    });
    res.json(accounts);
}));
router.post('/', asyncHandler(async (req, res) => {
    const { name, industry, type, revenue, employees, owner, phone, website, location } = req.body;
    if (!name)
        return res.status(400).json({ message: 'name is required' });
    const account = await prisma.account.create({
        data: { name, industry, type, revenue, employees, owner, phone, website, location }
    });
    res.status(201).json(account);
}));
export default router;
router.patch('/:id', asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const account = await prisma.account.update({ where: { id }, data: req.body });
    res.json(account);
}));
