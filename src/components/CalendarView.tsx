import React from 'react';
import { Calendar } from 'lucide-react';
import { COLORS } from '../data/mockData';

const CalendarView = () => (
  <div style={{ padding: '24px' }}>
    <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: COLORS.navyDark, marginBottom: '24px' }}>Calendar</h1>
    <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Upcoming Events</div>
      {[
        { title: 'Client Meeting - Acme Corp', time: 'Today at 2:00 PM', type: 'meeting' },
        { title: 'Product Demo - TechStart', time: 'Tomorrow at 10:00 AM', type: 'demo' },
        { title: 'Follow-up Call - BuildCo', time: 'Feb 12 at 3:00 PM', type: 'call' },
      ].map((event, idx) => (
        <div key={idx} style={{
          padding: '16px',
          background: '#F9FAFB',
          borderRadius: '8px',
          marginBottom: '12px',
          borderLeft: `4px solid ${COLORS.gold}`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Calendar size={20} color={COLORS.navyDark} />
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{event.title}</div>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>{event.time}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default CalendarView;
