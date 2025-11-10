import React, { useState } from 'react';
import { Plus, Search, Filter, Building2, Mail, Phone, Globe } from 'lucide-react';
import { COLORS, mockAccounts } from '../data/mockData';

const AccountsView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredAccounts = mockAccounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.industry.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || account.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div style={{ padding: '24px', background: '#F9FAFB', minHeight: '100%' }}>
      {/* Header */}
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
            {filteredAccounts.length} accounts
          </p>
        </div>
        <button style={{
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
        }}>
          <Plus size={16} />
          New Account
        </button>
      </div>

      {/* Search and Filters */}
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
            onChange={(e) => setFilterType(e.target.value)}
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

      {/* Accounts Table */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: `2px solid ${COLORS.gold}` }}>
              <th style={{
                padding: '16px',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Account Name
              </th>
              <th style={{
                padding: '16px',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Industry
              </th>
              <th style={{
                padding: '16px',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Type
              </th>
              <th style={{
                padding: '16px',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Revenue
              </th>
              <th style={{
                padding: '16px',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Location
              </th>
              <th style={{
                padding: '16px',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Account Owner
              </th>
            </tr>
          </thead>
          <tbody>
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
                      background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Building2 size={20} color={COLORS.navyDark} />
                    </div>
                    <div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: COLORS.navyDark,
                        marginBottom: '2px'
                      }}>
                        {account.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#9CA3AF',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Globe size={12} />
                        {account.website}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ fontSize: '14px', color: '#374151' }}>
                    {account.industry}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: account.type === 'Enterprise' ? '#DBEAFE' :
                               account.type === 'Mid-Market' ? '#FEF3C7' : '#E0E7FF',
                    color: account.type === 'Enterprise' ? '#1E40AF' :
                           account.type === 'Mid-Market' ? '#92400E' : '#4C1D95'
                  }}>
                    {account.type}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    {account.revenue}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ fontSize: '14px', color: '#6B7280' }}>
                    {account.location}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: COLORS.navyDark
                    }}>
                      {account.owner.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span style={{ fontSize: '14px', color: '#374151' }}>
                      {account.owner}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AccountsView;
