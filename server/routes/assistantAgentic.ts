import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from './helpers.js';
import {
  getOrCreateAssistant,
  createThread,
  addMessage,
  uploadFile,
  runAssistant
} from '../services/assistantService.js';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit for OpenAI
});

// Store thread IDs per session (in production, use Redis or database)
const threadStore = new Map<string, string>();

// Initialize or get thread for a session
router.post(
  '/thread',
  asyncHandler(async (req, res) => {
    const { sessionId } = req.body as { sessionId?: string };

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId required' });
    }

    // Check if thread already exists
    let threadId = threadStore.get(sessionId);

    if (!threadId) {
      // Create new thread
      threadId = await createThread();
      threadStore.set(sessionId, threadId);
    }

    res.json({ threadId, sessionId });
  })
);

// Send message to assistant (with optional file)
router.post(
  '/message',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const { threadId, message } = req.body as { threadId: string; message: string };

    if (!threadId || !message) {
      return res.status(400).json({ error: 'threadId and message required' });
    }

    const assistant = await getOrCreateAssistant();

    // Handle file upload if present
    let fileIds: string[] | undefined;
    if (req.file) {
      const fileId = await uploadFile(req.file.buffer, req.file.originalname);
      fileIds = [fileId];
    }

    // Add message to thread
    await addMessage(threadId, message, fileIds);

    // Set up Server-Sent Events for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      // Run assistant and stream responses
      const stream = await runAssistant(threadId, assistant.id);

      for await (const event of stream) {
        // Send events to client
        res.write(`data: ${JSON.stringify(event)}\n\n`);

        if (event.type === 'done' || event.type === 'error') {
          res.end();
          break;
        }
      }
    } catch (error) {
      console.error('Assistant run error:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Assistant failed' })}\n\n`);
      res.end();
    }
  })
);

// Delete thread (clear conversation)
router.delete(
  '/thread/:threadId',
  asyncHandler(async (req, res) => {
    const { threadId } = req.params;

    // Remove from store
    for (const [sessionId, storedThreadId] of threadStore.entries()) {
      if (storedThreadId === threadId) {
        threadStore.delete(sessionId);
        break;
      }
    }

    res.json({ success: true });
  })
);

export default router;
