import { Router } from 'express';
import prisma from '../prismaClient';
import { asyncHandler } from './helpers.js';
const router = Router();
router.get('/', asyncHandler(async (_req, res) => {
    const contracts = await prisma.contract.findMany({
        include: { account: true, opportunity: true },
        orderBy: { startDate: 'desc' }
    });
    res.json(contracts);
}));
router.post('/', asyncHandler(async (req, res) => {
    const { contractNumber, status, startDate, endDate, value, terms, accountId, opportunityId } = req.body;
    if (!contractNumber || !startDate || !accountId) {
        return res.status(400).json({ message: 'contractNumber, startDate, and accountId are required' });
    }
    const contract = await prisma.contract.create({
        data: {
            contractNumber,
            status: status ?? 'DRAFT',
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : undefined,
            value,
            terms,
            accountId,
            opportunityId
        }
    });
    res.status(201).json(contract);
}));
router.patch('/:id', asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const contract = await prisma.contract.update({
        where: { id },
        data: {
            ...req.body,
            startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
            endDate: req.body.endDate ? new Date(req.body.endDate) : undefined
        }
    });
    res.json(contract);
}));
router.delete('/:id', asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    await prisma.contract.delete({ where: { id } });
    res.status(204).send();
}));
export default router;
