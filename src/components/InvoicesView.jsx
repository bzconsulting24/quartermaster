import React, { useState } from 'react';
import { Plus, Search, Filter, FileText, Send, Check, X, Eye, Download, DollarSign } from 'lucide-react';
import { COLORS, mockInvoices } from '../data/mockData';

const InvoicesView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [invoices, setInvoices] = useState(mockInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.contact.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || invoice.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleMarkAsPaid = (invoiceId) => {
    setInvoices(invoices.map(inv =>
      inv.id === invoiceId ? { ...inv, status: 'paid', paidDate: new Date().toISOString().split('T')[0] } : inv
    ));
  };

  const handleSendInvoice = (invoiceId) => {
    setInvoices(invoices.map(inv =>
      inv.id === invoiceId && inv.status === 'draft' ? { ...inv, status: 'sent' } : inv
    ));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return { bg: '#D1FAE5', color: '#065F46', border: '#10B981' };
      case 'sent': return { bg: '#DBEAFE', color: '#1E40AF', border: '#3B82F6' };
      case 'overdue': return { bg: '#FEE2E2', color: '#991B1B', border: '#EF4444' };
      case 'draft': return { bg: '#F3F4F6', color: '#374151', border: '#9CA3AF' };
      default: return { bg: '#F3F4F6', color: '#374151', border: '#9CA3AF' };
    }
  };

  const totalStats = {
    total: invoices.reduce((sum, inv) => sum + inv.amount, 0),
    paid: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0),
    pending: invoices.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + inv.amount, 0),
    overdue: invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0),
  };

  return (
    <div style={{ padding: '24px', background: '#F9FAFB', minHeight: '100%' }}>
      {/* Header */}
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
            {filteredInvoices.length} invoices
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

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {[
          { label: 'Total Invoiced', value: `₱${(totalStats.total / 1000).toFixed(0)}K`, color: COLORS.navyDark },
          { label: 'Paid', value: `₱${(totalStats.paid / 1000).toFixed(0)}K`, color: '#10B981' },
          { label: 'Pending', value: `₱${(totalStats.pending / 1000).toFixed(0)}K`, color: '#3B82F6' },
          { label: 'Overdue', value: `₱${(totalStats.overdue / 1000).toFixed(0)}K`, color: '#EF4444' },
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

      {/* Search and Filters */}
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
            placeholder="Search invoices by number, account, or contact..."
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
            onChange={(e) => setFilterStatus(e.target.value)}
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
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
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
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Invoice #
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Account
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Amount
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Status
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Issue Date
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Due Date
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Paid Date
                </th>
                <th style={{
                  padding: '16px',
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => {
                const statusStyle = getStatusColor(invoice.status);
                return (
                  <tr
                    key={invoice.id}
                    style={{
                      borderBottom: '1px solid #E5E7EB',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: `${COLORS.gold}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <FileText size={20} color={COLORS.gold} />
                        </div>
                        <div>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: COLORS.navyDark
                          }}>
                            {invoice.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '2px' }}>
                          {invoice.account}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                          {invoice.contact}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ fontSize: '16px', fontWeight: '600', color: COLORS.navyDark }}>
                        ₱{invoice.amount.toLocaleString()}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        border: `1px solid ${statusStyle.border}`,
                        textTransform: 'capitalize'
                      }}>
                        {invoice.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ fontSize: '14px', color: '#6B7280' }}>
                        {invoice.issueDate}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ fontSize: '14px', color: '#6B7280' }}>
                        {invoice.dueDate}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ fontSize: '14px', color: invoice.paidDate ? '#10B981' : '#9CA3AF' }}>
                        {invoice.paidDate || '-'}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInvoice(invoice);
                          }}
                          style={{
                            padding: '6px',
                            background: 'transparent',
                            border: `1px solid ${COLORS.gold}`,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="View Details"
                        >
                          <Eye size={16} color={COLORS.navyDark} />
                        </button>
                        {invoice.status === 'draft' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendInvoice(invoice.id);
                            }}
                            style={{
                              padding: '6px',
                              background: '#3B82F6',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Send Invoice"
                          >
                            <Send size={16} color="white" />
                          </button>
                        )}
                        {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsPaid(invoice.id);
                            }}
                            style={{
                              padding: '6px',
                              background: '#10B981',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Mark as Paid"
                          >
                            <Check size={16} color="white" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Download functionality
                          }}
                          style={{
                            padding: '6px',
                            background: 'transparent',
                            border: `1px solid #9CA3AF`,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Download PDF"
                        >
                          <Download size={16} color="#6B7280" />
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

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}
        onClick={() => setSelectedInvoice(null)}
        >
          <div style={{
            background: 'white',
            borderRadius: '12px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)`
            }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                  Invoice {selectedInvoice.id}
                </h2>
                <p style={{ fontSize: '14px', color: '#D1D5DB' }}>
                  {selectedInvoice.account}
                </p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px'
                }}
              >
                <X size={24} color="white" />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px' }}>
              {/* Invoice Details */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '24px',
                marginBottom: '24px'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Bill To</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: COLORS.navyDark }}>
                    {selectedInvoice.account}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6B7280' }}>
                    {selectedInvoice.contact}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Status</div>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: getStatusColor(selectedInvoice.status).bg,
                    color: getStatusColor(selectedInvoice.status).color,
                    textTransform: 'capitalize'
                  }}>
                    {selectedInvoice.status}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Issue Date</div>
                  <div style={{ fontSize: '14px', color: '#374151' }}>{selectedInvoice.issueDate}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Due Date</div>
                  <div style={{ fontSize: '14px', color: '#374151' }}>{selectedInvoice.dueDate}</div>
                </div>
                {selectedInvoice.paidDate && (
                  <div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Paid Date</div>
                    <div style={{ fontSize: '14px', color: '#10B981', fontWeight: '500' }}>
                      {selectedInvoice.paidDate}
                    </div>
                  </div>
                )}
              </div>

              {/* Line Items */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: COLORS.navyDark, marginBottom: '16px' }}>
                  Line Items
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#6B7280' }}>
                        Description
                      </th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', color: '#6B7280' }}>
                        Quantity
                      </th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', color: '#6B7280' }}>
                        Rate
                      </th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', color: '#6B7280' }}>
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#374151' }}>
                          {item.description}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', color: '#374151' }}>
                          {item.quantity}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', color: '#374151' }}>
                          ₱{item.rate.toLocaleString()}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                          ₱{(item.quantity * item.rate).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" style={{ padding: '16px', textAlign: 'right', fontSize: '16px', fontWeight: '600', color: COLORS.navyDark }}>
                        Total:
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontSize: '20px', fontWeight: 'bold', color: COLORS.gold }}>
                        ₱{selectedInvoice.amount.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Notes */}
              {selectedInvoice.notes && (
                <div style={{
                  padding: '16px',
                  background: '#F9FAFB',
                  borderRadius: '8px',
                  marginBottom: '24px'
                }}>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>Notes</div>
                  <div style={{ fontSize: '14px', color: '#374151' }}>{selectedInvoice.notes}</div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                {selectedInvoice.status === 'draft' && (
                  <button
                    onClick={() => {
                      handleSendInvoice(selectedInvoice.id);
                      setSelectedInvoice(null);
                    }}
                    style={{
                      padding: '10px 20px',
                      background: '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Send size={16} />
                    Send Invoice
                  </button>
                )}
                {(selectedInvoice.status === 'sent' || selectedInvoice.status === 'overdue') && (
                  <button
                    onClick={() => {
                      handleMarkAsPaid(selectedInvoice.id);
                      setSelectedInvoice(null);
                    }}
                    style={{
                      padding: '10px 20px',
                      background: '#10B981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Check size={16} />
                    Mark as Paid
                  </button>
                )}
                <button
                  style={{
                    padding: '10px 20px',
                    background: 'transparent',
                    color: COLORS.navyDark,
                    border: `2px solid ${COLORS.gold}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Download size={16} />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesView;
