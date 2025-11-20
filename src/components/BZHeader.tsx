import { useState, useRef, useEffect } from 'react';
import type { UserSummary } from '../types';
import { COLORS } from '../data/uiConstants';
import { Search, Bell, Bot, Settings, User, LogOut } from 'lucide-react';

type BZHeaderProps = {
  currentUser?: UserSummary;
  notifications?: number;
  setShowNotifications?: (show: boolean) => void;
  setShowAssistant?: (show: boolean) => void;
  onOpenCommand?: () => void;
  focusMode?: boolean;
  onToggleFocus?: () => void;
  onOpenSettings?: () => void;
  onOpenUserSettings?: () => void;
};

const BZHeader = ({ currentUser = { name: 'User', initials: 'U' }, notifications = 0, setShowNotifications, setShowAssistant, onOpenCommand, focusMode = false, onToggleFocus, onOpenSettings, onOpenUserSettings }: BZHeaderProps) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserDropdown]);

  return (
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
          placeholder="Type to search  •  Ctrl+K"
          onFocus={() => onOpenCommand && onOpenCommand()}
          onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); onOpenCommand && onOpenCommand(); } }}
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
      <button onClick={() => onOpenCommand && onOpenCommand()} style={{ background: 'transparent', border: '1px solid #374151', color: '#E5E7EB', padding: '6px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Ctrl+K</button>
      <button onClick={() => onToggleFocus && onToggleFocus()} style={{ background: focusMode ? '#10B981' : 'transparent', border: '1px solid #374151', color: focusMode ? '#06251c' : '#E5E7EB', padding: '6px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>{focusMode ? 'Focus: On' : 'Focus: Off'}</button>
      <button
        onClick={() => setShowNotifications && setShowNotifications(true)}
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
      <button
        onClick={() => setShowAssistant && setShowAssistant(true)}
        style={{ background: 'transparent', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}
      >
        <Bot size={20} color="white" />
      </button>
      <button onClick={() => onOpenSettings && onOpenSettings()} style={{ background: 'transparent', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}>
        <Settings size={20} color="white" />
      </button>

      {/* User Profile Dropdown */}
      <div ref={dropdownRef} style={{ position: 'relative', marginLeft: '12px' }}>
        <div
          onClick={() => setShowUserDropdown(!showUserDropdown)}
          style={{
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
            boxShadow: showUserDropdown ? '0 0 0 3px rgba(212, 175, 55, 0.3)' : '0 2px 4px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!showUserDropdown) {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!showUserDropdown) {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
            }
          }}
        >
          {currentUser.initials}
        </div>

        {showUserDropdown && (
          <div style={{
            position: 'absolute',
            top: '45px',
            right: '0',
            width: '240px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            zIndex: 10000
          }}>
            {/* User Info Header */}
            <div style={{
              padding: '16px',
              background: `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)`,
              borderBottom: '1px solid #E5E7EB'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: COLORS.navyDark,
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  {currentUser.initials}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>
                    {currentUser.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#D1D5DB' }}>
                    Administrator
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div style={{ padding: '4px 0' }}>
              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  onOpenUserSettings && onOpenUserSettings();
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#374151',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <User size={16} color="#6B7280" />
                <span>Edit Profile</span>
              </button>

              <div style={{
                height: '1px',
                background: '#E5E7EB',
                margin: '4px 0'
              }} />

              <button
                onClick={() => {
                  // Add logout functionality here if needed
                  console.log('Logout clicked');
                  setShowUserDropdown(false);
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#EF4444',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#FEF2F2'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut size={16} color="#EF4444" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
};

export default BZHeader;