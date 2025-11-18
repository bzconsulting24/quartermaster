import { useCallback, useEffect, useState } from 'react';
import type { DragEvent } from 'react';
import BZHeader from './components/BZHeader';
import NavigationTabs from './components/NavigationTabs';
import OpportunityDetailModal from './components/OpportunityDetailModal';
import NotificationsPanel from './components/NotificationsPanel';
import HomeView from './components/HomeView';
import AccountsView from './components/AccountsView';
import ContactsView from './components/ContactsView';
import InvoicesView from './components/InvoicesView';
import TasksView from './components/TasksView';
import CalendarView from './components/CalendarView';
import ReportsView from './components/ReportsView';
import LeadsView from './components/LeadsView';
import QuotesView from './components/QuotesView';
import ContractsView from './components/ContractsView';
import BZPipeline from './components/BZPipeline';
import AssistantPanel from './components/AssistantPanel';
import CommandPalette from './components/CommandPalette';
import type { AppTab, Opportunity, StageId, UserSummary } from './types';

type PipelineView = 'pipeline';

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>('home');
  const [view, setView] = useState<PipelineView>('pipeline');
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [draggedItem, setDraggedItem] = useState<Opportunity | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [focusMode, setFocusMode] = useState<boolean>(() => localStorage.getItem('focusMode') === '1');

  const currentUser: UserSummary = { name: 'Deo Umali', initials: 'DU' };

  const loadOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/opportunities');
      if (!response.ok) {
        throw new Error('Unable to load opportunities');
      }
      const data = (await response.json()) as Opportunity[];
      setOpportunities(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOpportunities();
  }, [loadOpportunities]);

  useEffect(() => {
    const source = new EventSource('/api/events');
    const refresh = () => loadOpportunities();
    source.addEventListener('opportunity.created', refresh);
    source.addEventListener('opportunity.stageChanged', refresh);
    return () => {
      source.removeEventListener('opportunity.created', refresh);
      source.removeEventListener('opportunity.stageChanged', refresh);
      source.close();
    };
  }, [loadOpportunities]);

  const handleDragStart = (_event: DragEvent<HTMLDivElement>, opportunity: Opportunity) => {
    setDraggedItem(opportunity);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>, newStage: StageId) => {
    event.preventDefault();
    if (!draggedItem) return;

    try {
      const response = await fetch(`/api/opportunities/${draggedItem.id}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage })
      });

      if (!response.ok) {
        throw new Error('Unable to update opportunity stage');
      }

      setOpportunities((prev) => {
        const next = prev.map(opp =>
          opp.id === draggedItem.id ? { ...opp, stage: newStage } : opp
        );
        setSelectedOpportunity((current) => {
          if (!current || current.id !== draggedItem.id) {
            return current;
          }
          return next.find(opp => opp.id === draggedItem.id) ?? current;
        });
        return next;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update stage';
      setError(message);
    }
    setDraggedItem(null);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F9FAFB' }}>
      <BZHeader currentUser={currentUser} notifications={3} setShowNotifications={setShowNotifications} setShowAssistant={setShowAssistant} onOpenCommand={() => setCommandOpen(true)} focusMode={focusMode} onToggleFocus={() => { const next = !focusMode; setFocusMode(next); localStorage.setItem('focusMode', next ? '1' : '0'); }} />
      {!focusMode && (<NavigationTabs currentTab={currentTab} setCurrentTab={setCurrentTab} />)}

      <div style={{ flex: 1, overflow: 'auto' }}>
        {error && (
          <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '12px 16px', margin: '16px', borderRadius: '8px', border: '1px solid #FECACA' }}>
            {error}
          </div>
        )}
        {currentTab === 'home' && <HomeView />}

        {currentTab === 'opportunities' && (
          <>
            <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '8px 16px', display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setView('pipeline')}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  background: view === 'pipeline' ? '#0A2540' : 'white',
                  color: view === 'pipeline' ? 'white' : '#6B7280',
                  boxShadow: view === 'pipeline' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Pipeline
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '24px', color: '#6B7280' }}>Loading opportunities...</div>
            ) : (
              <BZPipeline
                opportunities={opportunities}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onOpportunityClick={(opportunity) => setSelectedOpportunity(opportunity)}
              />
            )}
          </>
        )}

        {currentTab === 'accounts' && <AccountsView />}
        {currentTab === 'contacts' && <ContactsView />}
        {currentTab === 'invoices' && <InvoicesView />}
        {currentTab === 'leads' && <LeadsView />}
        {currentTab === 'quotes' && <QuotesView />}
        {currentTab === 'contracts' && <ContractsView />}
        {currentTab === 'tasks' && <TasksView />}
        {currentTab === 'calendar' && <CalendarView />}
        {currentTab === 'reports' && <ReportsView />}
      </div>

      {selectedOpportunity && (
        <OpportunityDetailModal
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
        />
      )}

      {showNotifications && (
        <NotificationsPanel onClose={() => setShowNotifications(false)} />
      )}
      {showAssistant && <AssistantPanel onClose={() => setShowAssistant(false)} />}
      {commandOpen && (<CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} onNavigate={(t)=> setCurrentTab(t as any)} />)}
    </div>
  );
}


