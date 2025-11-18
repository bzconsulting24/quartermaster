import { Router } from 'express';
import prisma from '../prismaClient';
import { asyncHandler } from './helpers.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status } = req.query as { status?: string };
    const leads = await prisma.lead.findMany({
      where: status ? { status: status as any } : undefined,
      include: { account: true, opportunity: true },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(leads);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, company, email, phone, source, status, owner, score, notes, accountId } = req.body as {
      name: string;
      company?: string;
      email?: string;
      phone?: string;
      source?: string;
      status?: string;
      owner?: string;
      score?: number;
      notes?: string;
      accountId?: number;
    };

    if (!name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        company,
        email,
        phone,
        source,
        status: (status as any) ?? 'NEW',
        owner,
        score,
        notes,
        accountId
      }
    });

    res.status(201).json(lead);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const lead = await prisma.lead.update({
      where: { id },
      data: req.body
    });
    res.json(lead);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    await prisma.lead.delete({ where: { id } });
    res.status(204).send();
  })
);

export default router;
