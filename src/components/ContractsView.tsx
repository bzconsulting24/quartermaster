import { useEffect, useMemo, useState } from 'react';
import { FileSignature, Search, Filter } from 'lucide-react';
import { COLORS, formatCurrency, formatDisplayDate } from '../data/uiConstants';
import type { ContractRecord, ContractStatus } from '../types';

const statuses: ContractStatus[] = ['DRAFT', 'ACTIVE', 'EXPIRED', 'CANCELLED'];

const ContractsView = () => {
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ContractStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContracts = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/contracts');
        if (!response.ok) {
          throw new Error('Unable to load contracts');
        }
        const data = await response.json();
        setContracts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadContracts();
  }, []);

  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      const matchSearch =
        contract.contractNumber.toLowerCase().includes(search.toLowerCase()) ||
        contract.account.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = status === 'all' || contract.status === status;
      return matchSearch && matchStatus;
    });
  }, [contracts, search, status]);

  return (
    <div style={{ padding: '24px', background: '#F9FAFB', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: COLORS.navyDark }}>Contracts</h1>
          <p style={{ fontSize: '14px', color: '#6B7280' }}>
            {loading ? 'Loading...' : `${filteredContracts.length} contracts`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}
              size={18}
            />
            <input
              type="text"
              placeholder="Search by contract # or account"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '260px',
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
              value={status}
              onChange={e => setStatus(e.target.value as ContractStatus | 'all')}
              style={{
                padding: '10px 16px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Status</option>
              {statuses.map(value => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}
      >
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: `2px solid ${COLORS.gold}` }}>
                {['Contract #', 'Account', 'Status', 'Start', 'End', 'Value', 'Opportunity'].map(header => (
                  <th
                    key={header}
                    style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} style={{ padding: '16px', textAlign: 'center', color: '#6B7280' }}>
                    Loading contracts...
                  </td>
                </tr>
              )}
              {!loading &&
                filteredContracts.map(contract => (
                  <tr key={contract.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '16px', fontWeight: 600, color: COLORS.navyDark }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileSignature size={16} color={COLORS.navyDark} />
                        {contract.contractNumber}
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: '#6B7280' }}>{contract.account.name}</td>
                    <td style={{ padding: '16px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          background: '#F3F4F6',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: COLORS.navyDark
                        }}
                      >
                        {contract.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: '#6B7280' }}>{formatDisplayDate(contract.startDate)}</td>
                    <td style={{ padding: '16px', color: '#6B7280' }}>
                      {contract.endDate ? formatDisplayDate(contract.endDate) : '—'}
                    </td>
                    <td style={{ padding: '16px', fontWeight: 600, color: COLORS.navyDark }}>
                      {formatCurrency(contract.value)}
                    </td>
                    <td style={{ padding: '16px', color: '#6B7280' }}>{contract.opportunity?.name ?? '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ContractsView;
