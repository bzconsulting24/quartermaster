import { useState } from "react";
import { COLORS } from "../data/uiConstants";
import type { AccountRecord } from "../types";

export default function AccountEditModal({ account, onClose, onSaved }: { account?: AccountRecord; onClose: ()=>void; onSaved: (a: AccountRecord)=>void }) {
  const isEditing = !!account;

  const [form, setForm] = useState<any>({
    name: account?.name ?? '',
    industry: account?.industry ?? '',
    type: account?.type ?? 'Enterprise',
    revenue: account?.revenue ?? '',
    owner: account?.owner ?? '',
    phone: account?.phone ?? '',
    website: account?.website ?? '',
    location: account?.location ?? ''
  });
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fields = [ 'name', 'industry', 'type', 'revenue', 'owner', 'phone', 'website', 'location' ];
  const accountTypes = ['Enterprise', 'MidMarket', 'SMB'];

  const magicFill = async () => {
    if (!notes.trim() && !file) {
      setError('Add some notes or attach a PDF for Magic Fill to work.');
      return;
    }
    setLoading(true); setError(null);
    try {
      let pdfText = '';
      if (file) {
        const fd = new FormData(); fd.append('file', file);
        const r = await fetch('/api/ingest/pdf', { method: 'POST', body: fd });
        if (r.ok) { const j = await r.json(); pdfText = j.text || ''; }
      }
      const res = await fetch('/api/ai/form-parse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schema: fields.map(n=>({ name: n })), text: notes, pdfText }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = typeof data?.message === 'string' ? data.message : 'Magic Fill failed';
        throw new Error(msg);
      }
      const d = data.data || {};
      const next: any = { ...form };
      for (const k of fields) if (d[k]) next[k] = d[k];
      setForm(next);
    } catch (e:any) { setError(e.message || 'Magic Fill failed'); }
    finally { setLoading(false); }
  };

  const save = async () => {
    if (!form.name?.trim()) {
      setError('Account name is required');
      return;
    }

    setLoading(true); setError(null);
    try {
      const url = isEditing ? `/api/accounts/${account.id}` : '/api/accounts';
      const method = isEditing ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error('Save failed');
      const updated = await res.json();
      onSaved(updated);
      onClose();
    } catch (e: any) { setError(e.message || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 70 }} onClick={onClose}>
      <div onClick={(e)=> e.stopPropagation()} style={{ width: 720, margin: '10vh auto', background: 'white', borderRadius: 8, border: '1px solid #E5E7EB', padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.navyDark }}>
            {isEditing ? 'Edit Account' : 'Create New Account'}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Account Name */}
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Account Name *</label>
            <input
              value={form.name}
              onChange={(e)=> setForm((p:any)=> ({ ...p, name: e.target.value }))}
              placeholder="Enter account name"
              style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 6 }}
            />
          </div>

          {/* Industry */}
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Industry</label>
            <input
              value={form.industry}
              onChange={(e)=> setForm((p:any)=> ({ ...p, industry: e.target.value }))}
              placeholder="e.g., Technology, Healthcare"
              style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 6 }}
            />
          </div>

          {/* Type */}
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Type</label>
            <select
              value={form.type}
              onChange={(e)=> setForm((p:any)=> ({ ...p, type: e.target.value }))}
              style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 6, cursor: 'pointer' }}
            >
              <option value="Enterprise">Enterprise</option>
              <option value="MidMarket">Mid-Market</option>
              <option value="SMB">SMB</option>
            </select>
          </div>

          {/* Revenue */}
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Revenue</label>
            <input
              type="number"
              value={form.revenue}
              onChange={(e)=> setForm((p:any)=> ({ ...p, revenue: e.target.value ? parseInt(e.target.value) : '' }))}
              placeholder="Annual revenue"
              style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 6 }}
            />
          </div>

          {/* Location */}
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Location</label>
            <input
              value={form.location}
              onChange={(e)=> setForm((p:any)=> ({ ...p, location: e.target.value }))}
              placeholder="City, State/Country"
              style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 6 }}
            />
          </div>

          {/* Account Owner */}
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Account Owner</label>
            <input
              value={form.owner}
              onChange={(e)=> setForm((p:any)=> ({ ...p, owner: e.target.value }))}
              placeholder="Owner name"
              style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 6 }}
            />
          </div>

          {/* Phone */}
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Phone</label>
            <input
              value={form.phone}
              onChange={(e)=> setForm((p:any)=> ({ ...p, phone: e.target.value }))}
              placeholder="+1 (555) 123-4567"
              style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 6 }}
            />
          </div>

          {/* Website */}
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Website</label>
            <input
              value={form.website}
              onChange={(e)=> setForm((p:any)=> ({ ...p, website: e.target.value }))}
              placeholder="https://example.com"
              style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 6 }}
            />
          </div>
        </div>
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: '#6B7280' }}>Paste any notes</label>
            <textarea value={notes} onChange={(e)=> setNotes(e.target.value)} rows={4} style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 6 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#6B7280' }}>Attach PDF</label>
            <input type="file" accept="application/pdf" onChange={(e)=> setFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>
        {error && <div style={{ color: '#B91C1C', marginTop: 8 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={magicFill} disabled={loading} style={{ padding: '8px 12px', background: '#0EA5E9', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>{loading ? 'Filling…' : 'Magic Fill'}</button>
          <button onClick={save} disabled={loading} style={{ padding: '8px 12px', background: '#10B981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Save</button>
        </div>
      </div>
    </div>
  );
}
