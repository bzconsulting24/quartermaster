import { Router } from 'express';
import prisma from '../prismaClient';
import { asyncHandler } from './helpers.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const tasks = await prisma.task.findMany({
      include: {
        opportunity: {
          include: {
            account: true
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    res.json(tasks);
  })
);

export default router;
