import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import prisma from '../prismaClient.js';
import { embeddingService } from '../services/embeddingService.js';
import { chunkingService } from '../services/chunkingService.js';
import { emitAppEvent } from '../events/eventBus.js';
import type {
  EmbeddingJobData,
  EmbedDocumentJobData,
  EmbedTextJobData,
  ReindexDocumentJobData
} from '../jobs/embeddingQueue.js';

// Process embedding jobs
const worker = new Worker<EmbeddingJobData>(
  'embedding-queue',
  async (job: Job<EmbeddingJobData>) => {
    console.log(`[EmbeddingWorker] Processing job ${job.id}: ${job.data.jobType}`);

    try {
      switch (job.data.jobType) {
        case 'EMBED_DOCUMENT':
          return await processDocumentEmbedding(job as Job<EmbedDocumentJobData>);
        case 'EMBED_TEXT':
          return await processTextEmbedding(job as Job<EmbedTextJobData>);
        case 'REINDEX_DOCUMENT':
          return await processDocumentReindex(job as Job<ReindexDocumentJobData>);
        default:
          throw new Error(`Unknown job type: ${(job.data as any).jobType}`);
      }
    } catch (error: any) {
      console.error(`[EmbeddingWorker] Job ${job.id} failed:`, error);
      throw error; // Re-throw to mark job as failed
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, // Process up to 5 jobs concurrently
    limiter: {
      max: 50, // Max 50 jobs per duration
      duration: 60000 // 1 minute (aligned with OpenAI rate limits)
    }
  }
);

/**
 * Process document embedding job
 */
async function processDocumentEmbedding(job: Job<EmbedDocumentJobData>) {
  const { documentId, content, sourceType, metadata } = job.data;

  // Update document status to PROCESSING
  await prisma.document.update({
    where: { id: documentId },
    data: { embeddingStatus: 'PROCESSING' }
  });

  // Emit progress event
  emitAppEvent({ type: 'embedding.started', payload: { documentId, jobId: job.id } });

  try {
    // Step 1: Chunk the content
    await job.updateProgress(10);
    let chunks;

    if (sourceType === 'csv' || sourceType === 'excel') {
      // Parse JSON content back to array for CSV/Excel
      const data = typeof content === 'string' ? JSON.parse(content) : content;
      chunks = chunkingService.chunkCSVData(data);
    } else {
      // PDF or text
      chunks = chunkingService.chunkText(content, {
        chunkSize: 512,
        chunkOverlap: 50,
        preserveSentences: true
      });
    }

    console.log(`[EmbeddingWorker] Created ${chunks.length} chunks for document ${documentId}`);

    if (chunks.length === 0) {
      throw new Error('No chunks created from content');
    }

    // Step 2: Generate embeddings for all chunks
    await job.updateProgress(30);
    const chunkTexts = chunks.map(c => c.content);
    const embeddingResult = await embeddingService.generateEmbeddingsBatch(chunkTexts);

    console.log(
      `[EmbeddingWorker] Generated ${embeddingResult.embeddings.length} embeddings ` +
      `(${embeddingResult.totalTokens} tokens, $${embeddingResult.costs.toFixed(4)} cost)`
    );

    // Step 3: Store chunks with embeddings in database
    await job.updateProgress(70);

    // Get document to find related entities
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { opportunity: true }
    });

    const chunksToCreate = chunks.map((chunk, index) => ({
      content: chunk.content,
      embedding: `[${embeddingResult.embeddings[index].join(',')}]`, // Format as PostgreSQL vector
      metadata: {
        ...metadata,
        ...chunk.metadata,
        sourceType,
        chunkIndex: index
      },
      tokens: chunk.tokens || chunkingService.estimateTokens(chunk.content),
      documentId,
      accountId: document?.opportunity?.accountId,
      opportunityId: document?.opportunityId
    }));

    // Batch create all chunks
    await prisma.$executeRaw`
      INSERT INTO "DocumentChunk" (content, embedding, metadata, tokens, "documentId", "accountId", "opportunityId", "createdAt")
      SELECT
        c.content::text,
        c.embedding::vector(1536),
        c.metadata::jsonb,
        c.tokens::integer,
        c."documentId"::integer,
        c."accountId"::integer,
        c."opportunityId"::integer,
        NOW()
      FROM json_populate_recordset(null::"DocumentChunk", ${JSON.stringify(chunksToCreate)}::json) c
    `;

    // Step 4: Update document status
    await job.updateProgress(90);
    await prisma.document.update({
      where: { id: documentId },
      data: {
        embeddingStatus: 'COMPLETED',
        chunkCount: chunks.length,
        embeddedAt: new Date()
      }
    });

    await job.updateProgress(100);

    // Emit completion event
    emitAppEvent({
      type: 'embedding.completed',
      payload: {
        documentId,
        jobId: job.id,
        chunkCount: chunks.length,
        totalTokens: embeddingResult.totalTokens,
        cost: embeddingResult.costs
      }
    });

    return {
      success: true,
      documentId,
      chunksCreated: chunks.length,
      totalTokens: embeddingResult.totalTokens,
      cost: embeddingResult.costs
    };
  } catch (error: any) {
    // Update document status to FAILED
    await prisma.document.update({
      where: { id: documentId },
      data: { embeddingStatus: 'FAILED' }
    });

    // Emit failure event
    emitAppEvent({
      type: 'embedding.failed',
      payload: {
        documentId,
        jobId: job.id,
        error: error.message
      }
    });

    throw error;
  }
}

/**
 * Process text embedding job (no document reference)
 */
async function processTextEmbedding(job: Job<EmbedTextJobData>) {
  const { content, accountId, opportunityId, sourceType, metadata } = job.data;

  emitAppEvent({ type: 'embedding.started', payload: { jobId: job.id, embeddingType: 'text' } });

  try {
    // Chunk the text
    const chunks = chunkingService.chunkText(content, {
      chunkSize: 512,
      chunkOverlap: 50,
      preserveSentences: true
    });

    if (chunks.length === 0) {
      throw new Error('No chunks created from text');
    }

    // Generate embeddings
    const chunkTexts = chunks.map(c => c.content);
    const embeddingResult = await embeddingService.generateEmbeddingsBatch(chunkTexts);

    // Store chunks
    const chunksToCreate = chunks.map((chunk, index) => ({
      content: chunk.content,
      embedding: `[${embeddingResult.embeddings[index].join(',')}]`,
      metadata: {
        ...metadata,
        sourceType,
        chunkIndex: index
      },
      tokens: chunk.tokens || chunkingService.estimateTokens(chunk.content),
      accountId,
      opportunityId
    }));

    await prisma.$executeRaw`
      INSERT INTO "DocumentChunk" (content, embedding, metadata, tokens, "accountId", "opportunityId", "createdAt")
      SELECT
        c.content::text,
        c.embedding::vector(1536),
        c.metadata::jsonb,
        c.tokens::integer,
        c."accountId"::integer,
        c."opportunityId"::integer,
        NOW()
      FROM json_populate_recordset(null::"DocumentChunk", ${JSON.stringify(chunksToCreate)}::json) c
    `;

    emitAppEvent({
      type: 'embedding.completed',
      payload: {
        jobId: job.id,
        embeddingType: 'text',
        chunkCount: chunks.length
      }
    });

    return {
      success: true,
      chunksCreated: chunks.length,
      totalTokens: embeddingResult.totalTokens,
      cost: embeddingResult.costs
    };
  } catch (error: any) {
    emitAppEvent({
      type: 'embedding.failed',
      payload: {
        jobId: job.id,
        embeddingType: 'text',
        error: error.message
      }
    });

    throw error;
  }
}

/**
 * Process document reindex job
 */
async function processDocumentReindex(job: Job<ReindexDocumentJobData>) {
  const { documentId } = job.data;

  console.log(`[EmbeddingWorker] Reindexing document ${documentId}`);

  // Delete existing chunks
  await prisma.documentChunk.deleteMany({
    where: { documentId }
  });

  // Get document content - would need to be stored or re-fetched
  // For now, just update status
  await prisma.document.update({
    where: { id: documentId },
    data: {
      embeddingStatus: 'PENDING',
      chunkCount: 0,
      embeddedAt: null
    }
  });

  return {
    success: true,
    documentId,
    message: 'Document chunks deleted, ready for re-embedding'
  };
}

// Worker event handlers
worker.on('completed', (job) => {
  console.log(`[EmbeddingWorker] Job ${job.id} completed successfully`);
});

worker.on('failed', (job, error) => {
  console.error(`[EmbeddingWorker] Job ${job?.id} failed:`, error.message);
});

worker.on('error', (error) => {
  console.error('[EmbeddingWorker] Worker error:', error);
});

console.log('[EmbeddingWorker] Started and listening for jobs...');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[EmbeddingWorker] SIGTERM received, closing worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[EmbeddingWorker] SIGINT received, closing worker...');
  await worker.close();
  process.exit(0);
});

export default worker;
