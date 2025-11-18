import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { COLORS, formatRelativeTime } from '../data/uiConstants';
import type { Activity } from '../types';

type NotificationsPanelProps = {
  onClose: () => void;
};

const NotificationsPanel = ({ onClose }: NotificationsPanelProps) => {
  const [notifications, setNotifications] = useState<Activity[]>([]);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await fetch('/api/activities?limit=4');
        if (!response.ok) {
          throw new Error('Unable to load notifications');
        }
        const data = await response.json();
        setNotifications(data);
      } catch (err) {
        console.error(err);
      }
    };

    loadNotifications();
  }, []);

  return (
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
        {notifications.length === 0 && (
          <div style={{ color: '#6B7280', fontSize: '14px' }}>No new notifications.</div>
        )}
        {notifications.map((notif) => (
          <div key={notif.id} style={{
            padding: '12px',
            background: '#F9FAFB',
            borderRadius: '6px',
            marginBottom: '8px',
            borderLeft: `4px solid ${COLORS.gold}`
          }}>
            <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              {notif.performedBy} logged a {notif.type.toLowerCase()} - {notif.subject}
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>{formatRelativeTime(notif.performedAt)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPanel;
