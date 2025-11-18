import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import type { WorkflowTriggerType } from '@prisma/client';

export type WorkflowJobData = {
  triggerType: WorkflowTriggerType;
  opportunityId?: number;
  context?: Record<string, unknown>;
};

const QUEUE_NAME = 'automation-workflow';

export const automationQueue = new Queue<WorkflowJobData>(QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 25
  }
});

export const enqueueWorkflowJob = async (data: WorkflowJobData) => {
  await automationQueue.add(`workflow-${data.triggerType}`, data);
};
