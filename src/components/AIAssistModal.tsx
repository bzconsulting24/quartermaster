import { useState } from "react";
import { COLORS, formatCurrency } from "../data/uiConstants";

export default function AIAssistModal({ kind, onClose, onCreated }: { kind: 'quote'|'invoice'; onClose: ()=>void; onCreated: ()=>void }) {
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ lines: Array<{ description: string; quantity: number; unitPrice: number }>; subtotal: number } | null>(null);
  const [accountId, setAccountId] = useState<number | ''>('');

  const uploadPdf = async () => {
    if (!file) return '';
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/ingest/pdf', { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Failed to parse PDF');
    const data = await res.json();
    return data.text as string;
  };

  const runDraft = async () => {
    setLoading(true); setError(null);
    try {
      const pdfText = await uploadPdf();
      const res = await fetch('/api/ai/draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, notes, pdfText }) });
      const data = await res.json();
      setDraft({ lines: data.lines, subtotal: data.subtotal });
    } catch (e: any) {
      setError(e.message || 'Failed to draft');
    } finally { setLoading(false); }
  };

  const create = async () => {
    if (!draft || !accountId) { setError('Select account and generate a draft first'); return; }
    if (kind === 'quote') {
      const number = 'Q-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random()*9000);
      const lines = draft.lines.map(l => ({ description: l.description, quantity: l.quantity, unitPrice: l.unitPrice }));
      const res = await fetch('/api/quotes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ number, accountId: Number(accountId), total: Math.round(draft.subtotal), lines }) });
      if (!res.ok) throw new Error('Failed to create quote');
    } else {
      const id = 'INV-' + Math.floor(1000 + Math.random()*9000);
      const items = draft.lines.map(l => ({ description: l.description, quantity: l.quantity, rate: l.unitPrice }));
      const res = await fetch('/api/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, accountId: Number(accountId), amount: Math.round(draft.subtotal), items }) });
      if (!res.ok) throw new Error('Failed to create invoice');
    }
    onCreated(); onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60 }} onClick={onClose}>
      <div onClick={(e)=> e.stopPropagation()} style={{ maxWidth: 720, margin: '10vh auto', background: 'white', borderRadius: 8, padding: 16, border: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.navyDark }}>AI Draft {kind === 'quote' ? 'Estimate' : 'Invoice'}</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 16, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: '#6B7280' }}>Account ID</label>
            <input value={accountId} onChange={(e)=> setAccountId(Number(e.target.value) || '')} placeholder="e.g., 1" style={{ width: '100%', padding: 8, border: '1px solid #E5E7EB', borderRadius: 6 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#6B7280' }}>Attach PDF (optional)</label>
            <input type="file" accept="application/pdf" onChange={(e)=> setFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 12, color: '#6B7280' }}>Notes / Requirements (optional)</label>
          <textarea value={notes} onChange={(e)=> setNotes(e.target.value)} rows={6} placeholder="Paste requirements, items, or context here..." style={{ width: '100%', padding: 8, border: '1px solid #E5E7EB', borderRadius: 6 }} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={runDraft} disabled={loading} style={{ padding: '8px 12px', background: COLORS.navyDark, color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>{loading ? 'Generating…' : 'Generate Draft'}</button>
          <button onClick={create} disabled={!draft || !accountId} style={{ padding: '8px 12px', background: '#10B981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Create {kind === 'quote' ? 'Quote' : 'Invoice'}</button>
        </div>
        {error && <div style={{ marginTop: 8, color: '#B91C1C' }}>{error}</div>}
        {draft && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Preview</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  <th style={{ textAlign: 'left', padding: 8 }}>Description</th>
                  <th style={{ textAlign: 'right', padding: 8 }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: 8 }}>Rate</th>
                  <th style={{ textAlign: 'right', padding: 8 }}>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {draft.lines.map((l, idx)=> (
                  <tr key={idx}>
                    <td style={{ padding: 8, borderTop: '1px solid #E5E7EB' }}>{l.description}</td>
                    <td style={{ padding: 8, borderTop: '1px solid #E5E7EB', textAlign: 'right' }}>{l.quantity}</td>
                    <td style={{ padding: 8, borderTop: '1px solid #E5E7EB', textAlign: 'right' }}>{formatCurrency(l.unitPrice)}</td>
                    <td style={{ padding: 8, borderTop: '1px solid #E5E7EB', textAlign: 'right' }}>{formatCurrency(l.quantity * l.unitPrice)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} style={{ padding: 8, textAlign: 'right', fontWeight: 700 }}>Subtotal</td>
                  <td style={{ padding: 8, textAlign: 'right', fontWeight: 700 }}>{formatCurrency(draft.subtotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
