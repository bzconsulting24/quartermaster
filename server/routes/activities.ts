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

export default router;
