import { Router } from 'express';
import prisma from '../prismaClient';
import { asyncHandler } from './helpers.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { opportunityId, taskId } = req.query as { opportunityId?: string; taskId?: string };
    const insights = await prisma.aiInsight.findMany({
      where: {
        opportunityId: opportunityId ? Number(opportunityId) : undefined,
        taskId: taskId ? Number(taskId) : undefined
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(insights);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { type, summary, confidence, metadata, opportunityId, taskId } = req.body;

    if (!type || !summary) {
      return res.status(400).json({ message: 'type and summary are required' });
    }

    const insight = await prisma.aiInsight.create({
      data: { type, summary, confidence, metadata, opportunityId, taskId }
    });

    res.status(201).json(insight);
  })
);

export default router;
