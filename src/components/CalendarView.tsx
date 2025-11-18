import { useEffect, useMemo, useState } from 'react';
import { Calendar as CalendarIcon, Filter } from 'lucide-react';
import { COLORS, formatDisplayDate } from '../data/uiConstants';
import type { Task, TaskStatus } from '../types';

const CalendarView = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/tasks');
        if (!response.ok) {
          throw new Error('Unable to load calendar events');
        }
        const data = await response.json();
        setTasks(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const owners = useMemo(() => Array.from(new Set(tasks.map(task => task.assignedTo))), [tasks]);

  const upcoming = useMemo(() => {
    const filtered = tasks.filter(task => {
      const matchesOwner = ownerFilter === 'all' || task.assignedTo === ownerFilter;
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      return matchesOwner && matchesStatus;
    });

    return filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [tasks, ownerFilter, statusFilter]);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: COLORS.navyDark }}>Calendar</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'white', padding: '12px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Filter size={16} color="#6B7280" />
          <select value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)} style={{ border: 'none', outline: 'none' }}>
            <option value="all">All Owners</option>
            {owners.map(owner => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as TaskStatus | 'all')} style={{ border: 'none', outline: 'none' }}>
            <option value="all">All Status</option>
            {(['OPEN', 'OVERDUE', 'COMPLETED'] as TaskStatus[]).map(status => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Upcoming Events</div>
        {loading && <div style={{ color: '#6B7280' }}>Loading events...</div>}
        {!loading && upcoming.length === 0 && <div style={{ color: '#6B7280' }}>No events match your filters.</div>}
        {upcoming.map((event) => (
          <div key={event.id} style={{
            padding: '16px',
            background: '#F9FAFB',
            borderRadius: '8px',
            marginBottom: '12px',
            borderLeft: `4px solid ${COLORS.gold}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <CalendarIcon size={20} color={COLORS.navyDark} />
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{event.title}</div>
              <div style={{ fontSize: '14px', color: '#6B7280' }}>
                {formatDisplayDate(event.dueDate)} • {event.assignedTo}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;
