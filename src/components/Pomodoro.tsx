import { useEffect, useRef, useState } from 'react';
import { COLORS } from '../data/uiConstants';

function format(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function Pomodoro({ compact = false }: { compact?: boolean }) {
  const [work, setWork] = useState<number>(() => Number(localStorage.getItem('pomodoro.work') ?? 25) * 60);
  const [rest, setRest] = useState<number>(() => Number(localStorage.getItem('pomodoro.rest') ?? 5) * 60);
  const [remaining, setRemaining] = useState<number>(work);
  const [mode, setMode] = useState<'work'|'rest'>('work');
  const [running, setRunning] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => { setRemaining(mode==='work' ? work : rest); }, [work, rest, mode]);
  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); }, []);

  const toggle = () => {
    if (running) { if (timer.current) window.clearInterval(timer.current); setRunning(false); return; }
    setRunning(true);
    timer.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          const nextMode = mode === 'work' ? 'rest' : 'work';
          setMode(nextMode);
          return nextMode === 'work' ? work : rest;
        }
        return r - 1;
      });
    }, 1000);
  };

  const reset = () => {
    if (timer.current) window.clearInterval(timer.current);
    setRunning(false);
    setMode('work');
    setRemaining(work);
  };

  return (
    <div style={{
      background: 'white',
      border: `1px solid #E5E7EB`,
      borderRadius: 8,
      padding: compact ? '8px 12px' : 16,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
    }}>
      <div style={{ fontWeight: 700, color: mode==='work' ? COLORS.navyDark : '#059669' }}>{mode==='work' ? 'Focus' : 'Break'}</div>
      <div style={{ fontFamily: 'monospace', fontSize: compact ? 14 : 18 }}>{format(remaining)}</div>
      <button onClick={toggle} style={{ background: COLORS.navyDark, color: 'white', border: 'none', borderRadius: 4, padding: '6px 10px', cursor: 'pointer' }}>{running ? 'Pause' : 'Start'}</button>
      <button onClick={reset} style={{ background: 'transparent', color: COLORS.navyDark, border: `1px solid ${COLORS.navyDark}`, borderRadius: 4, padding: '6px 10px', cursor: 'pointer' }}>Reset</button>
    </div>
  );
}
