import { useEffect, useState, useRef } from 'react';
import { X, Send, Trash2, Maximize2, Minimize2, Paperclip, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
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
    { role: 'assistant', content: 'Hi! I\'m Quartermaster AI, your official navigator. You can ask me to create invoices, add contacts, check your pipeline, and more -- in English or Tagalog.' }
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMemory = async () => {
    try { const { items } = await fetch('/api/assistant/memory').then(r => r.json()); setMemory(items ?? []); } catch {}
  };
  useEffect(() => { void loadMemory(); }, []);

  const sendMessage = async () => {
    if (!input.trim() && !uploadedFile) return;

    const userMessageContent = uploadedFile
      ? `${input.trim() || 'Analyze this file and suggest actions'}\n\n📎 Attached: ${uploadedFile.name}`
      : input.trim();

    const newMessage: ChatMessage = { role: 'user', content: userMessageContent };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const userName = localStorage.getItem('userName') || 'User';
      const llmModel = localStorage.getItem('llmModel') || 'gpt-4o-mini';
      const systemPrompt = localStorage.getItem('systemPrompt') || undefined;
      const temperature = parseFloat(localStorage.getItem('temperature') || '0.7');
      const maxTokens = parseInt(localStorage.getItem('maxTokens') || '1000');

      let response;

      if (uploadedFile) {
        // Send file as multipart/form-data with message
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('messages', JSON.stringify(updatedMessages.map(m => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content : m.content.message || ''
        }))));
        formData.append('userName', userName);
        formData.append('model', llmModel);
        if (systemPrompt) formData.append('systemPrompt', systemPrompt);
        formData.append('temperature', temperature.toString());
        // Use higher token limit for file analysis (bulk imports need more tokens)
        formData.append('maxTokens', '16000');

        response = await fetch('/api/assistant/with-file', {
          method: 'POST',
          body: formData
        });

        setUploadedFile(null); // Clear file after sending
      } else {
        // Send regular JSON message
        response = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedMessages.map(m => ({
              role: m.role,
              content: typeof m.content === 'string' ? m.content : m.content.message || ''
            })),
            userName,
            model: llmModel,
            systemPrompt,
            temperature,
            maxTokens
          })
        });
      }

      if (!response.ok) throw new Error('Unable to reach assistant');
      const data = await response.json();
      console.log('📥 File analysis response:', data);
      console.log('📥 Response type:', typeof data);
      console.log('📥 Has actions?', data?.actions?.length);
      setMessages(prev => [...prev, { role: 'assistant', content: data }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not process that request.' }]);
      console.error(err);
    } finally { setLoading(false); }
  };

  const clearChat = () => {
    setMessages([
      { role: 'assistant', content: 'Hi! I\'m Quartermaster AI, your official navigator. You can ask me to create invoices, add contacts, check your pipeline, and more -- in English or Tagalog.' }
    ]);
    setInput('');
    setPreview(null);
  };

  const executeActions = async (actions: Array<any>) => {
    setExecutingActions(true);
    try {
      // Use bulk endpoint for large datasets (10+ actions) or when explicitly marked
      const useBulkImport = actions.length >= 10;
      const endpoint = useBulkImport ? '/api/assistant/execute-plan-bulk' : '/api/assistant/execute-plan';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actions })
      });
      const data = await response.json();

      const successCount = data.created || 0;
      const failedCount = data.failed || 0;

      // Format success message with clean summary
      let summaryMessage = '';

      if (useBulkImport) {
        // Bulk import response format
        if (data.createdRecords?.length > 0) {
          const summary = data.createdRecords.map((item: any) => {
            return `**${item.count}** ${item.type} created`;
          }).join('\n');
          summaryMessage = `✅ **Bulk Import Complete!**\n\n${summary}\n\n${failedCount > 0 ? `⚠️ ${failedCount} record(s) failed (check logs for details)` : ''}`;
        } else {
          summaryMessage = `✅ Bulk import completed: ${successCount} record(s) created${failedCount > 0 ? `, ${failedCount} failed` : '!'}`;
        }
      } else {
        // Individual action response format
        if (data.createdRecords?.length > 0) {
          const summary = data.createdRecords.map((item: any) => {
            if (item.type === 'account') {
              return `**${item.record.name}** account ${actions[0].type.includes('UPDATE') ? 'updated' : 'created'}`;
            } else if (item.type === 'contact') {
              return `**${item.record.name}** contact ${actions[0].type.includes('UPDATE') ? 'updated' : 'created'}`;
            } else if (item.type === 'invoice') {
              return `Invoice **${item.record.id}** created for ₱${item.record.amount.toLocaleString()}`;
            } else if (item.type === 'lead') {
              return `Lead **${item.record.name}** created`;
            } else if (item.type === 'opportunity') {
              return `Opportunity **${item.record.name}** ${actions[0].type.includes('UPDATE') ? 'updated' : 'created'}`;
            } else if (item.type === 'task') {
              return `Task **${item.record.title}** created${item.record.dueDate ? ` (due ${new Date(item.record.dueDate).toLocaleDateString()})` : ''}`;
            } else if (item.type === 'meeting') {
              return `Meeting **${item.record.subject}** scheduled${item.record.performedAt ? ` for ${new Date(item.record.performedAt).toLocaleString()}` : ''}`;
            }
            return `${item.type} ${actions[0].type.includes('UPDATE') ? 'updated' : 'created'}`;
          }).join('\n');
          summaryMessage = `✅ **Success!**\n\n${summary}`;
        } else {
          summaryMessage = `✅ ${successCount} record(s) ${actions[0].type.includes('UPDATE') ? 'updated' : 'created'} successfully${failedCount > 0 ? `. ${failedCount} failed.` : '!'}`;
        }
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: {
          message: summaryMessage
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

  const handleFileSelect = (file: File) => {
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

    // Just store the file - it will be sent when user clicks Send
    setUploadedFile(file);
  };

  const width = isExpanded ? '600px' : '380px';
  const height = isExpanded ? '700px' : '500px';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{
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
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Minimize" : "Expand"}
            whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.3)' }}
            whileTap={{ scale: 0.9 }}
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
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </motion.div>
          </motion.button>
          <motion.button
            onClick={clearChat}
            title="Clear conversation"
            whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.3)', rotate: [0, -5, 5, -5, 0] }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.3 }}
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
          </motion.button>
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'white', padding: '6px' }}
          >
            <X size={16} />
          </motion.button>
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
        <AnimatePresence initial={false}>
          {messages.map((m, i) => {
            const isStructured = typeof m.content === 'object';
            const content = isStructured ? m.content : { message: m.content };
            if (m.role === 'assistant' && i === messages.length - 1) {
              console.log('🎨 Rendering message:', { isStructured, hasActions: content?.actions?.length, content });
            }

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
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
                  {content.message && (
                    <div style={{ marginBottom: content.insights || content.recommendations ? '12px' : 0 }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content.message}</ReactMarkdown>
                    </div>
                  )}

                  {content.insights && content.insights.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                      style={{ marginTop: '8px', padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px', borderLeft: '3px solid #3B82F6' }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#1E40AF', marginBottom: '4px', textTransform: 'uppercase' }}>💡 Insights</div>
                      <div style={{ fontSize: '13px' }}>
                        {content.insights.map((insight: string, idx: number) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + idx * 0.05, duration: 0.2 }}
                            style={{ marginBottom: '6px' }}
                          >
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{insight}</ReactMarkdown>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {content.recommendations && content.recommendations.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                      style={{ marginTop: '8px', padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', borderLeft: '3px solid #10B981' }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#065F46', marginBottom: '4px', textTransform: 'uppercase' }}>✅ Recommendations</div>
                      <div style={{ fontSize: '13px' }}>
                        {content.recommendations.map((rec: string, idx: number) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + idx * 0.05, duration: 0.2 }}
                            style={{ marginBottom: '6px' }}
                          >
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{rec}</ReactMarkdown>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {content.actions && content.actions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                      style={{ marginTop: '8px', padding: '8px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '6px', borderLeft: '3px solid #A855F7' }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#6B21A8', marginBottom: '8px', textTransform: 'uppercase' }}>⚡ Executable Actions</div>
                      {content.actions.map((action: any, idx: number) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          transition={{ delay: 0.3 + idx * 0.1, duration: 0.2 }}
                          style={{ background: 'white', padding: '8px', borderRadius: '4px', marginBottom: '6px', border: '1px solid #E9D5FF' }}
                        >
                          <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>{action.type}</div>
                          <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>{action.description}</div>
                          <details style={{ fontSize: '11px', color: '#6B7280' }}>
                            <summary style={{ cursor: 'pointer', userSelect: 'none' }}>View parameters</summary>
                            <pre style={{ marginTop: '4px', padding: '4px', background: '#F9FAFB', borderRadius: '2px', overflow: 'auto' }}>
                              {JSON.stringify(action.params, null, 2)}
                            </pre>
                          </details>
                        </motion.div>
                      ))}
                      <motion.button
                        onClick={() => executeActions(content.actions!)}
                        disabled={executingActions}
                        whileHover={{ scale: executingActions ? 1 : 1.02, boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)' }}
                        whileTap={{ scale: executingActions ? 1 : 0.98 }}
                        animate={executingActions ? { opacity: [0.6, 0.8, 0.6] } : {}}
                        transition={{ duration: executingActions ? 1.5 : 0.2, repeat: executingActions ? Infinity : 0 }}
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
                        {executingActions ? '⏳ Executing...' : `Execute ${content.actions.length} Action(s)`}
                      </motion.button>
                    </motion.div>
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
            </motion.div>
          );
        })}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              background: '#F3F4F6',
              borderRadius: 12,
              maxWidth: '85%'
            }}
          >
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: COLORS.navyDark
                }}
              />
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.2
                }}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: COLORS.navyDark
                }}
              />
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.4
                }}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: COLORS.navyDark
                }}
              />
            </div>
          </motion.div>
        )}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: 1,
                scale: [0.9, 1.05, 1],
                y: [0, -5, 0]
              }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.3,
                y: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' }
              }}
              style={{
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
              }}
            >
              📎 Drop file here to analyze
            </motion.div>
          )}
        </AnimatePresence>
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
        {uploadedFile && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              marginBottom: '8px',
              padding: '8px 12px',
              background: '#F0F9FF',
              border: '1px solid #BAE6FD',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px'
            }}
          >
            <FileText size={16} color="#0284C7" />
            <span style={{ flex: 1, color: '#0369A1', fontWeight: '500' }}>{uploadedFile.name}</span>
            <motion.button
              onClick={() => setUploadedFile(null)}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                color: '#0369A1'
              }}
            >
              <X size={14} />
            </motion.button>
          </motion.div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
            accept=".pdf,.xlsx,.xls,.csv"
            style={{ display: 'none' }}
          />
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            title="Upload file (PDF, Excel, CSV)"
            whileHover={loading ? {} : {
              scale: 1.05,
              y: -2,
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }}
            whileTap={loading ? {} : { scale: 0.95, y: 0 }}
            style={{
              padding: '8px',
              borderRadius: 6,
              border: uploadedFile ? `1px solid #0284C7` : '1px solid #D1D5DB',
              background: uploadedFile ? '#F0F9FF' : 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              opacity: loading ? 0.5 : 1
            }}
          >
            <Paperclip size={16} color={uploadedFile ? '#0284C7' : COLORS.navyDark} />
          </motion.button>
          <input
            type="text"
            placeholder={uploadedFile ? "Add a message (optional)..." : "Ask or describe changes… (or drag files here)"}
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
          <motion.button
            onClick={sendMessage}
            disabled={loading}
            whileHover={loading ? {} : {
              scale: 1.05,
              boxShadow: '0 6px 20px rgba(30, 58, 138, 0.3)'
            }}
            whileTap={loading ? {} : {
              scale: 0.95,
              rotate: 15
            }}
            animate={loading ? {
              opacity: [0.5, 0.7, 0.5]
            } : {}}
            transition={{
              duration: loading ? 1.5 : 0.2,
              repeat: loading ? Infinity : 0,
              rotate: { duration: 0.3 }
            }}
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
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default AssistantPanel;