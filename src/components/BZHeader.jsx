import React from 'react';
import { Search, Bell, HelpCircle, Settings } from 'lucide-react';
import { COLORS } from '../data/mockData';

const BZHeader = ({ currentUser, notifications, setShowNotifications }) => (
  <div style={{
    background: COLORS.navyDark,
    borderBottom: `1px solid ${COLORS.navyLight}`,
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: 1 }}>
      <div style={{
        width: '36px',
        height: '36px',
        border: `2px solid ${COLORS.gold}`,
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        fontWeight: 'bold',
        color: COLORS.gold,
        cursor: 'pointer'
      }}>
        BZ
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>Quartermaster</span>
      </div>

      <div style={{ flex: 1, maxWidth: '600px', minWidth: '150px', position: 'relative' }}>
        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', width: '16px', height: '16px' }} />
        <input
          type="text"
          placeholder="Search..."
          style={{
            width: '100%',
            padding: '8px 16px 8px 40px',
            background: COLORS.navyLight,
            border: `1px solid ${COLORS.navyLight}`,
            borderRadius: '4px',
            color: 'white',
            fontSize: '14px'
          }}
        />
      </div>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <button
        onClick={() => setShowNotifications(true)}
        style={{ background: 'transparent', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', position: 'relative' }}
      >
        <Bell size={20} color="white" />
        {notifications > 0 && (
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '18px',
            height: '18px',
            background: COLORS.gold,
            borderRadius: '50%',
            fontSize: '10px',
            fontWeight: 'bold',
            color: COLORS.navyDark,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>{notifications}</span>
        )}
      </button>
      <button style={{ background: 'transparent', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}>
        <HelpCircle size={20} color="white" />
      </button>
      <button style={{ background: 'transparent', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}>
        <Settings size={20} color="white" />
      </button>
      <div style={{
        width: '32px',
        height: '32px',
        background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: COLORS.navyDark,
        fontSize: '14px',
        fontWeight: 'bold',
        marginLeft: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        cursor: 'pointer'
      }}>
        {currentUser.initials}
      </div>
    </div>
  </div>
);

export default BZHeader;
