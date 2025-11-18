export type StageId =
  | 'Prospecting'
  | 'Qualification'
  | 'Proposal/Price Quote'
  | 'Negotiation/Review'
  | 'Closed Won'
  | 'Closed Lost';

export type AccountType = 'Enterprise' | 'MidMarket' | 'SMB';

export interface AccountRecord {
  id: number;
  name: string;
  industry?: string | null;
  type: AccountType;
  revenue?: number | null;
  employees?: number | null;
  owner?: string | null;
  phone?: string | null;
  website?: string | null;
  location?: string | null;
  _count?: {
    contacts: number;
    opportunities: number;
    invoices: number;
  };
}

export interface ContactRecord {
  id: number;
  name: string;
  title?: string | null;
  email: string;
  phone?: string | null;
  owner?: string | null;
  lastContact?: string | null;
  account: AccountRecord;
}

export type ActivityType = 'EMAIL' | 'CALL' | 'TASK' | 'NOTE' | 'MEETING';

export interface Activity {
  id: number;
  type: ActivityType;
  subject: string;
  description?: string | null;
  performedBy: string;
  performedAt: string;
  opportunity?: {
    id: number;
    name: string;
  } | null;
}

export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskStatus = 'OPEN' | 'OVERDUE' | 'COMPLETED';

export interface Task {
  id: number;
  title: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo: string;
  opportunity?: {
    id: number;
    name: string;
    account?: AccountRecord | null;
  } | null;
}

export interface DocumentRecord {
  id: number;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Opportunity {
  id: number;
  name: string;
  amount: number;
  stage: StageId;
  closeDate: string;
  owner: string;
  probability: number;
  email?: string | null;
  phone?: string | null;
  account: AccountRecord;
  contact?: ContactRecord | null;
  activities?: Activity[];
  tasks?: Task[];
  documents?: DocumentRecord[];
}

export interface OpportunityStage {
  id: StageId;
  name: string;
  color: string;
}

export type InvoiceStatus = 'PAID' | 'SENT' | 'OVERDUE' | 'DRAFT';

export interface InvoiceItem {
  id?: number;
  description: string;
  quantity: number;
  rate: number;
}

export interface InvoiceRecord {
  id: string;
  account: AccountRecord;
  amount: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidDate: string | null;
  notes?: string | null;
  items: InvoiceItem[];
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
