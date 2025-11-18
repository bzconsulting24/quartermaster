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

router.post(
  '/:id/send',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const updated = await prisma.quote.update({ where: { id }, data: { status: 'SENT' as any } });
    res.json({ message: 'Estimate sent', quote: updated });
  })
);

router.post(
  '/:id/convert-to-invoice',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const quote = await prisma.quote.findUnique({ where: { id }, include: { lines: true, account: true } });
    if (!quote) return res.status(404).json({ message: 'Quote not found' });
    const amount = quote.lines.reduce((s, l) => s + (l.quantity ?? 1) * l.unitPrice, 0);
    const invoiceId = INV--;
    const invoice = await prisma.invoice.create({
      data: {
        id: invoiceId,
        amount,
        status: 'DRAFT',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 1000*60*60*24*30),
        accountId: quote.accountId,
        items: {
          create: quote.lines.map(l => ({ description: l.description, quantity: l.quantity ?? 1, rate: l.unitPrice }))
        }
      },
      include: { items: true, account: true }
    });
    // Log activity for audit\n    try {\n      if (quote.opportunityId) {\n        await prisma.activity.create({ data: { type: 'NOTE' as any, subject: 'Estimate converted', description: 'Converted to invoice ' + invoice.id, performedBy: 'system', opportunityId: quote.opportunityId } });\n      }\n    } catch {}\n    res.status(201).json({ message: 'Converted to invoice', invoice });
  })
);


router.get(
  '/:id/pdf',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const quote = await prisma.quote.findUnique({ where: { id }, include: { lines: true, account: true, opportunity: true } });
    if (!quote) return res.status(404).json({ message: 'Quote not found' });
    const PDFDocument = (await import('pdfkit')).default as any;
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="quote-${id}.pdf"`);

    doc.on('error', () => { /* ignore */ });
    doc.pipe(res);

    // Brand header
    doc.rect(0, 0, doc.page.width, 60).fill(String(process.env.BRAND_PRIMARY||'#0A2540'));
    doc.fillColor(String(process.env.BRAND_ACCENT||'#FDE68A')).fontSize(20).text(String(process.env.BRAND_NAME||'Quartermaster'), 40, 20);
    doc.fillColor('#FFFFFF').fontSize(12).text('Estimate', doc.page.width - 140, 22, { width: 100, align: 'right' });
    doc.moveDown();

    doc.fillColor('#111827');
    doc.moveDown(2);
    doc.fontSize(18).text(`Estimate #${quote.quoteNumber}`);
    doc.moveDown(0.5);
    doc.fontSize(12).text('Account: ' + (quote.account?.name || 'N/A'));
    if (quote.opportunity?.name) doc.text('Opportunity: ' + quote.opportunity.name);
    doc.moveDown();

    // Table header
    doc.fontSize(12).fillColor('#374151').text('Description', 40, doc.y, { continued: true });
    doc.text('Qty', 380, undefined, { width: 40, align: 'right', continued: true });
    doc.text('Rate', 440, undefined, { width: 60, align: 'right', continued: true });
    doc.text('Total', 510, undefined, { width: 60, align: 'right' });
    doc.moveDown(0.2);
    doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke('#E5E7EB');

    let subtotal = 0;
    doc.fillColor('#111827');
    for (const line of quote.lines) {
      const qty = line.quantity ?? 1;
      const rate = line.unitPrice;
      const total = qty * rate;
      subtotal += total;
      doc.moveDown(0.4);
      doc.text(line.description, 40, undefined, { width: 320 });
      const y = doc.y;
      doc.text(String(qty), 380, y, { width: 40, align: 'right' });
      doc.text(rate.toLocaleString(), 440, y, { width: 60, align: 'right' });
      doc.text(total.toLocaleString(), 510, y, { width: 60, align: 'right' });
    }

    doc.moveDown();
    doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke('#E5E7EB');
    doc.moveDown();
    doc.fontSize(12).fillColor('#111827').text('Subtotal', 400, undefined, { width: 100, align: 'right', continued: true });
    doc.fontSize(12).fillColor('#111827').text(subtotal.toLocaleString(), 510, undefined, { width: 60, align: 'right' });

    doc.end();
  })
);




