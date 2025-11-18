import { Router } from 'express';
import prisma from '../prismaClient';
import { asyncHandler } from './helpers.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { limit, opportunityId } = req.query as { limit?: string; opportunityId?: string };
    const take = limit ? Number(limit) : undefined;
    const parsedOpportunityId = opportunityId ? Number(opportunityId) : undefined;

    const activities = await prisma.activity.findMany({
      where: parsedOpportunityId ? { opportunityId: parsedOpportunityId } : undefined,
      orderBy: { performedAt: 'desc' },
      take,
      include: {
        opportunity: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json(activities);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { type='NOTE', subject, description, performedBy='user', opportunityId } = req.body as any;
    if (!subject) return res.status(400).json({ message: 'subject required' });
    const activity = await prisma.activity.create({ data: { type, subject, description, performedBy, opportunityId } });
    res.status(201).json(activity);
  })
);

export default router;

