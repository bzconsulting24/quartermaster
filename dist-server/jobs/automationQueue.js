import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';
const QUEUE_NAME = 'automation-workflow';
export const automationQueue = new Queue(QUEUE_NAME, {
    connection: redisConnection,
    defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 25
    }
});
export const enqueueWorkflowJob = async (data) => {
    await automationQueue.add(`workflow-${data.triggerType}`, data);
};
