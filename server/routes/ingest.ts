import type { Request, Response } from 'express';
import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from './helpers.js';
import pdfParse from 'pdf-parse';

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
    res.json({ text, info: { pages: data.numpages ?? undefined } });
  })
);

export default router;
