import { useEffect, useRef, useState } from 'react';
import api from '../../api';

export default function PaymentSettings() {
  const [methods, setMethods] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/api/settings').then(r => {
      if (r.data.payment_methods) setMethods(JSON.parse(r.data.payment_methods));
    });
  }, []);

  const toggle = i => setMethods(prev => { const m = [...prev]; m[i] = { ...m[i], enabled: !m[i].enabled }; return m; });
  const setLabel = (i, v) => setMethods(prev => { const m = [...prev]; m[i] = { ...m[i], label: v }; return m; });

  const save = async () => {
    await api.put('/api/settings/payment_methods', { value: JSON.stringify(methods) });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Payment Methods</h2>
      <div className="card" style={{ maxWidth: 500, marginBottom: 32 }}>
        {methods.map((m, i) => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #eee' }}>
            <input type="checkbox" checked={m.enabled} onChange={() => toggle(i)} style={{ width: 18, height: 18 }} />
            <input value={m.label} onChange={e => setLabel(i, e.target.value)} style={{ flex: 1, marginBottom: 0 }} />
            <span style={{ fontSize: 12, color: m.enabled ? '#27ae60' : '#aaa' }}>{m.enabled ? 'Active' : 'Disabled'}</span>
          </div>
        ))}
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={save}>Save</button>
        {saved && <p style={{ color: 'green', marginTop: 8, fontSize: 13 }}>✓ Saved</p>}
      </div>

      <BankingAccounts />

      <PluginSection type="payment" />
    </div>
  );
}

function BankingAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/api/settings').then(r => {
      if (r.data.banking_accounts) setAccounts(JSON.parse(r.data.banking_accounts));
    });
  }, []);

  const empty = () => ({ id: Date.now().toString(), name: '', currency_code: '', gateway_url: '', merchant_id: '', access_key: '', secret_key: '', extra: '', active: true });
  const set = (i, k, v) => setAccounts(prev => { const a = [...prev]; a[i] = { ...a[i], [k]: v }; return a; });
  const add = () => setAccounts(prev => [...prev, empty()]);
  const remove = i => setAccounts(prev => prev.filter((_, idx) => idx !== i));

  const save = async () => {
    await api.put('/api/settings/banking_accounts', { value: JSON.stringify(accounts) });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ marginBottom: 8 }}>🏦 Banking / Gateway Accounts</h3>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
        Store your bank or payment gateway credentials here. These are passed to your payment plugins as config.
      </p>

      {accounts.map((a, i) => (
        <div key={a.id} className="card" style={{ maxWidth: 620, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <strong>{a.name || `Account ${i + 1}`}</strong>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!a.active} onChange={() => set(i, 'active', !a.active)} />
                Active
              </label>
              <button className="btn btn-danger" style={{ padding: '2px 8px', fontSize: 12 }} onClick={() => remove(i)}>✕</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Account / Bank Name</label>
              <input value={a.name} onChange={e => set(i, 'name', e.target.value)} placeholder="ZarinPal, Mellat, Saderat…" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Currency Code</label>
              <input value={a.currency_code} onChange={e => set(i, 'currency_code', e.target.value.toUpperCase())} placeholder="IRR, SAR, USD…" style={{ maxWidth: 120 }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0, gridColumn: '1/-1' }}>
              <label>Gateway URL</label>
              <input value={a.gateway_url} onChange={e => set(i, 'gateway_url', e.target.value)} placeholder="https://api.zarinpal.com/pg/v4/payment/request.json" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Merchant ID</label>
              <input value={a.merchant_id} onChange={e => set(i, 'merchant_id', e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Access Key / API Key</label>
              <input value={a.access_key} onChange={e => set(i, 'access_key', e.target.value)} type="password" placeholder="••••••••" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Secret Key</label>
              <input value={a.secret_key} onChange={e => set(i, 'secret_key', e.target.value)} type="password" placeholder="••••••••" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Extra / Terminal ID</label>
              <input value={a.extra} onChange={e => set(i, 'extra', e.target.value)} placeholder="Terminal ID, shop ID, etc." />
            </div>
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-secondary" onClick={add}>+ Add Account</button>
        <button className="btn btn-primary" onClick={save}>Save All</button>
        {saved && <span style={{ color: 'green', fontSize: 13, alignSelf: 'center' }}>✓ Saved</span>}
      </div>
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
      <h3 style={{ marginBottom: 12 }}>
        {type === 'payment' ? '🔌 Payment Plugins' : '📦 Shipping Plugins'}
      </h3>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
        Upload a <code>.php</code> or <code>.js</code> plugin file. The plugin receives order data + your config (API keys, merchant IDs) and handles the {type} process.
      </p>

      {/* Upload form */}
      <div className="card" style={{ maxWidth: 520, marginBottom: 20 }}>
        <h4 style={{ marginBottom: 12 }}>Upload New Plugin</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Plugin Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={type === 'payment' ? 'ZarinPal' : 'DHL Express'} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Currency / Region</label>
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
          <input placeholder="Search plugins by name or currency…" value={search}
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
                        Config JSON <span style={{ fontWeight: 400, color: '#888' }}>(API keys, merchant IDs, secrets…)</span>
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
