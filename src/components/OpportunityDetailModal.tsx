import { useState } from 'react';
import { X, Mail, Phone, Calendar, CheckSquare, Plus, Upload, Paperclip, Eye } from 'lucide-react';
import { COLORS, formatCurrency, formatDisplayDate, formatRelativeTime } from '../data/uiConstants';
import type { Opportunity, OpportunityModalTab } from '../types';

type OpportunityDetailModalProps = {
  opportunity: Opportunity | null;
  onClose: () => void;
};

const tabs: OpportunityModalTab[] = ['overview', 'activity', 'contacts', 'documents'];

const OpportunityDetailModal = ({ opportunity, onClose }: OpportunityDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<OpportunityModalTab>('overview');

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
              <span>{opportunity.account?.name ?? 'Unassigned'}</span>
              <span>•</span>
              <span>{formatCurrency(opportunity.amount)}</span>
              <span>•</span>
              <span>{opportunity.stage}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'white' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ borderBottom: '1px solid #E5E7EB', background: 'white', display: 'flex', padding: '0 24px' }}>
          {tabs.map(tab => (
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
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{formatCurrency(opportunity.amount)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Close Date</div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{formatDisplayDate(opportunity.closeDate)}</div>
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
                    <div style={{ fontSize: '16px', fontWeight: '600', color: COLORS.navyDark }}>{opportunity.account?.name ?? 'Unassigned'}</div>
                  </div>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: '600', marginTop: '24px', marginBottom: '16px', color: COLORS.navyDark }}>Primary Contact</h3>
                {opportunity.contact ? (
                  <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>{opportunity.contact.name}</div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#6B7280' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={14} />
                        {opportunity.contact.email}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={14} />
                        {opportunity.contact.phone ?? '—'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '8px', color: '#6B7280' }}>
                    No contact assigned to this opportunity yet.
                  </div>
                )}
              </div>

              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: COLORS.navyDark }}>Quick Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button onClick={async()=>{ await fetch('/api/activities',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'EMAIL', subject:'Email sent', description:'Outbound email to contact', performedBy:'user', opportunityId: opportunity.id })}); alert('Logged email activity'); }} style={{}}><Mail size={16} color={COLORS.navyDark} \/> Send Email
                  </button>
                  <button onClick={async()=>{ await fetch('/api/activities',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'CALL', subject:'Call logged', description:'Call with prospect', performedBy:'user', opportunityId: opportunity.id })}); alert('Logged call'); }} style={{}}><Phone size={16} color={COLORS.navyDark} \/> Log Call
                  </button>
                  <button onClick={async()=>{ await fetch('/api/activities',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'MEETING', subject:'Meeting scheduled', description:'Calendar event created', performedBy:'user', opportunityId: opportunity.id })}); alert('Meeting scheduled'); }} style={{}}><Calendar size={16} color={COLORS.navyDark} \/> Schedule Meeting
                  </button>
                  <button onClick={async()=>{ const title=prompt('Task title?'); if(!title) return; const due = new Date(Date.now()+86400000).toISOString(); await fetch('/api/tasks',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title, dueDate: due, assignedTo:'Me', opportunityId: opportunity.id })}); alert('Task created'); }} style={{}}><CheckSquare size={16} color={COLORS.navyDark} \/> Create Task
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
                <button onClick={async()=>{ const subject=prompt('Activity subject?'); if(!subject) return; await fetch('/api/activities',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ subject, description:'Quick log', performedBy:'user', opportunityId: opportunity.id })}); }} style={{}}><Plus size={16} \/> Log Activity
                </button>
                <button style={{
                  padding: '8px 16px',
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}>
                  Filter
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(opportunity.activities ?? []).map(activity => (
                  <div key={activity.id} style={{
                    padding: '16px',
                    background: '#F9FAFB',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${COLORS.gold}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: COLORS.navyDark }}>
                        {activity.performedBy}
                      </span>
                      <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{formatRelativeTime(activity.performedAt)}</span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>
                      {activity.type}: <span style={{ fontWeight: '500' }}>{activity.subject}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#9CA3AF' }}>{activity.description}</div>
                  </div>
                ))}
                {(opportunity.activities ?? []).length === 0 && (
                  <div style={{ color: '#6B7280', fontSize: '14px' }}>No activity logged yet.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'contacts' && (
            <div style={{ display: 'grid', gap: '16px' }}>
              {opportunity.contact ? (
                <div style={{
                  padding: '16px',
                  background: '#F9FAFB',
                  borderRadius: '8px',
                  border: `1px solid ${COLORS.navyLight}`
                }}>
                  <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>{opportunity.contact.name}</div>
                  <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>{opportunity.contact.title}</div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#6B7280' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={14} />
                      {opportunity.contact.email}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} />
                      {opportunity.contact.phone ?? '—'}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#6B7280', fontSize: '14px' }}>No contact linked to this opportunity.</div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
                <button style={{
                  padding: '8px 16px',
                  background: `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)`,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Upload size={16} />
                  Upload
                </button>
                <button style={{
                  padding: '8px 16px',
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}>
                  <Paperclip size={16} />
                  Attach Existing
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(opportunity.documents ?? []).map(doc => (
                  <div key={doc.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    background: '#F9FAFB',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB'
                  }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{doc.name}</div>
                      <div style={{ fontSize: '14px', color: '#6B7280' }}>
                        {doc.type} • {doc.size} • Uploaded by {doc.uploadedBy} on {formatDisplayDate(doc.uploadedAt)}
                      </div>
                    </div>
                    <button style={{
                      padding: '8px 16px',
                      border: `1px solid ${COLORS.navyLight}`,
                      borderRadius: '6px',
                      background: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Eye size={16} />
                      View
                    </button>
                  </div>
                ))}
                {(opportunity.documents ?? []).length === 0 && (
                  <div style={{ color: '#6B7280', fontSize: '14px' }}>No documents attached.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpportunityDetailModal;

