import { Router } from 'express';
import prisma from '../prismaClient';
import { asyncHandler } from './helpers.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rules = await prisma.workflowRule.findMany({
      include: { actions: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(rules);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, description, triggerType, triggerConfig, conditionConfig, actions } = req.body;

    if (!name || !triggerType) {
      return res.status(400).json({ message: 'name and triggerType are required' });
    }

    const rule = await prisma.workflowRule.create({
      data: {
        name,
        description,
        triggerType,
        triggerConfig,
        conditionConfig,
        actions: actions
          ? {
              create: actions.map((action: any) => ({
                type: action.type,
                actionConfig: action.actionConfig
              }))
            }
          : undefined
      },
      include: { actions: true }
    });

    res.status(201).json(rule);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { actions, ...rest } = req.body;
    const rule = await prisma.workflowRule.update({
      where: { id },
      data: {
        ...rest,
        actions: Array.isArray(actions)
          ? {
              deleteMany: {},
              create: actions.map((action: any) => ({
                type: action.type,
                actionConfig: action.actionConfig
              }))
            }
          : undefined
      },
      include: { actions: true }
    });
    res.json(rule);
  })
);

router.post(
  '/:id/toggle',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const rule = await prisma.workflowRule.update({
      where: { id },
      data: { isActive: req.body.isActive }
    });
    res.json(rule);
  })
);

export default router;
