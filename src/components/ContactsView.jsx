import React, { useState } from 'react';
import { Plus, Search, Filter, Mail, Phone, Building2, User } from 'lucide-react';
import { COLORS, mockContacts } from '../data/mockData';

const ContactsView = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContacts = mockContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            Contacts
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280' }}>
            {filteredContacts.length} contacts
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
          New Contact
        </button>
      </div>

      {/* Search */}
      <div style={{
        background: 'white',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ position: 'relative' }}>
          <Search style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9CA3AF'
          }} size={18} />
          <input
            type="text"
            placeholder="Search contacts by name, title, or account..."
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
      </div>

      {/* Contacts Table */}
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
                Contact Name
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
                Title
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
                Account
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
                Contact Info
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
                Last Contact
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
                Owner
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredContacts.map((contact) => (
              <tr
                key={contact.id}
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
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      {contact.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: COLORS.navyDark
                      }}>
                        {contact.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ fontSize: '14px', color: '#374151' }}>
                    {contact.title}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={16} color="#9CA3AF" />
                    <span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                      {contact.account}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={14} color="#9CA3AF" />
                      <a href={`mailto:${contact.email}`} style={{
                        fontSize: '13px',
                        color: COLORS.gold,
                        textDecoration: 'none'
                      }}>
                        {contact.email}
                      </a>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} color="#9CA3AF" />
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>
                        {contact.phone}
                      </span>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ fontSize: '14px', color: '#6B7280' }}>
                    {contact.lastContact}
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
                      {contact.owner.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span style={{ fontSize: '14px', color: '#374151' }}>
                      {contact.owner}
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

export default ContactsView;
