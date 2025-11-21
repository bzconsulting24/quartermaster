import {
  PrismaClient,
  ActivityType,
  type Stage,
  type InvoiceStatus,
  type TaskPriority,
  type TaskStatus,
  type LeadStatus,
  type QuoteStatus,
  type ContractStatus,
  type WorkflowTriggerType,
  type WorkflowActionType,
  type AIInsightType,
  type NotificationType,
  type NotificationStatus
} from '@prisma/client';

const prisma = new PrismaClient();

const stageLabelToEnum: Record<string, Stage> = {
  Prospecting: 'Prospecting',
  Qualification: 'Qualification',
  'Proposal/Price Quote': 'ProposalPriceQuote',
  'Negotiation/Review': 'NegotiationReview',
  'Closed Won': 'ClosedWon',
  'Closed Lost': 'ClosedLost'
};

const accountsSeed = [
  { name: 'Acme Corporation', industry: 'Technology', type: 'Enterprise', revenue: 50_000_000, employees: 500, owner: 'Sarah Johnson', phone: '555-1000', website: 'acme.com', location: 'San Francisco, CA' },
  { name: 'TechStart Inc', industry: 'Software', type: 'SMB', revenue: 5_000_000, employees: 50, owner: 'Michael Chen', phone: '555-1001', website: 'techstart.io', location: 'Austin, TX' },
  { name: 'BuildCo Ltd', industry: 'Construction', type: 'MidMarket', revenue: 25_000_000, employees: 200, owner: 'Sarah Johnson', phone: '555-1002', website: 'buildco.com', location: 'Chicago, IL' },
  { name: 'DataFlow Inc', industry: 'Data Analytics', type: 'Enterprise', revenue: 100_000_000, employees: 800, owner: 'John Williams', phone: '555-1003', website: 'dataflow.com', location: 'New York, NY' },
  { name: 'CloudNine Corp', industry: 'Cloud Services', type: 'Enterprise', revenue: 75_000_000, employees: 600, owner: 'Sarah Johnson', phone: '555-1004', website: 'cloudnine.com', location: 'Seattle, WA' },
  { name: 'RetailMax', industry: 'Retail', type: 'MidMarket', revenue: 15_000_000, employees: 150, owner: 'Michael Chen', phone: '555-1005', website: 'retailmax.com', location: 'Los Angeles, CA' },
  { name: 'FinanceHub', industry: 'Financial Services', type: 'Enterprise', revenue: 200_000_000, employees: 1200, owner: 'John Williams', phone: '555-1006', website: 'financehub.com', location: 'Boston, MA' }
];

const contactsSeed = [
  { name: 'John Doe', title: 'CEO', account: 'Acme Corporation', email: 'john@acme.com', phone: '555-0100', owner: 'Sarah Johnson', lastContact: '2024-02-07' },
  { name: 'Jane Smith', title: 'VP of Sales', account: 'TechStart Inc', email: 'jane@techstart.com', phone: '555-0101', owner: 'Michael Chen', lastContact: '2024-02-06' },
  { name: 'Bob Johnson', title: 'CTO', account: 'BuildCo Ltd', email: 'bob@buildco.com', phone: '555-0102', owner: 'Sarah Johnson', lastContact: '2024-02-05' },
  { name: 'Alice Brown', title: 'Director of IT', account: 'DataFlow Inc', email: 'alice@dataflow.com', phone: '555-0103', owner: 'John Williams', lastContact: '2024-02-08' },
  { name: 'Mike Wilson', title: 'VP of Operations', account: 'CloudNine Corp', email: 'mike@cloudnine.com', phone: '555-0104', owner: 'Sarah Johnson', lastContact: '2024-02-04' },
  { name: 'Sarah Davis', title: 'CFO', account: 'Acme Corporation', email: 'sarah@acme.com', phone: '555-0105', owner: 'Sarah Johnson', lastContact: '2024-02-07' },
  { name: 'Tom Anderson', title: 'IT Manager', account: 'RetailMax', email: 'tom@retailmax.com', phone: '555-0106', owner: 'Michael Chen', lastContact: '2024-02-03' },
  { name: 'Emily White', title: 'SVP Technology', account: 'FinanceHub', email: 'emily@financehub.com', phone: '555-0107', owner: 'John Williams', lastContact: '2024-02-09' }
];

const productsSeed = [
  { name: 'Quartermaster Enterprise Suite', sku: 'CRM-ENT', description: 'Full platform license with automation add-ons', unitPrice: 5_000_000 },
  { name: 'Quartermaster Growth Pack', sku: 'CRM-GROW', description: 'Mid-market bundle for 100 seats', unitPrice: 2_200_000 },
  { name: 'Insights AI Add-on', sku: 'AI-INSIGHT', description: 'AI-generated recommendations per opportunity', unitPrice: 750_000 },
  { name: 'Implementation Services', sku: 'SERV-IMP', description: 'Professional services block', unitPrice: 1_500_000 }
];

const leadsSeed = [
  { name: 'Lara Patel', company: 'Acme Corporation', email: 'lara.patel@acme.com', phone: '555-0311', source: 'Website', status: 'WORKING', owner: 'Sarah Johnson', score: 72, notes: 'Needs enterprise analytics add-on', account: 'Acme Corporation', opportunity: 'Acme Corp - Enterprise' },
  { name: 'Carlos Reyes', company: 'TechStart Inc', email: 'carlos@techstart.com', phone: '555-0412', source: 'Referral', status: 'NURTURING', owner: 'Michael Chen', score: 58, notes: 'Interested in AI upsell', account: 'TechStart Inc', opportunity: 'TechStart - SMB Package' },
  { name: 'Priya Nair', company: 'DataFlow Inc', email: 'priya@dataflow.com', phone: '555-0513', source: 'Event', status: 'QUALIFIED', owner: 'John Williams', score: 80, notes: 'Decision in Q2', account: 'DataFlow Inc', opportunity: 'DataFlow Implementation' }
];

const opportunitiesSeed = [
  { name: 'Acme Corp - Enterprise', account: 'Acme Corporation', contact: 'john@acme.com', amount: 5_000_000, stage: 'Prospecting', closeDate: '2024-03-15', owner: 'Sarah Johnson', probability: 25, email: 'john@acme.com', phone: '555-0100', leadEmail: 'lara.patel@acme.com' },
  { name: 'TechStart - SMB Package', account: 'TechStart Inc', contact: 'jane@techstart.com', amount: 1_500_000, stage: 'Qualification', closeDate: '2024-02-28', owner: 'Michael Chen', probability: 40, email: 'jane@techstart.com', phone: '555-0101', leadEmail: 'carlos@techstart.com' },
  { name: 'BuildCo - Expansion', account: 'BuildCo Ltd', contact: 'bob@buildco.com', amount: 2_500_000, stage: 'Proposal/Price Quote', closeDate: '2024-04-10', owner: 'Sarah Johnson', probability: 60, email: 'bob@buildco.com', phone: '555-0102' },
  { name: 'DataFlow Implementation', account: 'DataFlow Inc', contact: 'alice@dataflow.com', amount: 7_500_000, stage: 'Negotiation/Review', closeDate: '2024-02-20', owner: 'John Williams', probability: 75, email: 'alice@dataflow.com', phone: '555-0103', leadEmail: 'priya@dataflow.com' },
  { name: 'CloudNine Solutions', account: 'CloudNine Corp', contact: 'mike@cloudnine.com', amount: 4_000_000, stage: 'Closed Won', closeDate: '2024-01-30', owner: 'Sarah Johnson', probability: 100, email: 'mike@cloudnine.com', phone: '555-0104' }
];

const workflowRulesSeed = [
  {
    name: 'Stalled Negotiation Reminder',
    description: 'Alert owners when negotiations sit idle for 5 days',
    triggerType: 'INACTIVITY',
    triggerConfig: { stage: 'Negotiation/Review', days: 5 },
    conditionConfig: { probabilityLessThan: 80 },
    actions: [
      { type: 'CREATE_TASK', actionConfig: { title: 'Follow up on negotiation', priority: 'HIGH' } },
      { type: 'INVOKE_AI', actionConfig: { insightType: 'NEXT_STEP' } }
    ]
  },
  {
    name: 'Proposal Sent Nudges',
    description: 'Tasks + reminder emails after proposals go out',
    triggerType: 'OPPORTUNITY_STAGE_CHANGED',
    triggerConfig: { toStage: 'Proposal/Price Quote' },
    conditionConfig: { amountGreaterThan: 2_000_000 },
    actions: [
      { type: 'CREATE_TASK', actionConfig: { title: 'Confirm proposal receipt', priority: 'MEDIUM' } },
      { type: 'SEND_EMAIL', actionConfig: { template: 'proposal-follow-up' } }
    ]
  }
];

const tasksSeed = [
  { title: 'Follow up with Acme Corp', dueDate: '2024-02-10', priority: 'HIGH', status: 'OPEN', assignedTo: 'Sarah Johnson', opportunity: 'Acme Corp - Enterprise', workflowRule: 'Stalled Negotiation Reminder' },
  { title: 'Send proposal to TechStart', dueDate: '2024-02-12', priority: 'MEDIUM', status: 'OPEN', assignedTo: 'Michael Chen', opportunity: 'TechStart - SMB Package', workflowRule: 'Proposal Sent Nudges' },
  { title: 'Schedule demo with BuildCo', dueDate: '2024-02-08', priority: 'HIGH', status: 'OVERDUE', assignedTo: 'Sarah Johnson', opportunity: 'BuildCo - Expansion' },
  { title: 'Prepare contract for DataFlow', dueDate: '2024-02-15', priority: 'LOW', status: 'OPEN', assignedTo: 'John Williams', opportunity: 'DataFlow Implementation' }
];

const invoicesSeed = [
  { id: 'INV-001', account: 'Acme Corporation', contact: 'john@acme.com', amount: 5_000_000, status: 'PAID', issueDate: '2024-01-15', dueDate: '2024-02-15', paidDate: '2024-02-10', notes: 'Payment received via wire transfer', items: [{ description: 'Enterprise Package - Annual License', quantity: 1, rate: 5_000_000 }] },
  { id: 'INV-002', account: 'TechStart Inc', contact: 'jane@techstart.com', amount: 1_500_000, status: 'SENT', issueDate: '2024-02-01', dueDate: '2024-03-01', paidDate: null, notes: 'Invoice sent via email on 2024-02-01', items: [{ description: 'SMB Package - Q1 Services', quantity: 1, rate: 1_500_000 }] },
  { id: 'INV-003', account: 'BuildCo Ltd', contact: 'bob@buildco.com', amount: 2_500_000, status: 'OVERDUE', issueDate: '2024-01-10', dueDate: '2024-02-10', paidDate: null, notes: 'Follow-up required - overdue by 1 day', items: [{ description: 'Expansion Services', quantity: 1, rate: 2_500_000 }] }
];

const activitiesSeed = [
  { type: ActivityType.EMAIL, subject: 'Follow-up on proposal', description: 'Sent proposal details and pricing breakdown', performedBy: 'Sarah Johnson', opportunity: 'Acme Corp - Enterprise' },
  { type: ActivityType.CALL, subject: 'Discovery call completed', description: 'Discussed requirements and timeline. Next steps: send proposal.', performedBy: 'Michael Chen', opportunity: 'TechStart - SMB Package' },
  { type: ActivityType.TASK, subject: 'Prepare demo environment', description: 'Demo environment ready for presentation', performedBy: 'Sarah Johnson', opportunity: 'BuildCo - Expansion' },
  { type: ActivityType.NOTE, subject: 'Budget confirmation', description: 'CFO confirmed budget approval for Q1', performedBy: 'John Williams', opportunity: 'DataFlow Implementation' }
];

const quotesSeed = [
  {
    number: 'Q-2024-001',
    status: 'SENT',
    account: 'Acme Corporation',
    opportunity: 'Acme Corp - Enterprise',
    total: 5_750_000,
    currency: 'PHP',
    issuedAt: '2024-02-01',
    expiresAt: '2024-03-01',
    notes: 'Includes AI add-on',
    lines: [
      { description: 'Quartermaster Enterprise Suite', quantity: 1, unitPrice: 5_000_000, product: 'CRM-ENT' },
      { description: 'Insights AI Add-on', quantity: 1, unitPrice: 750_000, product: 'AI-INSIGHT' }
    ]
  },
  {
    number: 'Q-2024-002',
    status: 'DRAFT',
    account: 'TechStart Inc',
    opportunity: 'TechStart - SMB Package',
    total: 2_200_000,
    currency: 'PHP',
    issuedAt: '2024-02-05',
    expiresAt: '2024-02-25',
    lines: [
      { description: 'Quartermaster Growth Pack', quantity: 1, unitPrice: 2_200_000, product: 'CRM-GROW' }
    ]
  }
];

const contractsSeed = [
  { contractNumber: 'C-2024-001', status: 'ACTIVE', startDate: '2024-02-01', endDate: '2025-01-31', value: 4_000_000, terms: 'Net 45, auto-renew', account: 'CloudNine Corp', opportunity: 'CloudNine Solutions' },
  { contractNumber: 'C-2024-002', status: 'DRAFT', startDate: '2024-03-01', endDate: '2025-02-28', value: 7_500_000, terms: 'Includes success plan', account: 'DataFlow Inc', opportunity: 'DataFlow Implementation' }
];

const documentsSeed = [
  { name: 'Proposal_Acme_v2.pdf', type: 'proposal', size: '2.4 MB', uploadedBy: 'Sarah Johnson', uploadedAt: '2024-02-05', opportunity: 'Acme Corp - Enterprise' },
  { name: 'Contract_TechStart.docx', type: 'contract', size: '1.1 MB', uploadedBy: 'Michael Chen', uploadedAt: '2024-02-03', opportunity: 'TechStart - SMB Package' },
  { name: 'Product_Demo_Slides.pptx', type: 'presentation', size: '5.8 MB', uploadedBy: 'Sarah Johnson', uploadedAt: '2024-01-28', opportunity: 'BuildCo - Expansion' },
  { name: 'Implementation_Playbook.pdf', type: 'proposal', size: '3.2 MB', uploadedBy: 'John Williams', uploadedAt: '2024-02-01', opportunity: 'DataFlow Implementation' }
];

const aiInsightsSeed = [
  { type: 'SUMMARY', summary: 'Acme wants unified view across regions; champion is CEO.', confidence: 80, opportunity: 'Acme Corp - Enterprise' },
  { type: 'NEXT_STEP', summary: 'Schedule technical validation with BuildCo security team.', confidence: 67, opportunity: 'BuildCo - Expansion', task: 'Schedule demo with BuildCo' },
  { type: 'RISK', summary: 'TechStart procurement pushing for discount; deal at risk.', confidence: 55, opportunity: 'TechStart - SMB Package' }
];

const notificationsSeed = [
  { type: 'TASK', status: 'UNREAD', title: 'Task overdue', body: 'Schedule demo with BuildCo is overdue.', recipient: 'deo@bzcrm.com', account: 'BuildCo Ltd' },
  { type: 'OPPORTUNITY', status: 'UNREAD', title: 'Negotiation reminder', body: 'DataFlow Implementation has been idle for 4 days.', recipient: 'deo@bzcrm.com', account: 'DataFlow Inc' },
  { type: 'WORKFLOW', status: 'READ', title: 'Automation executed', body: 'Proposal follow-up task created for TechStart.', recipient: 'deo@bzcrm.com', account: 'TechStart Inc', readAt: '2024-02-10T12:00:00.000Z' }
];

const teamsSeed = [
  { name: 'Enterprise Sales', description: 'Handles enterprise accounts' },
  { name: 'Growth Team', description: 'Mid-market and SMB hunters' }
];

const userTeamsSeed = [
  { userEmail: 'sarah.johnson@quartermaster.ai', role: 'Manager', team: 'Enterprise Sales' },
  { userEmail: 'michael.chen@quartermaster.ai', role: 'AE', team: 'Growth Team' },
  { userEmail: 'deo.umali@quartermaster.ai', role: 'VP Sales', team: 'Enterprise Sales' }
];

async function main() {
  console.info('🌱 Seeding Quartermaster database...');

  await prisma.userTeam.deleteMany();
  await prisma.team.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.aIInsight.deleteMany();
  await prisma.workflowAction.deleteMany();
  await prisma.workflowRule.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.quoteLine.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.product.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.task.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.document.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.account.deleteMany();

  const teamRecords: Record<string, { id: number }> = {};
  for (const team of teamsSeed) {
    const record = await prisma.team.create({ data: team });
    teamRecords[team.name] = { id: record.id };
  }

  for (const member of userTeamsSeed) {
    const team = teamRecords[member.team];
    if (!team) continue;
    await prisma.userTeam.create({
      data: {
        userEmail: member.userEmail,
        role: member.role,
        teamId: team.id
      }
    });
  }

  const productRecords: Record<string, { id: number }> = {};
  for (const product of productsSeed) {
    const record = await prisma.product.create({ data: product });
    if (product.sku) {
      productRecords[product.sku] = { id: record.id };
    }
  }

  const accountRecords: Record<string, { id: number }> = {};
  for (const account of accountsSeed) {
    const record = await prisma.account.create({ data: account });
    accountRecords[account.name] = { id: record.id };
  }

  const contactRecords: Record<string, { id: number }> = {};
  for (const contact of contactsSeed) {
    const account = accountRecords[contact.account];
    if (!account) continue;
    const record = await prisma.contact.create({
      data: {
        name: contact.name,
        title: contact.title,
        email: contact.email,
        phone: contact.phone,
        owner: contact.owner,
        lastContact: new Date(contact.lastContact),
        accountId: account.id
      }
    });
    contactRecords[contact.email] = { id: record.id };
  }

  const leadRecords: Record<string, { id: number }> = {};
  for (const lead of leadsSeed) {
    const account = lead.account ? accountRecords[lead.account] : undefined;
    const record = await prisma.lead.create({
      data: {
        name: lead.name,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        status: lead.status as LeadStatus,
        owner: lead.owner,
        score: lead.score,
        notes: lead.notes,
        accountId: account?.id
      }
    });
    if (lead.email) {
      leadRecords[lead.email] = { id: record.id };
    }
  }

  const workflowRuleRecords: Record<string, { id: number }> = {};
  for (const rule of workflowRulesSeed) {
    const record = await prisma.workflowRule.create({
      data: {
        name: rule.name,
        description: rule.description,
        triggerType: rule.triggerType as WorkflowTriggerType,
        triggerConfig: rule.triggerConfig,
        conditionConfig: rule.conditionConfig
      }
    });
    workflowRuleRecords[rule.name] = { id: record.id };
    for (const action of rule.actions) {
      await prisma.workflowAction.create({
        data: {
          type: action.type as WorkflowActionType,
          actionConfig: action.actionConfig,
          ruleId: record.id
        }
      });
    }
  }

  const opportunityRecords: Record<string, { id: number }> = {};
  for (const opportunity of opportunitiesSeed) {
    const account = accountRecords[opportunity.account];
    const contact = contactRecords[opportunity.contact];
    if (!account) continue;
    const lead = opportunity.leadEmail ? leadRecords[opportunity.leadEmail] : undefined;
    const record = await prisma.opportunity.create({
      data: {
        name: opportunity.name,
        amount: opportunity.amount,
        closeDate: new Date(opportunity.closeDate),
        probability: opportunity.probability,
        owner: opportunity.owner,
        stage: stageLabelToEnum[opportunity.stage],
        email: opportunity.email,
        phone: opportunity.phone,
        accountId: account.id,
        contactId: contact?.id,
        leadId: lead?.id
      }
    });
    opportunityRecords[opportunity.name] = { id: record.id };
    if (lead) {
      await prisma.opportunity.update({
        where: { id: record.id },
        data: {
          leadId: lead.id
        }
      });
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          status: 'QUALIFIED'
        }
      });
    }
  }

  for (const activity of activitiesSeed) {
    const opportunity = activity.opportunity ? opportunityRecords[activity.opportunity] : undefined;
    await prisma.activity.create({
      data: {
        type: activity.type,
        subject: activity.subject,
        description: activity.description,
        performedBy: activity.performedBy,
        opportunityId: opportunity?.id
      }
    });
  }

  const taskRecords: Record<string, { id: number }> = {};
  for (const task of tasksSeed) {
    const opportunity = task.opportunity ? opportunityRecords[task.opportunity] : undefined;
    const workflowRule = task.workflowRule ? workflowRuleRecords[task.workflowRule] : undefined;
    const record = await prisma.task.create({
      data: {
        title: task.title,
        dueDate: new Date(task.dueDate),
        priority: task.priority as TaskPriority,
        status: task.status as TaskStatus,
        assignedTo: task.assignedTo,
        opportunityId: opportunity?.id,
        workflowRuleId: workflowRule?.id
      }
    });
    taskRecords[task.title] = { id: record.id };
  }

  for (const invoice of invoicesSeed) {
    const account = accountRecords[invoice.account];
    if (!account) continue;
    await prisma.invoice.upsert({
      where: { id: invoice.id },
      update: {
        amount: invoice.amount,
        status: invoice.status as InvoiceStatus,
        issueDate: new Date(invoice.issueDate),
        dueDate: new Date(invoice.dueDate),
        paidDate: invoice.paidDate ? new Date(invoice.paidDate) : null,
        notes: invoice.notes,
        accountId: account.id,
        items: {
          deleteMany: {},
          create: invoice.items
        }
      },
      create: {
        id: invoice.id,
        amount: invoice.amount,
        status: invoice.status as InvoiceStatus,
        issueDate: new Date(invoice.issueDate),
        dueDate: new Date(invoice.dueDate),
        paidDate: invoice.paidDate ? new Date(invoice.paidDate) : null,
        notes: invoice.notes,
        accountId: account.id,
        items: {
          create: invoice.items
        }
      }
    });
  }

  for (const quote of quotesSeed) {
    const account = accountRecords[quote.account];
    if (!account) continue;
    const opportunity = quote.opportunity ? opportunityRecords[quote.opportunity] : undefined;
    await prisma.quote.upsert({
      where: { number: quote.number },
      update: {
        status: quote.status as QuoteStatus,
        total: quote.total,
        currency: quote.currency,
        issuedAt: new Date(quote.issuedAt),
        expiresAt: quote.expiresAt ? new Date(quote.expiresAt) : null,
        notes: quote.notes,
        accountId: account.id,
        opportunityId: opportunity?.id,
        lines: {
          deleteMany: {},
          create: quote.lines.map((line) => ({
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            productId: line.product ? productRecords[line.product]?.id : undefined
          }))
        }
      },
      create: {
        number: quote.number,
        status: quote.status as QuoteStatus,
        total: quote.total,
        currency: quote.currency,
        issuedAt: new Date(quote.issuedAt),
        expiresAt: quote.expiresAt ? new Date(quote.expiresAt) : null,
        notes: quote.notes,
        accountId: account.id,
        opportunityId: opportunity?.id,
        lines: {
          create: quote.lines.map((line) => ({
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            productId: line.product ? productRecords[line.product]?.id : undefined
          }))
        }
      }
    });
  }

  for (const contract of contractsSeed) {
    const account = accountRecords[contract.account];
    if (!account) continue;
    const opportunity = contract.opportunity ? opportunityRecords[contract.opportunity] : undefined;
    await prisma.contract.upsert({
      where: { contractNumber: contract.contractNumber },
      update: {
        status: contract.status as ContractStatus,
        startDate: new Date(contract.startDate),
        endDate: contract.endDate ? new Date(contract.endDate) : null,
        value: contract.value,
        terms: contract.terms,
        accountId: account.id,
        opportunityId: opportunity?.id
      },
      create: {
        contractNumber: contract.contractNumber,
        status: contract.status as ContractStatus,
        startDate: new Date(contract.startDate),
        endDate: contract.endDate ? new Date(contract.endDate) : null,
        value: contract.value,
        terms: contract.terms,
        accountId: account.id,
        opportunityId: opportunity?.id
      }
    });
  }

  for (const document of documentsSeed) {
    const opportunity = opportunityRecords[document.opportunity];
    await prisma.document.create({
      data: {
        name: document.name,
        type: document.type,
        size: document.size,
        uploadedBy: document.uploadedBy,
        uploadedAt: new Date(document.uploadedAt),
        opportunityId: opportunity?.id
      }
    });
  }

  for (const insight of aiInsightsSeed) {
    const opportunity = insight.opportunity ? opportunityRecords[insight.opportunity] : undefined;
    const task = insight.task ? taskRecords[insight.task] : undefined;
    await prisma.aIInsight.create({
      data: {
        type: insight.type as AIInsightType,
        summary: insight.summary,
        confidence: insight.confidence,
        opportunityId: opportunity?.id,
        taskId: task?.id
      }
    });
  }

  for (const notification of notificationsSeed) {
    const account = notification.account ? accountRecords[notification.account] : undefined;
    await prisma.notification.create({
      data: {
        type: notification.type as NotificationType,
        status: notification.status as NotificationStatus,
        title: notification.title,
        body: notification.body,
        recipient: notification.recipient,
        link: notification.link,
        accountId: account?.id,
        readAt: notification.readAt ? new Date(notification.readAt) : null
      }
    });
  }

  console.info('✅ Seed data applied.');
}

main()
  .catch((error) => {
    console.error('Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
