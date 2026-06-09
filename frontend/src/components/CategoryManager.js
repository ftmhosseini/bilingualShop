import { useEffect, useState } from 'react';
import api from '../api';

function NameInputs({ names, onChange, langs }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {langs.map(l => (
        <div key={l.code} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16 }}>{l.flag}</span>
          <input
            placeholder={l.label}
            value={names[l.code] || ''}
            onChange={e => onChange({ ...names, [l.code]: e.target.value })}
            dir={l.rtl ? 'rtl' : 'ltr'}
            style={{ width: 160, marginBottom: 0, padding: '3px 6px', fontSize: 13 }}
          />
        </div>
      ))}
    </div>
  );
}

function CategoryNode({ node, onRefresh, langs, depth = 0 }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [names, setNames] = useState({});

  const defaultName = () => node.names?.en || node.name;

  const save = async () => {
    const en = names.en?.trim() || defaultName();
    await api.post('/api/categories', { name: en, parent_id: node.id, names });
    setNames({}); setAdding(false); onRefresh();
  };

  const rename = async () => {
    const en = names.en?.trim() || defaultName();
    await api.put(`/api/categories/${node.id}`, { name: en, names });
    setNames({}); setEditing(false); onRefresh();
  };

  const del = async () => {
    const msg = node.children?.length ? `Delete "${defaultName()}" and all its subcategories?` : `Delete "${defaultName()}"?`;
    if (!window.confirm(msg)) return;
    await api.delete(`/api/categories/${node.id}`);
    onRefresh();
  };

  const startEdit = () => {
    setNames(node.names || { en: node.name });
    setEditing(true); setAdding(false);
  };

  const startAdd = () => {
    setNames({});
    setAdding(a => !a); setEditing(false);
  };

  return (
    <div style={{ marginLeft: depth * 20, borderLeft: depth > 0 ? '2px solid #e0e0e0' : 'none', paddingLeft: depth > 0 ? 12 : 0, marginTop: 6 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
        {depth > 0 && <span style={{ color: '#bbb', fontSize: 12, marginTop: 4 }}>└</span>}
        {editing ? (
          <div>
            <NameInputs names={names} onChange={setNames} langs={langs} />
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <button onClick={rename} style={btnStyle('#27ae60')}>✓ Save</button>
              <button onClick={() => setEditing(false)} style={btnStyle('#999')}>✕</button>
            </div>
          </div>
        ) : (
          <>
            <span style={{ fontSize: 13, fontWeight: depth === 0 ? 600 : 400, marginTop: 2 }}>
              {langs.map(l => node.names?.[l.code] || (l.code === 'en' ? node.name : '')).filter(Boolean).join(' / ')}
            </span>
            <button onClick={startEdit} style={btnStyle('#888')} title="Edit translations">✏️</button>
            <button onClick={startAdd} style={btnStyle('#2980b9')} title="Add sublevel">+ sub</button>
            <button onClick={del} style={btnStyle('#c0392b')} title="Delete">🗑</button>
          </>
        )}
      </div>

      {adding && (
        <div style={{ marginTop: 8, marginLeft: 20 }}>
          <NameInputs names={names} onChange={setNames} langs={langs} />
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button onClick={save} style={btnStyle('#27ae60')}>Add</button>
            <button onClick={() => setAdding(false)} style={btnStyle('#999')}>✕</button>
          </div>
        </div>
      )}

      {node.children?.map(child => (
        <CategoryNode key={child.id} node={child} onRefresh={onRefresh} langs={langs} depth={depth + 1} />
      ))}
    </div>
  );
}

const btnStyle = bg => ({
  background: bg, color: '#fff', border: 'none', borderRadius: 4,
  padding: '2px 7px', cursor: 'pointer', fontSize: 12,
});

export default function CategoryManager({ categories, onRefresh, inline = false }) {
  const [names, setNames] = useState({});
  const [langs, setLangs] = useState([{ code: 'en', label: 'English', flag: '🇬🇧', rtl: false }]);

  useEffect(() => {
    api.get('/api/languages').then(r => {
      if (r.data.length) setLangs(r.data);
    }).catch(() => {});
  }, []);

  const addRoot = async () => {
    const en = names.en?.trim();
    if (!en) return;
    await api.post('/api/categories', { name: en, parent_id: null, names });
    setNames({}); onRefresh();
  };

  const inner = (
    <div style={{ background: '#f9f9f9', border: '1px solid #ddd', borderRadius: 8, padding: 16, marginTop: inline ? 0 : 8 }}>
      <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
        Add top-level categories with names in each language, then use <strong>+ sub</strong> to nest deeper.
      </p>
      <div style={{ marginBottom: 16 }}>
        <NameInputs names={names} onChange={setNames} langs={langs} />
        <button className="btn btn-primary" style={{ fontSize: 13, marginTop: 8 }} onClick={addRoot}>+ Add Top-Level</button>
      </div>
      {categories.length === 0
        ? <p style={{ fontSize: 13, color: '#aaa' }}>No categories yet.</p>
        : categories.map(node => <CategoryNode key={node.id} node={node} onRefresh={onRefresh} langs={langs} depth={0} />)
      }
    </div>
  );

  if (inline) return inner;

  return (
    <details style={{ marginBottom: 20 }}>
      <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 14, padding: '8px 0' }}>
        🗂 Manage Categories ({categories.length} top-level)
      </summary>
      {inner}
    </details>
  );
}
