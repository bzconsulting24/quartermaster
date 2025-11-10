import React from 'react';
import { TrendingUp, DollarSign, Users, Briefcase, Calendar, CheckSquare } from 'lucide-react';
import { COLORS, mockActivities } from '../data/mockData';

const HomeView = () => {
  const stats = [
    { label: 'Total Revenue', value: '$205K', change: '+15%', icon: DollarSign, color: COLORS.gold },
    { label: 'Active Deals', value: '24', change: '+3', icon: Briefcase, color: '#60A5FA' },
    { label: 'New Contacts', value: '48', change: '+12', icon: Users, color: '#10B981' },
    { label: 'Tasks Due', value: '8', change: '-2', icon: CheckSquare, color: '#F59E0B' },
  ];

  return (
    <div style={{ padding: '24px', background: '#F9FAFB', minHeight: '100%' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: COLORS.navyDark, marginBottom: '8px' }}>
          Good morning, John
        </h1>
        <p style={{ fontSize: '16px', color: '#6B7280' }}>
          Here's what's happening with your sales today
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: `1px solid #E5E7EB`,
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: COLORS.navyDark, marginBottom: '4px' }}>
                    {stat.value}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: stat.change.startsWith('+') ? '#10B981' : '#EF4444',
                    fontWeight: '500'
                  }}>
                    {stat.change} from last week
                  </div>
                </div>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  background: `${stat.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={24} color={stat.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px'
      }}>
        {/* Recent Activity */}
        <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: `2px solid ${COLORS.gold}`
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: COLORS.navyDark }}>
              Recent Activity
            </h2>
            <a href="#" style={{ fontSize: '14px', color: COLORS.gold, textDecoration: 'none', fontWeight: '500' }}>
              View All
            </a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mockActivities.map((activity) => (
              <div
                key={activity.id}
                style={{
                  padding: '16px',
                  background: '#F9FAFB',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${COLORS.gold}`,
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#F9FAFB'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: COLORS.navyDark }}>
                    {activity.user}
                  </span>
                  <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{activity.time}</span>
                </div>
                <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>
                  {activity.action}: <span style={{ fontWeight: '500' }}>{activity.subject}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#9CA3AF' }}>{activity.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions & Upcoming */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Quick Actions */}
          <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: COLORS.navyDark,
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: `2px solid ${COLORS.gold}`
            }}>
              Quick Actions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'New Opportunity', icon: Briefcase },
                { label: 'Add Contact', icon: Users },
                { label: 'Schedule Meeting', icon: Calendar },
                { label: 'Create Task', icon: CheckSquare },
              ].map((action, idx) => {
                const Icon = action.icon;
                return (
                  <button
                    key={idx}
                    style={{
                      padding: '12px 16px',
                      background: 'white',
                      border: `2px solid ${COLORS.gold}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: COLORS.navyDark,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)`;
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.color = COLORS.navyDark;
                    }}
                  >
                    <Icon size={18} />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upcoming Events */}
          <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: COLORS.navyDark,
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: `2px solid ${COLORS.gold}`
            }}>
              Today's Agenda
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { time: '10:00 AM', title: 'Team Standup' },
                { time: '2:00 PM', title: 'Client Demo - Acme' },
                { time: '4:30 PM', title: 'Contract Review' },
              ].map((event, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    background: '#F9FAFB',
                    borderRadius: '6px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center'
                  }}
                >
                  <div style={{
                    width: '4px',
                    height: '40px',
                    background: COLORS.gold,
                    borderRadius: '2px'
                  }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>
                      {event.time}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: COLORS.navyDark }}>
                      {event.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
