import { useEffect, useMemo, useState } from 'react';
import { FileText, Filter, Send, Repeat } from 'lucide-react';
import { COLORS, formatCurrency, formatDisplayDate } from '../data/uiConstants';
import AIAssistModal from './AIAssistModal';
import EstimateDetailModal from './EstimateDetailModal';
import type { QuoteRecord, QuoteStatus } from '../types';

const statuses: QuoteStatus[] = ['DRAFT', 'SENT', 'ACCEPTED', 'DECLINED'];

const QuotesView = () => {
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [showAIModal, setShowAIModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/estimates');
      if (!response.ok) throw new Error('Unable to load estimates');
      const data = await response.json();
      setQuotes(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filteredQuotes = useMemo(
    () => quotes.filter(q => (statusFilter === 'all' ? true : q.status === statusFilter)),
    [quotes, statusFilter]
  );

  const totals = useMemo(() => {
    const draft = filteredQuotes.filter(q => q.status === 'DRAFT').reduce((sum, q) => sum + q.total, 0);
    const sent = filteredQuotes.filter(q => q.status === 'SENT').reduce((sum, q) => sum + q.total, 0);
    const accepted = filteredQuotes.filter(q => q.status === 'ACCEPTED').reduce((sum, q) => sum + q.total, 0);
    return { draft, sent, accepted };
  }, [filteredQuotes]);

  const sendEstimate = async (id: number) => {
    const to = window.prompt('Send estimate to email (leave blank to skip email):') || undefined;
    await fetch('/api/estimates/' + id + '/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to })
    });
    await load();
  };

  const convertToInvoice = async (id: number) => {
    const res = await fetch('/api/estimates/' + id + '/convert-to-invoice', { method: 'POST' });
    if (res.ok) await load();
  };

  return (
    <div style={{ padding: '24px', minHeight: '100%', background: '#F9FAFB' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: COLORS.navyDark }}>Estimates</h1>
          <p style={{ fontSize: '14px', color: '#6B7280' }}>
            {loading ? 'Loading...' : (filteredQuotes.length + ' estimates')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => setShowAIModal(true)} style={{ padding: '10px 12px', background: COLORS.navyDark, color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>AI Draft</button>
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
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1024px' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '2px solid ' + COLORS.gold }}>
                {['Estimate #', 'Account', 'Status', 'Issued', 'Expires', 'Total', 'Opportunity', 'Actions'].map(header => (
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
                  <td colSpan={8} style={{ padding: '16px', textAlign: 'center', color: '#6B7280' }}>
                    Loading estimates...
                  </td>
                </tr>
              )}
              {!loading &&
                filteredQuotes.map(quote => (
                  <tr key={quote.id} onClick={() => setSelectedId(quote.id)} style={{ borderBottom: '1px solid #E5E7EB', cursor: 'pointer' }}>
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
                      {quote.expiresAt ? formatDisplayDate(quote.expiresAt) : '-'}
                    </td>
                    <td style={{ padding: '16px', fontWeight: 600, color: COLORS.navyDark }}>
                      {formatCurrency(quote.total)}
                    </td>
                    <td style={{ padding: '16px', color: '#6B7280' }}>{quote.opportunity?.name ?? '-'}</td>
                    <td style={{ padding: '16px' }} onClick={(e) => e.stopPropagation()}>
                      <button title="Send Estimate" onClick={() => void sendEstimate(quote.id)} style={{ marginRight: 8, padding: '6px 10px', borderRadius: 6, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer' }}>
                        <Send size={14} style={{ verticalAlign: 'middle' }} />
                      </button>
                      <button title="Convert to Invoice" onClick={() => void convertToInvoice(quote.id)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer' }}>
                        <Repeat size={14} style={{ verticalAlign: 'middle' }} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAIModal && (
        <AIAssistModal kind='quote' onClose={() => setShowAIModal(false)} onCreated={() => { setShowAIModal(false); void load(); }} />
      )}

      {selectedId !== null && (
        <EstimateDetailModal id={selectedId} onClose={() => setSelectedId(null)} onChanged={() => void load()} />
      )}
    </div>
  );
};

export default QuotesView;
