import React from 'react';
import { X } from 'lucide-react';
import { COLORS } from '../data/mockData';

const NotificationsPanel = ({ onClose }) => (
  <div style={{
    position: 'fixed',
    top: 0,
    right: 0,
    width: '400px',
    height: '100vh',
    background: 'white',
    boxShadow: '-4px 0 20px rgba(0,0,0,0.2)',
    zIndex: 1001,
    display: 'flex',
    flexDirection: 'column'
  }}>
    <div style={{
      padding: '20px',
      borderBottom: '1px solid #E5E7EB',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)`,
      color: 'white'
    }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Notifications</h3>
      <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'white' }}>
        <X size={20} />
      </button>
    </div>
    <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
      {[
        { type: 'task', message: 'Task \"Follow up with Acme\" is overdue', time: '10 min ago' },
        { type: 'opportunity', message: 'Opportunity \"DataFlow\" moved to Negotiation', time: '1 hour ago' },
        { type: 'meeting', message: 'Meeting with BuildCo starts in 30 minutes', time: '2 hours ago' },
        { type: 'email', message: 'New email from john@acme.com', time: '3 hours ago' },
      ].map((notif, idx) => (
        <div key={idx} style={{
          padding: '12px',
          background: '#F9FAFB',
          borderRadius: '6px',
          marginBottom: '8px',
          borderLeft: `4px solid ${COLORS.gold}`
        }}>
          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>{notif.message}</div>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>{notif.time}</div>
        </div>
      ))}
    </div>
  </div>
);

export default NotificationsPanel;
