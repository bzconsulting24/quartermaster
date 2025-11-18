import { Router } from 'express';
import prisma from '../prismaClient';
import { asyncHandler } from './helpers.js';
import { emitAppEvent } from '../events/eventBus.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { recipient, status } = req.query as { recipient?: string; status?: string };
    const notifications = await prisma.notification.findMany({
      where: {
        recipient,
        status: status as any
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  })
);

router.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const notification = await prisma.notification.update({
      where: { id },
      data: { status: 'READ', readAt: new Date() }
    });
    emitAppEvent({ type: 'notification.read', payload: { id: notification.id } });
    res.json(notification);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { title, body, recipient, accountId, type } = req.body;
    if (!title || !body || !recipient) {
      return res.status(400).json({ message: 'title, body, and recipient are required' });
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        body,
        recipient,
        accountId,
        type
      }
    });

    emitAppEvent({ type: 'notification.new', payload: { id: notification.id, title, body } });
    res.status(201).json(notification);
  })
);

export default router;
