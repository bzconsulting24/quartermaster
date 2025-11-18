import { useEffect, useState } from "react";
import { COLORS, formatCurrency, formatDisplayDate } from "../data/uiConstants";
import type { QuoteRecord } from "../types";

export default function EstimateDetailModal({ id, onClose, onChanged }: { id: number; onClose: ()=>void; onChanged: ()=>void }) {
  const [estimate, setEstimate] = useState<QuoteRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/estimates/${id}`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setEstimate(data);
    } catch (e: any) {
      setError(e.message || 'Error');
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [id]);

  const sendEstimate = async () => {
    const to = window.prompt('Send estimate to email (leave blank to skip email):') || undefined;
    await fetch(`/api/estimates/${id}/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to }) });
    await load(); onChanged();
  };

  const convertToInvoice = async () => {
    await fetch(`/api/estimates/${id}/convert-to-invoice`, { method: 'POST' });
    onChanged(); onClose();
  };

  const pdfUrl = `/api/estimates/${id}/pdf`;

  if (!estimate) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 60 }} onClick={onClose}>
        <div onClick={(e)=> e.stopPropagation()} style={{ width: '90vw', maxWidth: 1100, margin: '8vh auto', background: 'white', borderRadius: 8, border: '1px solid #E5E7EB', padding: 16 }}>
          {loading ? 'Loading...' : error || 'Not found'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 60 }} onClick={onClose}>
      <div onClick={(e)=> e.stopPropagation()} style={{ width: '90vw', maxWidth: 1100, margin: '6vh auto', background: 'white', borderRadius: 8, border: '1px solid #E5E7EB', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 0 }}>
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.navyDark }}>Estimate {estimate.number}</div>
              <div style={{ fontSize: 13, color: '#6B7280' }}>Account: {estimate.account.name}</div>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer' }}>×</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 12 }}>
            <div style={{ background: '#F9FAFB', padding: 12, borderRadius: 6, border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 12, color: '#6B7280' }}>Status</div>
              <div style={{ fontWeight: 700 }}>{estimate.status}</div>
            </div>
            <div style={{ background: '#F9FAFB', padding: 12, borderRadius: 6, border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 12, color: '#6B7280' }}>Issued</div>
              <div style={{ fontWeight: 700 }}>{formatDisplayDate(estimate.issuedAt)}</div>
            </div>
            <div style={{ background: '#F9FAFB', padding: 12, borderRadius: 6, border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 12, color: '#6B7280' }}>Total</div>
              <div style={{ fontWeight: 700 }}>{formatCurrency(estimate.total)}</div>
            </div>
          </div>

          <div style={{ border: '1px solid #E5E7EB', borderRadius: 6, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  <th style={{ textAlign: 'left', padding: 10 }}>Description</th>
                  <th style={{ textAlign: 'right', padding: 10, width: 70 }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: 10, width: 120 }}>Rate</th>
                  <th style={{ textAlign: 'right', padding: 10, width: 140 }}>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {estimate.lines.map((l, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #E5E7EB' }}>
                    <td style={{ padding: 10 }}>{l.description}</td>
                    <td style={{ padding: 10, textAlign: 'right' }}>{l.quantity}</td>
                    <td style={{ padding: 10, textAlign: 'right' }}>{formatCurrency(l.unitPrice)}</td>
                    <td style={{ padding: 10, textAlign: 'right' }}>{formatCurrency(l.unitPrice * l.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={sendEstimate} style={{ padding: '8px 12px', background: COLORS.navyDark, color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Send Estimate</button>
            <button onClick={convertToInvoice} style={{ padding: '8px 12px', background: '#10B981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Convert to Invoice</button>
          </div>
        </div>
        <div style={{ borderLeft: '1px solid #E5E7EB', background: '#F9FAFB', minHeight: 600 }}>
          <iframe title="Estimate PDF" src={pdfUrl} style={{ width: '100%', height: '100%', border: 'none', minHeight: 600 }} />
        </div>
      </div>
    </div>
  );
}
