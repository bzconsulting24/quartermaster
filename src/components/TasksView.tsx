import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { COLORS, formatDisplayDate } from '../data/uiConstants';
import type { Task } from '../types';

const priorityStyles: Record<Task['priority'], { background: string; color: string }> = {
  HIGH: { background: '#FEE2E2', color: '#991B1B' },
  MEDIUM: { background: '#FEF3C7', color: '#92400E' },
  LOW: { background: '#E5E7EB', color: '#374151' }
};

const TasksView = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/tasks');
        if (!response.ok) {
          throw new Error('Unable to load tasks');
        }
        const data = await response.json();
        setTasks(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: COLORS.navyDark }}>Tasks</h1>
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
          gap: '8px'
        }}>
          <Plus size={16} />
          New Task
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {loading && (
          <div style={{ padding: '16px', color: '#6B7280' }}>Loading tasks...</div>
        )}
        {!loading && tasks.length === 0 && (
          <div style={{ padding: '16px', color: '#6B7280' }}>No tasks yet.</div>
        )}
        {tasks.map(task => (
          <div key={task.id} style={{
            padding: '16px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <input type="checkbox" style={{ width: '18px', height: '18px' }} checked={task.status === 'COMPLETED'} readOnly />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>{task.title}</div>
              <div style={{ fontSize: '14px', color: '#6B7280', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span>Due: {formatDisplayDate(task.dueDate)}</span>
                <span>•</span>
                <span>Assigned to: {task.assignedTo}</span>
                {task.opportunity?.name && (
                  <>
                    <span>•</span>
                    <span>{task.opportunity.name}</span>
                  </>
                )}
              </div>
            </div>
            <span style={{
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              background: priorityStyles[task.priority].background,
              color: priorityStyles[task.priority].color
            }}>
              {task.priority.toLowerCase()}
            </span>
            {task.status === 'OVERDUE' && (
              <span style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
                background: '#FEE2E2',
                color: '#991B1B'
              }}>
                Overdue
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TasksView;
