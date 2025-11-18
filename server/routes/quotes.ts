import { Router } from 'express';
import prisma from '../prismaClient';
import { asyncHandler } from './helpers.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const quotes = await prisma.quote.findMany({
      include: {
        lines: true,
        account: true,
        opportunity: true
      },
      orderBy: { issuedAt: 'desc' }
    });
    res.json(quotes);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: { lines: true, account: true, opportunity: true }
    });
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }
    res.json(quote);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { number, status, total, currency, issuedAt, expiresAt, notes, accountId, opportunityId, lines } = req.body as {
      number: string;
      status?: string;
      total: number;
      currency?: string;
      issuedAt?: string;
      expiresAt?: string;
      notes?: string;
      accountId: number;
      opportunityId?: number;
      lines?: Array<{ description: string; quantity?: number; unitPrice: number; productId?: number }>;
    };

    if (!number || !accountId) {
      return res.status(400).json({ message: 'Quote number and accountId are required' });
    }

    const quote = await prisma.quote.create({
      data: {
        number,
        status: (status as any) ?? 'DRAFT',
        total,
        currency,
        issuedAt: issuedAt ? new Date(issuedAt) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        notes,
        accountId,
        opportunityId,
        lines: lines
          ? {
              create: lines.map(line => ({
                description: line.description,
                quantity: line.quantity ?? 1,
                unitPrice: line.unitPrice,
                productId: line.productId
              }))
            }
          : undefined
      },
      include: { lines: true }
    });

    res.status(201).json(quote);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { lines, ...rest } = req.body;
    const quote = await prisma.quote.update({
      where: { id },
      data: {
        ...rest,
        lines: lines
          ? {
              deleteMany: {},
              create: lines.map((line: any) => ({
                description: line.description,
                quantity: line.quantity ?? 1,
                unitPrice: line.unitPrice,
                productId: line.productId
              }))
            }
          : undefined
      },
      include: { lines: true }
    });
    res.json(quote);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    await prisma.quote.delete({ where: { id } });
    res.status(204).send();
  })
);

export default router;
