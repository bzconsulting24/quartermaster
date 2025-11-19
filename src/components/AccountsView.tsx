import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Filter, Building2, Mail } from 'lucide-react';
import { COLORS, formatAccountType, formatCurrency } from '../data/uiConstants';
import type { AccountRecord } from '../types';
import AccountEditModal from './AccountEditModal';

const AccountsView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'Enterprise' | 'Mid-Market' | 'SMB'>('all');
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState<null | AccountRecord>(null);
  const [showCreate, setShowCreate] = useState(false);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/accounts');
      if (!response.ok) {
        throw new Error('Unable to load accounts');
      }
      const data = await response.json();
      setAccounts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const filteredAccounts = useMemo(() => {
    return accounts.filter(account => {
      const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (account.industry ?? '').toLowerCase().includes(searchTerm.toLowerCase());
      const humanType = formatAccountType(account.type);
      const matchesFilter = filterType === 'all' || humanType === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [accounts, searchTerm, filterType]);

  return (
    <div style={{ padding: '24px', background: '#F9FAFB', minHeight: '100%' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: COLORS.navyDark, marginBottom: '4px' }}>
            Accounts
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280' }}>
            {loading ? 'Loading...' : `${filteredAccounts.length} accounts`}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ padding: '10px 20px', background: COLORS.navyDark, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <Plus size={16} /> New Account
        </button>
      </div>

      <div style={{
        background: 'white',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9CA3AF'
          }} size={18} />
          <input
            type="text"
            placeholder="Search accounts by name or industry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            style={{
              padding: '10px 16px',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Types</option>
            <option value="Enterprise">Enterprise</option>
            <option value="Mid-Market">Mid-Market</option>
            <option value="SMB">SMB</option>
          </select>
        </div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: `2px solid ${COLORS.gold}` }}>
                {['Account Name', 'Industry', 'Type', 'Revenue', 'Location', 'Account Owner', 'Actions'].map((header) => (
                  <th key={header} style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: '#6B7280' }}>
                    Loading accounts...
                  </td>
                </tr>
              )}
              {!loading && filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: '#6B7280' }}>
                    No accounts match your filters.
                  </td>
                </tr>
              )}
              {filteredAccounts.map((account, idx) => (
                <tr
                  key={account.id}
                  style={{
                    borderBottom: '1px solid #E5E7EB',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: '#F3F4F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Building2 size={20} color={COLORS.navyDark} />
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: COLORS.navyDark }}>{account.name}</div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>
                          {account._count ? `${account._count.contacts} contacts` : account.industry}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: '#6B7280' }}>{account.industry ?? '—'}</td>
                  <td style={{ padding: '16px', color: '#6B7280' }}>{formatAccountType(account.type)}</td>
                  <td style={{ padding: '16px', color: COLORS.navyDark, fontWeight: '600' }}>{account.revenue ? formatCurrency(account.revenue) : '—'}</td>
                  <td style={{ padding: '16px', color: '#6B7280' }}>{account.location ?? '—'}</td>
                  <td style={{ padding: '16px', color: '#6B7280' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail size={16} color="#6B7280" />
                      {account.owner ?? 'Unassigned'}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <button
                      onClick={() => setShowEdit(account)}
                      style={{ padding: '6px 10px', background: '#6B7280', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showEdit && (
        <AccountEditModal
          account={showEdit}
          onClose={() => setShowEdit(null)}
          onSaved={(a) => {
            setShowEdit(null);
            setAccounts((prev) => prev.map((x) => (x.id === a.id ? a : x)));
          }}
        />
      )}
      {showCreate && (
        <AccountEditModal
          onClose={() => setShowCreate(false)}
          onSaved={(a) => {
            setShowCreate(false);
            loadAccounts();
          }}
        />
      )}
    </div>
  );
};

export default AccountsView;






