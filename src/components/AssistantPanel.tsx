import { useEffect, useState, useRef } from 'react';
import { X, Send, Trash2, Maximize2, Minimize2, Paperclip, FileText } from 'lucide-react';
import { COLORS } from '../data/uiConstants';

type AssistantPanelProps = {
  onClose: () => void;
};

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string | {
    message?: string;
    insights?: string[];
    recommendations?: string[];
    actions?: Array<{
      type: string;
      description: string;
      params: any;
    }>;
    data?: any;
  };
};

const AssistantPanel = ({ onClose }: AssistantPanelProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi! I\'m Quartermaster AI. I can help you with your CRM - create invoices, add contacts, check your pipeline, and more. You can chat with me in English or Tagalog! 🇵🇭' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any | null>(null);
  const [applying, setApplying] = useState(false);
  const [memory, setMemory] = useState<Array<{ ts: string; text: string }>>([]);
  const [executingActions, setExecutingActions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analyzingFile, setAnalyzingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMemory = async () => {
    try { const { items } = await fetch('/api/assistant/memory').then(r => r.json()); setMemory(items ?? []); } catch {}
  };
  useEffect(() => { void loadMemory(); }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessage: ChatMessage = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: typeof m.content === 'string' ? m.content : m.content.message || ''
          }))
        })
      });
      if (!response.ok) throw new Error('Unable to reach assistant');
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not process that request.' }]);
      console.error(err);
    } finally { setLoading(false); }
  };

  const clearChat = () => {
    setMessages([
      { role: 'assistant', content: 'Hi! I\'m Quartermaster AI. I can help you with your CRM - create invoices, add contacts, check your pipeline, and more. You can chat with me in English or Tagalog! 🇵🇭' }
    ]);
    setInput('');
    setPreview(null);
  };

  const executeActions = async (actions: Array<any>) => {
    setExecutingActions(true);
    try {
      const response = await fetch('/api/assistant/execute-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actions })
      });
      const data = await response.json();

      const successCount = data.created || 0;
      const failedCount = data.failed || 0;

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: {
          message: `✅ Created ${successCount} record(s) successfully${failedCount > 0 ? `. ${failedCount} failed.` : '!'}`,
          data: data.createdRecords?.length > 0 ? { created: data.createdRecords } : undefined
        }
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Failed to execute actions. Please try again.'
      }]);
    } finally {
      setExecutingActions(false);
    }
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
    await analyzeFile(file);
  };

  const analyzeFile = async (file: File) => {
    setAnalyzingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('prompt', input || 'Analyze this file and suggest what actions I should take with this data in my CRM.');

      const response = await fetch('/api/assistant/analyze-file', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to analyze file');

      const data = await response.json();
      setMessages(prev => [...prev,
        { role: 'user', content: `📎 Uploaded: ${file.name}` },
        { role: 'assistant', content: data }
      ]);
      setUploadedFile(null);
      setInput('');
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Failed to analyze file. Please try again.'
      }]);
    } finally {
      setAnalyzingFile(false);
    }
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
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Quartermaster AI</h3>
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
        {messages.map((m, i) => {
          const isStructured = typeof m.content === 'object';
          const content = isStructured ? m.content : { message: m.content };

          return (
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
              {m.role === 'user' ? (
                <div>{typeof m.content === 'string' ? m.content : content.message}</div>
              ) : (
                <div>
                  {content.message && <div style={{ marginBottom: content.insights || content.recommendations ? '12px' : 0 }}>{content.message}</div>}

                  {content.insights && content.insights.length > 0 && (
                    <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px', borderLeft: '3px solid #3B82F6' }}>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#1E40AF', marginBottom: '4px', textTransform: 'uppercase' }}>💡 Insights</div>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                        {content.insights.map((insight: string, idx: number) => (
                          <li key={idx} style={{ marginBottom: '4px' }}>{insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {content.recommendations && content.recommendations.length > 0 && (
                    <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', borderLeft: '3px solid #10B981' }}>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#065F46', marginBottom: '4px', textTransform: 'uppercase' }}>✅ Recommendations</div>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                        {content.recommendations.map((rec: string, idx: number) => (
                          <li key={idx} style={{ marginBottom: '4px' }}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {content.actions && content.actions.length > 0 && (
                    <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '6px', borderLeft: '3px solid #A855F7' }}>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#6B21A8', marginBottom: '8px', textTransform: 'uppercase' }}>⚡ Executable Actions</div>
                      {content.actions.map((action: any, idx: number) => (
                        <div key={idx} style={{ background: 'white', padding: '8px', borderRadius: '4px', marginBottom: '6px', border: '1px solid #E9D5FF' }}>
                          <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>{action.type}</div>
                          <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>{action.description}</div>
                          <details style={{ fontSize: '11px', color: '#6B7280' }}>
                            <summary style={{ cursor: 'pointer', userSelect: 'none' }}>View parameters</summary>
                            <pre style={{ marginTop: '4px', padding: '4px', background: '#F9FAFB', borderRadius: '2px', overflow: 'auto' }}>
                              {JSON.stringify(action.params, null, 2)}
                            </pre>
                          </details>
                        </div>
                      ))}
                      <button
                        onClick={() => executeActions(content.actions!)}
                        disabled={executingActions}
                        style={{
                          width: '100%',
                          marginTop: '8px',
                          padding: '8px',
                          background: '#A855F7',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: executingActions ? 'not-allowed' : 'pointer',
                          fontWeight: '600',
                          opacity: executingActions ? 0.6 : 1
                        }}
                      >
                        {executingActions ? 'Executing...' : `Execute ${content.actions.length} Action(s)`}
                      </button>
                    </div>
                  )}

                  {content.data && Object.keys(content.data).length > 0 && (
                    <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(249, 115, 22, 0.1)', borderRadius: '6px', borderLeft: '3px solid #F97316' }}>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#9A3412', marginBottom: '4px', textTransform: 'uppercase' }}>📊 Data</div>
                      <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                        {Object.entries(content.data).map(([key, value]) => (
                          <div key={key} style={{ marginBottom: '2px' }}>
                            <strong>{key}:</strong> {JSON.stringify(value)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {loading && <div style={{ color: '#6B7280', fontSize: 14 }}>Thinking…</div>}
        {analyzingFile && (
          <div style={{ color: '#6B7280', fontSize: 14, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} />
            <span>Analyzing file...</span>
          </div>
        )}
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
        {!!memory.length && (
          <div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Recent Memory</div>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {memory.slice(0, 5).map((m, i) => (<li key={i} style={{ fontSize: 12, color: '#4B5563' }}>{m.text}</li>))}
            </ul>
          </div>
        )}
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
            disabled={analyzingFile}
            title="Upload file (PDF, Excel, CSV)"
            style={{
              padding: '8px',
              borderRadius: 6,
              border: '1px solid #D1D5DB',
              background: 'white',
              cursor: analyzingFile ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              opacity: analyzingFile ? 0.5 : 1
            }}
          >
            <Paperclip size={16} color={COLORS.navyDark} />
          </button>
          <input
            type="text"
            placeholder="Ask or describe changes… (or drag files here)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) sendMessage(); }}
            disabled={analyzingFile}
            style={{
              flex: 1,
              padding: '10px 12px',
              border: '1px solid #E5E7EB',
              borderRadius: 6,
              fontSize: 14,
              outline: 'none',
              opacity: analyzingFile ? 0.5 : 1
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || analyzingFile}
            style={{
              background: `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)`,
              color: 'white',
              border: 'none',
              borderRadius: 6,
              padding: '0 14px',
              height: '40px',
              cursor: (loading || analyzingFile) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: (loading || analyzingFile) ? 0.5 : 1
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssistantPanel;