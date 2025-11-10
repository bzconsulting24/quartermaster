import React, { useState } from 'react';
import { X, Mail, Phone, Calendar, CheckSquare, Plus, Upload, Paperclip, Eye } from 'lucide-react';
import { COLORS, mockActivities, mockDocuments } from '../data/mockData';

const OpportunityDetailModal = ({ opportunity, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!opportunity) return null;

  return (
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
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '1200px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)`,
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start',
          color: 'white'
        }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>{opportunity.name}</h2>
            <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
              <span>{opportunity.account}</span>
              <span>•</span>
              <span>${opportunity.amount.toLocaleString()}</span>
              <span>•</span>
              <span>{opportunity.stage}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'white' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ borderBottom: '1px solid #E5E7EB', background: 'white', display: 'flex', padding: '0 24px' }}>
          {['overview', 'activity', 'contacts', 'documents'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '500',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === tab ? `2px solid ${COLORS.gold}` : '2px solid transparent',
                color: activeTab === tab ? COLORS.navyDark : '#6B7280',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: COLORS.navyDark }}>Opportunity Details</h3>
                <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Amount</div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>${opportunity.amount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Close Date</div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{opportunity.closeDate}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Stage</div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{opportunity.stage}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Probability</div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{opportunity.probability}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Owner</div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{opportunity.owner}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Account</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: COLORS.navyDark }}>{opportunity.account}</div>
                  </div>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: '600', marginTop: '24px', marginBottom: '16px', color: COLORS.navyDark }}>Primary Contact</h3>
                <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>{opportunity.contact}</div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#6B7280' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={14} />
                      {opportunity.email}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} />
                      {opportunity.phone}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: COLORS.navyDark }}>Quick Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button style={{
                    padding: '12px',
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    <Mail size={16} color={COLORS.navyDark} />
                    Send Email
                  </button>
                  <button style={{
                    padding: '12px',
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    <Phone size={16} color={COLORS.navyDark} />
                    Log Call
                  </button>
                  <button style={{
                    padding: '12px',
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    <Calendar size={16} color={COLORS.navyDark} />
                    Schedule Meeting
                  </button>
                  <button style={{
                    padding: '12px',
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    <CheckSquare size={16} color={COLORS.navyDark} />
                    Create Task
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
                <button style={{
                  padding: '8px 16px',
                  background: `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)`,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  <Plus size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Log Activity
                </button>
              </div>
              {mockActivities.map(activity => (
                <div key={activity.id} style={{
                  padding: '16px',
                  background: '#F9FAFB',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  borderLeft: `4px solid ${COLORS.gold}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: COLORS.navyDark }}>
                      {activity.user} {activity.action}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>{activity.time}</div>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>{activity.subject}</div>
                  <div style={{ fontSize: '14px', color: '#6B7280' }}>{activity.description}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'contacts' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <button style={{
                  padding: '8px 16px',
                  background: `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)`,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  <Plus size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Add Contact
                </button>
              </div>
              <div style={{ background: '#F9FAFB', padding: '20px', borderRadius: '8px' }}>
                <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>{opportunity.contact}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#6B7280' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={16} />
                    <a href={`mailto:${opportunity.email}`} style={{ color: COLORS.navyDark }}>{opportunity.email}</a>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={16} />
                    <a href={`tel:${opportunity.phone}`} style={{ color: COLORS.navyDark }}>{opportunity.phone}</a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <button style={{
                  padding: '8px 16px',
                  background: `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)`,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  <Upload size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Upload Document
                </button>
              </div>
              {mockDocuments.map(doc => (
                <div key={doc.id} style={{
                  padding: '16px',
                  background: '#F9FAFB',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Paperclip size={20} color={COLORS.navyDark} />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: COLORS.navyDark }}>{doc.name}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        {doc.size} • Uploaded by {doc.uploadedBy} • {doc.uploadedAt}
                      </div>
                    </div>
                  </div>
                  <button style={{
                    padding: '6px 12px',
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px'
                  }}>
                    <Eye size={14} />
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpportunityDetailModal;
