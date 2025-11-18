import type { AccountType, OpportunityStage } from '../types';

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
  return `₱${amount.toLocaleString('en-PH')}`;
};

export const PIPELINE_STAGES: OpportunityStage[] = [
  { id: 'Prospecting', name: 'Prospecting', color: '#9CA3AF' },
  { id: 'Qualification', name: 'Qualification', color: '#60A5FA' },
  { id: 'Proposal/Price Quote', name: 'Proposal/Price Quote', color: '#FBBF24' },
  { id: 'Negotiation/Review', name: 'Negotiation/Review', color: '#F59E0B' },
  { id: 'Closed Won', name: 'Closed Won', color: '#10B981' },
  { id: 'Closed Lost', name: 'Closed Lost', color: '#EF4444' }
];

export const formatAccountType = (type?: AccountType | null) => {
  if (!type) return 'N/A';
  return type === 'MidMarket' ? 'Mid-Market' : type;
};

export const formatDisplayDate = (date: string | Date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatRelativeTime = (date: string | Date) => {
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const toDate = typeof date === 'string' ? new Date(date) : date;
  const diffMs = toDate.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const absMinutes = Math.abs(diffMinutes);

  if (absMinutes < 60) {
    return formatter.format(diffMinutes, 'minute');
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, 'hour');
  }

  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, 'day');
};
