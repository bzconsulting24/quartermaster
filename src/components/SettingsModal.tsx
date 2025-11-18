import { useEffect, useState } from 'react';

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const [drive, setDrive] = useState<{ connected: boolean } | null>(null);
  const [one, setOne] = useState<{ connected: boolean } | null>(null);

  const load = async () => {
    try {
      const d = await fetch('/api/drive/status').then(r => r.json());
      setDrive(d);
    } catch { setDrive({ connected: false }); }
    try {
      const o = await fetch('/api/onedrive/status').then(r => r.json());
      setOne(o);
    } catch { setOne({ connected: false }); }
  };

  useEffect(() => { void load(); }, []);

  const connectDrive = async () => {
    const { url } = await fetch('/api/drive/auth-url').then(r => r.json());
    window.location.href = url;
  };
  const connectOneDrive = async () => {
    const { url } = await fetch('/api/onedrive/auth-url').then(r => r.json());
    window.location.href = url;
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ width: 520, background: 'white', borderRadius: 8, padding: 20 }}>
        <h3 style={{ marginTop: 0 }}>Settings</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ padding: 12, border: '1px solid #E5E7EB', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600 }}>Google Drive</div>
                <div style={{ color: '#6B7280', fontSize: 12 }}>{drive?.connected ? 'Connected' : 'Not Connected'}</div>
              </div>
              <button onClick={connectDrive} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', background: drive?.connected ? '#E5E7EB' : '#0A2540', color: drive?.connected ? '#111827' : 'white', cursor: 'pointer' }}>{drive?.connected ? 'Reconnect' : 'Connect'}</button>
            </div>
          </div>
          <div style={{ padding: 12, border: '1px solid #E5E7EB', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600 }}>Microsoft OneDrive</div>
                <div style={{ color: '#6B7280', fontSize: 12 }}>{one?.connected ? 'Connected' : 'Not Connected'}</div>
              </div>
              <button onClick={connectOneDrive} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', background: one?.connected ? '#E5E7EB' : '#0A2540', color: one?.connected ? '#111827' : 'white', cursor: 'pointer' }}>{one?.connected ? 'Reconnect' : 'Connect'}</button>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', background: 'white', cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    </div>
  );
}