import { Router } from 'express';
import prisma from '../prismaClient';
import { asyncHandler } from './helpers.js';
const router = Router();
router.get('/', asyncHandler(async (_req, res) => {
    const products = await prisma.product.findMany({
        orderBy: { name: 'asc' }
    });
    res.json(products);
}));
router.post('/', asyncHandler(async (req, res) => {
    const { name, sku, description, unitPrice, currency } = req.body;
    if (!name || !unitPrice) {
        return res.status(400).json({ message: 'name and unitPrice are required' });
    }
    const product = await prisma.product.create({
        data: {
            name,
            sku,
            description,
            unitPrice,
            currency
        }
    });
    res.status(201).json(product);
}));
router.patch('/:id', asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const product = await prisma.product.update({
        where: { id },
        data: req.body
    });
    res.json(product);
}));
router.delete('/:id', asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    await prisma.product.delete({ where: { id } });
    res.status(204).send();
}));
export default router;
