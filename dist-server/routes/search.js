import { Router } from 'express';
import prisma from '../prismaClient';
import { asyncHandler } from './helpers.js';
const router = Router();
router.get('/', asyncHandler(async (req, res) => {
    const q = String(req.query.q ?? '').trim();
    if (!q || q.length < 2) {
        return res.json({ accounts: [], contacts: [], opportunities: [], tasks: [] });
    }
    const [accounts, contacts, opportunities, tasks] = await Promise.all([
        prisma.account.findMany({
            where: { OR: [{ name: { contains: q, mode: 'insensitive' } }, { industry: { contains: q, mode: 'insensitive' } }] },
            select: { id: true, name: true, industry: true, type: true }
        }),
        prisma.contact.findMany({
            where: {
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } },
                    { phone: { contains: q, mode: 'insensitive' } }
                ]
            },
            select: { id: true, name: true, email: true, phone: true, account: { select: { id: true, name: true } } }
        }),
        prisma.opportunity.findMany({
            where: {
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { owner: { contains: q, mode: 'insensitive' } }
                ]
            },
            select: { id: true, name: true, stage: true, amount: true, account: { select: { id: true, name: true } } }
        }),
        prisma.task.findMany({
            where: { title: { contains: q, mode: 'insensitive' } },
            select: { id: true, title: true, status: true, dueDate: true, assignedTo: true }
        })
    ]);
    res.json({ accounts, contacts, opportunities, tasks });
}));
export default router;
