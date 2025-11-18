import { PrismaClient, type Stage, ActivityType, type InvoiceStatus, type TaskPriority, type TaskStatus } from '@prisma/client';

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

const opportunitiesSeed = [
  { name: 'Acme Corp - Enterprise', account: 'Acme Corporation', contact: 'john@acme.com', amount: 5_000_000, stage: 'Prospecting', closeDate: '2024-03-15', owner: 'Sarah Johnson', probability: 25, email: 'john@acme.com', phone: '555-0100' },
  { name: 'TechStart - SMB Package', account: 'TechStart Inc', contact: 'jane@techstart.com', amount: 1_500_000, stage: 'Qualification', closeDate: '2024-02-28', owner: 'Michael Chen', probability: 40, email: 'jane@techstart.com', phone: '555-0101' },
  { name: 'BuildCo - Expansion', account: 'BuildCo Ltd', contact: 'bob@buildco.com', amount: 2_500_000, stage: 'Proposal/Price Quote', closeDate: '2024-04-10', owner: 'Sarah Johnson', probability: 60, email: 'bob@buildco.com', phone: '555-0102' },
  { name: 'DataFlow Implementation', account: 'DataFlow Inc', contact: 'alice@dataflow.com', amount: 7_500_000, stage: 'Negotiation/Review', closeDate: '2024-02-20', owner: 'John Williams', probability: 75, email: 'alice@dataflow.com', phone: '555-0103' },
  { name: 'CloudNine Solutions', account: 'CloudNine Corp', contact: 'mike@cloudnine.com', amount: 4_000_000, stage: 'Closed Won', closeDate: '2024-01-30', owner: 'Sarah Johnson', probability: 100, email: 'mike@cloudnine.com', phone: '555-0104' }
];

const tasksSeed = [
  { title: 'Follow up with Acme Corp', dueDate: '2024-02-10', priority: 'HIGH', status: 'OPEN', assignedTo: 'Sarah Johnson', opportunity: 'Acme Corp - Enterprise' },
  { title: 'Send proposal to TechStart', dueDate: '2024-02-12', priority: 'MEDIUM', status: 'OPEN', assignedTo: 'Michael Chen', opportunity: 'TechStart - SMB Package' },
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

const documentsSeed = [
  { name: 'Proposal_Acme_v2.pdf', type: 'proposal', size: '2.4 MB', uploadedBy: 'Sarah Johnson', uploadedAt: '2024-02-05', opportunity: 'Acme Corp - Enterprise' },
  { name: 'Contract_TechStart.docx', type: 'contract', size: '1.1 MB', uploadedBy: 'Michael Chen', uploadedAt: '2024-02-03', opportunity: 'TechStart - SMB Package' },
  { name: 'Product_Demo_Slides.pptx', type: 'presentation', size: '5.8 MB', uploadedBy: 'Sarah Johnson', uploadedAt: '2024-01-28', opportunity: 'BuildCo - Expansion' },
  { name: 'Implementation_Playbook.pdf', type: 'proposal', size: '3.2 MB', uploadedBy: 'John Williams', uploadedAt: '2024-02-01', opportunity: 'DataFlow Implementation' }
];

async function main() {
  console.info('🌱 Seeding Quartermaster database...');

  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.task.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.document.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.account.deleteMany();

  const accountRecords: Record<string, { id: number }> = {};
  for (const account of accountsSeed) {
    const record = await prisma.account.upsert({
      where: { name: account.name },
      update: account,
      create: account
    });
    accountRecords[account.name] = { id: record.id };
  }

  const contactRecords: Record<string, { id: number }> = {};
  for (const contact of contactsSeed) {
    const account = accountRecords[contact.account];
    if (!account) continue;
    const record = await prisma.contact.upsert({
      where: { email: contact.email },
      update: {
        name: contact.name,
        title: contact.title,
        phone: contact.phone,
        owner: contact.owner,
        lastContact: new Date(contact.lastContact)
      },
      create: {
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

  const opportunityRecords: Record<string, { id: number }> = {};
  for (const opportunity of opportunitiesSeed) {
    const account = accountRecords[opportunity.account];
    const contact = contactRecords[opportunity.contact];
    if (!account) continue;
    const record = await prisma.opportunity.upsert({
      where: { name: opportunity.name },
      update: {
        amount: opportunity.amount,
        closeDate: new Date(opportunity.closeDate),
        probability: opportunity.probability,
        owner: opportunity.owner,
        stage: stageLabelToEnum[opportunity.stage],
        email: opportunity.email,
        phone: opportunity.phone,
        accountId: account.id,
        contactId: contact?.id
      },
      create: {
        name: opportunity.name,
        amount: opportunity.amount,
        closeDate: new Date(opportunity.closeDate),
        probability: opportunity.probability,
        owner: opportunity.owner,
        stage: stageLabelToEnum[opportunity.stage],
        email: opportunity.email,
        phone: opportunity.phone,
        accountId: account.id,
        contactId: contact?.id
      }
    });
    opportunityRecords[opportunity.name] = { id: record.id };
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

  for (const task of tasksSeed) {
    const opportunity = opportunityRecords[task.opportunity];
    await prisma.task.create({
      data: {
        title: task.title,
        dueDate: new Date(task.dueDate),
        priority: task.priority as TaskPriority,
        status: task.status as TaskStatus,
        assignedTo: task.assignedTo,
        opportunityId: opportunity?.id
      }
    });
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
