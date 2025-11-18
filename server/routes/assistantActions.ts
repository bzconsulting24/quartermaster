import { Router } from 'express';
import prisma from '../prismaClient';
import { asyncHandler } from './helpers.js';
import { addMemory, getMemory } from '../utils/aiMemory.js';

const router = Router();

type Entity = 'account'|'contact'|'lead'|'opportunity'|'task'|'estimate'|'invoice';
type Mode = 'dryRun'|'apply';

type Action =
  | { type: 'update'; entity: Entity; where: { id?: number; match?: Record<string, any> }; data: Record<string, unknown>; reason?: string }
  | { type: 'create'; entity: Entity; data: Record<string, unknown>; reason?: string };

const ALLOWED: Record<Entity, true> = {
  account: true,
  contact: true,
  lead: true,
  opportunity: true,
  task: true,
  estimate: true,
  invoice: true,
};

function coerceEntity(e: unknown): Entity | null {
  if (typeof e !== 'string') return null;
  return (Object.keys(ALLOWED) as Entity[]).includes(e as Entity) ? (e as Entity) : null;
}

function mapEntityToPrisma(entity: Entity) {
  switch (entity) {
    case 'account': return prisma.account;
    case 'contact': return prisma.contact;
    case 'lead': return prisma.lead;
    case 'opportunity': return prisma.opportunity;
    case 'task': return prisma.task;
    case 'estimate': return prisma.quote;
    case 'invoice': return prisma.invoice;
  }
}

async function findId(entity: Entity, where: { id?: number; match?: Record<string, any> }) {
  if (where.id) return where.id;
  const client = mapEntityToPrisma(entity);
  const match = where.match ?? {};
  const one = await (client as any).findFirst({ where: match, select: { id: true } });
  return one?.id ?? null;
}

async function applyActions(mode: Mode, actions: Action[]) {
  const diffs: Array<{ entity: Entity; id?: number; before?: any; after?: any; createdId?: any; action: string }>=[];
  if (actions.length > 50) throw new Error('Too many actions');

  for (const a of actions) {
    if (!ALLOWED[coerceEntity((a as any).entity) as Entity]) throw new Error(`Entity not allowed: ${(a as any).entity}`);
  }

  if (mode === 'dryRun') {
    for (const a of actions) {
      if (a.type === 'update') {
        const id = await findId(a.entity, a.where);
        const client = mapEntityToPrisma(a.entity);
        if (!id) { diffs.push({ entity: a.entity, action: 'update', before: null, after: a.data }); continue; }
        const before = await (client as any).findUnique({ where: { id } });
        diffs.push({ entity: a.entity, id, action: 'update', before, after: { ...before, ...a.data } });
      } else if (a.type === 'create') {
        diffs.push({ entity: a.entity, action: 'create', before: null, after: a.data });
      }
    }
    return { diffs };
  }

  const result = await prisma.$transaction(async (_tx) => {
    for (const a of actions) {
      if (a.type === 'update') {
        const id = await findId(a.entity, a.where);
        const client = mapEntityToPrisma(a.entity);
        if (!id) continue;
        const before = await (client as any).findUnique({ where: { id } });
        const updated = await (client as any).update({ where: { id }, data: a.data });
        diffs.push({ entity: a.entity, id, action: 'update', before, after: updated });
      } else if (a.type === 'create') {
        const client = mapEntityToPrisma(a.entity);
        const created = await (client as any).create({ data: a.data });
        diffs.push({ entity: a.entity, createdId: (created as any).id, action: 'create', before: null, after: created });
      }
    }
    return { diffs };
  });

  for (const d of result.diffs) {
    try {
      addMemory({ ts: new Date().toISOString(), by: 'assistant', text: `${d.action} ${d.entity} ${d.id ?? d.createdId ?? ''}` });
      let opportunityId: number | undefined;
      const after = (d as any).after || {};
      const before = (d as any).before || {};
      if (d.entity === 'opportunity') opportunityId = (d.id as number | undefined);
      if (d.entity === 'estimate') opportunityId = (after.opportunityId ?? before.opportunityId);
      if (d.entity === 'task') opportunityId = (after.opportunityId ?? before.opportunityId);
      if (opportunityId) {
        await prisma.activity.create({ data: { type: 'NOTE' as any, subject: 'Assistant change', description: `${d.action} ${d.entity} ${d.id ?? d.createdId ?? ''}`, performedBy: 'assistant', opportunityId } });
      }
    } catch {}
  }
  return result;
}

async function openAIPlan(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const mem = getMemory(20).map((m) => `- ${m.text}`).join('\n');
  const sys = 'You are a CRM assistant. Output only JSON. Schema: { actions: Array<Action> } where Action is one of: { type:"update", entity, where:{ id?:number, match?:object }, data:object, reason?:string } | { type:"create", entity, data:object, reason?:string }. Entities: account, contact, lead, opportunity, task, estimate, invoice. Use at most 25 actions. Do not delete.';
  const body: any = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: `Memory:\n${mem}\n\nInstruction:\n${prompt}` }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1
  };
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify(body)
  });
  if (!r.ok) return null;
  const j = await r.json();
  const text = j.choices?.[0]?.message?.content ?? '{}';
  try { return JSON.parse(text); } catch { return null; }
}

router.post('/', asyncHandler(async (req, res) => {
  const { prompt, mode = 'dryRun', actions: provided } = req.body as { prompt?: string; mode?: Mode; actions?: Action[] };
  if (!prompt && !provided) return res.status(400).json({ message: 'prompt or actions required' });

  let actions: Action[] | null = provided ?? null;
  if (!actions) {
    const plan = await openAIPlan(String(prompt));
    if (!plan?.actions || !Array.isArray(plan.actions)) return res.status(400).json({ message: 'AI failed to produce actions' });
    actions = plan.actions as Action[];
  }

  const cleaned: Action[] = [];
  for (const a of actions) {
    if (!a || typeof a !== 'object') continue;
    if (a.type !== 'update' && a.type !== 'create') continue;
    const ent = coerceEntity((a as any).entity);
    if (!ent) continue;
    if (a.type === 'update') cleaned.push({ type: 'update', entity: ent, where: (a as any).where ?? {}, data: a.data ?? {}, reason: a.reason });
    else cleaned.push({ type: 'create', entity: ent, data: a.data ?? {}, reason: a.reason });
    if (cleaned.length >= 50) break;
  }

  const capped = cleaned.slice(0, 50);
  const result = await applyActions(mode as Mode, capped);
  res.json({ mode, actions: capped.length, ...result });
}));

export default router;