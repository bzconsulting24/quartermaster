import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Filter, FileText, Eye, Download } from 'lucide-react';
import { COLORS, formatCurrency, formatDisplayDate } from '../data/uiConstants';
import type { InvoiceRecord } from '../types';

type InvoiceStatusFilter = 'all' | 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';

const statusColors: Record<string, { bg: string; color: string; border: string }> = {
  PAID: { bg: '#D1FAE5', color: '#065F46', border: '#10B981' },
  SENT: { bg: '#DBEAFE', color: '#1E40AF', border: '#3B82F6' },
  OVERDUE: { bg: '#FEE2E2', color: '#991B1B', border: '#EF4444' },
  DRAFT: { bg: '#F3F4F6', color: '#374151', border: '#9CA3AF' }
};

const InvoicesView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<InvoiceStatusFilter>('all');
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInvoices = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/invoices');
        if (!response.ok) {
          throw new Error('Unable to load invoices');
        }
        const data = await response.json();
        setInvoices(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const matchesSearch = invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.account?.name ?? '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || invoice.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [invoices, searchTerm, filterStatus]);

  const totalStats = {
    total: invoices.reduce((sum, inv) => sum + inv.amount, 0),
    paid: invoices.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + inv.amount, 0),
    pending: invoices.filter(inv => inv.status === 'SENT').reduce((sum, inv) => sum + inv.amount, 0),
    overdue: invoices.filter(inv => inv.status === 'OVERDUE').reduce((sum, inv) => sum + inv.amount, 0),
  };

  return (
    <div style={{ padding: '24px', background: '#F9FAFB', minHeight: '100%' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: COLORS.navyDark, marginBottom: '4px' }}>
            Invoices
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280' }}>
            {loading ? 'Loading...' : `${filteredInvoices.length} invoices`}
          </p>
        </div>
        <button style={{
          padding: '10px 20px',
          background: `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)`,
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <Plus size={16} />
          New Invoice
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {[
          { label: 'Total Invoiced', value: formatCurrency(totalStats.total), color: COLORS.navyDark },
          { label: 'Paid', value: formatCurrency(totalStats.paid), color: '#10B981' },
          { label: 'Pending', value: formatCurrency(totalStats.pending), color: '#3B82F6' },
          { label: 'Overdue', value: formatCurrency(totalStats.overdue), color: '#EF4444' },
        ].map((stat, idx) => (
          <div
            key={idx}
            style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              borderLeft: `4px solid ${stat.color}`
            }}
          >
            <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
              {stat.label}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: 'white',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9CA3AF'
          }} size={18} />
          <input
            type="text"
            placeholder="Search invoices by number or account..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 10px 10px 40px',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Filter size={18} color="#6B7280" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as InvoiceStatusFilter)}
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
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: `2px solid ${COLORS.gold}` }}>
                {['Invoice #', 'Account', 'Amount', 'Status', 'Issued', 'Due', 'Actions'].map((header) => (
                  <th key={header} style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} style={{ padding: '16px', textAlign: 'center', color: '#6B7280' }}>
                    Loading invoices...
                  </td>
                </tr>
              )}
              {!loading && filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '16px', textAlign: 'center', color: '#6B7280' }}>
                    No invoices match your filters.
                  </td>
                </tr>
              )}
              {filteredInvoices.map((invoice) => {
                const colors = statusColors[invoice.status] ?? statusColors.DRAFT;
                return (
                  <tr key={invoice.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '16px', fontWeight: '600', color: COLORS.navyDark }}>{invoice.id}</td>
                    <td style={{ padding: '16px', color: '#6B7280' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} color="#6B7280" />
                        {invoice.account?.name ?? 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: COLORS.navyDark, fontWeight: '600' }}>
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '12px',
                        background: colors.bg,
                        color: colors.color,
                        border: `1px solid ${colors.border}`,
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {invoice.status.toLowerCase()}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: '#6B7280' }}>{formatDisplayDate(invoice.issueDate)}</td>
                    <td style={{ padding: '16px', color: '#6B7280' }}>{formatDisplayDate(invoice.dueDate)}</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setSelectedInvoice(invoice)}
                          style={{
                            border: `1px solid ${COLORS.navyDark}`,
                            borderRadius: '6px',
                            padding: '6px 12px',
                            background: 'white',
                            color: COLORS.navyDark,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Eye size={14} />
                          View
                        </button>
                        <button style={{
                          border: '1px solid #E5E7EB',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          background: 'white',
                          color: '#374151',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <Download size={14} />
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedInvoice && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '640px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: COLORS.navyDark }}>Invoice {selectedInvoice.id}</h2>
                <p style={{ color: '#6B7280', fontSize: '14px' }}>
                  {selectedInvoice.account?.name} • Issued {formatDisplayDate(selectedInvoice.issueDate)}
                </p>
              </div>
              <button onClick={() => setSelectedInvoice(null)} style={{ border: 'none', background: 'transparent', fontSize: '18px', cursor: 'pointer' }}>
                ✕
              </button>
            </div>
            <div style={{ marginBottom: '16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>Amount</div>
                <div style={{ fontSize: '20px', fontWeight: '600', color: COLORS.navyDark }}>{formatCurrency(selectedInvoice.amount)}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>Status</div>
                <div style={{ fontSize: '14px', fontWeight: '600', textTransform: 'capitalize' }}>{selectedInvoice.status.toLowerCase()}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>Due Date</div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>{formatDisplayDate(selectedInvoice.dueDate)}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>Paid Date</div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>
                  {selectedInvoice.paidDate ? formatDisplayDate(selectedInvoice.paidDate) : '—'}
                </div>
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Notes</div>
              <p style={{ fontSize: '14px', color: '#374151' }}>{selectedInvoice.notes ?? 'No notes provided.'}</p>
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: COLORS.navyDark, marginBottom: '8px' }}>
                Line Items
              </h3>
              <div style={{ border: '1px solid #E5E7EB', borderRadius: '6px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB', fontSize: '12px', textTransform: 'uppercase', color: '#6B7280' }}>
                      <th style={{ textAlign: 'left', padding: '8px 12px' }}>Description</th>
                      <th style={{ textAlign: 'right', padding: '8px 12px' }}>Quantity</th>
                      <th style={{ textAlign: 'right', padding: '8px 12px' }}>Rate</th>
                      <th style={{ textAlign: 'right', padding: '8px 12px' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map(item => (
                      <tr key={`${item.description}-${item.rate}`} style={{ borderTop: '1px solid #E5E7EB', fontSize: '14px' }}>
                        <td style={{ padding: '8px 12px' }}>{item.description}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>{item.quantity}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatCurrency(item.rate * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesView;
