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
    const { prompt, opportunityId } = req.body as { prompt?: string; opportunityId?: number };
    if (!prompt) {
      return res.status(400).json({ message: 'prompt is required' });
    }

    let answer: string;
    let contextSummary: string | undefined;

    if (opportunityId) {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: {
        account: true,
        contact: true,
        tasks: {
          where: { status: { not: 'COMPLETED' } },
          orderBy: { dueDate: 'asc' }
        },
        quotes: {
          orderBy: { issuedAt: 'desc' }
        },
        insights: {
          orderBy: { createdAt: 'desc' },
          take: 3
        }
      }
    });

      if (!opportunity) {
        return res.status(404).json({ message: 'Opportunity not found' });
      }

      contextSummary = summarizeOpportunity(opportunity);
      answer = buildResponse(prompt, contextSummary);

      await prisma.aIInsight.create({
        data: {
          type: AIInsightType.NEXT_STEP,
          summary: answer,
          opportunityId: opportunity.id
        }
      });
    } else {
      const [pipelineSum, tasksDue, activeDeals, wonThisMonth] = await Promise.all([
        prisma.opportunity.aggregate({ _sum: { amount: true } }),
        prisma.task.count({
          where: {
            status: { not: 'COMPLETED' },
            dueDate: { lte: new Date() }
          }
        }),
        prisma.opportunity.count({
          where: {
            stage: { notIn: ['ClosedWon', 'ClosedLost'] }
          }
        }),
        prisma.opportunity.aggregate({
          _sum: { amount: true },
          where: {
            stage: 'ClosedWon',
            closeDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
          }
        })
      ]);
      const metrics = {
        totalPipeline: pipelineSum._sum.amount ?? 0,
        tasksDue,
        activeDeals,
        wonThisMonth: wonThisMonth._sum.amount ?? 0
      };
      answer = buildResponse(prompt, undefined, metrics);
    }

    res.json({
      answer,
      context: contextSummary
    });
  })
);

export default router;

