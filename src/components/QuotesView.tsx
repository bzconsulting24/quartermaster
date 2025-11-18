import { useEffect, useMemo, useState } from 'react';
import { FileText, Filter } from 'lucide-react';
import { COLORS, formatCurrency, formatDisplayDate } from '../data/uiConstants';
import type { QuoteRecord, QuoteStatus } from '../types';

const statuses: QuoteStatus[] = ['DRAFT', 'SENT', 'ACCEPTED', 'DECLINED'];

const QuotesView = () => {
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuotes = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/quotes');
        if (!response.ok) {
          throw new Error('Unable to load quotes');
        }
        const data = await response.json();
        setQuotes(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadQuotes();
  }, []);

  const filteredQuotes = useMemo(() => {
    return quotes.filter(quote => (statusFilter === 'all' ? true : quote.status === statusFilter));
  }, [quotes, statusFilter]);

  const totals = useMemo(() => {
    const draft = filteredQuotes.filter(q => q.status === 'DRAFT').reduce((sum, q) => sum + q.total, 0);
    const sent = filteredQuotes.filter(q => q.status === 'SENT').reduce((sum, q) => sum + q.total, 0);
    const accepted = filteredQuotes.filter(q => q.status === 'ACCEPTED').reduce((sum, q) => sum + q.total, 0);
    return { draft, sent, accepted };
  }, [filteredQuotes]);

  return (
    <div style={{ padding: '24px', minHeight: '100%', background: '#F9FAFB' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: COLORS.navyDark }}>Quotes</h1>
          <p style={{ fontSize: '14px', color: '#6B7280' }}>
            {loading ? 'Loading...' : `${filteredQuotes.length} quotes`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Filter size={18} color="#6B7280" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as QuoteStatus | 'all')}
            style={{
              padding: '10px 16px',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        {[
          { label: 'Draft Value', value: formatCurrency(totals.draft), color: '#6B7280' },
          { label: 'Sent Value', value: formatCurrency(totals.sent), color: '#2563EB' },
          { label: 'Accepted', value: formatCurrency(totals.accepted), color: '#059669' }
        ].map(stat => (
          <div
            key={stat.label}
            style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
          >
            <div style={{ fontSize: '14px', color: '#6B7280' }}>{stat.label}</div>
            <div style={{ fontSize: '26px', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}
      >
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '960px' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: `2px solid ${COLORS.gold}` }}>
                {['Quote #', 'Account', 'Status', 'Issued', 'Expires', 'Total', 'Opportunity'].map(header => (
                  <th
                    key={header}
                    style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#6B7280',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase'
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} style={{ padding: '16px', textAlign: 'center', color: '#6B7280' }}>
                    Loading quotes...
                  </td>
                </tr>
              )}
              {!loading &&
                filteredQuotes.map(quote => (
                  <tr key={quote.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '16px', fontWeight: 600, color: COLORS.navyDark }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} color={COLORS.navyDark} />
                        {quote.number}
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: '#6B7280' }}>{quote.account.name}</td>
                    <td style={{ padding: '16px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          background: '#F3F4F6',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 600
                        }}
                      >
                        {quote.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: '#6B7280' }}>{formatDisplayDate(quote.issuedAt)}</td>
                    <td style={{ padding: '16px', color: '#6B7280' }}>
                      {quote.expiresAt ? formatDisplayDate(quote.expiresAt) : '—'}
                    </td>
                    <td style={{ padding: '16px', fontWeight: 600, color: COLORS.navyDark }}>
                      {formatCurrency(quote.total)}
                    </td>
                    <td style={{ padding: '16px', color: '#6B7280' }}>{quote.opportunity?.name ?? '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QuotesView;
