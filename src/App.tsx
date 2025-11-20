import { useCallback, useEffect, useState } from 'react';
import type { DragEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BZHeader from './components/BZHeader';
import NavigationTabs from './components/NavigationTabs';
import OpportunityDetailModal from './components/OpportunityDetailModal';
import NotificationsPanel from './components/NotificationsPanel';
import HomeView from './components/HomeView';
import AccountsView from './components/AccountsView';
import ContactsView from './components/ContactsView';
import CustomerInformationView from './components/CustomerInformationView';
import InvoicesView from './components/InvoicesView';
import TasksView from './components/TasksView';
import CalendarView from './components/CalendarView';
import ReportsView from './components/ReportsView';
import LeadsView from './components/LeadsView';
import QuotesView from './components/QuotesView';
import ContractsView from './components/ContractsView';
import BZPipeline from './components/BZPipeline';
import AssistantPanel from './components/AssistantPanel';
import AIFloatingButton from './components/AIFloatingButton';
import SettingsModal from './components/SettingsModal';
import CommandPalette from './components/CommandPalette';
import type { AppTab, Opportunity, StageId, UserSummary } from './types';

type PipelineView = 'pipeline';

// Map URL paths to tab IDs
const pathToTab: Record<string, AppTab> = {
  '/': 'home',
  '/home': 'home',
  '/opportunities': 'opportunities',
  '/accounts': 'accounts',
  '/contacts': 'contacts',
  '/customer-information': 'customerInformation',
  '/invoices': 'invoices',
  '/leads': 'leads',
  '/estimates': 'estimates',
  '/contracts': 'contracts',
  '/tasks': 'tasks',
  '/calendar': 'calendar',
  '/reports': 'reports'
};

// Map tab IDs to URL paths
const tabToPath: Record<AppTab, string> = {
  home: '/home',
  opportunities: '/opportunities',
  accounts: '/accounts',
  contacts: '/contacts',
  customerInformation: '/customer-information',
  invoices: '/invoices',
  leads: '/leads',
  estimates: '/estimates',
  contracts: '/contracts',
  tasks: '/tasks',
  calendar: '/calendar',
  reports: '/reports'
};

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState<AppTab>(pathToTab[location.pathname] || 'home');
  const [view, setView] = useState<PipelineView>('pipeline');
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [draggedItem, setDraggedItem] = useState<Opportunity | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userName, setUserName] = useState(() => localStorage.getItem('userName') || 'Deo Umali');
  const [editingName, setEditingName] = useState('');

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const currentUser: UserSummary = { name: userName, initials: getInitials(userName) };

  // Sync URL changes to tab state
  useEffect(() => {
    const newTab = pathToTab[location.pathname] || 'home';
    setCurrentTab(newTab);
  }, [location.pathname]);

  // Navigate to URL when tab changes
  const handleTabChange = useCallback((tab: AppTab) => {
    const path = tabToPath[tab];
    if (path && path !== location.pathname) {
      navigate(path);
    }
    setCurrentTab(tab);
  }, [navigate, location.pathname]);

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
    if (currentTab === 'opportunities') {
      loadOpportunities();
    }
  }, [currentTab, loadOpportunities]);

  useEffect(() => {
    const onNavigate = (e: any) => {
      const tab = e?.detail?.tab as any;
      if (tab) handleTabChange(tab);
    };
    window.addEventListener('app:navigate', onNavigate as any);
    return () => window.removeEventListener('app:navigate', onNavigate as any);
  }, [handleTabChange]);

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
      <BZHeader
        currentUser={currentUser}
        notifications={0}
        setShowNotifications={setShowNotifications}
        setShowAssistant={setShowAssistant}
        onOpenCommand={() => setCommandOpen(true)}
        focusMode={focusMode}
        onToggleFocus={() => setFocusMode(!focusMode)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenUserSettings={() => {
          setEditingName(userName);
          setShowUserModal(true);
        }}
      />
      {!focusMode && (<NavigationTabs currentTab={currentTab} setCurrentTab={handleTabChange} />)}

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
        {currentTab === 'customerInformation' && <CustomerInformationView />}
        {currentTab === 'invoices' && <InvoicesView />}
        {currentTab === 'leads' && <LeadsView />}
        {currentTab === 'estimates' && <QuotesView />}
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

      {/* AI Assistant - floating button or panel */}
      {!showAssistant && <AIFloatingButton onClick={() => setShowAssistant(true)} />}
      {showAssistant && <AssistantPanel onClose={() => setShowAssistant(false)} />}

      {commandOpen && (<CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} onNavigate={(t)=> handleTabChange(t as any)} />)}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {showUserModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            width: '450px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0A2540', marginBottom: '8px' }}>
              User Settings
            </h2>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
              Update your display name
            </p>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Your Name
              </label>
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setUserName(editingName);
                    localStorage.setItem('userName', editingName);
                    setShowUserModal(false);
                  }
                  if (e.key === 'Escape') {
                    setShowUserModal(false);
                  }
                }}
                placeholder="Enter your name"
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#D4AF37'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowUserModal(false)}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  background: 'white',
                  color: '#6B7280',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setUserName(editingName);
                  localStorage.setItem('userName', editingName);
                  setShowUserModal(false);
                }}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #0A2540 0%, #1E3A5F 100%)',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}







