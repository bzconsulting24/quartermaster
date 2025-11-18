import { useEffect, useMemo, useState } from 'react';
import { Calendar } from 'lucide-react';
import { COLORS, formatDisplayDate } from '../data/uiConstants';
import type { Task } from '../types';

const CalendarView = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

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

  const upcoming = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    return sorted.slice(0, 5);
  }, [tasks]);

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: COLORS.navyDark, marginBottom: '24px' }}>Calendar</h1>
      <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Upcoming Events</div>
        {loading && <div style={{ color: '#6B7280' }}>Loading events...</div>}
        {!loading && upcoming.length === 0 && <div style={{ color: '#6B7280' }}>No upcoming due dates.</div>}
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
            <Calendar size={20} color={COLORS.navyDark} />
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
