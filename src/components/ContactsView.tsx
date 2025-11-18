import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Mail, Phone, Building2, User } from 'lucide-react';
import { COLORS, formatDisplayDate } from '../data/uiConstants';
import type { ContactRecord } from '../types';

const ContactsView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContacts = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/contacts');
        if (!response.ok) {
          throw new Error('Unable to load contacts');
        }
        const data = await response.json();
        setContacts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, []);

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.account?.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.title ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [contacts, searchTerm]);

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
            Contacts
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280' }}>
            {loading ? 'Loading...' : `${filteredContacts.length} contacts`}
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
                {['Contact Name', 'Title', 'Account', 'Contact Info', 'Last Contact', 'Owner'].map((header) => (
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
                    Loading contacts...
                  </td>
                </tr>
              )}
              {!loading && filteredContacts.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: '#6B7280' }}>
                    No contacts match your filters.
                  </td>
                </tr>
              )}
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
                  <td style={{ padding: '16px', color: '#6B7280' }}>{contact.title ?? '—'}</td>
                  <td style={{ padding: '16px', color: '#6B7280' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building2 size={16} color="#6B7280" />
                      {contact.account?.name ?? 'N/A'}
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: '#6B7280' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={14} />
                        {contact.email}
                      </div>
                      {contact.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={14} />
                          {contact.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: '#6B7280' }}>
                    {contact.lastContact ? formatDisplayDate(contact.lastContact) : '—'}
                  </td>
                  <td style={{ padding: '16px', color: '#6B7280' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={14} />
                      {contact.owner ?? 'Unassigned'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ContactsView;
