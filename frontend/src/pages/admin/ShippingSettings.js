import { useEffect, useRef, useState } from 'react';
import api from '../../api';

export default function ShippingSettings() {
  const [methods, setMethods] = useState([]);
  const [multipliers, setMultipliers] = useState([]);
  const [saved, setSaved] = useState(false);
  const [savedMult, setSavedMult] = useState(false);

  useEffect(() => {
    api.get('/api/settings').then(r => {
      if (r.data.shipping_methods) setMethods(JSON.parse(r.data.shipping_methods));
      if (r.data.shipping_multipliers) setMultipliers(JSON.parse(r.data.shipping_multipliers));
    });
  }, []);

  const set = (i, k, v) => setMethods(prev => { const m = [...prev]; m[i] = { ...m[i], [k]: v }; return m; });
  const add = () => setMethods(prev => [...prev, { id: Date.now().toString(), label: '', price: 0, days: '' }]);
  const remove = i => setMethods(prev => prev.filter((_, idx) => idx !== i));

  const setMul = (i, k, v) => setMultipliers(prev => { const m = [...prev]; m[i] = { ...m[i], [k]: v }; return m; });
  const addMul = () => setMultipliers(prev => [...prev, { country: '', multiplier: 1 }]);
  const removeMul = i => setMultipliers(prev => prev.filter((_, idx) => idx !== i));

  const save = async () => {
    await api.put('/api/settings/shipping_methods', { value: JSON.stringify(methods) });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const saveMult = async () => {
    await api.put('/api/settings/shipping_multipliers', { value: JSON.stringify(multipliers) });
    setSavedMult(true); setTimeout(() => setSavedMult(false), 2000);
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Shipping Options</h2>
      <div className="card" style={{ maxWidth: 600, marginBottom: 32 }}>
        {methods.map((m, i) => (
          <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <input placeholder="Label (e.g. Standard Shipping)" value={m.label} onChange={e => set(i, 'label', e.target.value)} style={{ marginBottom: 0 }} />
            <input type="number" step="0.01" placeholder="Price" value={m.price} onChange={e => set(i, 'price', parseFloat(e.target.value))} style={{ marginBottom: 0 }} />
            <input placeholder="Days (e.g. 3-5)" value={m.days} onChange={e => set(i, 'days', e.target.value)} style={{ marginBottom: 0 }} />
            <button className="btn btn-danger" style={{ padding: '6px 10px' }} onClick={() => remove(i)}>✕</button>
          </div>
        ))}
        <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Label | Price | Delivery days</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={add}>+ Add Option</button>
          <button className="btn btn-primary" onClick={save}>Save</button>
        </div>
        {saved && <p style={{ color: 'green', marginTop: 8, fontSize: 13 }}>✓ Saved</p>}
      </div>

      <h3 style={{ marginBottom: 8 }}>🌍 Shipping Price Multiplier by Country</h3>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
        Multiply the calculated shipping price by a factor per destination country. Example: Iran × 1, Canada × 16.
      </p>
      <div className="card" style={{ maxWidth: 500, marginBottom: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: '#888' }}>Country name (as typed in checkout)</span>
          <span style={{ fontSize: 12, color: '#888' }}>Multiplier</span>
          <span />
        </div>
        {multipliers.map((m, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input placeholder="Iran / Canada / UAE…" value={m.country} onChange={e => setMul(i, 'country', e.target.value)} style={{ marginBottom: 0 }} />
            <input type="number" step="0.01" min="0" placeholder="1" value={m.multiplier} onChange={e => setMul(i, 'multiplier', parseFloat(e.target.value) || 1)} style={{ marginBottom: 0 }} />
            <button className="btn btn-danger" style={{ padding: '6px 10px' }} onClick={() => removeMul(i)}>✕</button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-secondary" onClick={addMul}>+ Add Country</button>
          <button className="btn btn-primary" onClick={saveMult}>Save</button>
        </div>
        {savedMult && <p style={{ color: 'green', marginTop: 8, fontSize: 13 }}>✓ Saved</p>}
      </div>

      <PluginSection type="shipping" />
    </div>
  );
}

function PluginSection({ type }) {
  const [plugins, setPlugins] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', currency_code: '' });
  const [expandedConfig, setExpandedConfig] = useState({});
  const [editConfig, setEditConfig] = useState({});
  const [configSaved, setConfigSaved] = useState({});
  const fileRef = useRef();

  const load = () => api.get(`/api/plugins?type=${type}`).then(r => setPlugins(r.data));
  useEffect(() => { load(); }, []);

  const upload = async () => {
    if (!fileRef.current?.files[0] || !form.name) return alert('Name and file required');
    const fd = new FormData();
    fd.append('plugin', fileRef.current.files[0]);
    fd.append('name', form.name);
    fd.append('type', type);
    fd.append('currency_code', form.currency_code);
    fd.append('config', '{}');
    await api.post('/api/plugins', fd);
    setForm({ name: '', currency_code: '' });
    fileRef.current.value = '';
    load();
  };

  const saveConfig = async (id) => {
    const cfg = editConfig[id] ?? {};
    await api.put(`/api/plugins/${id}`, { config: cfg, active: true });
    setConfigSaved(p => ({ ...p, [id]: true }));
    setTimeout(() => setConfigSaved(p => ({ ...p, [id]: false })), 2000);
    load();
  };

  const toggleActive = async (p) => {
    await api.put(`/api/plugins/${p.id}`, { config: typeof p.config === 'string' ? JSON.parse(p.config) : p.config, active: !p.active });
    load();
  };

  const del = async (id) => {
    if (!window.confirm('Delete this plugin?')) return;
    await api.delete(`/api/plugins/${id}`);
    load();
  };

  const filtered = plugins.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.currency_code || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <h3 style={{ marginBottom: 12 }}>📦 Shipping Plugins</h3>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
        Upload a <code>.php</code> or <code>.js</code> plugin to integrate a shipping carrier (DHL, FedEx, local couriers, etc.). The plugin receives order data + your config and returns shipping rates or tracking info.
      </p>

      {/* Upload form */}
      <div className="card" style={{ maxWidth: 520, marginBottom: 20 }}>
        <h4 style={{ marginBottom: 12 }}>Upload New Plugin</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Plugin Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="DHL Express" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Region / Currency</label>
            <input value={form.currency_code} onChange={e => setForm(f => ({ ...f, currency_code: e.target.value.toUpperCase() }))} placeholder="IRR, SAR, USD…" />
          </div>
        </div>
        <div className="form-group">
          <label>Plugin File (.php or .js) *</label>
          <input ref={fileRef} type="file" accept=".php,.js" />
        </div>
        <button className="btn btn-primary" onClick={upload}>Upload Plugin</button>
      </div>

      {/* Search + list */}
      {plugins.length > 0 && (
        <>
          <input placeholder="Search plugins by name or region…" value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 320, marginBottom: 16 }} />

          {filtered.length === 0
            ? <p style={{ color: '#aaa', fontSize: 13 }}>No plugins match "{search}"</p>
            : filtered.map(p => {
              const cfg = editConfig[p.id] ?? (typeof p.config === 'string' ? JSON.parse(p.config || '{}') : p.config ?? {});
              const isOpen = !!expandedConfig[p.id];
              return (
                <div key={p.id} className="card" style={{ marginBottom: 10, maxWidth: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <strong style={{ flex: 1 }}>{p.name}</strong>
                    {p.currency_code && <span style={{ background: '#eee', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{p.currency_code}</span>}
                    <span style={{ background: p.active ? '#d4edda' : '#f8d7da', padding: '2px 8px', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}
                      onClick={() => toggleActive(p)}>{p.active ? '● Active' : '○ Inactive'}</span>
                    <button className="btn btn-secondary" style={{ padding: '3px 10px', fontSize: 12 }}
                      onClick={() => setExpandedConfig(prev => ({ ...prev, [p.id]: !prev[p.id] }))}>
                      {isOpen ? 'Hide Config' : '⚙ Config'}
                    </button>
                    <button className="btn btn-danger" style={{ padding: '3px 8px', fontSize: 12 }} onClick={() => del(p.id)}>✕</button>
                  </div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>{p.filename}</div>

                  {isOpen && (
                    <div style={{ marginTop: 12 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                        Config JSON <span style={{ fontWeight: 400, color: '#888' }}>(API keys, account numbers, secrets…)</span>
                      </label>
                      <textarea rows={5}
                        defaultValue={JSON.stringify(cfg, null, 2)}
                        onChange={e => { try { setEditConfig(prev => ({ ...prev, [p.id]: JSON.parse(e.target.value) })); } catch {} }}
                        style={{ fontFamily: 'monospace', fontSize: 12, width: '100%', marginBottom: 8 }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => saveConfig(p.id)}>Save Config</button>
                        {configSaved[p.id] && <span style={{ color: 'green', fontSize: 13 }}>✓ Saved</span>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          }
        </>
      )}
    </div>
  );
}
