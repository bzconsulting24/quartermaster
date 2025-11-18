import { useEffect, useState } from 'react';
import { X, Send } from 'lucide-react';
import { COLORS } from '../data/uiConstants';

type AssistantPanelProps = {
  onClose: () => void;
};

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const AssistantPanel = ({ onClose }: AssistantPanelProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi! Ask me about an opportunity, or preview changes to apply.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any | null>(null);
  const [applying, setApplying] = useState(false);
  const [memory, setMemory] = useState<Array<{ ts: string; text: string }>>([]);

  const loadMemory = async () => {
    try { const { items } = await fetch('/api/assistant/memory').then(r => r.json()); setMemory(items ?? []); } catch {}
  };
  useEffect(() => { void loadMemory(); }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessage: ChatMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setLoading(true);
    try {
      const response = await fetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: newMessage.content }) });
      if (!response.ok) throw new Error('Unable to reach assistant');
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not process that request.' }]);
      console.error(err);
    } finally { setLoading(false); }
  };

  const previewActions = async () => {
    if (!input.trim()) return;
    setLoading(true); setPreview(null);
    try {
      const res = await fetch('/api/assistant/actions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: input.trim(), mode: 'dryRun' }) });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setPreview(data);
    } catch { setPreview({ error: 'Could not preview actions' }); }
    finally { setLoading(false); }
  };

  const applyActions = async () => {
    if (!input.trim()) return;
    setApplying(true);
    try {
      const res = await fetch('/api/assistant/actions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: input.trim(), mode: 'apply' }) });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: `Applied ${data.actions ?? 0} action(s).` }]);
      setPreview(null);
      await loadMemory();
    } catch { setMessages(prev => [...prev, { role: 'assistant', content: 'Apply failed.' }]); }
    finally { setApplying(false); }
  };

  const remember = async () => {
    if (!input.trim()) return;
    try { await fetch('/api/assistant/memory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: input.trim() }) }); setInput(''); await loadMemory(); } catch {}
  };

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, width: '480px', height: '100vh', background: 'white', boxShadow: '-4px 0 20px rgba(0,0,0,0.2)', zIndex: 1002, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)`, color: 'white' }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Quartermaster AI</h3>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'white' }}><X size={20} /></button>
      </div>

      {preview && (
        <div style={{ padding: 12, borderBottom: '1px solid #E5E7EB', background: '#F9FAFB' }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Planned Changes</div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, maxHeight: 160, overflow: 'auto', margin: 0 }}>{JSON.stringify(preview, null, 2)}</pre>
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button disabled={applying} onClick={applyActions} style={{ padding: '6px 10px', border: 'none', borderRadius: 4, background: '#10B981', color: 'white', cursor: 'pointer' }}>Apply</button>
            <button onClick={() => setPreview(null)} style={{ padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: 4, background: 'white', cursor: 'pointer' }}>Dismiss</button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, padding: '16px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', background: m.role === 'user' ? COLORS.navyDark : '#F3F4F6', color: m.role === 'user' ? 'white' : '#111827', padding: '12px 16px', borderRadius: 12, maxWidth: '85%' }}>{m.content}</div>
        ))}
        {loading && <div style={{ color: '#6B7280', fontSize: 14 }}>Thinking…</div>}
        {!!memory.length && (
          <div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Recent Memory</div>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {memory.slice(0, 5).map((m, i) => (<li key={i} style={{ fontSize: 12, color: '#4B5563' }}>{m.text}</li>))}
            </ul>
          </div>
        )}
      </div>

      <div style={{ padding: '12px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: 8 }}>
        <input type="text" placeholder="Ask or describe changes…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }} style={{ flex: 1, padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 14, outline: 'none' }} />
        <button onClick={previewActions} disabled={loading} style={{ padding: '0 10px', borderRadius: 6, border: '1px solid #D1D5DB', background: 'white', cursor: 'pointer' }}>Preview</button>
        <button onClick={remember} style={{ padding: '0 10px', borderRadius: 6, border: '1px solid #D1D5DB', background: 'white', cursor: 'pointer' }}>Remember</button>
        <button onClick={sendMessage} disabled={loading} style={{ background: `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)`, color: 'white', border: 'none', borderRadius: 6, padding: '0 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default AssistantPanel;