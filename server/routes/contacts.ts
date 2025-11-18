import { Router } from 'express';
import prisma from '../prismaClient';
import { asyncHandler } from './helpers.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const contacts = await prisma.contact.findMany({
      include: {
        account: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(contacts);
  })
);

export default router;


router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const contact = await prisma.contact.update({ where: { id }, data: req.body });
    res.json(contact);
  })
);

