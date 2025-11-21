import { Router } from 'express';
import { asyncHandler } from './helpers.js';
import prisma from '../prismaClient.js';
import { embeddingService } from '../services/embeddingService.js';
import { getJobStatus, getQueueStats } from '../jobs/embeddingQueue.js';

const router = Router();

/**
 * Semantic search endpoint
 * POST /api/vector-search/query
 */
router.post(
  '/query',
  asyncHandler(async (req, res) => {
    const { query, topK = 10, accountId, opportunityId, sourceType } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Step 1: Generate embedding for the query
    const { embedding } = await embeddingService.generateEmbedding(query);

    // Step 2: Build the search query with filters
    const filters: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Format embedding as PostgreSQL vector
    const vectorString = `[${embedding.join(',')}]`;
    params.push(vectorString);
    const vectorParamIndex = paramIndex++;

    if (accountId) {
      params.push(accountId);
      filters.push(`"accountId" = $${paramIndex++}`);
    }

    if (opportunityId) {
      params.push(opportunityId);
      filters.push(`"opportunityId" = $${paramIndex++}`);
    }

    if (sourceType) {
      params.push(sourceType);
      filters.push(`metadata->>'sourceType' = $${paramIndex++}`);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    params.push(topK);
    const limitParamIndex = paramIndex++;

    // Step 3: Execute similarity search using pgvector
    // Using cosine distance (<=>): lower is better (0 = identical)
    const results = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        id,
        content,
        metadata,
        tokens,
        "documentId",
        "accountId",
        "opportunityId",
        "createdAt",
        1 - (embedding <=> $${vectorParamIndex}::vector) AS similarity
      FROM "DocumentChunk"
      ${whereClause}
      ORDER BY embedding <=> $${vectorParamIndex}::vector
      LIMIT $${limitParamIndex}
    `, ...params);

    // Step 4: Enrich results with related data
    const enrichedResults = await Promise.all(
      results.map(async (chunk) => {
        const related: any = {};

        if (chunk.documentId) {
          const document = await prisma.document.findUnique({
            where: { id: chunk.documentId },
            select: { id: true, name: true, type: true }
          });
          related.document = document;
        }

        if (chunk.accountId) {
          const account = await prisma.account.findUnique({
            where: { id: chunk.accountId },
            select: { id: true, name: true }
          });
          related.account = account;
        }

        if (chunk.opportunityId) {
          const opportunity = await prisma.opportunity.findUnique({
            where: { id: chunk.opportunityId },
            select: { id: true, name: true, stage: true }
          });
          related.opportunity = opportunity;
        }

        return {
          id: chunk.id,
          content: chunk.content,
          similarity: parseFloat(chunk.similarity.toFixed(4)),
          tokens: chunk.tokens,
          metadata: chunk.metadata,
          createdAt: chunk.createdAt,
          ...related
        };
      })
    );

    res.json({
      query,
      results: enrichedResults,
      count: enrichedResults.length
    });
  })
);

/**
 * Get embedding job status
 * GET /api/vector-search/status/:jobId
 */
router.get(
  '/status/:jobId',
  asyncHandler(async (req, res) => {
    const { jobId } = req.params;
    const status = await getJobStatus(jobId);

    if (!status) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(status);
  })
);

/**
 * Get queue statistics
 * GET /api/vector-search/queue-stats
 */
router.get(
  '/queue-stats',
  asyncHandler(async (req, res) => {
    const stats = await getQueueStats();
    res.json(stats);
  })
);

/**
 * Reindex all documents
 * POST /api/vector-search/reindex-all
 */
router.post(
  '/reindex-all',
  asyncHandler(async (req, res) => {
    // Delete all existing chunks
    const deletedCount = await prisma.documentChunk.deleteMany({});

    // Reset all document statuses
    await prisma.document.updateMany({
      data: {
        embeddingStatus: 'PENDING',
        chunkCount: 0,
        embeddedAt: null
      }
    });

    res.json({
      message: 'All documents queued for reindexing',
      deletedChunks: deletedCount.count,
      note: 'Documents need to be re-uploaded or content needs to be re-queued'
    });
  })
);

/**
 * Get document chunks
 * GET /api/vector-search/document/:documentId/chunks
 */
router.get(
  '/document/:documentId/chunks',
  asyncHandler(async (req, res) => {
    const documentId = parseInt(req.params.documentId);

    if (isNaN(documentId)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        chunks: {
          select: {
            id: true,
            content: true,
            metadata: true,
            tokens: true,
            createdAt: true
          },
          orderBy: {
            id: 'asc'
          }
        }
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({
      document: {
        id: document.id,
        name: document.name,
        embeddingStatus: document.embeddingStatus,
        chunkCount: document.chunkCount,
        embeddedAt: document.embeddedAt
      },
      chunks: document.chunks
    });
  })
);

/**
 * Delete document and its chunks
 * DELETE /api/vector-search/document/:documentId
 */
router.delete(
  '/document/:documentId',
  asyncHandler(async (req, res) => {
    const documentId = parseInt(req.params.documentId);

    if (isNaN(documentId)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    // Chunks will be cascade deleted due to foreign key constraint
    await prisma.document.delete({
      where: { id: documentId }
    });

    res.json({ message: 'Document and chunks deleted successfully' });
  })
);

export default router;
