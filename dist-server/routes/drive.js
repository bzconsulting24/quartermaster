import { Router } from 'express';
import { asyncHandler } from './helpers.js';
import { getAuthUrl, handleOAuthCallback, hasDriveAuth, uploadBuffer } from '../utils/googleDrive.js';
import prisma from '../prismaClient';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
const router = Router();
router.get('/status', asyncHandler(async (_req, res) => {
    res.json({ connected: hasDriveAuth() });
}));
router.get('/auth-url', asyncHandler(async (_req, res) => {
    const url = getAuthUrl();
    if (!url)
        return res.status(400).json({ message: 'Drive not configured' });
    res.json({ url });
}));
router.get('/callback', asyncHandler(async (req, res) => {
    const code = String(req.query.code ?? '');
    if (!code)
        return res.status(400).json({ message: 'code required' });
    await handleOAuthCallback(code);
    res.json({ ok: true });
}));
async function renderEstimatePdfBuffer(id) {
    const PDFDocument = (await import('pdfkit')).default;
    const doc = new PDFDocument({ margin: 40 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('error', () => { });
    const quote = await prisma.quote.findUnique({ where: { id }, include: { lines: true, account: true, opportunity: true } });
    if (!quote)
        throw new Error('Quote not found');
    doc.rect(0, 0, doc.page.width, 60).fill(String(process.env.BRAND_PRIMARY || '#0A2540'));
    doc.fillColor(String(process.env.BRAND_ACCENT || '#FDE68A')).fontSize(20).text(String(process.env.BRAND_NAME || 'Quartermaster'), 40, 20);
    doc.fillColor('#FFFFFF').fontSize(12).text('Estimate', doc.page.width - 140, 22, { width: 100, align: 'right' });
    doc.fillColor('#111827');
    doc.moveDown(2);
    doc.fontSize(18).text(`Estimate #${quote.number}`);
    doc.moveDown(0.5);
    doc.fontSize(12).text('Account: ' + (quote.account?.name || 'N/A'));
    if (quote.opportunity?.name)
        doc.text('Opportunity: ' + quote.opportunity.name);
    doc.moveDown();
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
    doc.text(subtotal.toLocaleString(), 510, undefined, { width: 60, align: 'right' });
    doc.end();
    await new Promise((r) => doc.on('end', r));
    return Buffer.concat(chunks);
}
router.post('/upload/estimate/:id', asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const buf = await renderEstimatePdfBuffer(id);
    const file = await uploadBuffer(`estimate-${id}.pdf`, buf, 'application/pdf');
    res.json({ ok: true, file });
}));
router.post('/upload/invoice/:id', asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const invoice = await prisma.invoice.findUnique({ where: { id }, include: { items: true, account: true } });
    if (!invoice)
        return res.status(404).json({ message: 'Invoice not found' });
    const PDFDocument = (await import('pdfkit')).default;
    const doc = new PDFDocument({ margin: 40 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('error', () => { });
    doc.rect(0, 0, doc.page.width, 60).fill(String(process.env.BRAND_PRIMARY || '#0A2540'));
    doc.fillColor(String(process.env.BRAND_ACCENT || '#FDE68A')).fontSize(20).text(String(process.env.BRAND_NAME || 'Quartermaster'), 40, 20);
    doc.fillColor('#FFFFFF').fontSize(12).text('Invoice', doc.page.width - 140, 22, { width: 100, align: 'right' });
    doc.fillColor('#111827');
    doc.moveDown(2);
    doc.fontSize(18).text(`Invoice #${invoice.id}`);
    let subtotal = 0;
    for (const it of invoice.items) {
        subtotal += it.quantity * it.rate;
    }
    doc.fontSize(12).text('Account: ' + (invoice.account?.name || 'N/A'));
    doc.end();
    await new Promise((r) => doc.on('end', r));
    const buf = Buffer.concat(chunks);
    const file = await uploadBuffer(`invoice-${invoice.id}.pdf`, buf, 'application/pdf');
    res.json({ ok: true, file });
}));
function toCSV(rows, headers) {
    const escape = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n');
}
router.post('/export/estimates/csv', asyncHandler(async (_req, res) => {
    const quotes = await prisma.quote.findMany({ orderBy: { issuedAt: 'desc' } });
    const headers = ['id', 'number', 'status', 'total', 'currency', 'issuedAt', 'expiresAt'];
    const csv = toCSV(quotes, headers);
    const file = await uploadBuffer('estimates.csv', Buffer.from(csv), 'text/csv');
    res.json({ ok: true, file });
}));
router.post('/export/estimates/xlsx', asyncHandler(async (_req, res) => {
    const { utils, write } = await import('xlsx');
    const rows = await prisma.quote.findMany({ orderBy: { issuedAt: 'desc' } });
    const wb = utils.book_new();
    const ws = utils.json_to_sheet(rows);
    utils.book_append_sheet(wb, ws, 'Estimates');
    const buf = write(wb, { type: 'buffer', bookType: 'xlsx' });
    const file = await uploadBuffer('estimates.xlsx', buf, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.json({ ok: true, file });
}));
router.post('/export/invoices/csv', asyncHandler(async (_req, res) => {
    const invoices = await prisma.invoice.findMany({ orderBy: { issueDate: 'desc' } });
    const headers = ['id', 'status', 'amount', 'issueDate', 'dueDate', 'paidDate'];
    const csv = toCSV(invoices, headers);
    const file = await uploadBuffer('invoices.csv', Buffer.from(csv), 'text/csv');
    res.json({ ok: true, file });
}));
router.post('/export/invoices/xlsx', asyncHandler(async (_req, res) => {
    const { utils, write } = await import('xlsx');
    const rows = await prisma.invoice.findMany({ orderBy: { issueDate: 'desc' } });
    const wb = utils.book_new();
    const ws = utils.json_to_sheet(rows);
    utils.book_append_sheet(wb, ws, 'Invoices');
    const buf = write(wb, { type: 'buffer', bookType: 'xlsx' });
    const file = await uploadBuffer('invoices.xlsx', buf, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.json({ ok: true, file });
}));
router.post('/local/estimate/:id', asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const dir = process.env.LOCAL_EXPORT_DIR || path.resolve(process.cwd(), 'exports');
    mkdirSync(dir, { recursive: true });
    const buf = await renderEstimatePdfBuffer(id);
    const out = path.join(dir, `estimate-${id}.pdf`);
    writeFileSync(out, buf);
    res.json({ ok: true, file: out });
}));
router.post('/local/invoice/:id', asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const dir = process.env.LOCAL_EXPORT_DIR || path.resolve(process.cwd(), 'exports');
    mkdirSync(dir, { recursive: true });
    const out = path.join(dir, `invoice-${id}.pdf`);
    writeFileSync(out, Buffer.from(`PDF placeholder for invoice ${id}`));
    res.json({ ok: true, file: out });
}));
router.post('/local/invoices/csv', asyncHandler(async (_req, res) => {
    const dir = process.env.LOCAL_EXPORT_DIR || path.resolve(process.cwd(), 'exports');
    mkdirSync(dir, { recursive: true });
    const invoices = await prisma.invoice.findMany({ orderBy: { issueDate: 'desc' } });
    const headers = ['id', 'status', 'amount', 'issueDate', 'dueDate', 'paidDate'];
    const csv = toCSV(invoices, headers);
    const out = path.join(dir, 'invoices.csv');
    writeFileSync(out, csv);
    res.json({ ok: true, file: out });
}));
router.post('/local/estimates/csv', asyncHandler(async (_req, res) => {
    const dir = process.env.LOCAL_EXPORT_DIR || path.resolve(process.cwd(), 'exports');
    mkdirSync(dir, { recursive: true });
    const quotes = await prisma.quote.findMany({ orderBy: { issuedAt: 'desc' } });
    const headers = ['id', 'number', 'status', 'total', 'currency', 'issuedAt', 'expiresAt'];
    const csv = toCSV(quotes, headers);
    const out = path.join(dir, 'estimates.csv');
    writeFileSync(out, csv);
    res.json({ ok: true, file: out });
}));
export default router;
