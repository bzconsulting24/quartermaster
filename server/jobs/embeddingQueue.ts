import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';

export interface EmbedDocumentJobData {
  jobType: 'EMBED_DOCUMENT';
  documentId: number;
  content: string;
  sourceType: 'pdf' | 'excel' | 'csv' | 'text';
  metadata?: Record<string, any>;
}

export interface EmbedTextJobData {
  jobType: 'EMBED_TEXT';
  content: string;
  accountId?: number;
  opportunityId?: number;
  sourceType: string;
  metadata?: Record<string, any>;
}

export interface ReindexDocumentJobData {
  jobType: 'REINDEX_DOCUMENT';
  documentId: number;
}

export type EmbeddingJobData =
  | EmbedDocumentJobData
  | EmbedTextJobData
  | ReindexDocumentJobData;

// Create embedding queue
export const embeddingQueue = new Queue<EmbeddingJobData>('embedding-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Retry up to 3 times on failure
    backoff: {
      type: 'exponential',
      delay: 2000 // Start with 2 second delay, doubles each retry
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000 // Keep last 1000 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600 // Keep failed jobs for 7 days
    }
  }
});

// Helper functions to add jobs to queue

/**
 * Queue a document for embedding generation
 */
export async function queueDocumentEmbedding(
  documentId: number,
  content: string,
  sourceType: 'pdf' | 'excel' | 'csv' | 'text',
  metadata?: Record<string, any>
): Promise<string> {
  const job = await embeddingQueue.add(
    'embed-document',
    {
      jobType: 'EMBED_DOCUMENT',
      documentId,
      content,
      sourceType,
      metadata
    },
    {
      priority: 1 // Normal priority
    }
  );

  console.log(`Queued document embedding job ${job.id} for document ${documentId}`);
  return job.id || '';
}

/**
 * Queue text content for embedding (without document reference)
 */
export async function queueTextEmbedding(
  content: string,
  sourceType: string,
  accountId?: number,
  opportunityId?: number,
  metadata?: Record<string, any>
): Promise<string> {
  const job = await embeddingQueue.add(
    'embed-text',
    {
      jobType: 'EMBED_TEXT',
      content,
      accountId,
      opportunityId,
      sourceType,
      metadata
    },
    {
      priority: 2 // Lower priority for standalone text
    }
  );

  console.log(`Queued text embedding job ${job.id}`);
  return job.id || '';
}

/**
 * Queue a document for re-indexing (delete old chunks and re-embed)
 */
export async function queueDocumentReindex(documentId: number): Promise<string> {
  const job = await embeddingQueue.add(
    'reindex-document',
    {
      jobType: 'REINDEX_DOCUMENT',
      documentId
    },
    {
      priority: 3 // Lower priority for re-indexing
    }
  );

  console.log(`Queued document reindex job ${job.id} for document ${documentId}`);
  return job.id || '';
}

/**
 * Get job status by ID
 */
export async function getJobStatus(jobId: string) {
  const job = await embeddingQueue.getJob(jobId);
  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress;
  const returnValue = job.returnvalue;
  const failedReason = job.failedReason;

  return {
    id: job.id,
    state,
    progress,
    data: job.data,
    result: returnValue,
    error: failedReason,
    attemptsMade: job.attemptsMade,
    timestamp: job.timestamp
  };
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const [waiting, active, completed, failed] = await Promise.all([
    embeddingQueue.getWaitingCount(),
    embeddingQueue.getActiveCount(),
    embeddingQueue.getCompletedCount(),
    embeddingQueue.getFailedCount()
  ]);

  return {
    waiting,
    active,
    completed,
    failed
  };
}
