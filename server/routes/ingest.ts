import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from './helpers.js';
import pdfParseCjs from 'pdf-parse';
const pdfParse: any = (pdfParseCjs as any).default ?? (pdfParseCjs as any);

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post(
  '/pdf',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'file is required' });
    }
    const data = await (pdfParse as any)(req.file.buffer);
    const text: string = (data as any).text || '';
    res.json({ text, info: { pages: (data as any).numpages ?? undefined } });
  })
);

export default router;
