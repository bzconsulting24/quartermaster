import { useEffect, useMemo, useState } from 'react';
import { Building2, Mail, Phone, Search, UserCircle2, Users } from 'lucide-react';
import type { AccountRecord, ContactRecord } from '../types';
import { COLORS, formatCurrency } from '../data/uiConstants';

const CustomerInformationView = () => {
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(true);

  useEffect(() => {
    const loadAccounts = async () => {
      setLoadingAccounts(true);
      try {
        const response = await fetch('/api/accounts');
        if (!response.ok) {
          throw new Error('Unable to load accounts');
        }
        const data = await response.json();
        setAccounts(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingAccounts(false);
      }
    };

    void loadAccounts();
  }, []);

  useEffect(() => {
    const loadContacts = async () => {
      setLoadingContacts(true);
      try {
        const response = await fetch('/api/contacts');
        if (!response.ok) {
          throw new Error('Unable to load contacts');
        }
        const data = await response.json();
        setContacts(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingContacts(false);
      }
    };

    void loadContacts();
  }, []);

  const loading = loadingAccounts || loadingContacts;

  const accountContactsMap = useMemo(() => {
    const map = new Map<number, ContactRecord[]>();
    contacts.forEach((contact) => {
      const accountId = contact.account?.id;
      if (!accountId) return;
      const list = map.get(accountId) ?? [];
      list.push(contact);
      map.set(accountId, list);
    });
    return map;
  }, [contacts]);

  const filteredAccounts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return accounts;

    return accounts.filter((account) => {
      const inAccount =
        account.name.toLowerCase().includes(query) ||
        (account.industry ?? '').toLowerCase().includes(query) ||
        (account.owner ?? '').toLowerCase().includes(query);

      const relatedContacts = accountContactsMap.get(account.id) ?? [];
      const inContact = relatedContacts.some(
        (contact) =>
          contact.name.toLowerCase().includes(query) ||
          (contact.title ?? '').toLowerCase().includes(query) ||
          (contact.email ?? '').toLowerCase().includes(query)
      );

      return inAccount || inContact;
    });
  }, [accounts, accountContactsMap, searchTerm]);

  const totalCustomers = accounts.length;
  const totalContacts = contacts.length;
  const averageContacts = totalCustomers === 0 ? 0 : totalContacts / totalCustomers;

  const topIndustry = useMemo(() => {
    if (!accounts.length) return '—';
    const counts = accounts.reduce<Record<string, number>>((acc, account) => {
      if (!account.industry) return acc;
      const key = account.industry;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const [industry] =
      Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? [];
    return industry ?? '—';
  }, [accounts]);

  const highlightedAccounts = useMemo(
    () =>
      filteredAccounts.map((account) => {
        const contactList = accountContactsMap.get(account.id) ?? [];
        return {
          account,
          primaryContact: contactList[0],
          contactCount: contactList.length
        };
      }),
    [filteredAccounts, accountContactsMap]
  );

  return (
    <div style={{ padding: '24px', background: '#F9FAFB', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: COLORS.navyDark, marginBottom: '4px' }}>
            Customer Information
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280' }}>
            {loading ? 'Loading customer records...' : `${filteredAccounts.length} customers with ${totalContacts} contacts`}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Customers', value: loading ? '—' : totalCustomers.toString(), icon: Users },
          { label: 'Total Contacts', value: loading ? '—' : totalContacts.toString(), icon: UserCircle2 },
          {
            label: 'Avg Contacts / Customer',
            value: loading ? '—' : averageContacts.toFixed(1),
            icon: Building2
          },
          { label: 'Top Industry', value: loading ? '—' : topIndustry, icon: Building2 }
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              style={{
                background: 'white',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={COLORS.navyDark} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: COLORS.navyDark }}>{card.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background: 'white', padding: '16px', borderRadius: '8px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} size={18} />
          <input
            type="text"
            placeholder="Search by customer, owner, industry, or contact info..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            style={{ width: '100%', padding: '10px 10px 10px 40px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
          />
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: `2px solid ${COLORS.gold}` }}>
                {['Customer', 'Industry', 'Owner', 'Revenue', 'Primary Contact', 'Contact Info', 'Contacts'].map((header) => (
                  <th
                    key={header}
                    style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '600',
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
                    Loading customer information...
                  </td>
                </tr>
              )}
              {!loading && highlightedAccounts.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '16px', textAlign: 'center', color: '#6B7280' }}>
                    No customers match your filters.
                  </td>
                </tr>
              )}
              {!loading &&
                highlightedAccounts.map(({ account, primaryContact, contactCount }) => (
                  <tr
                    key={account.id}
                    style={{ borderBottom: '1px solid #E5E7EB', transition: 'background 0.2s' }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.background = '#F9FAFB';
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.background = 'white';
                    }}
                  >
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Building2 size={20} color={COLORS.navyDark} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: COLORS.navyDark }}>{account.name}</div>
                          <div style={{ fontSize: 12, color: '#6B7280' }}>
                            {contactCount ? `${contactCount} contact${contactCount > 1 ? 's' : ''}` : 'No linked contacts'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: '#6B7280' }}>{account.industry ?? '—'}</td>
                    <td style={{ padding: '16px', color: '#6B7280' }}>{account.owner ?? 'Unassigned'}</td>
                    <td style={{ padding: '16px', color: COLORS.navyDark, fontWeight: 600 }}>
                      {account.revenue ? formatCurrency(account.revenue) : '—'}
                    </td>
                    <td style={{ padding: '16px', color: COLORS.navyDark }}>
                      {primaryContact ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{primaryContact.name}</div>
                          <div style={{ fontSize: 12, color: '#6B7280' }}>{primaryContact.title ?? '—'}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#9CA3AF' }}>No primary contact</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', color: '#6B7280' }}>
                      {primaryContact ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Mail size={14} />
                            {primaryContact.email ?? '—'}
                          </div>
                          {primaryContact.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Phone size={14} />
                              {primaryContact.phone}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', fontWeight: 600, color: COLORS.navyDark }}>
                      {contactCount}
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

export default CustomerInformationView;

