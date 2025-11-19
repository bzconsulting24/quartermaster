import { useState, useEffect } from 'react';
import { Plus, Trash2, X, FileText, Upload, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import type { InvoiceRecord, AccountRecord } from '../types';
import { COLORS, formatCurrency, formatDisplayDate } from '../data/uiConstants';

interface LineItem {
  id?: number;
  description: string;
  quantity: number;
  rate: number;
}

interface InvoiceEditModalProps {
  invoice?: InvoiceRecord;
  onClose: () => void;
  onSaved?: (invoice: InvoiceRecord) => void;
}

export default function InvoiceEditModal({ invoice, onClose, onSaved }: InvoiceEditModalProps) {
  const isEditing = !!invoice;

  // Form fields
  const [invoiceNumber, setInvoiceNumber] = useState(invoice?.id || `INV-${Date.now()}`);
  const [accountId, setAccountId] = useState<number | null>(invoice?.accountId || null);
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [status, setStatus] = useState(invoice?.status || 'DRAFT');
  const [issueDate, setIssueDate] = useState(
    invoice?.issueDate ? new Date(invoice.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState(
    invoice?.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : ''
  );
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [notes, setNotes] = useState(invoice?.notes || '');
  const [lineItems, setLineItems] = useState<LineItem[]>(
    invoice?.items || [{ description: '', quantity: 1, rate: 0 }]
  );
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [poNumber, setPoNumber] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);

  // AI Assistant state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(true);

  // Load accounts on mount
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const res = await fetch('/api/accounts');
        if (res.ok) {
          const data = await res.json();
          setAccounts(data);
        }
      } catch (err) {
        console.error('Failed to load accounts:', err);
      }
    };
    loadAccounts();
  }, []);

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const tax = 0; // You can add tax calculation logic here
  const total = subtotal + tax;

  // Add line item
  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, rate: 0 }]);
  };

  // Remove line item
  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  // Update line item
  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // AI Auto-Generate Invoice
  const handleAutoGenerate = async () => {
    if (!aiPrompt.trim()) {
      alert('Please enter a prompt for AI to generate the invoice');
      return;
    }

    setAiGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });

      if (!response.ok) throw new Error('AI generation failed');

      const data = await response.json();

      // Populate form with AI-generated data
      if (data.accountName) {
        const matchingAccount = accounts.find(a =>
          a.name.toLowerCase().includes(data.accountName.toLowerCase())
        );
        if (matchingAccount) setAccountId(matchingAccount.id);
      }
      if (data.items && Array.isArray(data.items)) {
        setLineItems(data.items);
      }
      if (data.notes) setNotes(data.notes);
      if (data.dueDate) setDueDate(new Date(data.dueDate).toISOString().split('T')[0]);

      setAiPrompt('');
    } catch (error) {
      console.error('AI generation error:', error);
      alert('Failed to generate invoice with AI');
    } finally {
      setAiGenerating(false);
    }
  };

  // AI Parse Text
  const handleParseText = async () => {
    if (!aiPrompt.trim()) {
      alert('Please paste invoice text or email to extract information');
      return;
    }

    setAiGenerating(true);
    try {
      const response = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiPrompt, type: 'invoice' })
      });

      if (!response.ok) throw new Error('Text parsing failed');

      const data = await response.json();

      // Populate form with extracted data
      if (data.items && Array.isArray(data.items)) {
        setLineItems(data.items.map((item: any) => ({
          description: item.description || '',
          quantity: item.quantity || 1,
          rate: item.rate || item.price || 0
        })));
      }
      if (data.total) {
        // If we have a total but no items, create a single line item
        if (!data.items || data.items.length === 0) {
          setLineItems([{ description: 'Service', quantity: 1, rate: data.total }]);
        }
      }
      if (data.customerName) {
        const matchingAccount = accounts.find(a =>
          a.name.toLowerCase().includes(data.customerName.toLowerCase())
        );
        if (matchingAccount) setAccountId(matchingAccount.id);
      }
      if (data.dueDate) setDueDate(new Date(data.dueDate).toISOString().split('T')[0]);
      if (data.issueDate) setIssueDate(new Date(data.issueDate).toISOString().split('T')[0]);
      if (data.notes) setNotes(data.notes);

      setAiPrompt('');
    } catch (error) {
      console.error('Parse error:', error);
      alert('Failed to parse text. Please try again or enter details manually.');
    } finally {
      setAiGenerating(false);
    }
  };

  // Save invoice
  const save = async () => {
    if (!accountId) {
      alert('Please select a customer');
      return;
    }

    if (lineItems.length === 0 || lineItems.every(item => !item.description)) {
      alert('Please add at least one line item');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: invoiceNumber,
        accountId,
        status,
        issueDate: new Date(issueDate).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : new Date(issueDate).toISOString(),
        notes,
        amount: total,
        items: lineItems.filter(item => item.description)
      };

      const url = isEditing ? `/api/invoices/${invoice.id}` : '/api/invoices';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save invoice');

      const savedInvoice = await res.json();
      if (onSaved) onSaved(savedInvoice);
      onClose();
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  // Get selected account details
  const selectedAccount = accounts.find(a => a.id === accountId);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }}>
      <div style={{
        width: '90%',
        maxWidth: '1400px',
        height: '90vh',
        background: 'white',
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: '#2563EB',
          color: 'white',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
              {isEditing ? 'Edit Invoice' : 'Create New Invoice'}
            </h2>
            <p style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>
              Design and preview your professional invoice
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: 24,
              cursor: 'pointer',
              padding: 0,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden'
        }}>
          {/* Left Panel - Form */}
          <div style={{
            width: '50%',
            padding: 24,
            overflowY: 'auto',
            borderRight: '1px solid #E5E7EB'
          }}>
            {/* AI Invoice Assistant */}
            {!isEditing && (
              <div style={{
                marginBottom: 24,
                border: '2px solid #7C3AED',
                borderRadius: 12,
                padding: 20,
                background: 'linear-gradient(135deg, #F3E8FF 0%, #EDE9FE 100%)'
              }}>
                <div
                  onClick={() => setShowAiAssistant(!showAiAssistant)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    marginBottom: showAiAssistant ? 16 : 0
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={20} color="#7C3AED" />
                    <h3 style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#7C3AED',
                      margin: 0
                    }}>
                      AI Invoice Assistant
                    </h3>
                  </div>
                  {showAiAssistant ? (
                    <ChevronUp size={20} color="#7C3AED" />
                  ) : (
                    <ChevronDown size={20} color="#7C3AED" />
                  )}
                </div>

                {showAiAssistant && (
                  <>
                    <p style={{
                      fontSize: 13,
                      color: '#6B21A8',
                      marginBottom: 12,
                      lineHeight: 1.5
                    }}>
                      Let AI automatically generate a complete invoice, or paste text/email to extract information.
                    </p>
                    <textarea
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                      placeholder="Example: 'Create invoice for Acme Corp, 123 Main St, email john@acme.com, for 10 widgets at $50 each, tax 8%, due in 30 days' or leave blank to auto-generate"
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #C4B5FD',
                        borderRadius: 8,
                        fontSize: 14,
                        resize: 'vertical',
                        marginBottom: 12,
                        background: 'white'
                      }}
                    />
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button
                        onClick={handleAutoGenerate}
                        disabled={aiGenerating}
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          background: '#7C3AED',
                          color: 'white',
                          border: 'none',
                          borderRadius: 8,
                          cursor: aiGenerating ? 'not-allowed' : 'pointer',
                          fontSize: 14,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          opacity: aiGenerating ? 0.6 : 1
                        }}
                      >
                        <Sparkles size={16} />
                        {aiGenerating ? 'Generating...' : 'Auto-Generate Invoice'}
                      </button>
                      <button
                        onClick={handleParseText}
                        disabled={aiGenerating}
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          background: '#A78BFA',
                          color: 'white',
                          border: 'none',
                          borderRadius: 8,
                          cursor: aiGenerating ? 'not-allowed' : 'pointer',
                          fontSize: 14,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          opacity: aiGenerating ? 0.6 : 1
                        }}
                      >
                        <FileText size={16} />
                        {aiGenerating ? 'Parsing...' : 'Parse Text'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Company Logo */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                fontSize: 12,
                color: '#6B7280',
                textTransform: 'uppercase',
                fontWeight: 600,
                marginBottom: 8,
                display: 'block'
              }}>
                Company Logo
              </label>
              <div style={{
                border: '2px dashed #E5E7EB',
                borderRadius: 8,
                padding: 20,
                textAlign: 'center',
                background: '#F9FAFB'
              }}>
                {companyLogo ? (
                  <img
                    src={companyLogo}
                    alt="Company Logo"
                    style={{ maxHeight: 80, maxWidth: '100%' }}
                  />
                ) : (
                  <FileText size={40} color="#9CA3AF" />
                )}
                <label style={{
                  display: 'inline-block',
                  marginTop: 12,
                  padding: '8px 16px',
                  background: '#2563EB',
                  color: 'white',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  <Upload size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  Upload Logo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            {/* Invoice Details */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{
                fontSize: 14,
                fontWeight: 600,
                color: COLORS.navyDark,
                marginBottom: 16,
                textTransform: 'uppercase'
              }}>
                Invoice Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 6 }}>
                    Invoice Number *
                  </label>
                  <input
                    value={invoiceNumber}
                    onChange={e => setInvoiceNumber(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: 6,
                      fontSize: 14
                    }}
                    disabled={isEditing}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 6 }}>
                    PO Number
                  </label>
                  <input
                    value={poNumber}
                    onChange={e => setPoNumber(e.target.value)}
                    placeholder="Optional"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: 6,
                      fontSize: 14
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 6 }}>
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={e => setIssueDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: 6,
                      fontSize: 14
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 6 }}>
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: 6,
                      fontSize: 14
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 6 }}>
                    Payment Terms
                  </label>
                  <select
                    value={paymentTerms}
                    onChange={e => setPaymentTerms(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: 6,
                      fontSize: 14,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Net 30">Net 30</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 60">Net 60</option>
                    <option value="Due on receipt">Due on receipt</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 6 }}>
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: 6,
                      fontSize: 14,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="SENT">Sent</option>
                    <option value="PAID">Paid</option>
                    <option value="OVERDUE">Overdue</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bill To */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{
                fontSize: 14,
                fontWeight: 600,
                color: COLORS.navyDark,
                marginBottom: 16,
                textTransform: 'uppercase'
              }}>
                Bill To
              </h3>
              <div>
                <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 6 }}>
                  Customer Name *
                </label>
                <select
                  value={accountId || ''}
                  onChange={e => setAccountId(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: 6,
                    fontSize: 14,
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Select a customer...</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedAccount && (
                <div style={{
                  marginTop: 12,
                  padding: 12,
                  background: '#F9FAFB',
                  borderRadius: 6,
                  fontSize: 14,
                  color: '#6B7280'
                }}>
                  {selectedAccount.phone && <div>{selectedAccount.phone}</div>}
                  {selectedAccount.location && <div>{selectedAccount.location}</div>}
                </div>
              )}
            </div>

            {/* Line Items */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{
                fontSize: 14,
                fontWeight: 600,
                color: COLORS.navyDark,
                marginBottom: 16,
                textTransform: 'uppercase'
              }}>
                Line Items
              </h3>
              <div style={{
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB' }}>
                      <th style={{
                        padding: '10px 12px',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#6B7280',
                        textAlign: 'left',
                        width: '40%'
                      }}>
                        DESCRIPTION
                      </th>
                      <th style={{
                        padding: '10px 12px',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#6B7280',
                        textAlign: 'center',
                        width: '15%'
                      }}>
                        QTY
                      </th>
                      <th style={{
                        padding: '10px 12px',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#6B7280',
                        textAlign: 'right',
                        width: '20%'
                      }}>
                        RATE
                      </th>
                      <th style={{
                        padding: '10px 12px',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#6B7280',
                        textAlign: 'right',
                        width: '20%'
                      }}>
                        AMOUNT
                      </th>
                      <th style={{ width: '5%' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, index) => (
                      <tr key={index}>
                        <td style={{ padding: '8px 12px' }}>
                          <input
                            value={item.description}
                            onChange={e => updateLineItem(index, 'description', e.target.value)}
                            placeholder="Item description"
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              border: '1px solid #E5E7EB',
                              borderRadius: 4,
                              fontSize: 14
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={e => updateLineItem(index, 'quantity', parseInt(e.target.value) || 0)}
                            min="0"
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              border: '1px solid #E5E7EB',
                              borderRadius: 4,
                              fontSize: 14,
                              textAlign: 'center'
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <input
                            type="number"
                            value={item.rate}
                            onChange={e => updateLineItem(index, 'rate', parseInt(e.target.value) || 0)}
                            min="0"
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              border: '1px solid #E5E7EB',
                              borderRadius: 4,
                              fontSize: 14,
                              textAlign: 'right'
                            }}
                          />
                        </td>
                        <td style={{
                          padding: '8px 12px',
                          textAlign: 'right',
                          fontWeight: 600,
                          color: COLORS.navyDark
                        }}>
                          {formatCurrency(item.quantity * item.rate)}
                        </td>
                        <td style={{ padding: '8px' }}>
                          {lineItems.length > 1 && (
                            <button
                              onClick={() => removeLineItem(index)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#EF4444',
                                cursor: 'pointer',
                                padding: 4
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  onClick={addLineItem}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#F9FAFB',
                    border: 'none',
                    borderTop: '1px solid #E5E7EB',
                    color: '#2563EB',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <Plus size={16} />
                  Add Line Item
                </button>
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 6 }}>
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Add any notes or payment instructions..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: 6,
                  fontSize: 14,
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div style={{
            width: '50%',
            padding: 24,
            overflowY: 'auto',
            background: '#F9FAFB'
          }}>
            <div style={{
              background: 'white',
              borderRadius: 8,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              padding: 32,
              minHeight: 600
            }}>
              {/* Invoice Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 32
              }}>
                <div>
                  {companyLogo ? (
                    <img
                      src={companyLogo}
                      alt="Company"
                      style={{ maxHeight: 60, marginBottom: 12 }}
                    />
                  ) : (
                    <div style={{
                      width: 60,
                      height: 60,
                      background: '#E5E7EB',
                      borderRadius: 8,
                      marginBottom: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FileText size={24} color="#9CA3AF" />
                    </div>
                  )}
                  <div style={{ fontSize: 14, color: '#6B7280' }}>
                    <div style={{ fontWeight: 600, color: COLORS.navyDark }}>Your Company Name</div>
                    <div>123 Business Street</div>
                    <div>City, State 12345</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h1 style={{
                    fontSize: 32,
                    fontWeight: 700,
                    color: COLORS.navyDark,
                    marginBottom: 8
                  }}>
                    INVOICE
                  </h1>
                  <div style={{ fontSize: 16, color: '#6B7280' }}>
                    {invoiceNumber}
                  </div>
                </div>
              </div>

              {/* Bill To and Details */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 32,
                marginBottom: 32
              }}>
                <div>
                  <h3 style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#6B7280',
                    marginBottom: 12,
                    textTransform: 'uppercase'
                  }}>
                    Bill To:
                  </h3>
                  <div style={{ fontSize: 14, color: COLORS.navyDark }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      {selectedAccount?.name || 'Customer Name'}
                    </div>
                    {selectedAccount?.phone && <div>{selectedAccount.phone}</div>}
                    {selectedAccount?.location && <div>{selectedAccount.location}</div>}
                  </div>
                </div>
                <div>
                  <h3 style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#6B7280',
                    marginBottom: 12,
                    textTransform: 'uppercase'
                  }}>
                    Details:
                  </h3>
                  <div style={{ fontSize: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: '#6B7280' }}>Date:</span>
                      <span style={{ color: COLORS.navyDark, fontWeight: 500 }}>
                        {formatDisplayDate(issueDate)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: '#6B7280' }}>Due:</span>
                      <span style={{ color: COLORS.navyDark, fontWeight: 500 }}>
                        {dueDate ? formatDisplayDate(dueDate) : 'Not set'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6B7280' }}>Terms:</span>
                      <span style={{ color: COLORS.navyDark, fontWeight: 500 }}>
                        {paymentTerms}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div style={{ marginBottom: 32 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                      <th style={{
                        padding: '12px 0',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#6B7280',
                        textAlign: 'left',
                        textTransform: 'uppercase'
                      }}>
                        #
                      </th>
                      <th style={{
                        padding: '12px 0',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#6B7280',
                        textAlign: 'left',
                        textTransform: 'uppercase'
                      }}>
                        Item
                      </th>
                      <th style={{
                        padding: '12px 0',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#6B7280',
                        textAlign: 'center',
                        textTransform: 'uppercase'
                      }}>
                        Qty
                      </th>
                      <th style={{
                        padding: '12px 0',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#6B7280',
                        textAlign: 'right',
                        textTransform: 'uppercase'
                      }}>
                        Price
                      </th>
                      <th style={{
                        padding: '12px 0',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#6B7280',
                        textAlign: 'right',
                        textTransform: 'uppercase'
                      }}>
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.filter(item => item.description).map((item, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '12px 0', fontSize: 14, color: '#6B7280' }}>
                          {index + 1}
                        </td>
                        <td style={{ padding: '12px 0', fontSize: 14, color: COLORS.navyDark }}>
                          {item.description}
                        </td>
                        <td style={{ padding: '12px 0', fontSize: 14, color: COLORS.navyDark, textAlign: 'center' }}>
                          {item.quantity}
                        </td>
                        <td style={{ padding: '12px 0', fontSize: 14, color: COLORS.navyDark, textAlign: 'right' }}>
                          {formatCurrency(item.rate)}
                        </td>
                        <td style={{ padding: '12px 0', fontSize: 14, color: COLORS.navyDark, textAlign: 'right', fontWeight: 600 }}>
                          {formatCurrency(item.quantity * item.rate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: 250 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                    fontSize: 14
                  }}>
                    <span style={{ color: '#6B7280' }}>Subtotal:</span>
                    <span style={{ color: COLORS.navyDark, fontWeight: 500 }}>
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px 0',
                    borderTop: '2px solid #E5E7EB',
                    fontSize: 18,
                    fontWeight: 700
                  }}>
                    <span style={{ color: COLORS.navyDark }}>TOTAL:</span>
                    <span style={{ color: '#2563EB' }}>
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {notes && (
                <div style={{
                  marginTop: 32,
                  padding: 16,
                  background: '#F9FAFB',
                  borderRadius: 8
                }}>
                  <h4 style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#6B7280',
                    marginBottom: 8,
                    textTransform: 'uppercase'
                  }}>
                    Notes
                  </h4>
                  <p style={{
                    fontSize: 14,
                    color: COLORS.navyDark,
                    margin: 0,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {notes}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div style={{
                marginTop: 48,
                paddingTop: 24,
                borderTop: '1px solid #E5E7EB',
                textAlign: 'center',
                fontSize: 12,
                color: '#9CA3AF'
              }}>
                Thank you for your business!
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'white'
        }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: COLORS.navyDark }}>
            Total: {formatCurrency(total)}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: 6,
                border: '1px solid #D1D5DB',
                background: 'white',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setStatus('DRAFT');
                save();
              }}
              disabled={saving}
              style={{
                padding: '10px 20px',
                borderRadius: 6,
                border: '1px solid #FFA500',
                background: 'white',
                color: '#FFA500',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500
              }}
            >
              Save as Draft
            </button>
            <button
              onClick={() => {
                setStatus('SENT');
                save();
              }}
              disabled={saving}
              style={{
                padding: '10px 20px',
                borderRadius: 6,
                border: 'none',
                background: '#2563EB',
                color: 'white',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500
              }}
            >
              {saving ? 'Saving...' : 'Send Invoice'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}