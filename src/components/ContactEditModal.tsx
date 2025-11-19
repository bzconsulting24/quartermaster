import { useEffect, useState } from 'react';
import { COLORS } from '../data/uiConstants';
import type { AccountRecord, ContactRecord } from '../types';

type ContactFormState = {
  name: string;
  title: string;
  email: string;
  phone: string;
  owner: string;
  accountId: string;
  lastContact: string;
};

const initialForm = (contact?: ContactRecord): ContactFormState => ({
  name: contact?.name ?? '',
  title: contact?.title ?? '',
  email: contact?.email ?? '',
  phone: contact?.phone ?? '',
  owner: contact?.owner ?? '',
  accountId: contact?.account?.id ? String(contact.account.id) : '',
  lastContact: contact?.lastContact ? new Date(contact.lastContact).toISOString().split('T')[0] : ''
});

export default function ContactEditModal({
  contact,
  onClose,
  onSaved
}: {
  contact?: ContactRecord;
  onClose: () => void;
  onSaved: (contact: ContactRecord) => void;
}) {
  const [form, setForm] = useState<ContactFormState>(() => initialForm(contact));
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const res = await fetch('/api/accounts');
        if (res.ok) {
          setAccounts(await res.json());
        }
      } catch {
        // ignore account fetch failure, we fallback to empty select
      }
    };
    loadAccounts();
  }, []);

  const update = (field: keyof ContactFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const save = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.accountId) {
      setError('Name, email, and account are required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        title: form.title.trim() || null,
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        owner: form.owner.trim() || null,
        accountId: Number(form.accountId),
        lastContact: form.lastContact ? new Date(form.lastContact).toISOString() : null
      };
      const res = await fetch(contact ? `/api/contacts/${contact.id}` : '/api/contacts', {
        method: contact ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Unable to save contact');
      }
      const saved = await res.json();
      onSaved(saved);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Unable to save contact');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 75 }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '600px',
          maxWidth: '95vw',
          margin: '8vh auto',
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
              {contact ? 'Edit Contact' : 'New Contact'}
            </div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>
              {contact ? 'Update contact details and relationships' : 'Add a new relationship to your CRM'}
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: 22, cursor: 'pointer' }}>
            ×
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Contact Name */}
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Contact Name *</label>
            <input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Enter full name"
              style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 8 }}
            />
          </div>

          {/* Title */}
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Title</label>
            <input
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="e.g., VP of Sales"
              style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 8 }}
            />
          </div>

          {/* Account */}
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Account *</label>
            <select
              value={form.accountId}
              onChange={(e) => update('accountId', e.target.value)}
              style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer' }}
            >
              <option value="">Select account…</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Email (Contact Info) */}
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="contact@example.com"
              style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 8 }}
            />
          </div>

          {/* Phone (Contact Info) */}
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Phone</label>
            <input
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
              style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 8 }}
            />
          </div>

          {/* Last Contact */}
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Last Contact</label>
            <input
              type="date"
              value={form.lastContact}
              onChange={(e) => update('lastContact', e.target.value)}
              style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 8 }}
            />
          </div>

          {/* Owner */}
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Owner</label>
            <input
              value={form.owner}
              onChange={(e) => update('owner', e.target.value)}
              placeholder="Assigned owner"
              style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 8 }}
            />
          </div>
        </div>

        {error && <div style={{ color: '#B91C1C' }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
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
            {loading ? 'Saving…' : contact ? 'Save Contact' : 'Create Contact'}
          </button>
        </div>
      </div>
    </div>
  );
}

