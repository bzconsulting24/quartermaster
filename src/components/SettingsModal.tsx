import { useEffect, useState } from 'react';
import { COLORS } from '../data/uiConstants';
import { Sparkles, X } from 'lucide-react';

const DEFAULT_SYSTEM_PROMPT = `You are Quartermaster AI, an intelligent CRM assistant. You help users manage their sales pipeline, track customer relationships, and automate workflows.

CAPABILITIES:
- Answer questions about the CRM data
- Create tasks, meetings, and opportunities
- Analyze documents and extract information
- Provide insights and recommendations

PERSONALITY:
- Professional yet friendly
- Concise and action-oriented
- Empathetic and supportive
- Use emojis sparingly for clarity`;


export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const [drive, setDrive] = useState<{ connected: boolean } | null>(null);
  const [one, setOne] = useState<{ connected: boolean } | null>(null);

  // LLM Configuration
  const [llmModel, setLlmModel] = useState(() => localStorage.getItem('llmModel') || 'gpt-4o-mini');
  const [systemPrompt, setSystemPrompt] = useState(() => localStorage.getItem('systemPrompt') || DEFAULT_SYSTEM_PROMPT);
  const [temperature, setTemperature] = useState(() => parseFloat(localStorage.getItem('temperature') || '0.7'));
  const [maxTokens, setMaxTokens] = useState(() => parseInt(localStorage.getItem('maxTokens') || '1000'));
  const [saved, setSaved] = useState(false);

  // AI Helper for improving prompts
  const [showAIHelper, setShowAIHelper] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [helperInput, setHelperInput] = useState('');

  const load = async () => {
    try {
      const d = await fetch('/api/drive/status').then(r => r.json());
      setDrive(d);
    } catch { setDrive({ connected: false }); }
    try {
      const o = await fetch('/api/onedrive/status').then(r => r.json());
      setOne(o);
    } catch { setOne({ connected: false }); }
  };

  useEffect(() => { void load(); }, []);

  const connectDrive = async () => {
    const { url } = await fetch('/api/drive/auth-url').then(r => r.json());
    window.location.href = url;
  };
  const connectOneDrive = async () => {
    const { url } = await fetch('/api/onedrive/auth-url').then(r => r.json());
    window.location.href = url;
  };

  const saveLLMSettings = () => {
    localStorage.setItem('llmModel', llmModel);
    localStorage.setItem('systemPrompt', systemPrompt);
    localStorage.setItem('temperature', temperature.toString());
    localStorage.setItem('maxTokens', maxTokens.toString());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const resetToDefaults = () => {
    if (confirm('Reset all LLM settings to defaults?')) {
      setLlmModel('gpt-4o-mini');
      setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
      setTemperature(0.7);
      setMaxTokens(1000);
      localStorage.removeItem('llmModel');
      localStorage.removeItem('systemPrompt');
      localStorage.removeItem('temperature');
      localStorage.removeItem('maxTokens');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const improveSystemPrompt = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `I need help improving my AI system instructions. Current instructions:

${systemPrompt}

${helperInput ? `User request: ${helperInput}` : 'Please rewrite these instructions in second person imperative format (e.g., "Manage customer data" not "You manage customer data"). Make them clear, concise, and action-oriented.'}

Return ONLY the improved system instructions, nothing else. Use second person imperative format throughout.`
            }
          ]
        })
      });

      const data = await response.json();
      const improved = data.message || data.content || 'Could not generate suggestion';
      setAiSuggestion(improved);
    } catch (error) {
      console.error('Error improving prompt:', error);
      setAiSuggestion('Error generating suggestion. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const acceptSuggestion = () => {
    setSystemPrompt(aiSuggestion);
    setShowAIHelper(false);
    setAiSuggestion('');
    setHelperInput('');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, overflow: 'auto', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: 700, background: 'white', borderRadius: 12, padding: 24, maxHeight: '90vh', overflow: 'auto' }}>
        <h2 style={{ marginTop: 0, marginBottom: 24, fontSize: 24, fontWeight: 'bold', color: COLORS.navyDark }}>Settings</h2>

        {/* LLM Configuration Section */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: '600', color: COLORS.navyDark, marginBottom: 16, paddingBottom: 8, borderBottom: `2px solid ${COLORS.gold}` }}>
            🤖 AI Assistant Configuration
          </h3>

          <div style={{ display: 'grid', gap: 16 }}>
            {/* Model Selection */}
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                AI Model
              </label>
              <input
                type="text"
                value={llmModel}
                onChange={(e) => setLlmModel(e.target.value)}
                placeholder="gpt-4o-mini"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: 14,
                  border: '2px solid #E5E7EB',
                  borderRadius: 8,
                  outline: 'none',
                  fontFamily: 'monospace'
                }}
              />
              <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4, marginBottom: 0 }}>
                Enter any OpenAI model name (e.g., gpt-4o-mini, gpt-4o, gpt-4-turbo, o1-preview, o1-mini)
              </p>
            </div>

            {/* System Instructions */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 14, fontWeight: '600', color: '#374151', margin: 0 }}>
                  System Instructions
                </label>
                <button
                  onClick={() => setShowAIHelper(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    fontSize: 12,
                    fontWeight: '500',
                    border: '1px solid #D1D5DB',
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  title="Get AI help to improve your system instructions"
                >
                  <Sparkles size={14} />
                  AI Help
                </button>
              </div>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={8}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: 13,
                  border: '2px solid #E5E7EB',
                  borderRadius: 8,
                  outline: 'none',
                  fontFamily: 'monospace',
                  resize: 'vertical'
                }}
                placeholder="Enter system instructions for the AI assistant..."
              />
              <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4, marginBottom: 0 }}>
                Define the AI assistant's behavior, personality, and capabilities.
              </p>
            </div>

            {/* Temperature & Max Tokens */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                  Temperature: {temperature.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
                <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4, marginBottom: 0 }}>
                  Higher = more creative, Lower = more focused
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                  Max Tokens
                </label>
                <input
                  type="number"
                  min="100"
                  max="4000"
                  step="100"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: 14,
                    border: '2px solid #E5E7EB',
                    borderRadius: 8,
                    outline: 'none'
                  }}
                />
                <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4, marginBottom: 0 }}>
                  Maximum response length
                </p>
              </div>
            </div>

            {/* Save/Reset Buttons */}
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                onClick={saveLLMSettings}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  fontSize: 14,
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: 8,
                  background: saved ? '#10B981' : `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)`,
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {saved ? '✓ Saved!' : 'Save LLM Settings'}
              </button>
              <button
                onClick={resetToDefaults}
                style={{
                  padding: '12px 20px',
                  fontSize: 14,
                  fontWeight: '500',
                  border: '2px solid #E5E7EB',
                  borderRadius: 8,
                  background: 'white',
                  color: '#6B7280',
                  cursor: 'pointer'
                }}
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>

        {/* Integrations Section */}
        <div>
          <h3 style={{ fontSize: 18, fontWeight: '600', color: COLORS.navyDark, marginBottom: 16, paddingBottom: 8, borderBottom: `2px solid ${COLORS.gold}` }}>
            🔗 Integrations
          </h3>
          <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ padding: 12, border: '1px solid #E5E7EB', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600 }}>Google Drive</div>
                <div style={{ color: '#6B7280', fontSize: 12 }}>{drive?.connected ? 'Connected' : 'Not Connected'}</div>
              </div>
              <button onClick={connectDrive} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', background: drive?.connected ? '#E5E7EB' : '#0A2540', color: drive?.connected ? '#111827' : 'white', cursor: 'pointer' }}>{drive?.connected ? 'Reconnect' : 'Connect'}</button>
            </div>
          </div>
          <div style={{ padding: 12, border: '1px solid #E5E7EB', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600 }}>Microsoft OneDrive</div>
                <div style={{ color: '#6B7280', fontSize: 12 }}>{one?.connected ? 'Connected' : 'Not Connected'}</div>
              </div>
              <button onClick={connectOneDrive} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', background: one?.connected ? '#E5E7EB' : '#0A2540', color: one?.connected ? '#111827' : 'white', cursor: 'pointer' }}>{one?.connected ? 'Reconnect' : 'Connect'}</button>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', background: 'white', cursor: 'pointer' }}>Close</button>
        </div>
        </div>
      </div>

      {/* AI Helper Modal */}
      {showAIHelper && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
          <div style={{ width: '100%', maxWidth: 800, background: 'white', borderRadius: 12, padding: 24, maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: '600', color: COLORS.navyDark, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={20} style={{ color: COLORS.gold }} />
                AI System Instruction Helper
              </h3>
              <button
                onClick={() => { setShowAIHelper(false); setAiSuggestion(''); setHelperInput(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} color="#6B7280" />
              </button>
            </div>

            <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 16 }}>
              Get AI help to improve your system instructions. The AI will analyze what you currently have written and rewrite it in <strong>second person imperative format</strong> (e.g., "Manage customer data" not "You manage customer data").
            </p>

            {/* Preview of current instructions */}
            <div style={{ marginBottom: 16, padding: 12, background: '#F3F4F6', borderRadius: 8, border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>
                📝 Your Current Instructions ({systemPrompt.length} characters):
              </div>
              <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#374151', maxHeight: 100, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                {systemPrompt.substring(0, 300)}{systemPrompt.length > 300 ? '...' : ''}
              </div>
            </div>

            {/* Optional user input */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                What would you like to improve? (Optional)
              </label>
              <input
                type="text"
                value={helperInput}
                onChange={(e) => setHelperInput(e.target.value)}
                placeholder="e.g., Make it more concise, Add email capabilities, Focus on task management"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: 14,
                  border: '2px solid #E5E7EB',
                  borderRadius: 8,
                  outline: 'none'
                }}
              />
            </div>

            {/* Generate button */}
            <button
              onClick={improveSystemPrompt}
              disabled={isGenerating}
              style={{
                width: '100%',
                padding: '12px 20px',
                fontSize: 14,
                fontWeight: '600',
                border: 'none',
                borderRadius: 8,
                background: isGenerating ? '#9CA3AF' : `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)`,
                color: 'white',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                marginBottom: 16
              }}
            >
              {isGenerating ? 'Generating...' : '✨ Generate Improved Instructions'}
            </button>

            {/* AI Suggestion */}
            {aiSuggestion && (
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                  AI Suggestion:
                </label>
                <textarea
                  value={aiSuggestion}
                  onChange={(e) => setAiSuggestion(e.target.value)}
                  rows={12}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: 13,
                    border: '2px solid #10B981',
                    borderRadius: 8,
                    outline: 'none',
                    fontFamily: 'monospace',
                    resize: 'vertical',
                    marginBottom: 12
                  }}
                />
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={acceptSuggestion}
                    style={{
                      flex: 1,
                      padding: '12px 20px',
                      fontSize: 14,
                      fontWeight: '600',
                      border: 'none',
                      borderRadius: 8,
                      background: '#10B981',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    ✓ Accept & Use This
                  </button>
                  <button
                    onClick={() => setAiSuggestion('')}
                    style={{
                      padding: '12px 20px',
                      fontSize: 14,
                      fontWeight: '500',
                      border: '2px solid #E5E7EB',
                      borderRadius: 8,
                      background: 'white',
                      color: '#6B7280',
                      cursor: 'pointer'
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}