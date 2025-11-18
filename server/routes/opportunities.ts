import { Router } from 'express';
import prisma from '../prismaClient';
import type { Stage } from '@prisma/client';
import { asyncHandler } from './helpers.js';
import { stageLabelToEnum, presentStage } from './stageLabels.js';

const router = Router();

const normalizeStageInput = (incoming?: string | Stage): Stage | undefined => {
  if (!incoming) return undefined;
  if (stageLabelToEnum[incoming]) {
    return stageLabelToEnum[incoming];
  }
  return incoming as Stage;
};

const serializeOpportunity = <T extends { stage: Stage }>(opportunity: T) => ({
  ...opportunity,
  stage: presentStage(opportunity.stage)
});

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const opportunities = await prisma.opportunity.findMany({
      include: {
        account: true,
        contact: true,
        activities: true,
        tasks: true,
        documents: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(opportunities.map(serializeOpportunity));
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);

    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        account: true,
        contact: true,
        activities: true,
        tasks: true,
        documents: true
      }
    });

    if (!opportunity) {
      return res.status(404).json({ message: 'Opportunity not found' });
    }

    res.json(opportunity ? serializeOpportunity(opportunity) : opportunity);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, amount, closeDate, accountId, contactId, owner, probability, stage, email, phone } = req.body as {
      name: string;
      amount: number;
      closeDate: string;
      accountId: number;
      contactId?: number;
      owner: string;
      probability?: number;
      stage?: Stage;
      email?: string;
      phone?: string;
    };

    if (!name || !amount || !closeDate || !accountId) {
      return res.status(400).json({ message: 'name, amount, closeDate, and accountId are required' });
    }

    const normalizedStage = normalizeStageInput(stage) ?? 'Prospecting';

    const newOpportunity = await prisma.opportunity.create({
      data: {
        name,
        amount,
        closeDate: new Date(closeDate),
        accountId,
        contactId,
        owner,
        probability: probability ?? 0,
        stage: normalizedStage,
        email,
        phone
      }
    });

    res.status(201).json(serializeOpportunity(newOpportunity));
  })
);

router.patch(
  '/:id/stage',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { stage } = req.body as { stage: string | Stage };
    const normalizedStage = normalizeStageInput(stage);

    if (!normalizedStage) {
      return res.status(400).json({ message: 'Invalid stage value' });
    }

    const updated = await prisma.opportunity.update({
      where: { id },
      data: { stage: normalizedStage }
    });

    res.json(serializeOpportunity(updated));
  })
);

router.patch(
  '/:id/probability',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { probability } = req.body as { probability: number };

    const updated = await prisma.opportunity.update({
      where: { id },
      data: { probability }
    });

    res.json(serializeOpportunity(updated));
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    await prisma.opportunity.delete({ where: { id } });
    res.status(204).send();
  })
);

export default router;
