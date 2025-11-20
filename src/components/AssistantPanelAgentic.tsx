import { useEffect, useState, useRef } from 'react';
import { X, Send, Trash2, Maximize2, Minimize2, Paperclip, FileText, Zap } from 'lucide-react';
import { COLORS } from '../data/uiConstants';

type AssistantPanelProps = {
  onClose: () => void;
};

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  functionCalls?: Array<{
    name: string;
    args: any;
    result: any;
  }>;
};

const AssistantPanelAgentic = ({ onClose }: AssistantPanelProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi! I\'m Quartermaster AI - your autonomous CRM assistant. I can analyze files, create records, and execute multi-step workflows. Try uploading an Excel file or ask me anything!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize thread
  useEffect(() => {
    const initThread = async () => {
      try {
        const response = await fetch('/api/assistant/agentic/thread', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });
        const data = await response.json();
        setThreadId(data.threadId);
      } catch (error) {
        console.error('Failed to create thread:', error);
      }
    };
    initThread();
  }, [sessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (fileToSend?: File) => {
    if (!input.trim() && !fileToSend) return;
    if (!threadId) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Thread not initialized. Please refresh.' }]);
      return;
    }

    const userMessage = input.trim() || `📎 Uploaded: ${fileToSend?.name}`;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    // Add temporary "thinking" message
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const formData = new FormData();
      formData.append('threadId', threadId);
      formData.append('message', input.trim() || 'Analyze this file and suggest what to do with the data.');
      if (fileToSend) {
        formData.append('file', fileToSend);
      }

      const response = await fetch('/api/assistant/agentic/message', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to send message');

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      const functionCalls: Array<{ name: string; args: any; result: any }> = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6));

                if (event.type === 'text') {
                  assistantContent += event.content;
                  // Update last message (the assistant's response)
                  setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      role: 'assistant',
                      content: assistantContent,
                      functionCalls: functionCalls.length > 0 ? functionCalls : undefined
                    };
                    return newMessages;
                  });
                } else if (event.type === 'function_call') {
                  functionCalls.push({
                    name: event.name,
                    args: event.args,
                    result: event.result
                  });
                  // Show function execution in real-time
                  setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      role: 'assistant',
                      content: assistantContent || 'Executing actions...',
                      functionCalls
                    };
                    return newMessages;
                  });
                } else if (event.type === 'done') {
                  break;
                } else if (event.type === 'error') {
                  setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      role: 'assistant',
                      content: '❌ Error: ' + (event.error || 'Unknown error')
                    };
                    return newMessages;
                  });
                }
              } catch (e) {
                console.error('Failed to parse SSE event:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Send message error:', error);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: '❌ Failed to get response. Please try again.'
        };
        return newMessages;
      });
    } finally {
      setLoading(false);
      setUploadedFile(null);
    }
  };

  const clearChat = async () => {
    if (threadId) {
      try {
        await fetch(`/api/assistant/agentic/thread/${threadId}`, { method: 'DELETE' });
      } catch (error) {
        console.error('Failed to delete thread:', error);
      }
    }
    setMessages([
      { role: 'assistant', content: 'Hi! I\'m Quartermaster AI - your autonomous CRM assistant. I can analyze files, create records, and execute multi-step workflows. Try uploading an Excel file or ask me anything!' }
    ]);
    // Reinitialize thread
    const response = await fetch('/api/assistant/agentic/thread', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });
    const data = await response.json();
    setThreadId(data.threadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = async (file: File) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (!validTypes.includes(file.type)) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I can only analyze PDF, Excel (.xlsx, .xls), and CSV files.'
      }]);
      return;
    }

    setUploadedFile(file);
    await sendMessage(file);
  };

  const width = isExpanded ? '600px' : '380px';
  const height = isExpanded ? '700px' : '500px';

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width,
      height,
      background: 'white',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      zIndex: 1002,
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'width 0.3s ease, height 0.3s ease'
    }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)`, color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={16} color={COLORS.gold} />
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Quartermaster AI</h3>
          <span style={{ fontSize: 10, background: COLORS.gold, color: COLORS.navyDark, padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>AGENTIC</span>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Minimize" : "Expand"}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              cursor: 'pointer',
              color: 'white',
              padding: '6px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button
            onClick={clearChat}
            title="Clear conversation"
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              cursor: 'pointer',
              color: 'white',
              padding: '6px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Trash2 size={14} />
          </button>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'white', padding: '6px' }}><X size={16} /></button>
        </div>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          flex: 1,
          padding: '16px',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          border: isDragging ? `2px dashed ${COLORS.navyDark}` : 'none',
          background: isDragging ? '#F0F9FF' : 'transparent',
          position: 'relative'
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              background: m.role === 'user' ? COLORS.navyDark : '#F3F4F6',
              color: m.role === 'user' ? 'white' : '#111827',
              padding: '12px 16px',
              borderRadius: 12,
              maxWidth: '85%'
            }}
          >
            <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>

            {/* Show function calls */}
            {m.functionCalls && m.functionCalls.length > 0 && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#6B21A8', marginBottom: '8px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Zap size={12} />
                  Actions Executed
                </div>
                {m.functionCalls.map((fc, idx) => (
                  <div key={idx} style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '8px', borderRadius: '4px', marginBottom: '6px', border: '1px solid #E9D5FF' }}>
                    <div style={{ fontWeight: '600', fontSize: '12px', marginBottom: '4px' }}>{fc.name}</div>
                    {fc.result.success && (
                      <div style={{ fontSize: '11px', color: '#10B981' }}>✅ Success</div>
                    )}
                    {fc.result.created !== undefined && (
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>Created: {fc.result.created}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && <div style={{ color: '#6B7280', fontSize: 14, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={16} />
          <span>Agent working...</span>
        </div>}

        {isDragging && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(240, 249, 255, 0.95)',
            border: `3px dashed ${COLORS.navyDark}`,
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: '600',
            color: COLORS.navyDark,
            pointerEvents: 'none'
          }}>
            📎 Drop file here to analyze
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: '12px', borderTop: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
            accept=".pdf,.xlsx,.xls,.csv"
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            title="Upload file (PDF, Excel, CSV)"
            style={{
              padding: '8px',
              borderRadius: 6,
              border: '1px solid #D1D5DB',
              background: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              opacity: loading ? 0.5 : 1
            }}
          >
            <Paperclip size={16} color={COLORS.navyDark} />
          </button>
          <input
            type="text"
            placeholder="Ask anything... I can execute actions autonomously"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) sendMessage(); }}
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px 12px',
              border: '1px solid #E5E7EB',
              borderRadius: 6,
              fontSize: 14,
              outline: 'none',
              opacity: loading ? 0.5 : 1
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading}
            style={{
              background: `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)`,
              color: 'white',
              border: 'none',
              borderRadius: 6,
              padding: '0 14px',
              height: '40px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: loading ? 0.5 : 1
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssistantPanelAgentic;
