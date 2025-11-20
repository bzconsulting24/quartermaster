import { Router } from 'express';
import prisma from '../prismaClient';
import { asyncHandler } from './helpers.js';
import { AIInsightType } from '@prisma/client';

const router = Router();

const summarizeOpportunity = (opportunity: any) => {
  const parts = [
    `${opportunity.name} (${opportunity.stage}) worth ${Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0
    }).format(opportunity.amount)}.`,
    opportunity.account ? `Account: ${opportunity.account.name}.` : '',
    opportunity.contact ? `Primary contact: ${opportunity.contact.name}.` : '',
    `Owner: ${opportunity.owner} with ${opportunity.probability}% confidence.`
  ].filter(Boolean);

  if (opportunity.tasks?.length) {
    const tasks = opportunity.tasks
      .slice(0, 2)
      .map((task: any) => `${task.title} (due ${task.dueDate.toISOString().slice(0, 10)})`)
      .join('; ');
    parts.push(`Open tasks: ${tasks}.`);
  }

  if (opportunity.quotes?.length) {
    const mostRecent = opportunity.quotes[0];
    parts.push(`Latest quote ${mostRecent.number} at ${Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0
    }).format(mostRecent.total)} (${mostRecent.status}).`);
  }

  return parts.join(' ');
};

const buildResponse = (prompt: string, opportunitySummary?: string, metrics?: Record<string, number>) => {
  const lower = prompt.toLowerCase();
  if (opportunitySummary) {
    if (lower.includes('next step') || lower.includes('plan')) {
      return `${opportunitySummary} Suggested next step: confirm stakeholder alignment and schedule the next decision call. Mention any blockers and share progress with the team.`;
    }
    if (lower.includes('risk')) {
      return `${opportunitySummary} Risks: ensure the champion remains engaged and track open tasks. Escalate if due dates fall within 3 days.`;
    }
    return `Summary for this opportunity: ${opportunitySummary}`;
  }

  if (metrics) {
    if (lower.includes('summary') || lower.includes('pipeline')) {
      return `Pipeline overview: ₱${(metrics.totalPipeline / 1_000_000).toFixed(1)}M total, ${metrics.activeDeals} active deals, won this month ₱${(metrics.wonThisMonth / 1_000_000).toFixed(1)}M. Tasks due today: ${metrics.tasksDue}.`;
    }
    if (lower.includes('stress') || lower.includes('workload')) {
      return `You have ${metrics.tasksDue} open tasks due now and ${metrics.activeDeals} deals in flight. Consider delegating overdue work and reviewing idle opportunities.`;
    }
  }

  return `I'm here to help with summaries, next steps, or risk scans. Ask me about a specific opportunity or request a pipeline overview.`;
};

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { messages, userName, model, systemPrompt, temperature, maxTokens } = req.body as {
      messages?: Array<{ role: string; content: string }>;
      userName?: string;
      model?: string;
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    };

    if (!messages || !messages.length) {
      return res.status(400).json({ message: 'messages array is required' });
    }

    const userDisplayName = userName || 'User';
    const llmModel = model || 'gpt-4o-mini';
    const llmTemperature = temperature !== undefined ? temperature : 0.7;
    const llmMaxTokens = maxTokens || 1000;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'OpenAI API key not configured' });
    }

    // Get FULL CRM context for the AI
    const [
      opportunities,
      accounts,
      contacts,
      tasks,
      invoices,
      quotes,
      leads,
      aiInsights
    ] = await Promise.all([
      prisma.opportunity.findMany({
        include: {
          account: true,
          contact: true,
          tasks: { where: { status: { not: 'COMPLETED' } } }
        },
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.account.findMany({
        include: {
          _count: {
            select: { contacts: true, opportunities: true }
          }
        }
      }),
      prisma.contact.findMany({
        include: { account: true }
      }),
      prisma.task.findMany({
        where: { status: { not: 'COMPLETED' } },
        include: { account: true, opportunity: true }
      }),
      prisma.invoice.findMany({
        include: { account: true },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      prisma.quote.findMany({
        include: { account: true, opportunity: true },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      prisma.lead.findMany({
        include: { account: true },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      prisma.aIInsight.findMany({
        include: { opportunity: true },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    // Calculate metrics
    const totalPipeline = opportunities.reduce((sum, o) => sum + o.amount, 0);
    const activeDeals = opportunities.filter(o => !['ClosedWon', 'ClosedLost'].includes(o.stage)).length;
    const wonThisMonth = opportunities
      .filter(o => o.stage === 'ClosedWon' && o.closeDate >= new Date(new Date().getFullYear(), new Date().getMonth(), 1))
      .reduce((sum, o) => sum + o.amount, 0);

    const crmContext = {
      metrics: {
        totalPipeline,
        activeDeals,
        wonThisMonth,
        tasksDue: tasks.length,
        totalAccounts: accounts.length,
        totalContacts: contacts.length,
        totalLeads: leads.length
      },
      opportunities: opportunities.map(o => ({
        id: o.id,
        name: o.name,
        stage: o.stage,
        amount: o.amount,
        probability: o.probability,
        owner: o.owner,
        account: o.account?.name,
        contact: o.contact?.name,
        openTasks: o.tasks?.length || 0
      })),
      accounts: accounts.map(a => ({
        id: a.id,
        name: a.name,
        industry: a.industry,
        type: a.type,
        revenue: a.revenue,
        location: a.location,
        contactCount: a._count.contacts,
        opportunityCount: a._count.opportunities
      })),
      contacts: contacts.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        title: c.title,
        account: c.account.name
      })),
      tasks: tasks.map(t => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate,
        priority: t.priority,
        assignedTo: t.assignedTo,
        account: t.account?.name,
        opportunity: t.opportunity?.name
      })),
      recentInvoices: invoices.slice(0, 10).map(i => ({
        id: i.id,
        amount: i.amount,
        status: i.status,
        account: i.account.name,
        dueDate: i.dueDate
      })),
      recentQuotes: quotes.slice(0, 10).map(q => ({
        id: q.id,
        number: q.number,
        total: q.total,
        status: q.status,
        account: q.account.name
      })),
      recentLeads: leads.slice(0, 10).map(l => ({
        id: l.id,
        name: l.name,
        company: l.company,
        status: l.status,
        score: l.score
      })),
      previousInsights: aiInsights.map(i => ({
        type: i.type,
        summary: i.summary,
        opportunity: i.opportunity?.name
      }))
    };

    // Build system prompt
    const defaultSystemPrompt = `You are Quartermaster AI, a warm, empathetic, and multilingual CRM assistant. You speak both English and Tagalog fluently and respond in the language the user uses.

You are assisting ${userDisplayName}. When appropriate, you can refer to them by name to make the conversation more personal.

PERSONALITY:
- Direct and helpful (NO greetings like "Kumusta!" or "Hey there!" - just answer)
- Empathetic and supportive ("I can see you're busy with those 10 tasks, ${userDisplayName}...")
- Proactive and helpful ("Would you like me to...?")
- Natural and human-like (avoid robotic responses)
- Use Filipino expressions naturally when speaking Tagalog (e.g., "Sige!", "Oo naman!", "Walang problema!")
- Occasionally use the user's name (${userDisplayName}) to make responses more personal, but don't overuse it

LANGUAGE RULES:
- Match the user's language (English or Tagalog)
- If user mixes languages (Taglish), respond naturally in the same style
- Use casual, conversational tone appropriate for the language
- Filipino numbers/amounts: "5K" or "₱5,000" both acceptable

You have access to the COMPLETE CRM database:
${JSON.stringify(crmContext, null, 2)}

IMPORTANT: You MUST respond in valid JSON format with this ADHD-FRIENDLY structure using MARKDOWN:
{
  "message": "Short summary or direct answer (1-2 sentences max). NO greetings. Use **bold** for emphasis.",
  "insights": [
    // Each insight MUST be specific, data-driven, and in MARKDOWN format
    // Use **bold** for numbers and key data
    // ✅ GOOD: "📊 **₱2.4M** pipeline across **12** active deals"
    // ❌ BAD: "You have some opportunities that need attention"
    "📊 **₱X.XM** metric: **number** with description",
    "⚠️ **X overdue** tasks: Company1 (n), Company2 (n)",
    "🎯 **CompanyName** deal at **X%** - worth **₱XXK**"
  ],
  "recommendations": [
    // Each recommendation MUST be actionable with MARKDOWN formatting
    // Use **bold** for actions and important terms
    // ✅ GOOD: "🔔 **TODAY**: Clear **3** Globe overdue tasks"
    // ❌ BAD: "Follow up with important accounts"
    "✅ **Action**: Specific step with **who/what/when**",
    "🔔 **Priority**: **Urgent** item with deadline",
    "💡 **Quick win**: Easy task with clear outcome"
  ],
  "actions": [
    // Include this ONLY when user requests an action to be executed
    {
      "type": "CREATE_INVOICE" | "CREATE_LEAD" | "CREATE_CONTACT" | "CREATE_OPPORTUNITY" | "CREATE_TASK" | "SCHEDULE_MEETING" | "UPDATE_OPPORTUNITY_STAGE" | "CREATE_QUOTE" | "UPDATE_ACCOUNT",
      "description": "Human-readable description of what this action does",
      "params": {
        // Action-specific parameters (use IDs from the CRM context data)
      }
    }
  ],
  "data": {
    // ALWAYS include actual metrics when providing insights
    "totalPipeline": "₱2.4M",
    "activeDeals": 12,
    "tasksDueToday": 5,
    "hotOpportunities": ["Company A (₱500K)", "Company B (₱300K)"]
  }
}

AVAILABLE ACTIONS:

CREATE ACTIONS:
1. CREATE_ACCOUNT: params { name, industry?, type?, revenue?, location?, owner?, phone?, website? }
2. CREATE_INVOICE: params { accountId, amount, dueDate, notes }
3. CREATE_LEAD: params { name, company, email, phone, source, owner, notes }
4. CREATE_CONTACT: params { name, email, accountId, title, phone, owner }
5. CREATE_OPPORTUNITY: params { name, accountId, amount, closeDate, probability, owner, stage }
6. CREATE_TASK: params { title, dueDate, priority, assignedTo, accountId?, opportunityId? }
7. CREATE_QUOTE: params { accountId, opportunityId?, total, notes }
8. SCHEDULE_MEETING: params { subject, description?, meetingTime, opportunityName?, performedBy? }

UPDATE ACTIONS:
9. UPDATE_OPPORTUNITY_STAGE: params { opportunityId, stage }
10. UPDATE_ACCOUNT: params { accountId, updates }

DELETE ACTIONS (SAFE - only low-impact items):
11. DELETE_LEAD: params { leadId } - Only deletes if status is DISQUALIFIED or QUALIFIED
12. DELETE_ACTIVITY: params { activityId } - Safe to delete old activities
13. DELETE_TASK: params { taskId } - Only deletes if status is COMPLETED
14. DELETE_INVOICE: params { invoiceId } - Only deletes if status is DRAFT (not PAID/SENT)
15. DELETE_QUOTE: params { quoteId } - Only deletes if status is DRAFT or DECLINED
16. DELETE_OPPORTUNITY: params { opportunityId } - Only deletes if stage is ClosedLost
17. CLEANUP_ACTIVITIES: params { olderThanDays } - Bulk delete activities older than X days

SAFETY RULES:
- DELETE actions will automatically REJECT if the item doesn't meet safety criteria
- Cannot delete active accounts, paid invoices, or won opportunities
- Cannot delete contacts or accounts with active relationships
- All deletes are validated server-side for safety

When user requests an action (e.g., "create an invoice", "add a contact", "schedule a meeting", "create a task", "delete old activities"), include the appropriate action object with all required parameters filled from context.

EXAMPLES OF WHEN TO CREATE ACTIONS:
- "Schedule a meeting with PLDT tomorrow at 2pm" → CREATE SCHEDULE_MEETING action
- "Create a follow-up task for Globe" → CREATE CREATE_TASK action
- "Remind me to call StoneHill next week" → CREATE CREATE_TASK action
- "Set up a demo meeting for the SMART opportunity" → CREATE SCHEDULE_MEETING action
- "Add a task to send the proposal to Acme by Friday" → CREATE CREATE_TASK action

FORMATTING RULES:
- Use emojis (📊 ⚠️ ✅ 🎯 💡 🔔) for visual scanning
- Always include actual numbers, never "some" or "several"
- Keep each insight/recommendation under 15 words
- Be specific: names, amounts, dates
- Front-load key info

Be PROACTIVE with missing data:
- If an account doesn't exist: Ask "Would you like me to create an account for [name]? I'll need: [list missing fields]. Or I can create it with defaults."
- If a contact is missing: Offer to create it and ask for required info (name, email)
- If information is incomplete: Ask for the missing pieces conversationally
- Chain actions when needed: If creating an invoice requires a new account, prepare BOTH actions (CREATE_ACCOUNT then CREATE_INVOICE)
- Always offer the path forward, don't just say what's missing

TONE: Helpful, proactive, conversational. You're a smart assistant that figures out what needs to happen and guides the user through it.

GOOD Example (with MARKDOWN):
{
  "message": "Here's your **CRM snapshot** 📊",
  "insights": [
    "📊 **₱2.4M** pipeline across **12** active deals",
    "⚠️ **5 overdue** tasks: Globe (**3**), PLDT (**2**)",
    "🎯 **SMART** deal at **80%** - worth **₱500K**"
  ],
  "recommendations": [
    "🔔 **TODAY**: Clear **3** Globe overdue tasks",
    "✅ **This week**: Close SMART (needs quote)",
    "💡 **Quick win**: Update **8** contacts missing emails"
  ]
}

Be concise, friendly, and action-oriented. Provide specific insights and actionable recommendations based on the actual CRM data. Always match the user's language and emotional tone.`;

    // Use custom system prompt if provided, otherwise use default
    const finalSystemPrompt = systemPrompt || defaultSystemPrompt;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: llmModel,
          messages: [
            {
              role: 'system',
              content: finalSystemPrompt
            },
            ...messages
          ],
          temperature: llmTemperature,
          response_format: { type: "json_object" },
          max_completion_tokens: llmMaxTokens
        })
      });

      if (!response.ok) {
        throw new Error('OpenAI API request failed');
      }

      const data = await response.json() as any;
      const content = data.choices?.[0]?.message?.content || '{"message":"Sorry, I could not process that."}';

      // Parse the JSON response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(content);
      } catch {
        parsedResponse = { message: content };
      }

      res.json(parsedResponse);
    } catch (error) {
      console.error('OpenAI error:', error);
      res.status(500).json({ message: 'Failed to get AI response' });
    }
  })
);

// Execute AI actions
router.post(
  '/execute',
  asyncHandler(async (req, res) => {
    const { actions } = req.body as { actions?: Array<{ type: string; params: any }> };

    if (!actions || !actions.length) {
      return res.status(400).json({ message: 'actions array is required' });
    }

    const results = [];

    for (const action of actions) {
      try {
        let result;

        switch (action.type) {
          case 'CREATE_ACCOUNT':
            result = await prisma.account.create({
              data: {
                name: action.params.name,
                industry: action.params.industry || null,
                type: action.params.type || 'SMB',
                revenue: action.params.revenue || null,
                employees: action.params.employees || null,
                location: action.params.location || null,
                owner: action.params.owner || null,
                phone: action.params.phone || null,
                website: action.params.website || null
              }
            });
            results.push({ success: true, type: 'CREATE_ACCOUNT', data: result });
            break;

          case 'CREATE_INVOICE':
            result = await prisma.invoice.create({
              data: {
                accountId: action.params.accountId,
                amount: action.params.amount,
                status: 'DRAFT',
                issueDate: new Date(),
                dueDate: new Date(action.params.dueDate || Date.now() + 30 * 24 * 60 * 60 * 1000),
                notes: action.params.notes || null,
                id: `INV-${Date.now()}`
              },
              include: { account: true }
            });
            results.push({ success: true, type: 'CREATE_INVOICE', data: result });
            break;

          case 'CREATE_LEAD':
            result = await prisma.lead.create({
              data: {
                name: action.params.name,
                company: action.params.company,
                email: action.params.email,
                phone: action.params.phone,
                source: action.params.source || null,
                status: 'NEW',
                owner: action.params.owner || null,
                notes: action.params.notes || null
              }
            });
            results.push({ success: true, type: 'CREATE_LEAD', data: result });
            break;

          case 'CREATE_CONTACT':
            result = await prisma.contact.create({
              data: {
                name: action.params.name,
                email: action.params.email,
                accountId: action.params.accountId,
                title: action.params.title || null,
                phone: action.params.phone || null,
                owner: action.params.owner || null
              },
              include: { account: true }
            });
            results.push({ success: true, type: 'CREATE_CONTACT', data: result });
            break;

          case 'CREATE_OPPORTUNITY':
            result = await prisma.opportunity.create({
              data: {
                name: action.params.name,
                accountId: action.params.accountId,
                amount: action.params.amount,
                closeDate: new Date(action.params.closeDate || Date.now() + 30 * 24 * 60 * 60 * 1000),
                probability: action.params.probability || 50,
                owner: action.params.owner || 'Unassigned',
                stage: action.params.stage || 'Prospecting'
              },
              include: { account: true }
            });
            results.push({ success: true, type: 'CREATE_OPPORTUNITY', data: result });
            break;

          case 'CREATE_TASK':
            result = await prisma.task.create({
              data: {
                title: action.params.title,
                dueDate: new Date(action.params.dueDate || Date.now() + 7 * 24 * 60 * 60 * 1000),
                priority: action.params.priority || 'MEDIUM',
                status: 'OPEN',
                assignedTo: action.params.assignedTo || 'Unassigned',
                accountId: action.params.accountId || null,
                opportunityId: action.params.opportunityId || null
              }
            });
            results.push({ success: true, type: 'CREATE_TASK', data: result });
            break;

          case 'UPDATE_OPPORTUNITY_STAGE':
            result = await prisma.opportunity.update({
              where: { id: action.params.opportunityId },
              data: { stage: action.params.stage },
              include: { account: true }
            });
            results.push({ success: true, type: 'UPDATE_OPPORTUNITY_STAGE', data: result });
            break;

          case 'CREATE_QUOTE':
            result = await prisma.quote.create({
              data: {
                number: `QT-${Date.now()}`,
                accountId: action.params.accountId,
                opportunityId: action.params.opportunityId || null,
                status: 'DRAFT',
                total: action.params.total,
                currency: 'PHP',
                issuedAt: new Date(),
                notes: action.params.notes || null
              },
              include: { account: true, opportunity: true }
            });
            results.push({ success: true, type: 'CREATE_QUOTE', data: result });
            break;

          case 'UPDATE_ACCOUNT':
            result = await prisma.account.update({
              where: { id: action.params.accountId },
              data: action.params.updates
            });
            results.push({ success: true, type: 'UPDATE_ACCOUNT', data: result });
            break;

          case 'DELETE_LEAD':
            // Safety check: only delete DISQUALIFIED or QUALIFIED leads
            const lead = await prisma.lead.findUnique({ where: { id: action.params.leadId } });
            if (!lead) {
              results.push({ success: false, type: 'DELETE_LEAD', error: 'Lead not found' });
            } else if (!['DISQUALIFIED', 'QUALIFIED'].includes(lead.status)) {
              results.push({ success: false, type: 'DELETE_LEAD', error: `Cannot delete lead with status ${lead.status}. Only DISQUALIFIED or QUALIFIED leads can be deleted.` });
            } else {
              await prisma.lead.delete({ where: { id: action.params.leadId } });
              results.push({ success: true, type: 'DELETE_LEAD', data: { id: action.params.leadId, status: lead.status } });
            }
            break;

          case 'DELETE_ACTIVITY':
            // Activities are safe to delete
            result = await prisma.activity.delete({ where: { id: action.params.activityId } });
            results.push({ success: true, type: 'DELETE_ACTIVITY', data: result });
            break;

          case 'DELETE_TASK':
            // Safety check: only delete COMPLETED tasks
            const task = await prisma.task.findUnique({ where: { id: action.params.taskId } });
            if (!task) {
              results.push({ success: false, type: 'DELETE_TASK', error: 'Task not found' });
            } else if (task.status !== 'COMPLETED') {
              results.push({ success: false, type: 'DELETE_TASK', error: `Cannot delete task with status ${task.status}. Only COMPLETED tasks can be deleted.` });
            } else {
              await prisma.task.delete({ where: { id: action.params.taskId } });
              results.push({ success: true, type: 'DELETE_TASK', data: { id: action.params.taskId } });
            }
            break;

          case 'DELETE_INVOICE':
            // Safety check: only delete DRAFT invoices
            const invoice = await prisma.invoice.findUnique({ where: { id: action.params.invoiceId } });
            if (!invoice) {
              results.push({ success: false, type: 'DELETE_INVOICE', error: 'Invoice not found' });
            } else if (invoice.status !== 'DRAFT') {
              results.push({ success: false, type: 'DELETE_INVOICE', error: `Cannot delete invoice with status ${invoice.status}. Only DRAFT invoices can be deleted.` });
            } else {
              await prisma.invoice.delete({ where: { id: action.params.invoiceId } });
              results.push({ success: true, type: 'DELETE_INVOICE', data: { id: action.params.invoiceId } });
            }
            break;

          case 'DELETE_QUOTE':
            // Safety check: only delete DRAFT or DECLINED quotes
            const quote = await prisma.quote.findUnique({ where: { id: action.params.quoteId } });
            if (!quote) {
              results.push({ success: false, type: 'DELETE_QUOTE', error: 'Quote not found' });
            } else if (!['DRAFT', 'DECLINED'].includes(quote.status)) {
              results.push({ success: false, type: 'DELETE_QUOTE', error: `Cannot delete quote with status ${quote.status}. Only DRAFT or DECLINED quotes can be deleted.` });
            } else {
              await prisma.quote.delete({ where: { id: action.params.quoteId } });
              results.push({ success: true, type: 'DELETE_QUOTE', data: { id: action.params.quoteId } });
            }
            break;

          case 'DELETE_OPPORTUNITY':
            // Safety check: only delete ClosedLost opportunities
            const opportunity = await prisma.opportunity.findUnique({ where: { id: action.params.opportunityId } });
            if (!opportunity) {
              results.push({ success: false, type: 'DELETE_OPPORTUNITY', error: 'Opportunity not found' });
            } else if (opportunity.stage !== 'ClosedLost') {
              results.push({ success: false, type: 'DELETE_OPPORTUNITY', error: `Cannot delete opportunity in ${opportunity.stage} stage. Only ClosedLost opportunities can be deleted.` });
            } else {
              await prisma.opportunity.delete({ where: { id: action.params.opportunityId } });
              results.push({ success: true, type: 'DELETE_OPPORTUNITY', data: { id: action.params.opportunityId } });
            }
            break;

          case 'CLEANUP_ACTIVITIES':
            // Bulk delete activities older than specified days
            const olderThanDate = new Date();
            olderThanDate.setDate(olderThanDate.getDate() - (action.params.olderThanDays || 90));
            const deletedActivities = await prisma.activity.deleteMany({
              where: { performedAt: { lt: olderThanDate } }
            });
            results.push({ success: true, type: 'CLEANUP_ACTIVITIES', data: { count: deletedActivities.count, olderThan: olderThanDate } });
            break;

          default:
            results.push({ success: false, type: action.type, error: 'Unknown action type' });
        }
      } catch (error: any) {
        results.push({ success: false, type: action.type, error: error.message });
      }
    }

    res.json({ results, executedCount: results.filter(r => r.success).length });
  })
);

export default router;

