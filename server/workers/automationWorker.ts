import 'dotenv/config';
import { Worker } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import type { WorkflowJobData } from '../jobs/automationQueue.js';
import { processWorkflowJob } from '../services/workflowProcessor.js';

const WORKFLOW_QUEUE = 'automation:workflow';

const worker = new Worker<WorkflowJobData>(
  WORKFLOW_QUEUE,
  async job => {
    await processWorkflowJob(job.data);
  },
  {
    connection: redisConnection
  }
);

worker.on('completed', job => {
  console.info(`[automation-worker] completed job ${job.id}`);
});

worker.on('failed', (job, err) => {
  console.error(`[automation-worker] job ${job?.id ?? 'unknown'} failed`, err);
});

process.on('SIGINT', async () => {
  await worker.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await worker.close();
  process.exit(0);
});
