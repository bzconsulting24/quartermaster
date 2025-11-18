import React from 'react';
import { Plus } from 'lucide-react';
import { COLORS, mockTasks } from '../data/mockData';

const TasksView = () => (
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
      {mockTasks.map(task => (
        <div key={task.id} style={{
          padding: '16px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <input type="checkbox" style={{ width: '18px', height: '18px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>{task.title}</div>
            <div style={{ fontSize: '14px', color: '#6B7280', display: 'flex', gap: '16px' }}>
              <span>Due: {task.dueDate}</span>
              <span>•</span>
              <span>Assigned to: {task.assignedTo}</span>
            </div>
          </div>
          <span style={{
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            background: task.priority === 'high' ? '#FEE2E2' : task.priority === 'medium' ? '#FEF3C7' : '#E5E7EB',
            color: task.priority === 'high' ? '#991B1B' : task.priority === 'medium' ? '#92400E' : '#374151'
          }}>
            {task.priority}
          </span>
          {task.status === 'overdue' && (
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

export default TasksView;
