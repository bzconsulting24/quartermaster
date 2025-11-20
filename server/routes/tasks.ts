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

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { title, dueDate, priority, assignedTo, status, opportunityId, accountId } = req.body as any;
    if (!title || !dueDate || !assignedTo) return res.status(400).json({ message: 'title, dueDate, assignedTo required' });
    const task = await prisma.task.create({ data: { title, dueDate: new Date(dueDate), priority: (priority as any) ?? 'MEDIUM', status: (status as any) ?? 'OPEN', assignedTo, opportunityId, accountId } });
    res.status(201).json(task);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const taskId = parseInt(id, 10);
    if (isNaN(taskId)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    const updates = req.body;
    const task = await prisma.task.update({
      where: { id: taskId },
      data: updates
    });

    res.json(task);
  })
);

export default router;

