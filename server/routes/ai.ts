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
  const hasCommaAsDecimal = /,\d{1,2}$/.test(cleaned) && !cleaned.includes('.');
  const normalized = hasCommaAsDecimal ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned.replace(/,/g, '');
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
      const description = line.replace(qtyMatch[0], '').replace(priceMatch[0], '').replace(/[•*\-\s]{2,}/g, ' ').trim();
      if (unitPrice > 0) lines.push({ description: description || line, quantity, unitPrice });
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
      const prev = map.get(key)!; prev.quantity += it.quantity; prev.unitPrice = Math.max(prev.unitPrice, it.unitPrice);
    } else { map.set(key, { ...it }); }
  }
  return Array.from(map.values()).slice(0, 30);
}

async function draftWithOpenAI(kind: 'quote'|'invoice', content: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const prompt = `Extract structured line items for a ${kind} from the following context. Only return strict JSON. Schema: {\n  lines: Array<{ description: string; quantity: number; unitPrice: number }>,\n  subtotal: number\n}\nContext:\n${content}`;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You extract billing line items. Always respond with JSON only.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0, max_completion_tokens: 600
      })
    });
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const text = data.choices?.[0]?.message?.content ?? '';
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed.lines)) return null;
    const lines = parsed.lines.map((l: any) => ({ description: String(l.description || ''), quantity: Number(l.quantity || 1), unitPrice: Number(l.unitPrice || 0) })).filter((l: any) => l.description && l.unitPrice > 0 && l.quantity > 0).slice(0, 50);
    const subtotal = Number(parsed.subtotal ?? lines.reduce((s: number, l: any) => s + l.quantity * l.unitPrice, 0));
    return { lines, subtotal };
  } catch {
    return null;
  }
}

router.post(
  '/draft',
  asyncHandler(async (req, res) => {
    const body = req.body as DraftRequest;
    const combined = `${body.notes ?? ''}\n${body.pdfText ?? ''}`.trim();
    if (!combined) return res.status(400).json({ message: 'Provide notes or pdfText' });

    const ai = await draftWithOpenAI(body.kind, combined);
    if (ai) return res.json({ kind: body.kind, ...ai });

    const lines = extractLinesFromText(combined);
    const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    res.json({ kind: body.kind, lines, subtotal });
  })
);

// Generate invoice from natural language prompt
router.post(
  '/generate-invoice',
  asyncHandler(async (req, res) => {
    const { prompt } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(503).json({ message: 'OpenAI API key not configured' });
    }

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    try {
      const systemPrompt = `You are an invoice generation assistant. Extract or generate invoice information from the user's request. Return strict JSON with this schema:
{
  "accountName": "string (customer/company name)",
  "items": [{ "description": "string", "quantity": number, "rate": number }],
  "notes": "string (optional)",
  "dueDate": "ISO date string (optional)",
  "total": number
}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-5-nano',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_completion_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = (await response.json()) as any;
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(content);
      res.json(parsed);
    } catch (error) {
      console.error('AI generation error:', error);
      res.status(500).json({ message: 'Failed to generate invoice', error: String(error) });
    }
  })
);

// Generate estimate from natural language prompt
router.post(
  '/generate-estimate',
  asyncHandler(async (req, res) => {
    const { prompt } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(503).json({ message: 'OpenAI API key not configured' });
    }

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    try {
      const systemPrompt = `You are an estimate/quote generation assistant. Extract or generate estimate information from the user's request. Return strict JSON with this schema:
{
  "accountName": "string (customer/company name)",
  "items": [{ "description": "string", "quantity": number, "unitPrice": number, "discount": number }],
  "notes": "string (optional terms/conditions)",
  "expiresAt": "ISO date string (optional)",
  "total": number
}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-5-nano',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_completion_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = (await response.json()) as any;
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(content);
      res.json(parsed);
    } catch (error) {
      console.error('AI generation error:', error);
      res.status(500).json({ message: 'Failed to generate estimate', error: String(error) });
    }
  })
);

// Generate lead from natural language prompt
router.post(
  '/generate-lead',
  asyncHandler(async (req, res) => {
    const { prompt } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(503).json({ message: 'OpenAI API key not configured' });
    }

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    try {
      const systemPrompt = `You are a lead generation assistant. Extract or generate lead information from the user's request.
Return ONLY valid JSON in this exact format (use null for missing fields):
{
  "name": "string",
  "company": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "source": "string or null",
  "owner": "string or null",
  "notes": "string or null",
  "score": number or null,
  "companyName": "string or null"
}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-5-nano',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_completion_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenAI API error details:', errorData);
        throw new Error(`OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = (await response.json()) as any;
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(content);
      res.json(parsed);
    } catch (error) {
      console.error('AI generation error:', error);
      res.status(500).json({ message: 'Failed to generate lead', error: String(error) });
    }
  })
);

// Extract information from text/email
router.post(
  '/extract',
  asyncHandler(async (req, res) => {
    const { text, type } = req.body; // type: 'invoice', 'estimate', or 'lead'
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(503).json({ message: 'OpenAI API key not configured' });
    }

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ message: 'Text is required' });
    }

    let systemPrompt: string;

    if (type === 'lead') {
      systemPrompt = `You are a lead extraction assistant. Extract lead/contact information from the provided text.
Return ONLY valid JSON in this exact format (use null for missing fields):
{
  "name": "string",
  "company": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "source": "string or null",
  "owner": "string or null",
  "notes": "string or null",
  "score": number or null,
  "companyName": "string or null"
}`;
    } else {
      const docType = type === 'estimate' ? 'estimate/quote' : 'invoice';
      systemPrompt = `You are a document extraction assistant. Extract ${docType} information from the provided text. Return strict JSON with this schema:
{
  "customerName": "string (optional)",
  "items": [{ "description": "string", "quantity": number, ${type === 'estimate' ? '"unitPrice": number, "discount": number' : '"rate": number'} }],
  "total": number (optional),
  "issueDate": "ISO date string (optional)",
  "dueDate": "ISO date string (optional, for invoices)",
  "expiresAt": "ISO date string (optional, for estimates)",
  "notes": "string (optional)"
}`;
    }

    const docType = type === 'lead' ? 'lead' : (type === 'estimate' ? 'estimate/quote' : 'invoice');

    try {

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-5-nano',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Extract ${docType} information from this text:\n\n${text}` }
          ],
          response_format: { type: 'json_object' },
          temperature: 0,
          max_completion_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenAI API error details:', errorData);
        throw new Error(`OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = (await response.json()) as any;
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No response from AI');
      }

      const parsed = JSON.parse(content);
      res.json(parsed);
    } catch (error) {
      console.error('AI extraction error:', error);
      res.status(500).json({ message: 'Failed to extract information', error: String(error) });
    }
  })
);

export default router;

router.post(
  '/form-parse',
  asyncHandler(async (req, res) => {
    const { schema, text, pdfText } = req.body as { schema: Array<{ name: string; type?: string }>; text?: string; pdfText?: string };
    const content = `${text ?? ''}\n${pdfText ?? ''}`.trim();
    if (!schema || !Array.isArray(schema) || !content) return res.status(400).json({ message: 'schema and text/pdfText required' });
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Fallback: naive extraction by field name
      const out: Record<string, any> = {};
      for (const f of schema) {
        const m = content.match(new RegExp(`${f.name}[:\\-\\s]+(.{1,64})`, 'i'));
        if (m) out[f.name] = m[1].trim();
      }
      return res.json({ data: out });
    }
    const prompt = `Extract JSON matching the given schema (keys must match exactly) from the content. Only return JSON.\nSchema keys: ${schema.map(f => f.name).join(', ')}\nContent:\n${content}`;
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: 'You extract forms. Always respond with JSON only.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0, max_completion_tokens: 600
      })
    });
    const data = (await r.json()) as any;
    const textOut = data.choices?.[0]?.message?.content ?? '{}';
    let parsed: any = {};
    try { parsed = JSON.parse(textOut); } catch {}
    res.json({ data: parsed });
  })
);

