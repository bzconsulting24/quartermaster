import { useEffect, useState } from 'react';
import { Sparkles, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { COLORS } from '../data/uiConstants';
import type { AccountRecord, LeadRecord, LeadStatus } from '../types';

const statusOptions: LeadStatus[] = ['NEW', 'WORKING', 'NURTURING', 'QUALIFIED', 'DISQUALIFIED'];

type LeadEditModalProps = {
  lead?: LeadRecord;
  onClose: () => void;
  onSaved: (lead: LeadRecord) => void;
};

type LeadFormState = {
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  owner: string;
  status: LeadStatus;
  score: string;
  notes: string;
  accountId: string;
};

const blankForm = (): LeadFormState => ({
  name: '',
  company: '',
  email: '',
  phone: '',
  source: '',
  owner: '',
  status: 'NEW',
  score: '',
  notes: '',
  accountId: ''
});

export default function LeadEditModal({ lead, onClose, onSaved }: LeadEditModalProps) {
  const [form, setForm] = useState<LeadFormState>(() => ({
    ...blankForm(),
    name: lead?.name ?? '',
    company: lead?.company ?? '',
    email: lead?.email ?? '',
    phone: lead?.phone ?? '',
    source: lead?.source ?? '',
    owner: lead?.owner ?? '',
    status: lead?.status ?? 'NEW',
    score: lead?.score?.toString() ?? '',
    notes: lead?.notes ?? '',
    accountId: lead?.account?.id ? String(lead.account.id) : ''
  }));
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Assistant state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(true);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const res = await fetch('/api/accounts');
        if (res.ok) {
          setAccounts(await res.json());
        }
      } catch {
        // ignore account list errors
      }
    };
    loadAccounts();
  }, []);

  const update = (field: keyof LeadFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // AI Auto-Generate Lead
  const handleAutoGenerate = async () => {
    if (!aiPrompt.trim()) {
      setError('Please enter a prompt for AI to generate the lead');
      return;
    }

    setAiGenerating(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/generate-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });

      if (!response.ok) throw new Error('AI generation failed');

      const data = await response.json();

      // Populate form with AI-generated data
      if (data.name) update('name', data.name);
      if (data.company) update('company', data.company);
      if (data.email) update('email', data.email);
      if (data.phone) update('phone', data.phone);
      if (data.source) update('source', data.source);
      if (data.owner) update('owner', data.owner);
      if (data.notes) update('notes', data.notes);
      if (data.score) update('score', String(data.score));
      if (data.companyName) {
        const matchingAccount = accounts.find(a =>
          a.name.toLowerCase().includes(data.companyName.toLowerCase())
        );
        if (matchingAccount) update('accountId', String(matchingAccount.id));
      }

      setAiPrompt('');
    } catch (error) {
      console.error('AI generation error:', error);
      setError('Failed to generate lead with AI');
    } finally {
      setAiGenerating(false);
    }
  };

  // AI Parse Text
  const handleParseText = async () => {
    if (!aiPrompt.trim()) {
      setError('Please paste lead information or email to extract details');
      return;
    }

    setAiGenerating(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiPrompt, type: 'lead' })
      });

      if (!response.ok) throw new Error('Text parsing failed');

      const data = await response.json();

      // Populate form with extracted data
      if (data.name) update('name', data.name);
      if (data.company) update('company', data.company);
      if (data.email) update('email', data.email);
      if (data.phone) update('phone', data.phone);
      if (data.source) update('source', data.source);
      if (data.owner) update('owner', data.owner);
      if (data.notes) update('notes', data.notes);
      if (data.score) update('score', String(data.score));
      if (data.companyName) {
        const matchingAccount = accounts.find(a =>
          a.name.toLowerCase().includes(data.companyName.toLowerCase())
        );
        if (matchingAccount) update('accountId', String(matchingAccount.id));
      }

      setAiPrompt('');
    } catch (error) {
      console.error('Parse error:', error);
      setError('Failed to parse text. Please try again or enter details manually.');
    } finally {
      setAiGenerating(false);
    }
  };

  const save = async () => {
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        company: form.company.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        source: form.source.trim() || null,
        status: form.status,
        owner: form.owner.trim() || null,
        score: form.score ? Number(form.score) : null,
        notes: form.notes.trim() || null,
        accountId: form.accountId ? Number(form.accountId) : undefined
      };
      const res = await fetch(lead ? `/api/leads/${lead.id}` : '/api/leads', {
        method: lead ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Unable to save lead');
      }
      const saved = await res.json();
      onSaved(saved);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Unable to save lead');
    } finally {
      setLoading(false);
    }
  };

  const deleteLead = async () => {
    if (!lead) return;
    if (!confirm(`Delete lead "${lead.name}"? This will also remove the associated opportunity from the pipeline.`)) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Unable to delete lead');
      }
      onSaved(lead); // Trigger refresh
      onClose();
    } catch (e: any) {
      setError(e.message || 'Unable to delete lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 80 }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '95vw',
          maxWidth: 840,
          margin: '6vh auto',
          background: 'white',
          borderRadius: 12,
          border: '1px solid #E5E7EB',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.navyDark }}>
              {lead ? 'Edit Lead' : 'New Lead'}
            </div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>
              {lead ? 'Update lead details and sync to CRM' : 'Capture a new inbound lead quickly'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer' }}>
            ×
          </button>
        </div>

        {/* AI Lead Assistant */}
        {!lead && (
          <div style={{
            marginBottom: 24,
            border: '2px solid #10B981',
            borderRadius: 12,
            padding: 20,
            background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)'
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
                <Sparkles size={20} color="#10B981" />
                <h3 style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#059669',
                  margin: 0
                }}>
                  AI Lead Assistant
                </h3>
              </div>
              {showAiAssistant ? (
                <ChevronUp size={20} color="#10B981" />
              ) : (
                <ChevronDown size={20} color="#10B981" />
              )}
            </div>

            {showAiAssistant && (
              <>
                <p style={{
                  fontSize: 13,
                  color: '#047857',
                  marginBottom: 12,
                  lineHeight: 1.5
                }}>
                  Let AI automatically generate lead details from a description, or paste contact information to extract details.
                </p>
                <textarea
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="Example: 'Sarah Johnson from Acme Corp reached out via LinkedIn about our enterprise plan. She's the VP of Sales, email: sarah@acme.com, phone: +1-555-0123. Very interested, high priority lead.' or paste business card/email content"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #6EE7B7',
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
                      background: '#10B981',
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
                    {aiGenerating ? 'Generating...' : 'Auto-Generate Lead'}
                  </button>
                  <button
                    onClick={handleParseText}
                    disabled={aiGenerating}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      background: '#34D399',
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: '#6B7280' }}>Name*</label>
            <input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 8 }}
              placeholder="Lead name"
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#6B7280' }}>Company</label>
            <input
              value={form.company}
              onChange={(e) => update('company', e.target.value)}
              style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 8 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#6B7280' }}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 8 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#6B7280' }}>Phone</label>
            <input
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 8 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#6B7280' }}>Source</label>
            <input
              value={form.source}
              onChange={(e) => update('source', e.target.value)}
              style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 8 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#6B7280' }}>Owner</label>
            <input
              value={form.owner}
              onChange={(e) => update('owner', e.target.value)}
              style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 8 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#6B7280' }}>Status</label>
            <select
              value={form.status}
              onChange={(e) => update('status', e.target.value as LeadStatus)}
              style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 8 }}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#6B7280' }}>Score</label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.score}
              onChange={(e) => update('score', e.target.value)}
              style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 8 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#6B7280' }}>Related Account</label>
            <select
              value={form.accountId}
              onChange={(e) => update('accountId', e.target.value)}
              style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 8 }}
            >
              <option value="">Unassigned</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, color: '#6B7280' }}>Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            rows={4}
            style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 8 }}
            placeholder="Capture context from calls, forms, or events."
          />
        </div>

        {error && <div style={{ color: '#B91C1C' }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <div>
            {lead && (
              <button
                onClick={deleteLead}
                disabled={loading}
                style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #EF4444', background: 'white', color: '#EF4444', cursor: 'pointer' }}
              >
                Delete Lead
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClose}
              disabled={loading}
              style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={loading}
              style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: COLORS.navyDark, color: 'white', cursor: 'pointer' }}
            >
              {loading ? 'Saving…' : lead ? 'Save Lead' : 'Create Lead'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

