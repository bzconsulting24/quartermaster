import { Router } from 'express';
import prisma from '../prismaClient';
import { asyncHandler } from './helpers.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
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
  })
);

export default router;
