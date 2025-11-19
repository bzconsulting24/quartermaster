import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { COLORS } from '../data/uiConstants';

export type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onCreateTask?: (title: string) => void;
};

type ResultItem =
  | { kind: 'account'; id: number; name: string; subtitle?: string }
  | { kind: 'contact'; id: number; name: string; subtitle?: string }
  | { kind: 'opportunity'; id: number; name: string; subtitle?: string }
  | { kind: 'task'; id: number; name: string; subtitle?: string };

const actionItems = [
  { label: 'Go to: Home', action: (nav: (t: string)=>void) => nav('home') },
  { label: 'Go to: Pipeline', action: (nav: (t: string)=>void) => nav('pipeline') },
  { label: 'Go to: Accounts', action: (nav: (t: string)=>void) => nav('accounts') },
  { label: 'Go to: Contacts', action: (nav: (t: string)=>void) => nav('contacts') },
  { label: 'Go to: Customer Information', action: (nav: (t: string)=>void) => nav('customerInformation') },
  { label: 'Go to: Tasks', action: (nav: (t: string)=>void) => nav('tasks') },
  { label: 'Go to: Reports', action: (nav: (t: string)=>void) => nav('reports') }
];

export default function CommandPalette({ open, onClose, onNavigate, onCreateTask }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<ResultItem[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((i)=> Math.min(i+1, items.length-1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((i)=> Math.max(i-1, 0)); }
      if (e.key === 'Enter') { e.preventDefault(); select(index); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, index]);

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      if (!open) return;
      const q = query.trim();
      if (q.length < 2) { setResults([]); return; }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          const next: ResultItem[] = [
            ...data.accounts.map((a: any)=>({ kind: 'account', id: a.id, name: a.name, subtitle: a.industry })),
            ...data.contacts.map((c: any)=>({ kind: 'contact', id: c.id, name: c.name, subtitle: c.email ?? c.phone })),
            ...data.opportunities.map((o: any)=>({ kind: 'opportunity', id: o.id, name: o.name, subtitle: `${o.account?.name ?? ''}` })),
            ...data.tasks.map((t: any)=>({ kind: 'task', id: t.id, name: t.title, subtitle: `${t.status}` }))
          ];
          setResults(next.slice(0, 25));
          setIndex(0);
        }
      } catch {}
      finally { setLoading(false); }
    };
    const timer = setTimeout(run, 150);
    return () => clearTimeout(timer);
  }, [query, open]);

  const items = useMemo(() => {
    const head = actionItems.map((a) => ({ kind: 'action' as const, label: a.label, action: a.action }));
    const mapped = results.map((r) => ({ kind: r.kind, label: r.name, subtitle: r.subtitle }));
    return [...head, ...mapped];
  }, [results]);

  const select = (i: number) => {
    const item = items[i] as any;
    if (!item) return;
    if (item.kind === 'action') {
      item.action(onNavigate);
      onClose();
      return;
    }
    // Basic navigation mapping
    if (item.kind === 'account') onNavigate('accounts');
    if (item.kind === 'contact') onNavigate('contacts');
    if (item.kind === 'opportunity') onNavigate('pipeline');
    if (item.kind === 'task') onNavigate('tasks');
    onClose();
  };

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50 }} onClick={onClose}>
      <div
        role="dialog"
        aria-modal
        onClick={(e)=> e.stopPropagation()}
        style={{
          maxWidth: 720,
          margin: '10vh auto 0',
          background: COLORS.navyDark,
          border: `1px solid ${COLORS.navyLight}`,
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ position: 'relative', padding: '12px 12px 0 12px' }}>
          <Search style={{ position: 'absolute', left: 24, top: 26, width: 16, height: 16, color: '#9CA3AF' }} />
          <input
            ref={inputRef}
            placeholder="Search accounts, contacts, deals, tasks..."
            value={query}
            onChange={(e)=> setQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 44px',
              borderRadius: 6,
              background: COLORS.navyLight,
              color: 'white',
              border: `1px solid ${COLORS.navyLight}`,
              outline: 'none',
              fontSize: 14
            }}
          />
        </div>
        <div style={{ maxHeight: 420, overflow: 'auto', padding: 12 }}>
          {loading && <div style={{ color: '#9CA3AF', padding: '8px 12px' }}>Searching…</div>}
          {!loading && items.map((item, i)=> (
            <div
              key={`${item.label}-${i}`}
              onMouseEnter={()=> setIndex(i)}
              onClick={()=> select(i)}
              style={{
                padding: '10px 12px',
                background: i===index ? '#0B1220' : 'transparent',
                borderRadius: 6,
                cursor: 'pointer',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{(item as any).label}</div>
                {(item as any).subtitle && <div style={{ color: '#9CA3AF', fontSize: 12 }}>{(item as any).subtitle}</div>}
              </div>
              {i === 0 && <div style={{ color: '#9CA3AF', fontSize: 12 }}>Enter</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
