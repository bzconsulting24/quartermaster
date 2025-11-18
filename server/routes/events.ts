import { Router } from 'express';
import { asyncHandler } from './helpers.js';
import { emitAppEvent, subscribeToEvents } from '../events/eventBus.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const send = (event: { type: string; payload: Record<string, unknown> }) => {
      res.write(`event: ${event.type}\n`);
      res.write(`data: ${JSON.stringify(event.payload)}\n\n`);
    };

    const unsubscribe = subscribeToEvents(send);

    req.on('close', () => {
      unsubscribe();
      res.end();
    });
  })
);

export const emitServerEvent = emitAppEvent;

export default router;
