import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Filter, PlusCircle, Mail, PhoneCall, Star } from 'lucide-react';
import { COLORS, formatDisplayDate } from '../data/uiConstants';
import LeadEditModal from './LeadEditModal';
import type { LeadRecord, LeadStatus } from '../types';

const statuses: LeadStatus[] = ['NEW', 'WORKING', 'NURTURING', 'QUALIFIED', 'DISQUALIFIED'];

const LeadsView = () => {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<{ mode: 'create' | 'edit'; lead?: LeadRecord } | null>(null);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/leads');
      if (!response.ok) {
        throw new Error('Unable to load leads');
      }
      const data = await response.json();
      setLeads(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch =
        lead.name.toLowerCase().includes(search.toLowerCase()) ||
        (lead.company ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, search, statusFilter]);

  return (
    <div style={{ padding: '24px', background: '#F9FAFB', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: COLORS.navyDark, marginBottom: '4px' }}>Leads</h1>
          <p style={{ fontSize: '14px', color: '#6B7280' }}>{loading ? 'Loading...' : `${filteredLeads.length} leads`}</p>
        </div>
        <button
          onClick={() => setModalState({ mode: 'create' })}
          style={{
            padding: '10px 20px',
            background: `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)`,
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <PlusCircle size={18} />
          New Lead
        </button>
      </div>

      <div
        style={{
          background: 'white',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}
      >
        <div style={{ flex: 1, position: 'relative' }}>
          <Search
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}
            size={18}
          />
          <input
            type="text"
            placeholder="Search leads by name or company..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 10px 10px 40px',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Filter size={18} color="#6B7280" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as LeadStatus | 'all')}
            style={{
              padding: '10px 16px',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Statuses</option>
            {statuses.map(status => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px'
        }}
      >
        {loading &&
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} style={{ background: 'white', borderRadius: '8px', padding: '20px', minHeight: '180px' }} />
          ))}

        {!loading && filteredLeads.length === 0 && (
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '24px',
              color: '#6B7280',
              gridColumn: '1 / -1'
            }}
          >
            No leads match your filters.
          </div>
        )}

        {filteredLeads.map(lead => (
          <div
            key={lead.id}
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: `1px solid ${COLORS.navyLight}10`,
              cursor: 'pointer'
            }}
            onClick={() => setModalState({ mode: 'edit', lead })}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: COLORS.navyDark }}>{lead.name}</div>
                <div style={{ fontSize: '13px', color: '#6B7280' }}>{lead.company ?? 'Unassigned company'}</div>
              </div>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: '#F3F4F6',
                  color: COLORS.navyDark
                }}
              >
                {lead.status}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>
              {lead.email && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={14} />
                  {lead.email}
                </span>
              )}
              {lead.phone && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <PhoneCall size={14} />
                  {lead.phone}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6B7280' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Star size={14} />
                Score: {lead.score ?? '—'}
              </div>
              <div>Updated {lead.updatedAt ? formatDisplayDate(lead.updatedAt) : 'recently'}</div>
            </div>
          </div>
        ))}
      </div>
      {modalState && (
        <LeadEditModal
          lead={modalState.mode === 'edit' ? modalState.lead : undefined}
          onClose={() => setModalState(null)}
          onSaved={() => {
            setModalState(null);
            void loadLeads();
          }}
        />
      )}
    </div>
  );
};

export default LeadsView;
