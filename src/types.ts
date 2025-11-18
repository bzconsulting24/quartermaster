export type StageId =
  | 'Prospecting'
  | 'Qualification'
  | 'Proposal/Price Quote'
  | 'Negotiation/Review'
  | 'Closed Won'
  | 'Closed Lost';

export interface Opportunity {
  id: number;
  name: string;
  account: string;
  contact: string;
  amount: number;
  stage: StageId;
  closeDate: string;
  owner: string;
  probability: number;
  email: string;
  phone: string;
}

export interface OpportunityStage {
  id: StageId;
  name: string;
  color: string;
}

export type ActivityType = 'email' | 'call' | 'task' | 'note' | 'meeting';

export interface Activity {
  id: number;
  type: ActivityType;
  user: string;
  action: string;
  subject: string;
  time: string;
  description: string;
}

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'open' | 'overdue';

export interface Task {
  id: number;
  title: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo: string;
}

export type DocumentType = 'proposal' | 'contract' | 'presentation';

export interface DocumentRecord {
  id: number;
  name: string;
  type: DocumentType;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface AccountRecord {
  id: number;
  name: string;
  industry: string;
  type: 'Enterprise' | 'Mid-Market' | 'SMB';
  revenue: string;
  employees: number;
  owner: string;
  phone: string;
  website: string;
  location: string;
}

export interface ContactRecord {
  id: number;
  name: string;
  title: string;
  account: string;
  email: string;
  phone: string;
  owner: string;
  lastContact: string;
}

export type InvoiceStatus = 'paid' | 'sent' | 'overdue' | 'draft';

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
}

export interface InvoiceRecord {
  id: string;
  account: string;
  contact: string;
  amount: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidDate: string | null;
  items: InvoiceItem[];
  notes: string;
}

export interface UserSummary {
  name: string;
  initials: string;
}

export type AppTab =
  | 'home'
  | 'opportunities'
  | 'accounts'
  | 'contacts'
  | 'invoices'
  | 'tasks'
  | 'calendar'
  | 'reports';

export type OpportunityModalTab = 'overview' | 'activity' | 'contacts' | 'documents';
