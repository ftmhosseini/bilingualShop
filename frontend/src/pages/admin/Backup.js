import { useState, useRef } from 'react';
import api from '../../api';

export default function Backup() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  const exportBackup = async () => {
    const r = await api.get('/api/admin/backup', { responseType: 'blob' });
    const url = URL.createObjectURL(r.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = async e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!window.confirm('This will overwrite ALL data in the database. Are you sure?')) return;
    setImporting(true);
    setResult(null);
    const fd = new FormData();
    fd.append('backup', file);
    try {
      const r = await api.post('/api/admin/restore', fd);
      setResult({ success: true, errors: r.data.errors });
    } catch (err) {
      setResult({ success: false, errors: [err.response?.data?.error || err.message] });
    } finally {
      setImporting(false);
      fileRef.current.value = '';
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>🗄️ Backup & Restore</h2>

      <div className="card" style={{ marginBottom: 20, maxWidth: 500 }}>
        <h3 style={{ marginBottom: 8 }}>📤 Export (Backup)</h3>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
          Download all database tables as a single JSON file.
        </p>
        <button className="btn btn-primary" onClick={exportBackup}>
          ⬇ Download Backup
        </button>
      </div>

      <div className="card" style={{ maxWidth: 500 }}>
        <h3 style={{ marginBottom: 8 }}>📥 Import (Restore)</h3>
        <p style={{ fontSize: 13, color: '#c0392b', marginBottom: 16 }}>
          ⚠️ This will <strong>replace all existing data</strong> with the contents of the backup file.
        </p>
        <button className="btn btn-secondary" onClick={() => fileRef.current.click()} disabled={importing}>
          {importing ? 'Restoring…' : '⬆ Choose Backup File'}
        </button>
        <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={importBackup} />

        {result && (
          <div style={{ marginTop: 16 }}>
            {result.success
              ? <p style={{ color: 'green', fontWeight: 600 }}>✓ Restore completed.</p>
              : <p style={{ color: 'red', fontWeight: 600 }}>✗ Restore failed.</p>
            }
            {result.errors?.length > 0 && (
              <div style={{ marginTop: 8, background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 4, padding: '8px 12px', fontSize: 13 }}>
                <strong>Errors / warnings:</strong>
                <ul style={{ margin: '6px 0 0 16px' }}>
                  {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
