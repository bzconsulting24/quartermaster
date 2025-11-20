import { Router } from 'express';
import prisma from '../prismaClient';
import { WorkflowTriggerType } from '@prisma/client';
import { asyncHandler } from './helpers.js';
import { stageLabelToEnum, presentStage } from '../utils/stageUtils.js';
import { enqueueWorkflowJob } from '../jobs/automationQueue.js';
import { emitAppEvent } from '../events/eventBus.js';
const router = Router();
const normalizeStageInput = (incoming) => {
    if (!incoming)
        return undefined;
    if (stageLabelToEnum[incoming]) {
        return stageLabelToEnum[incoming];
    }
    return incoming;
};
const serializeOpportunity = (opportunity) => ({
    ...opportunity,
    stage: presentStage(opportunity.stage)
});
router.get('/', asyncHandler(async (_req, res) => {
    const opportunities = await prisma.opportunity.findMany({
        include: {
            account: true,
            contact: true,
            activities: true,
            tasks: true,
            documents: true
        },
        orderBy: { updatedAt: 'desc' }
    });
    res.json(opportunities.map(serializeOpportunity));
}));
router.get('/:id', asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const opportunity = await prisma.opportunity.findUnique({
        where: { id },
        include: {
            account: true,
            contact: true,
            activities: true,
            tasks: true,
            documents: true
        }
    });
    if (!opportunity) {
        return res.status(404).json({ message: 'Opportunity not found' });
    }
    res.json(opportunity ? serializeOpportunity(opportunity) : opportunity);
}));
router.post('/', asyncHandler(async (req, res) => {
    const { name, amount, closeDate, accountId, contactId, owner, probability, stage, email, phone } = req.body;
    if (!name || !amount || !closeDate || !accountId) {
        return res.status(400).json({ message: 'name, amount, closeDate, and accountId are required' });
    }
    const normalizedStage = normalizeStageInput(stage) ?? 'Prospecting';
    const newOpportunity = await prisma.opportunity.create({
        data: {
            name,
            amount,
            closeDate: new Date(closeDate),
            accountId,
            contactId,
            owner,
            probability: probability ?? 0,
            stage: normalizedStage,
            email,
            phone
        }
    });
    emitAppEvent({
        type: 'opportunity.created',
        payload: { id: newOpportunity.id, name: newOpportunity.name, stage: presentStage(newOpportunity.stage) }
    });
    res.status(201).json(serializeOpportunity(newOpportunity));
}));
router.patch('/:id/stage', asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { stage } = req.body;
    const normalizedStage = normalizeStageInput(stage);
    if (!normalizedStage) {
        return res.status(400).json({ message: 'Invalid stage value' });
    }
    const existing = await prisma.opportunity.findUnique({
        where: { id },
        select: { stage: true }
    });
    if (!existing) {
        return res.status(404).json({ message: 'Opportunity not found' });
    }
    const updated = await prisma.opportunity.update({
        where: { id },
        data: { stage: normalizedStage }
    });
    emitAppEvent({
        type: 'opportunity.stageChanged',
        payload: {
            id: updated.id,
            fromStage: presentStage(existing.stage),
            toStage: presentStage(updated.stage)
        }
    });
    await enqueueWorkflowJob({
        triggerType: WorkflowTriggerType.OPPORTUNITY_STAGE_CHANGED,
        opportunityId: updated.id,
        context: {
            fromStage: presentStage(existing.stage),
            toStage: presentStage(updated.stage)
        }
    });
    res.json(serializeOpportunity(updated));
}));
router.patch('/:id/probability', asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { probability } = req.body;
    const updated = await prisma.opportunity.update({
        where: { id },
        data: { probability }
    });
    res.json(serializeOpportunity(updated));
}));
router.delete('/:id', asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    await prisma.opportunity.delete({ where: { id } });
    res.status(204).send();
}));
export default router;
