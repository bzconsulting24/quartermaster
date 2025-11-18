import { useState } from 'react';
import type { InvoiceRecord } from '../types';
import { COLORS } from '../data/uiConstants';

export default function InvoiceEditModal({ invoice, onClose, onSaved }: { invoice: InvoiceRecord; onClose: ()=>void; onSaved: (i: InvoiceRecord)=>void }) {
  const [status, setStatus] = useState(invoice.status);
  const [notes, setNotes] = useState(invoice.notes ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/invoices/' + invoice.id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, notes }) });
      if (!res.ok) throw new Error('Failed');
      const j = await res.json();
      onSaved(j);
      onClose();
    } catch {
      // ignore
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ width: 520, background: 'white', borderRadius: 8, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.navyDark }}>Edit Invoice</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <label style={{ fontSize: 12, color: '#6B7280' }}>Status</label>
          <select value={status} onChange={e => setStatus(e.target.value as any)} style={{ padding: 10, border: '1px solid #E5E7EB', borderRadius: 6 }}>
            {['DRAFT','SENT','PAID','OVERDUE'].map(s => (<option key={s} value={s}>{s}</option>))}
          </select>
          <label style={{ fontSize: 12, color: '#6B7280' }}>Notes</label>
          <textarea value={notes} onChange={e=> setNotes(e.target.value)} rows={4} style={{ padding: 10, border: '1px solid #E5E7EB', borderRadius: 6 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', background: 'white', cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#10B981', color: 'white', cursor: 'pointer' }}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}