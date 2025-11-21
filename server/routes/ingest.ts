import type { Request, Response } from 'express';
import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from './helpers.js';
import pdfParse from 'pdf-parse';
import prisma from '../prismaClient.js';
import { queueDocumentEmbedding, getJobStatus } from '../jobs/embeddingQueue.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
type UploadRequest = Request & { file?: Express.Multer.File };

router.post(
  '/pdf',
  upload.single('file'),
  asyncHandler(async (req: UploadRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ message: 'file is required' });
    }

    const data = await pdfParse(req.file.buffer);
    const text = data.text ?? '';

    // Optionally create a Document record and queue for embedding
    const { opportunityId, autoEmbed } = req.body;

    let document = null;
    let jobId = null;

    if (autoEmbed === 'true' || autoEmbed === true) {
      // Create document record
      document = await prisma.document.create({
        data: {
          name: req.file.originalname,
          type: req.file.mimetype,
          size: `${Math.round(req.file.size / 1024)} KB`,
          uploadedBy: req.body.uploadedBy || 'Unknown',
          opportunityId: opportunityId ? parseInt(opportunityId) : undefined,
          embeddingStatus: 'PENDING'
        }
      });

      // Queue for embedding
      jobId = await queueDocumentEmbedding(
        document.id,
        text,
        'pdf',
        {
          fileName: req.file.originalname,
          pages: data.numpages
        }
      );
    }

    res.json({
      text,
      info: { pages: data.numpages ?? undefined },
      document: document ? { id: document.id, embeddingJobId: jobId } : null
    });
  })
);

// Check embedding job status
router.get(
  '/embedding-status/:jobId',
  asyncHandler(async (req: Request, res: Response) => {
    const { jobId } = req.params;
    const status = await getJobStatus(jobId);

    if (!status) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(status);
  })
);

export default router;
