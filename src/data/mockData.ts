import type {
  AccountRecord,
  Activity,
  ContactRecord,
  DocumentRecord,
  InvoiceRecord,
  Opportunity,
  OpportunityStage,
  Task
} from '../types';

export const COLORS = {
  navyDark: '#0A2540',
  navyLight: '#143A5C',
  gold: '#FFD700',
  goldDark: '#FFA500'
} as const;

export const formatCurrency = (amount: number): string => {
  if (amount >= 1_000_000) {
    return `₱${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `₱${(amount / 1_000).toFixed(0)}K`;
  }
  return `₱${amount.toLocaleString()}`;
};

export const mockOpportunities: Opportunity[] = [
  { id: 1, name: 'Acme Corp - Enterprise', account: 'Acme Corporation', contact: 'John Doe', amount: 5_000_000, stage: 'Prospecting', closeDate: '2024-03-15', owner: 'Sarah Johnson', probability: 25, email: 'john@acme.com', phone: '555-0100' },
  { id: 2, name: 'TechStart - SMB Package', account: 'TechStart Inc', contact: 'Jane Smith', amount: 1_500_000, stage: 'Qualification', closeDate: '2024-02-28', owner: 'Michael Chen', probability: 40, email: 'jane@techstart.com', phone: '555-0101' },
  { id: 3, name: 'BuildCo - Expansion', account: 'BuildCo Ltd', contact: 'Bob Johnson', amount: 2_500_000, stage: 'Proposal/Price Quote', closeDate: '2024-04-10', owner: 'Sarah Johnson', probability: 60, email: 'bob@buildco.com', phone: '555-0102' },
  { id: 4, name: 'DataFlow Implementation', account: 'DataFlow Inc', contact: 'Alice Brown', amount: 7_500_000, stage: 'Negotiation/Review', closeDate: '2024-02-20', owner: 'John Williams', probability: 75, email: 'alice@dataflow.com', phone: '555-0103' },
  { id: 5, name: 'CloudNine Solutions', account: 'CloudNine Corp', contact: 'Mike Wilson', amount: 4_000_000, stage: 'Closed Won', closeDate: '2024-01-30', owner: 'Sarah Johnson', probability: 100, email: 'mike@cloudnine.com', phone: '555-0104' }
];

export const mockActivities: Activity[] = [
  { id: 1, type: 'email', user: 'Sarah Johnson', action: 'sent an email', subject: 'Follow-up on proposal', time: '2 hours ago', description: 'Sent proposal details and pricing breakdown' },
  { id: 2, type: 'call', user: 'Michael Chen', action: 'logged a call', subject: 'Discovery call completed', time: '5 hours ago', description: 'Discussed requirements and timeline. Next steps: send proposal.' },
  { id: 3, type: 'task', user: 'Sarah Johnson', action: 'completed a task', subject: 'Prepare demo environment', time: '1 day ago', description: 'Demo environment ready for presentation' },
  { id: 4, type: 'note', user: 'John Williams', action: 'added a note', subject: 'Budget confirmation', time: '2 days ago', description: 'CFO confirmed budget approval for Q1' },
  { id: 5, type: 'meeting', user: 'Sarah Johnson', action: 'scheduled a meeting', subject: 'Product Demo', time: '3 days ago', description: 'Demo scheduled for Feb 15 at 2pm' }
];

export const mockTasks: Task[] = [
  { id: 1, title: 'Follow up with Acme Corp', dueDate: '2024-02-10', priority: 'high', status: 'open', assignedTo: 'Sarah Johnson' },
  { id: 2, title: 'Send proposal to TechStart', dueDate: '2024-02-12', priority: 'medium', status: 'open', assignedTo: 'Michael Chen' },
  { id: 3, title: 'Schedule demo with BuildCo', dueDate: '2024-02-08', priority: 'high', status: 'overdue', assignedTo: 'Sarah Johnson' },
  { id: 4, title: 'Prepare contract for DataFlow', dueDate: '2024-02-15', priority: 'low', status: 'open', assignedTo: 'John Williams' }
];

export const mockDocuments: DocumentRecord[] = [
  { id: 1, name: 'Proposal_Acme_v2.pdf', type: 'proposal', size: '2.4 MB', uploadedBy: 'Sarah Johnson', uploadedAt: '2024-02-05' },
  { id: 2, name: 'Contract_TechStart.docx', type: 'contract', size: '1.1 MB', uploadedBy: 'Michael Chen', uploadedAt: '2024-02-03' },
  { id: 3, name: 'Product_Demo_Slides.pptx', type: 'presentation', size: '5.8 MB', uploadedBy: 'Sarah Johnson', uploadedAt: '2024-01-28' }
];

export const stages: OpportunityStage[] = [
  { id: 'Prospecting', name: 'Prospecting', color: '#9CA3AF' },
  { id: 'Qualification', name: 'Qualification', color: '#60A5FA' },
  { id: 'Proposal/Price Quote', name: 'Proposal/Price Quote', color: '#FBBF24' },
  { id: 'Negotiation/Review', name: 'Negotiation/Review', color: '#F59E0B' },
  { id: 'Closed Won', name: 'Closed Won', color: '#10B981' },
  { id: 'Closed Lost', name: 'Closed Lost', color: '#EF4444' }
];

export const mockAccounts: AccountRecord[] = [
  { id: 1, name: 'Acme Corporation', industry: 'Technology', type: 'Enterprise', revenue: '$50M', employees: 500, owner: 'Sarah Johnson', phone: '555-1000', website: 'acme.com', location: 'San Francisco, CA' },
  { id: 2, name: 'TechStart Inc', industry: 'Software', type: 'SMB', revenue: '$5M', employees: 50, owner: 'Michael Chen', phone: '555-1001', website: 'techstart.io', location: 'Austin, TX' },
  { id: 3, name: 'BuildCo Ltd', industry: 'Construction', type: 'Mid-Market', revenue: '$25M', employees: 200, owner: 'Sarah Johnson', phone: '555-1002', website: 'buildco.com', location: 'Chicago, IL' },
  { id: 4, name: 'DataFlow Inc', industry: 'Data Analytics', type: 'Enterprise', revenue: '$100M', employees: 800, owner: 'John Williams', phone: '555-1003', website: 'dataflow.com', location: 'New York, NY' },
  { id: 5, name: 'CloudNine Corp', industry: 'Cloud Services', type: 'Enterprise', revenue: '$75M', employees: 600, owner: 'Sarah Johnson', phone: '555-1004', website: 'cloudnine.com', location: 'Seattle, WA' },
  { id: 6, name: 'RetailMax', industry: 'Retail', type: 'Mid-Market', revenue: '$15M', employees: 150, owner: 'Michael Chen', phone: '555-1005', website: 'retailmax.com', location: 'Los Angeles, CA' },
  { id: 7, name: 'FinanceHub', industry: 'Financial Services', type: 'Enterprise', revenue: '$200M', employees: 1200, owner: 'John Williams', phone: '555-1006', website: 'financehub.com', location: 'Boston, MA' }
];

export const mockContacts: ContactRecord[] = [
  { id: 1, name: 'John Doe', title: 'CEO', account: 'Acme Corporation', email: 'john@acme.com', phone: '555-0100', owner: 'Sarah Johnson', lastContact: '2024-02-07' },
  { id: 2, name: 'Jane Smith', title: 'VP of Sales', account: 'TechStart Inc', email: 'jane@techstart.com', phone: '555-0101', owner: 'Michael Chen', lastContact: '2024-02-06' },
  { id: 3, name: 'Bob Johnson', title: 'CTO', account: 'BuildCo Ltd', email: 'bob@buildco.com', phone: '555-0102', owner: 'Sarah Johnson', lastContact: '2024-02-05' },
  { id: 4, name: 'Alice Brown', title: 'Director of IT', account: 'DataFlow Inc', email: 'alice@dataflow.com', phone: '555-0103', owner: 'John Williams', lastContact: '2024-02-08' },
  { id: 5, name: 'Mike Wilson', title: 'VP of Operations', account: 'CloudNine Corp', email: 'mike@cloudnine.com', phone: '555-0104', owner: 'Sarah Johnson', lastContact: '2024-02-04' },
  { id: 6, name: 'Sarah Davis', title: 'CFO', account: 'Acme Corporation', email: 'sarah@acme.com', phone: '555-0105', owner: 'Sarah Johnson', lastContact: '2024-02-07' },
  { id: 7, name: 'Tom Anderson', title: 'IT Manager', account: 'RetailMax', email: 'tom@retailmax.com', phone: '555-0106', owner: 'Michael Chen', lastContact: '2024-02-03' },
  { id: 8, name: 'Emily White', title: 'SVP Technology', account: 'FinanceHub', email: 'emily@financehub.com', phone: '555-0107', owner: 'John Williams', lastContact: '2024-02-09' }
];

export const mockInvoices: InvoiceRecord[] = [
  { id: 'INV-001', account: 'Acme Corporation', contact: 'John Doe', amount: 5_000_000, status: 'paid', issueDate: '2024-01-15', dueDate: '2024-02-15', paidDate: '2024-02-10', items: [{ description: 'Enterprise Package - Annual License', quantity: 1, rate: 5_000_000 }], notes: 'Payment received via wire transfer' },
  { id: 'INV-002', account: 'TechStart Inc', contact: 'Jane Smith', amount: 1_500_000, status: 'sent', issueDate: '2024-02-01', dueDate: '2024-03-01', paidDate: null, items: [{ description: 'SMB Package - Q1 Services', quantity: 1, rate: 1_500_000 }], notes: 'Invoice sent via email on 2024-02-01' },
  { id: 'INV-003', account: 'BuildCo Ltd', contact: 'Bob Johnson', amount: 2_500_000, status: 'overdue', issueDate: '2024-01-10', dueDate: '2024-02-10', paidDate: null, items: [{ description: 'Expansion Services', quantity: 1, rate: 2_500_000 }], notes: 'Follow-up required - overdue by 1 day' },
  { id: 'INV-004', account: 'DataFlow Inc', contact: 'Alice Brown', amount: 7_500_000, status: 'sent', issueDate: '2024-02-05', dueDate: '2024-03-05', paidDate: null, items: [{ description: 'Implementation Services', quantity: 1, rate: 6_000_000 }, { description: 'Training & Support', quantity: 1, rate: 1_500_000 }], notes: 'Awaiting approval from CFO' },
  { id: 'INV-005', account: 'CloudNine Corp', contact: 'Mike Wilson', amount: 4_000_000, status: 'paid', issueDate: '2024-01-20', dueDate: '2024-02-20', paidDate: '2024-02-18', items: [{ description: 'Cloud Solutions Package', quantity: 1, rate: 4_000_000 }], notes: 'Paid on time' },
  { id: 'INV-006', account: 'RetailMax', contact: 'Tom Anderson', amount: 1_200_000, status: 'draft', issueDate: '2024-02-11', dueDate: '2024-03-11', paidDate: null, items: [{ description: 'Retail Integration Services', quantity: 1, rate: 1_200_000 }], notes: 'Draft - pending client review' },
  { id: 'INV-007', account: 'FinanceHub', contact: 'Emily White', amount: 8_500_000, status: 'sent', issueDate: '2024-02-08', dueDate: '2024-03-08', paidDate: null, items: [{ description: 'Financial Platform Integration', quantity: 1, rate: 7_000_000 }, { description: 'Compliance Audit', quantity: 1, rate: 1_500_000 }], notes: 'Sent to procurement department' },
  { id: 'INV-008', account: 'Acme Corporation', contact: 'Sarah Davis', amount: 3_000_000, status: 'overdue', issueDate: '2024-01-05', dueDate: '2024-02-05', paidDate: null, items: [{ description: 'Consulting Services - January', quantity: 1, rate: 3_000_000 }], notes: 'Multiple follow-up attempts made' }
];
