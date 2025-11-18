import { Router } from 'express';
import { WorkflowTriggerType } from '@prisma/client';
import { asyncHandler } from './helpers.js';
import { enqueueWorkflowJob } from '../jobs/automationQueue.js';

const router = Router();

router.post(
  '/trigger',
  asyncHandler(async (req, res) => {
    const { triggerType, opportunityId, context } = req.body as {
      triggerType: WorkflowTriggerType;
      opportunityId?: number;
      context?: Record<string, unknown>;
    };

    if (!triggerType || !Object.values(WorkflowTriggerType).includes(triggerType)) {
      return res.status(400).json({ message: 'Invalid triggerType' });
    }

    await enqueueWorkflowJob({
      triggerType,
      opportunityId,
      context
    });

    res.status(202).json({ status: 'queued' });
  })
);

export default router;
