import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { COLORS, formatCurrency, formatDisplayDate } from "../data/uiConstants";
import type { QuoteRecord } from "../types";

export default function EstimateDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const navigate = useNavigate();
  const [estimate, setEstimate] = useState<QuoteRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [lines, setLines] = useState<{ description: string; quantity: number; unitPrice: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/estimates/${id}`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setEstimate(data); setLines(data.lines.map((l:any)=>({ description: l.description, quantity: l.quantity, unitPrice: l.unitPrice })));
    } catch (e: any) {
      setError(e.message || 'Error');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (!Number.isFinite(id)) return; void load(); }, [id]);

  const sendEstimate = async () => {
    const to = window.prompt('Send estimate to email (leave blank to skip email):') || undefined;
    await fetch(`/api/estimates/${id}/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to }) });
    await load();
  };

  const convertToInvoice = async () => {
    await fetch(`/api/estimates/${id}/convert-to-invoice`, { method: 'POST' });
    navigate('/?tab=invoices');
  };

  const pdfUrl = `/api/estimates/${id}/pdf`;

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (error || !estimate) return <div style={{ padding: 24, color: '#B91C1C' }}>{error || 'Not found'}</div>;

  const subtotal = useMemo(()=> lines.reduce((s,l)=> s + l.quantity*l.unitPrice, 0), [lines]);

  const save = async () => {
    await fetch(`/api/estimates/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ total: Math.round(subtotal), lines }) });
    setEditing(false); await load();
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F9FAFB' }}>
      <div style={{ background: COLORS.navyDark, color: 'white', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: '1px solid #374151', color: '#E5E7EB', padding: '6px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Back</button>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Estimate {estimate.number}</div>
          <div style={{ fontSize: 12, color: '#D1D5DB' }}>Account: {estimate.account.name}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}><button onClick={()=> setEditing(e=> !e)} style={{ padding: '8px 12px', background: editing ? '#F59E0B' : '#6B7280', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>{editing ? 'Cancel' : 'Edit'}</button>{editing ? (<button onClick={save} style={{ padding: '8px 12px', background: '#10B981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Save</button>) : (<><button onClick={sendEstimate} style={{ padding: '8px 12px', background: '#0EA5E9', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Send</button><button onClick={convertToInvoice} style={{ padding: '8px 12px', background: '#10B981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Convert to Invoice</button></>)}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', flex: 1 }}>
        <div style={{ padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 12 }}>
            <div style={{ background: 'white', padding: 12, borderRadius: 6, border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 12, color: '#6B7280' }}>Status</div>
              <div style={{ fontWeight: 700 }}>{estimate.status}</div>
            </div>
            <div style={{ background: 'white', padding: 12, borderRadius: 6, border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 12, color: '#6B7280' }}>Issued</div>
              <div style={{ fontWeight: 700 }}>{formatDisplayDate(estimate.issuedAt)}</div>
            </div>
            <div style={{ background: 'white', padding: 12, borderRadius: 6, border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 12, color: '#6B7280' }}>Total</div>
              <div style={{ fontWeight: 700 }}>{formatCurrency(estimate.total)}</div>
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 6, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  <th style={{ textAlign: 'left', padding: 10 }}>Description</th>
                  <th style={{ textAlign: 'right', padding: 10, width: 70 }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: 10, width: 120 }}>Rate</th>
                  <th style={{ textAlign: 'right', padding: 10, width: 140 }}>Line Total</th>
                  {editing && <th style={{ width: 80 }}></th>}
                </tr>
              </thead>
              <tbody>
                {(!editing ? estimate!.lines : lines).map((l:any, i:number) => (
                  <tr key={i} style={{ borderTop: '1px solid #E5E7EB' }}>
                    <td style={{ padding: 10 }}>
                      {editing ? (<input value={lines[i].description} onChange={(e)=> { const v=e.target.value; setLines(prev=> prev.map((x,idx)=> idx===i? { ...x, description: v }: x)); }} style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 4, padding: 6 }} />) : l.description}
                    </td>
                    <td style={{ padding: 10, textAlign: 'right' }}>
                      {editing ? (<input type='number' value={lines[i].quantity} min={1} onChange={(e)=> { const v=Math.max(1, Number(e.target.value)||1); setLines(prev=> prev.map((x,idx)=> idx===i? { ...x, quantity: v }: x)); }} style={{ width: 70, border: '1px solid #E5E7EB', borderRadius: 4, padding: 6, textAlign: 'right' }} />) : l.quantity}
                    </td>
                    <td style={{ padding: 10, textAlign: 'right' }}>
                      {editing ? (<input type='number' value={lines[i].unitPrice} min={0} onChange={(e)=> { const v=Math.max(0, Number(e.target.value)||0); setLines(prev=> prev.map((x,idx)=> idx===i? { ...x, unitPrice: v }: x)); }} style={{ width: 120, border: '1px solid #E5E7EB', borderRadius: 4, padding: 6, textAlign: 'right' }} />) : formatCurrency(l.unitPrice)}
                    </td>
                    <td style={{ padding: 10, textAlign: 'right' }}>{formatCurrency((editing? lines[i].unitPrice: l.unitPrice) * (editing? lines[i].quantity: l.quantity))}</td>
                    {editing && (<td style={{ padding: 10, textAlign: 'right' }}><button onClick={()=> setLines(prev=> prev.filter((_,idx)=> idx!==i))} style={{ background: 'transparent', border: '1px solid #E5E7EB', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}>Remove</button></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            {editing && (<div style={{ padding: 10 }}><button onClick={()=> setLines(prev=> [...prev, { description: 'New item', quantity: 1, unitPrice: 0 }])} style={{ background: 'transparent', border: '1px dashed #9CA3AF', color: '#374151', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>+ Add line</button></div>)}
          </div>
        </div>
        <div style={{ borderLeft: '1px solid #E5E7EB', background: '#F9FAFB', minHeight: 600 }}>
          <iframe title="Estimate PDF" src={pdfUrl} style={{ width: '100%', height: '100%', border: 'none', minHeight: 600 }} />
        </div>
      </div>
    </div>
  );
}

