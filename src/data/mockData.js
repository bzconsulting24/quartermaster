export const COLORS = {
  navyDark: '#0A2540',
  navyLight: '#143A5C',
  gold: '#FFD700',
  goldDark: '#FFA500',
};

export const mockOpportunities = [
  { id: 1, name: 'Acme Corp - Enterprise', account: 'Acme Corporation', contact: 'John Doe', amount: 50000, stage: 'Prospecting', closeDate: '2024-03-15', owner: 'Sarah Johnson', probability: 25, email: 'john@acme.com', phone: '555-0100' },
  { id: 2, name: 'TechStart - SMB Package', account: 'TechStart Inc', contact: 'Jane Smith', amount: 15000, stage: 'Qualification', closeDate: '2024-02-28', owner: 'Michael Chen', probability: 40, email: 'jane@techstart.com', phone: '555-0101' },
  { id: 3, name: 'BuildCo - Expansion', account: 'BuildCo Ltd', contact: 'Bob Johnson', amount: 25000, stage: 'Proposal/Price Quote', closeDate: '2024-04-10', owner: 'Sarah Johnson', probability: 60, email: 'bob@buildco.com', phone: '555-0102' },
  { id: 4, name: 'DataFlow Implementation', account: 'DataFlow Inc', contact: 'Alice Brown', amount: 75000, stage: 'Negotiation/Review', closeDate: '2024-02-20', owner: 'John Williams', probability: 75, email: 'alice@dataflow.com', phone: '555-0103' },
  { id: 5, name: 'CloudNine Solutions', account: 'CloudNine Corp', contact: 'Mike Wilson', amount: 40000, stage: 'Closed Won', closeDate: '2024-01-30', owner: 'Sarah Johnson', probability: 100, email: 'mike@cloudnine.com', phone: '555-0104' },
];

export const mockActivities = [
  { id: 1, type: 'email', user: 'Sarah Johnson', action: 'sent an email', subject: 'Follow-up on proposal', time: '2 hours ago', description: 'Sent proposal details and pricing breakdown' },
  { id: 2, type: 'call', user: 'Michael Chen', action: 'logged a call', subject: 'Discovery call completed', time: '5 hours ago', description: 'Discussed requirements and timeline. Next steps: send proposal.' },
  { id: 3, type: 'task', user: 'Sarah Johnson', action: 'completed a task', subject: 'Prepare demo environment', time: '1 day ago', description: 'Demo environment ready for presentation' },
  { id: 4, type: 'note', user: 'John Williams', action: 'added a note', subject: 'Budget confirmation', time: '2 days ago', description: 'CFO confirmed budget approval for Q1' },
  { id: 5, type: 'meeting', user: 'Sarah Johnson', action: 'scheduled a meeting', subject: 'Product Demo', time: '3 days ago', description: 'Demo scheduled for Feb 15 at 2pm' },
];

export const mockTasks = [
  { id: 1, title: 'Follow up with Acme Corp', dueDate: '2024-02-10', priority: 'high', status: 'open', assignedTo: 'Sarah Johnson' },
  { id: 2, title: 'Send proposal to TechStart', dueDate: '2024-02-12', priority: 'medium', status: 'open', assignedTo: 'Michael Chen' },
  { id: 3, title: 'Schedule demo with BuildCo', dueDate: '2024-02-08', priority: 'high', status: 'overdue', assignedTo: 'Sarah Johnson' },
  { id: 4, title: 'Prepare contract for DataFlow', dueDate: '2024-02-15', priority: 'low', status: 'open', assignedTo: 'John Williams' },
];

export const mockDocuments = [
  { id: 1, name: 'Proposal_Acme_v2.pdf', type: 'proposal', size: '2.4 MB', uploadedBy: 'Sarah Johnson', uploadedAt: '2024-02-05' },
  { id: 2, name: 'Contract_TechStart.docx', type: 'contract', size: '1.1 MB', uploadedBy: 'Michael Chen', uploadedAt: '2024-02-03' },
  { id: 3, name: 'Product_Demo_Slides.pptx', type: 'presentation', size: '5.8 MB', uploadedBy: 'Sarah Johnson', uploadedAt: '2024-01-28' },
];

export const stages = [
  { id: 'Prospecting', name: 'Prospecting', color: '#9CA3AF' },
  { id: 'Qualification', name: 'Qualification', color: '#60A5FA' },
  { id: 'Proposal/Price Quote', name: 'Proposal/Price Quote', color: '#FBBF24' },
  { id: 'Negotiation/Review', name: 'Negotiation/Review', color: '#F59E0B' },
  { id: 'Closed Won', name: 'Closed Won', color: '#10B981' },
  { id: 'Closed Lost', name: 'Closed Lost', color: '#EF4444' },
];
