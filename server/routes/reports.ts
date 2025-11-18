import { Router } from 'express';
import prisma from '../prismaClient';
import { asyncHandler } from './helpers.js';
import { presentStage } from '../utils/stageUtils.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [pipelineSum, wonThisMonthSum, totalOpportunities, wonOpportunities, stageGroup] = await Promise.all([
      prisma.opportunity.aggregate({
        _sum: { amount: true }
      }),
      prisma.opportunity.aggregate({
        _sum: { amount: true },
        where: {
          stage: 'ClosedWon',
          closeDate: { gte: startOfMonth }
        }
      }),
      prisma.opportunity.count(),
      prisma.opportunity.count({
        where: { stage: 'ClosedWon' }
      }),
      prisma.opportunity.groupBy({
        by: ['stage'],
        _count: { _all: true },
        _sum: { amount: true }
      })
    ]);

    const avgDealSize =
      totalOpportunities > 0 && pipelineSum._sum.amount
        ? Math.round((pipelineSum._sum.amount ?? 0) / totalOpportunities)
        : 0;

    res.json({
      summary: {
        totalPipeline: pipelineSum._sum.amount ?? 0,
        wonThisMonth: wonThisMonthSum._sum.amount ?? 0,
        winRate: totalOpportunities > 0 ? Math.round((wonOpportunities / totalOpportunities) * 100) : 0,
        averageDealSize: avgDealSize
      },
      stageBreakdown: stageGroup.map(stage => ({
        stage: presentStage(stage.stage),
        count: stage._count._all,
        amount: stage._sum.amount ?? 0
      }))
    });
  })
);

export default router;
