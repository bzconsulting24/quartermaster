import { Router } from 'express';
import { asyncHandler } from './helpers.js';

const router = Router();

type DraftRequest = {
  kind: 'quote' | 'invoice';
  accountId?: number;
  notes?: string;
  pdfText?: string;
};

function parseNumber(n: string): number {
  const cleaned = n.replace(/[^0-9.,-]/g, '');
  const hasCommaAsDecimal = /,\d{1,2}$/.test(cleaned) && cleaned.includes('.') === false;
  const normalized = hasCommaAsDecimal
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned.replace(/,/g, '');
  const num = Number(normalized);
  return Number.isFinite(num) ? num : 0;
}

function extractLinesFromText(text: string): Array<{ description: string; quantity: number; unitPrice: number }> {
  const lines: Array<{ description: string; quantity: number; unitPrice: number }> = [];
  const candidates = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of candidates) {
    const qtyMatch = line.match(/\b(qty|quantity)\s*[:x-]?\s*(\d{1,4})\b/i) || line.match(/\b(\d{1,4})\s*x\b/i);
    const priceMatch = line.match(/\b(price|rate|unit|each)\s*[:x-]?\s*([\d.,]{2,})\b/i) || line.match(/\b([\d.,]{3,})\b(?!.*\b\d)/);
    if (qtyMatch && priceMatch) {
      const quantity = parseInt((qtyMatch[2] ?? qtyMatch[1] ?? '1') as string, 10) || 1;
      const unitPrice = parseNumber((priceMatch[2] ?? priceMatch[1]) as string);
      const description = line
        .replace(qtyMatch[0], '')
        .replace(priceMatch[0], '')
        .replace(/[•*\-\s]{2,}/g, ' ')
        .trim();
      if (unitPrice > 0) {
        lines.push({ description: description || line, quantity, unitPrice });
      }
      continue;
    }
    const tailAmount = line.match(/([\d.,]{3,})\s*$/);
    if (tailAmount) {
      const unitPrice = parseNumber(tailAmount[1] as string);
      if (unitPrice > 0) {
        const description = line.replace(tailAmount[1] as string, '').trim();
        lines.push({ description: description || line, quantity: 1, unitPrice });
      }
    }
  }
  const map = new Map<string, { description: string; quantity: number; unitPrice: number }>();
  for (const it of lines) {
    const key = it.description.toLowerCase();
    if (map.has(key)) {
      const prev = map.get(key)!;
      prev.quantity += it.quantity;
      prev.unitPrice = Math.max(prev.unitPrice, it.unitPrice);
    } else {
      map.set(key, { ...it });
    }
  }
  return Array.from(map.values()).slice(0, 30);
}

router.post(
  '/draft',
  asyncHandler(async (req, res) => {
    const body = req.body as DraftRequest;
    const text = `${body.notes ?? ''}\n${body.pdfText ?? ''}`.trim();
    if (!text) {
      return res.status(400).json({ message: 'Provide notes or pdfText' });
    }
    const lines = extractLinesFromText(text);
    const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    res.json({ kind: body.kind, lines, subtotal });
  })
);

export default router;
