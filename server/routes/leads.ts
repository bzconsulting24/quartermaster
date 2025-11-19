import { Router } from 'express';
import prisma from '../prismaClient';
import { asyncHandler } from './helpers.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status } = req.query as { status?: string };
    const leads = await prisma.lead.findMany({
      where: status ? { status: status as any } : undefined,
      include: { account: true, opportunity: true },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(leads);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, company, email, phone, source, status, owner, score, notes, accountId } = req.body as {
      name: string;
      company?: string;
      email?: string;
      phone?: string;
      source?: string;
      status?: string;
      owner?: string;
      score?: number;
      notes?: string;
      accountId?: number;
    };

    if (!name) {
      return res.status(400).json({ message: 'name is required' });
    }

    // Auto-create account if company is provided but no accountId
    let finalAccountId = accountId;
    if (!accountId && company) {
      try {
        // Check if account with this company name already exists
        const existingAccount = await prisma.account.findFirst({
          where: { name: { equals: company, mode: 'insensitive' } }
        });

        if (existingAccount) {
          finalAccountId = existingAccount.id;
        } else {
          // Create new account
          const newAccount = await prisma.account.create({
            data: {
              name: company,
              type: 'SMB', // Default to SMB, can be updated later
              owner: owner || null,
              phone: phone || null
            }
          });
          finalAccountId = newAccount.id;
        }
      } catch (error) {
        console.error('Failed to auto-create account:', error);
      }
    }

    // Create the lead
    const lead = await prisma.lead.create({
      data: {
        name,
        company,
        email,
        phone,
        source,
        status: (status as any) ?? 'NEW',
        owner,
        score,
        notes,
        accountId: finalAccountId
      }
    });

    // Auto-create opportunity in pipeline (Prospecting stage)
    // Only if account exists (either provided or auto-created)
    if (finalAccountId) {
      try {
        const opportunity = await prisma.opportunity.create({
          data: {
            name: `${name} - ${company || 'Opportunity'}`,
            amount: score ? score * 100 : 0, // Convert lead score to estimated deal value
            closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            probability: score || 10, // Use lead score as probability, default 10%
            owner: owner || 'Unassigned',
            stage: 'Prospecting', // Start in first stage
            email,
            phone,
            accountId: finalAccountId,
            leadId: lead.id
          },
          include: {
            account: true,
            lead: true
          }
        });

        // Return lead with the created opportunity
        const leadWithOpportunity = await prisma.lead.findUnique({
          where: { id: lead.id },
          include: { account: true, opportunity: true }
        });

        return res.status(201).json(leadWithOpportunity);
      } catch (error) {
        // If opportunity creation fails, still return the lead
        console.error('Failed to auto-create opportunity:', error);
      }
    }

    res.status(201).json(lead);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const lead = await prisma.lead.update({
      where: { id },
      data: req.body
    });
    res.json(lead);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);

    // First, delete the associated opportunity if it exists
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { opportunity: true }
    });

    if (lead?.opportunity) {
      await prisma.opportunity.delete({
        where: { id: lead.opportunity.id }
      });
    }

    // Then delete the lead
    await prisma.lead.delete({ where: { id } });
    res.status(204).send();
  })
);

export default router;
