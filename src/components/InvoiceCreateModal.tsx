import { useEffect, useMemo, useState } from "react";
import { COLORS, formatCurrency } from "../data/uiConstants";
import type { AccountRecord } from "../types";

function todayISO() {
  return new Date().toISOString().slice(0,10);
}
function addDaysISO(days: number) { const d=new Date(); d.setDate(d.getDate()+days); return d.toISOString().slice(0,10); }
function makeId() { return 'INV-' + Math.floor(100000000000 + Math.random()*900000000000); }

export default function InvoiceCreateModal({ onClose, onCreated }: { onClose: ()=>void; onCreated: ()=>void }) {
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [accountId, setAccountId] = useState<number | ''>('');
  const [logo, setLogo] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [invoiceNumber, setInvoiceNumber] = useState(makeId());
  const [poNumber, setPoNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState(addDaysISO(30));
  const [terms, setTerms] = useState('Net 30');

  type Line = { description: string; quantity: number; unitPrice: number };
  const [lines, setLines] = useState<Line[]>([{ description: 'Item description', quantity: 1, unitPrice: 0 }]);

  const subtotal = useMemo(() => lines.reduce((s,l)=> s + l.quantity*l.unitPrice, 0), [lines]);

  useEffect(() => {
    const load = async () => {
      try { const r = await fetch('/api/accounts'); if (r.ok) setAccounts(await r.json()); } catch {}
    };
    load();
  }, []);

  const parsePdf = async (): Promise<string> => {
    if (!pdfFile) return '';
    const fd = new FormData(); fd.append('file', pdfFile);
    const r = await fetch('/api/ingest/pdf', { method: 'POST', body: fd });
    if (!r.ok) return '';
    const j = await r.json();
    return String(j.text || '');
  };

  const autoGenerate = async () => {
    setLoading(true); setError(null);
    try {
      const pdfText = await parsePdf();
      const res = await fetch('/api/ai/draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'invoice', notes, pdfText }) });
      if (!res.ok) throw new Error('AI generation failed');
      const data = await res.json();
      const newLines: Line[] = data.lines.map((l: any)=> ({ description: String(l.description), quantity: Number(l.quantity||1), unitPrice: Number(l.unitPrice||0) }))
        .filter((l: Line)=> l.description && l.quantity>0 && l.unitPrice>=0);
      if (newLines.length) setLines(newLines);
    } catch (e: any) {
      setError(e.message || 'Auto-generate failed');
    } finally { setLoading(false); }
  };

  const create = async (status: 'DRAFT'|'SENT') => {
    if (!accountId) { setError('Please select a customer'); return; }
    setLoading(true); setError(null);
    try {
      const items = lines.map(l => ({ description: l.description, quantity: l.quantity, rate: l.unitPrice }));
      const body = { id: invoiceNumber, amount: Math.round(subtotal), status, issueDate: invoiceDate, dueDate, notes, accountId: Number(accountId), items };
      const res = await fetch('/api/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Create failed');
      onCreated(); onClose();
    } catch (e:any) { setError(e.message || 'Create failed'); } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 70 }} onClick={onClose}>
      <div onClick={(e)=> e.stopPropagation()} style={{ width: '96vw', maxWidth: 1200, margin: '4vh auto', background: 'white', borderRadius: 8, border: '1px solid #E5E7EB', padding: 16, display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 16 }}>
        {/* Left column */}
        <div>
          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <div style={{ fontWeight: 700, color: COLORS.navyDark, marginBottom: 8 }}>AI Invoice Assistant</div>
            <textarea placeholder="Example: 'Create invoice for Acme Corp, 10 widgets at 50 each, tax 8%, due in 30 days' or paste text/email."
              value={notes}
              onChange={(e)=> setNotes(e.target.value)}
              rows={6}
              style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 8, padding: 10 }} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
              <button onClick={autoGenerate} disabled={loading} style={{ padding: '10px 12px', background: '#7C3AED', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>{loading ? 'Generating…' : 'Auto-Generate Invoice'}</button>
              <input type="file" accept="application/pdf" onChange={(e)=> setPdfFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>

          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <div style={{ fontWeight: 700, color: COLORS.navyDark, marginBottom: 8 }}>Company Logo</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 72, height: 72, border: '1px dashed #D1D5DB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
                {logo ? (<img src={logo} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%' }} />) : (<span style={{ color: '#9CA3AF' }}>Logo</span>)}
              </div>
              <input type="file" accept="image/*" onChange={(e)=> { const f=e.target.files?.[0]; if (f) { const r=new FileReader(); r.onload = ()=> setLogo(String(r.result)); r.readAsDataURL(f);} }} />
            </div>
          </div>

          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 700, color: COLORS.navyDark, marginBottom: 8 }}>Invoice Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: '#6B7280' }}>Invoice Number</label>
                <input value={invoiceNumber} onChange={(e)=> setInvoiceNumber(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 6 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#6B7280' }}>PO Number</label>
                <input value={poNumber} onChange={(e)=> setPoNumber(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 6 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#6B7280' }}>Invoice Date</label>
                <input type="date" value={invoiceDate} onChange={(e)=> setInvoiceDate(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 6 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#6B7280' }}>Due Date</label>
                <input type="date" value={dueDate} onChange={(e)=> setDueDate(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 6 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#6B7280' }}>Payment Terms</label>
                <select value={terms} onChange={(e)=> setTerms(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 6 }}>
                  <option>Net 15</option>
                  <option>Net 30</option>
                  <option>Net 45</option>
                  <option>Due on receipt</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#6B7280' }}>Customer</label>
                <select value={accountId} onChange={(e)=> setAccountId(Number(e.target.value)||'')} style={{ width: '100%', padding: 10, border: '1px solid #E5E7EB', borderRadius: 6 }}>
                  <option value="">Select account…</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {error && <div style={{ color: '#B91C1C', marginTop: 8 }}>{error}</div>}
        </div>

        {/* Right Preview */}
        <div>
          <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1F2937' }}>INVOICE</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>{invoiceNumber}</div>
              </div>
              {logo && <img src={logo} alt="logo" style={{ height: 40 }} />}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>Bill To:</div>
                <div style={{ fontWeight: 600 }}>{accounts.find(a=> a.id===accountId)?.name || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>Details:</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>Date: {invoiceDate}</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>Due: {dueDate}</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>Terms: {terms}</div>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0A2540', color: 'white' }}>
                  <th style={{ textAlign: 'left', padding: 8 }}>#</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Item</th>
                  <th style={{ textAlign: 'right', padding: 8 }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: 8 }}>Price</th>
                  <th style={{ textAlign: 'right', padding: 8 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, idx)=> (
                  <tr key={idx}>
                    <td style={{ padding: 8 }}>{idx+1}</td>
                    <td style={{ padding: 8 }}>
                      <input value={l.description} onChange={(e)=> setLines(prev=> prev.map((x,i)=> i===idx? { ...x, description: e.target.value }: x))} style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 4, padding: 6 }} />
                    </td>
                    <td style={{ padding: 8, textAlign: 'right' }}>
                      <input type='number' min={1} value={l.quantity} onChange={(e)=> setLines(prev=> prev.map((x,i)=> i===idx? { ...x, quantity: Math.max(1, Number(e.target.value)||1) }: x))} style={{ width: 70, border: '1px solid #E5E7EB', borderRadius: 4, padding: 6, textAlign: 'right' }} />
                    </td>
                    <td style={{ padding: 8, textAlign: 'right' }}>
                      <input type='number' min={0} value={l.unitPrice} onChange={(e)=> setLines(prev=> prev.map((x,i)=> i===idx? { ...x, unitPrice: Math.max(0, Number(e.target.value)||0) }: x))} style={{ width: 120, border: '1px solid #E5E7EB', borderRadius: 4, padding: 6, textAlign: 'right' }} />
                    </td>
                    <td style={{ padding: 8, textAlign: 'right' }}>{formatCurrency(l.quantity*l.unitPrice)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={5} style={{ padding: 8 }}>
                    <button onClick={()=> setLines(prev=> [...prev, { description: 'Item description', quantity: 1, unitPrice: 0 }])} style={{ background: 'transparent', border: '1px dashed #9CA3AF', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>+ Add Line</button>
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <div style={{ minWidth: 240 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px' }}>
                  <div>Subtotal:</div>
                  <div>{formatCurrency(subtotal)}</div>
                </div>
                <div style={{ background: '#0A2540', color: 'white', display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 6, fontWeight: 700 }}>
                  <div>Total:</div>
                  <div>{formatCurrency(subtotal)}</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ position: 'sticky', bottom: 0, background: 'white', borderTop: '1px solid #E5E7EB', padding: 12, marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={onClose} style={{ padding: '10px 16px', background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
            <button onClick={()=> create('DRAFT')} disabled={loading} style={{ padding: '10px 16px', background: '#F59E0B', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Save as Draft</button>
            <button onClick={()=> create('SENT')} disabled={loading} style={{ padding: '10px 16px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Create Invoice</button>
          </div>
        </div>
      </div>
    </div>
  );
}
