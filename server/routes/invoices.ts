import { Router } from 'express';
import prisma from '../prismaClient';
import { asyncHandler } from './helpers.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const invoices = await prisma.invoice.findMany({
      include: {
        account: true,
        items: true
      },
      orderBy: { issueDate: 'desc' }
    });

    res.json(invoices);
  })
);

export default router;

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { id, amount, status, issueDate, dueDate, paidDate, notes, accountId, items } = req.body as {
      id: string;
      amount: number;
      status?: string;
      issueDate?: string;
      dueDate?: string;
      paidDate?: string | null;
      notes?: string;
      accountId: number;
      items?: Array<{ description: string; quantity?: number; rate: number }>;
    };

    if (!id || !accountId) {
      return res.status(400).json({ message: 'Invoice id and accountId are required' });
    }

    const invoice = await prisma.invoice.create({
      data: {
        id,
        amount,
        status: (status as any) ?? 'DRAFT',
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        paidDate: paidDate ? new Date(paidDate) : undefined,
        notes,
        accountId,
        items: items
          ? {
              create: items.map((it) => ({ description: it.description, quantity: it.quantity ?? 1, rate: it.rate }))
            }
          : undefined
      },
      include: { items: true }
    });

    res.status(201).json(invoice);
  })
);
