import React from 'react';
import { COLORS, stages } from '../data/mockData';

const ReportsView = () => (
  <div style={{ padding: '24px' }}>
    <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: COLORS.navyDark, marginBottom: '24px' }}>Reports & Analytics</h1>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
      {[
        { label: 'Total Pipeline', value: '$205K', change: '+15%' },
        { label: 'Won This Month', value: '$40K', change: '+22%' },
        { label: 'Win Rate', value: '67%', change: '+5%' },
        { label: 'Avg Deal Size', value: '$41K', change: '+8%' },
      ].map((stat, idx) => (
        <div key={idx} style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: `2px solid ${COLORS.gold}`
        }}>
          <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>{stat.label}</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: COLORS.navyDark, marginBottom: '4px' }}>{stat.value}</div>
          <div style={{ fontSize: '14px', color: '#10B981' }}>{stat.change} from last month</div>
        </div>
      ))}
    </div>

    <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: COLORS.navyDark }}>Sales Funnel</h3>
      {stages.slice(0, -1).map((stage, idx) => {
        const percentage = [100, 60, 40, 30, 20][idx];
        return (
          <div key={stage.id} style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
              <span style={{ fontWeight: '500' }}>{stage.name}</span>
              <span style={{ color: '#6B7280' }}>{percentage}%</span>
            </div>
            <div style={{ height: '24px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${percentage}%`,
                background: `linear-gradient(90deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                transition: 'width 0.3s'
              }}></div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default ReportsView;
