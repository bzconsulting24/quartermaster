import { Router } from 'express';
import prisma from '../prismaClient';
import { asyncHandler } from './helpers.js';

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
    res.json(notification);
  })
);

export default router;
