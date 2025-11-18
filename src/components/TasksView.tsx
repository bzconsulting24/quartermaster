import { useEffect, useMemo, useState } from 'react';
import { Plus, Filter, Info, Zap } from 'lucide-react';
import { COLORS, formatDisplayDate } from '../data/uiConstants';
import type { Task, TaskPriority, TaskStatus } from '../types';

const priorityStyles: Record<Task['priority'], { background: string; color: string }> = {
  HIGH: { background: '#FEE2E2', color: '#991B1B' },
  MEDIUM: { background: '#FEF3C7', color: '#92400E' },
  LOW: { background: '#E5E7EB', color: '#374151' }
};

const TasksView = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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

  const owners = useMemo(() => Array.from(new Set(tasks.map(task => task.assignedTo))), [tasks]);

  const filteredTasks = tasks.filter(task => {
    const matchOwner = ownerFilter === 'all' || task.assignedTo === ownerFilter;
    const matchStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchOwner && matchStatus && matchPriority;
  });

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: COLORS.navyDark }}>Tasks</h1>
        <button onClick={async()=>{ const title=prompt('Task title?'); const due=(new Date(Date.now()+86400000)).toISOString(); const r=await fetch('/api/tasks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title, dueDate: due, assignedTo:'Me'})}); if(r.ok){ location.reload(); } }} style={{}}><Plus size={16} \/> New Task
        </button>
      </div>

      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          marginBottom: '16px',
          padding: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', fontSize: '14px' }}>
          <Filter size={16} />
          Filters
        </div>
        <select
          value={ownerFilter}
          onChange={e => setOwnerFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            fontSize: '14px',
            outline: 'none'
          }}
        >
          <option value="all">All Owners</option>
          {owners.map(owner => (
            <option key={owner} value={owner}>
              {owner}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as TaskStatus | 'all')}
          style={{
            padding: '8px 12px',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            fontSize: '14px',
            outline: 'none'
          }}
        >
          <option value="all">All Status</option>
          {(['OPEN', 'OVERDUE', 'COMPLETED'] as TaskStatus[]).map(status => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value as TaskPriority | 'all')}
          style={{
            padding: '8px 12px',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            fontSize: '14px',
            outline: 'none'
          }}
        >
          <option value="all">All Priority</option>
          {(['HIGH', 'MEDIUM', 'LOW'] as TaskPriority[]).map(priority => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
      </div>

      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {loading && <div style={{ padding: '16px', color: '#6B7280' }}>Loading tasks...</div>}
        {!loading && filteredTasks.length === 0 && (
          <div style={{ padding: '16px', color: '#6B7280' }}>No tasks match your filters.</div>
        )}
        {filteredTasks.map(task => (
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
            {task.workflowRuleId && (
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: '#DBEAFE',
                  color: '#1D4ED8',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Zap size={12} />
                Automation
              </span>
            )}
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
            <button
              onClick={() => setSelectedTask(task)}
              style={{
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                background: 'white',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: COLORS.navyDark
              }}
            >
              <Info size={14} />
              Details
            </button>
          </div>
        ))}
      </div>

      {selectedTask && (
        <div
          style={{
            marginTop: '16px',
            background: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.08)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: COLORS.navyDark }}>{selectedTask.title}</h2>
            <button
              onClick={() => setSelectedTask(null)}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#6B7280' }}
            >
              Close
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>Due Date</div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>{formatDisplayDate(selectedTask.dueDate)}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>Status</div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>{selectedTask.status}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>Priority</div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>{selectedTask.priority}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>Opportunity</div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>{selectedTask.opportunity?.name ?? '—'}</div>
            </div>
          </div>
          {selectedTask.workflowRuleId && (
            <div style={{ marginTop: '16px', fontSize: '13px', color: '#6B7280' }}>
              Triggered by automation rule #{selectedTask.workflowRuleId}. Review workflow settings if edits are needed.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TasksView;

