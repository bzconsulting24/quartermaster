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
  workflowRuleId?: number | null;
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
  insights?: AIInsight[];
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

export type LeadStatus = 'NEW' | 'WORKING' | 'NURTURING' | 'QUALIFIED' | 'DISQUALIFIED';

export interface LeadRecord {
  id: number;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  status: LeadStatus;
  owner?: string | null;
  score?: number | null;
  notes?: string | null;
  updatedAt?: string;
  account?: AccountRecord | null;
  opportunity?: Opportunity | null;
}

export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'DECLINED';

export interface QuoteLine {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  productId?: number | null;
}

export interface QuoteRecord {
  id: number;
  number: string;
  status: QuoteStatus;
  total: number;
  currency: string;
  issuedAt: string;
  expiresAt?: string | null;
  notes?: string | null;
  account: AccountRecord;
  opportunity?: Opportunity | null;
  lines: QuoteLine[];
}

export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface ContractRecord {
  id: number;
  contractNumber: string;
  status: ContractStatus;
  startDate: string;
  endDate?: string | null;
  value: number;
  terms?: string | null;
  account: AccountRecord;
  opportunity?: Opportunity | null;
}

export type AIInsightType = 'SUMMARY' | 'NEXT_STEP' | 'RISK' | 'EMAIL_DRAFT';

export interface AIInsight {
  id: number;
  type: AIInsightType;
  summary: string;
  confidence?: number | null;
  createdAt?: string;
}

export type AppTab =
  | 'home'
  | 'opportunities'
  | 'accounts'
  | 'contacts'
  | 'customerInformation'
  | 'invoices'
  | 'tasks'
  | 'calendar'
  | 'reports'
  | 'leads'
  | 'estimates'
  | 'contracts';

export type OpportunityModalTab = 'overview' | 'activity' | 'contacts' | 'documents';

