import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COLORS, formatDisplayDate } from '../data/uiConstants';
import type { Task } from '../types';

const UpcomingTasksWidget = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<number>>(new Set());

  const loadTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      if (!response.ok) throw new Error('Failed to load tasks');

      const data = await response.json();

      // Filter open tasks and sort by due date
      const openTasks = data
        .filter((t: Task) => t.status !== 'COMPLETED')
        .sort((a: Task, b: Task) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5);

      setTasks(openTasks);
      setLoading(false);
    } catch (err) {
      console.error('Tasks error:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleToggleTask = async (taskId: number, checked: boolean) => {
    try {
      // Optimistically update UI
      if (checked) {
        setCompletedTaskIds(prev => new Set(prev).add(taskId));
      } else {
        setCompletedTaskIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(taskId);
          return newSet;
        });
      }

      // Update task status on server
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: checked ? 'COMPLETED' : 'OPEN' })
      });

      if (!response.ok) {
        // Revert on error
        setCompletedTaskIds(prev => {
          const newSet = new Set(prev);
          if (checked) newSet.delete(taskId);
          else newSet.add(taskId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      // Revert on error
      setCompletedTaskIds(prev => {
        const newSet = new Set(prev);
        if (checked) newSet.delete(taskId);
        else newSet.add(taskId);
        return newSet;
      });
    }
  };

  const clearCompletedTasks = () => {
    setTasks(prev => prev.filter(t => !completedTaskIds.has(t.id)));
    setCompletedTaskIds(new Set());
  };

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropTaskId: number) => {
    e.preventDefault();
    if (!draggedTaskId || draggedTaskId === dropTaskId) {
      setDraggedTaskId(null);
      return;
    }

    // Reorder tasks
    setTasks(prev => {
      const newTasks = [...prev];
      const draggedIndex = newTasks.findIndex(t => t.id === draggedTaskId);
      const dropIndex = newTasks.findIndex(t => t.id === dropTaskId);

      if (draggedIndex === -1 || dropIndex === -1) return prev;

      const [draggedTask] = newTasks.splice(draggedIndex, 1);
      newTasks.splice(dropIndex, 0, draggedTask);

      return newTasks;
    });

    setDraggedTaskId(null);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
  };


  if (loading) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        textAlign: 'center',
        color: '#6B7280'
      }}>
        Loading tasks...
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '8px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: `2px solid ${COLORS.gold}`
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: COLORS.navyDark,
          marginBottom: '4px'
        }}>
          Tasks
        </h2>
        <p style={{
          fontSize: '12px',
          color: '#9CA3AF',
          fontStyle: 'italic'
        }}>
          ✨ Drag to reorder • Check to complete
        </p>
      </div>

      <AnimatePresence mode="popLayout">
        {tasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{ color: '#6B7280', fontSize: '14px', textAlign: 'center', padding: '16px' }}
          >
            All caught up!
          </motion.div>
        ) : (
          <>
            {/* Active Tasks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {tasks.filter(task => !completedTaskIds.has(task.id)).map((task, index) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, x: -20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{
                    opacity: 0,
                    x: 100,
                    scale: 0.8,
                    transition: { duration: 0.3 }
                  }}
                  transition={{
                    delay: index * 0.05,
                    type: 'spring',
                    stiffness: 300,
                    damping: 25
                  }}
                  whileHover={{
                    scale: draggedTaskId === task.id ? 0.98 : 1.02,
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                  }}
                  whileTap={{ scale: 0.98 }}
                  draggable
                  onDragStart={(e) => handleDragStart(e as any, task.id)}
                  onDragOver={handleDragOver as any}
                  onDrop={(e) => handleDrop(e as any, task.id)}
                  onDragEnd={handleDragEnd}
                  style={{
                    padding: '16px',
                    background: draggedTaskId === task.id ? '#E0E7FF' : '#F9FAFB',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${COLORS.gold}`,
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    cursor: 'grab',
                    opacity: draggedTaskId === task.id ? 0.6 : 1
                  }}
                >
                  <motion.input
                    type="checkbox"
                    checked={false}
                    onChange={(e) => handleToggleTask(task.id, e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer',
                      accentColor: COLORS.navyDark
                    }}
                  />
                  <div style={{ flex: 1, pointerEvents: 'none' }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: COLORS.navyDark,
                      marginBottom: '4px'
                    }}>
                      {task.title}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#6B7280'
                    }}>
                      {formatDisplayDate(task.dueDate)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Completed Tasks Section */}
            {completedTaskIds.size > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ marginTop: '24px' }}
              >
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#9CA3AF',
                  marginBottom: '12px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>COMPLETED ({completedTaskIds.size})</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {tasks.filter(task => completedTaskIds.has(task.id)).map((task, index) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 100 }}
                      transition={{ delay: index * 0.03 }}
                      style={{
                        padding: '12px',
                        background: '#F9FAFB',
                        borderRadius: '6px',
                        borderLeft: '3px solid #D1D5DB',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center',
                        opacity: 0.7
                      }}
                    >
                      <motion.input
                        type="checkbox"
                        checked={true}
                        onChange={(e) => handleToggleTask(task.id, e.target.checked)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        style={{
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer',
                          accentColor: '#10B981'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#9CA3AF',
                          textDecoration: 'line-through',
                          marginBottom: '2px'
                        }}>
                          {task.title}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#9CA3AF',
                          textDecoration: 'line-through'
                        }}>
                          {formatDisplayDate(task.dueDate)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {completedTaskIds.size > 0 && (
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={clearCompletedTasks}
          style={{
            marginTop: '16px',
            padding: '10px 16px',
            width: '100%',
            background: 'white',
            border: `1px solid #E5E7EB`,
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            color: '#6B7280',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
        >
          Clear {completedTaskIds.size} completed task{completedTaskIds.size > 1 ? 's' : ''}
        </motion.button>
      )}
    </div>
  );
};

export default UpcomingTasksWidget;
