import React, { useState } from 'react';
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
import BZPipeline from './components/BZPipeline';
import { COLORS, mockOpportunities } from './data/mockData';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [view, setView] = useState('pipeline');
  const [opportunities, setOpportunities] = useState(mockOpportunities);
  const [draggedItem, setDraggedItem] = useState(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const currentUser = { name: 'Deo Umali', initials: 'DU' };

  const handleDragStart = (e, opportunity) => {
    setDraggedItem(opportunity);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, newStage) => {
    e.preventDefault();
    if (draggedItem) {
      setOpportunities(opportunities.map(opp =>
        opp.id === draggedItem.id ? { ...opp, stage: newStage } : opp
      ));
      setDraggedItem(null);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F9FAFB' }}>
      <BZHeader currentUser={currentUser} notifications={3} setShowNotifications={setShowNotifications} />
      <NavigationTabs currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <div style={{ flex: 1, overflow: 'auto' }}>
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
                  background: view === 'pipeline' ? `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)` : 'white',
                  color: view === 'pipeline' ? 'white' : '#6B7280',
                  boxShadow: view === 'pipeline' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Pipeline
              </button>
            </div>

            <BZPipeline
              opportunities={opportunities}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onOpportunityClick={setSelectedOpportunity}
            />
          </>
        )}

        {currentTab === 'accounts' && <AccountsView />}
        {currentTab === 'contacts' && <ContactsView />}
        {currentTab === 'invoices' && <InvoicesView />}
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
    </div>
  );
}
