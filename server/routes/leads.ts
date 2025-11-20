import { Router } from 'express';
import prisma from '../prismaClient';
import { asyncHandler } from './helpers.js';

const router = Router();

// Helper function to enrich account data using AI
async function enrichAccountData(companyName: string, notes: string | undefined, owner: string | undefined): Promise<{
  industry: string | null;
  location: string | null;
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY not configured');
    return { industry: null, location: null };
  }

  try {
    const prompt = notes
      ? `Based on this company name and context, infer the industry and location:\n\nCompany: ${companyName}\nContext: ${notes}`
      : `Based on this company name, infer the likely industry and location:\n\nCompany: ${companyName}`;

    const systemPrompt = `You are a business intelligence assistant. Extract or infer the following information and return ONLY a JSON object:
{
  "industry": "industry sector (e.g., Technology, Healthcare, Finance, Manufacturing, etc.)",
  "location": "city and country or state (e.g., San Francisco, CA or London, UK)"
}

If you cannot confidently determine a field, use null. Be concise and specific.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-5-nano',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: 500
      })
    });

    if (!response.ok) {
      console.error('AI enrichment failed:', response.statusText);
      return { industry: null, location: null };
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content;
    if (!content) return { industry: null, location: null };

    const parsed = JSON.parse(content);
    return {
      industry: parsed.industry || null,
      location: parsed.location || null
    };
  } catch (error) {
    console.error('AI enrichment error:', error);
    return { industry: null, location: null };
  }
}

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
          // Enrich account data with AI inference
          const enrichedData = await enrichAccountData(company, notes, owner);
          console.log('AI Enrichment Result:', { company, enrichedData });

          // Create new account with enriched data
          const newAccount = await prisma.account.create({
            data: {
              name: company,
              industry: enrichedData.industry,
              type: 'SMB', // Default to SMB, can be updated later
              owner: owner || null,
              phone: phone || null,
              location: enrichedData.location
            }
          });
          finalAccountId = newAccount.id;

          // Also create a contact for this new account (for Customer Information view)
          if (email && name) {
            try {
              await prisma.contact.create({
                data: {
                  name,
                  email,
                  phone: phone || null,
                  owner: owner || null,
                  accountId: finalAccountId
                }
              });
            } catch (contactError) {
              console.error('Failed to auto-create contact:', contactError);
            }
          }
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

    // Fetch the lead with all related data
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        opportunity: true,
        account: {
          include: {
            leads: true,
            contacts: true,
            opportunities: true,
            invoices: true,
            quotes: true,
            contracts: true,
            tasks: true
          }
        }
      }
    });

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Delete the associated opportunity if it exists
    if (lead.opportunity) {
      await prisma.opportunity.delete({
        where: { id: lead.opportunity.id }
      });
    }

    // Check if we should delete the account (only if it was auto-created by this lead and is orphaned)
    if (lead.account) {
      const account = lead.account;

      // Account is orphaned if:
      // - Only has this one lead
      // - Has at most 1 contact (the auto-created one)
      // - Has at most 1 opportunity (the one we just deleted)
      // - Has no invoices, quotes, contracts, or tasks
      const isOrphaned =
        account.leads.length <= 1 &&
        account.contacts.length <= 1 &&
        account.opportunities.length <= 1 &&
        account.invoices.length === 0 &&
        account.quotes.length === 0 &&
        account.contracts.length === 0 &&
        account.tasks.length === 0;

      if (isOrphaned) {
        // Delete the account (contacts will cascade delete)
        await prisma.account.delete({
          where: { id: account.id }
        });
      }
    }

    // Finally, delete the lead
    await prisma.lead.delete({ where: { id } });
    res.status(204).send();
  })
);

export default router;
