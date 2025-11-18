import { Router } from 'express';
import prisma from '../prismaClient';
import { asyncHandler } from './helpers.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const invoices = await prisma.invoice.findMany({
      include: {
        account: true,
        items: true
      },
      orderBy: { issueDate: 'desc' }
    });

    res.json(invoices);
  })
);

export default router;
