import { useState } from 'react';
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
    { role: 'assistant', content: 'Hi! Ask me about an opportunity or request a pipeline summary.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessage: ChatMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setLoading(true);
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: newMessage.content })
      });
      if (!response.ok) {
        throw new Error('Unable to reach assistant');
      }
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not process that request.' }]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '420px',
        height: '100vh',
        background: 'white',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.2)',
        zIndex: 1002,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div
        style={{
          padding: '20px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)`,
          color: 'white'
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Quartermaster AI</h3>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'white' }}>
          <X size={20} />
        </button>
      </div>

      <div style={{ flex: 1, padding: '16px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((message, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
              background: message.role === 'user' ? COLORS.navyDark : '#F3F4F6',
              color: message.role === 'user' ? 'white' : '#111827',
              padding: '12px 16px',
              borderRadius: '12px',
              maxWidth: '85%'
            }}
          >
            {message.content}
          </div>
        ))}
        {loading && <div style={{ color: '#6B7280', fontSize: '14px' }}>Thinking…</div>}
      </div>

      <div style={{ padding: '16px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          placeholder="Ask about pipeline, risks, or next steps..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') sendMessage();
          }}
          style={{
            flex: 1,
            padding: '10px 12px',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            background: `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)`,
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '0 14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default AssistantPanel;
