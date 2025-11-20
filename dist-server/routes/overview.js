import { Router } from 'express';
import prisma from '../prismaClient';
import { asyncHandler } from './helpers.js';
const router = Router();
router.get('/', asyncHandler(async (_req, res) => {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [invoiceAggregate, activeDeals, newContacts, tasksDue, activities, idleDeals, automationTasks, riskAlerts] = await Promise.all([
        prisma.invoice.aggregate({
            _sum: { amount: true },
            where: {
                status: { in: ['PAID', 'SENT', 'OVERDUE'] }
            }
        }),
        prisma.opportunity.count({
            where: {
                stage: { notIn: ['ClosedWon', 'ClosedLost'] }
            }
        }),
        prisma.contact.count({
            where: {
                lastContact: { gte: sevenDaysAgo }
            }
        }),
        prisma.task.count({
            where: {
                dueDate: { lte: now },
                status: { not: 'COMPLETED' }
            }
        }),
        prisma.activity.findMany({
            orderBy: { performedAt: 'desc' },
            take: 5,
            include: {
                opportunity: {
                    select: { id: true, name: true }
                }
            }
        }),
        prisma.opportunity.count({
            where: {
                stage: { notIn: ['ClosedWon', 'ClosedLost'] },
                updatedAt: { lt: sevenDaysAgo }
            }
        }),
        prisma.task.count({
            where: {
                workflowRuleId: { not: null },
                status: { not: 'COMPLETED' }
            }
        }),
        prisma.aIInsight.count({
            where: {
                type: 'RISK',
                createdAt: { gte: sevenDaysAgo }
            }
        })
    ]);
    const wonThisMonth = await prisma.opportunity.aggregate({
        _sum: { amount: true },
        where: {
            stage: 'ClosedWon',
            closeDate: {
                gte: startOfMonth
            }
        }
    });
    res.json({
        totalRevenue: invoiceAggregate._sum.amount ?? 0,
        activeDeals,
        newContacts,
        tasksDue,
        idleDeals,
        automationTasks,
        riskAlerts,
        wonThisMonth: wonThisMonth._sum.amount ?? 0,
        activities
    });
}));
export default router;
