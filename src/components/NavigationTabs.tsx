import {
  Home,
  Briefcase,
  Users,
  CheckSquare,
  Calendar,
  BarChart3,
  Plus,
  FileText,
  UserPlus,
  ScrollText,
  FileSignature,
  UserCircle2
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { COLORS } from '../data/uiConstants';
import type { AppTab } from '../types';

type TabConfig = {
  id: AppTab;
  label: string;
  icon: LucideIcon;
};

type NavigationTabsProps = {
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;
};

const tabs: TabConfig[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
  { id: 'accounts', label: 'Accounts', icon: Users },
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'customerInformation', label: 'Customer Information', icon: UserCircle2 },
  { id: 'leads', label: 'Leads', icon: UserPlus },
  { id: 'estimates', label: 'Estimates', icon: ScrollText },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'contracts', label: 'Contracts', icon: FileSignature },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'reports', label: 'Reports', icon: BarChart3 }
];

const NavigationTabs = ({ currentTab, setCurrentTab }: NavigationTabsProps) => (
  <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB' }}>
    <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch' }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '500',
              borderBottom: isActive ? `3px solid ${COLORS.gold}` : '3px solid transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              background: isActive ? 'linear-gradient(to bottom, #FEF3C7 0%, transparent 100%)' : 'transparent',
              color: isActive ? COLORS.navyDark : '#6B7280',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <Icon size={16} />
            {tab.label}
          </button>
        );
      })}
      <button style={{
        marginLeft: 'auto',
        background: `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)`,
        color: 'white',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '14px',
        fontWeight: '500'
      }}>
        <Plus size={16} />
        New
      </button>
    </div>
  </div>
);

export default NavigationTabs;
