import { useEffect, useState } from 'react';
import api from '../../api';

const PROVIDERS = {
  email: [{ value: 'resend', label: 'Resend', fields: [{ key: 'from_email', label: 'From Email', placeholder: 'NuttyMilk <noreply@yourdomain.com>' }] }],
  sms: [
    { value: 'kavenegar', label: 'Kavenegar (Iran)', fields: [{ key: 'sender', label: 'Sender Number', placeholder: '10008663' }] },
    { value: 'twilio', label: 'Twilio (International)', fields: [{ key: 'from_number', label: 'From Number', placeholder: '+1234567890' }], apiKeyHint: 'Format: accountSid:authToken' },
  ],
};

export default function MessagingSettings() {
  const [providers, setProviders] = useState([]);
  const [form, setForm] = useState({ channel: 'email', provider: 'resend', api_key: '', config: {}, is_active: true });
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState('');

  const load = () => api.get('/api/messaging').then(r => setProviders(r.data)).catch(() => { });
  useEffect(() => { load(); }, []);

  const providerDef = PROVIDERS[form.channel]?.find(p => p.value === form.provider);

  const save = async () => {
    await api.post('/api/messaging', form);
    setSaved('✓ Saved'); setTimeout(() => setSaved(''), 2000);
    setForm({ channel: 'email', provider: 'resend', api_key: '', config: {}, is_active: true });
    setEditing(false);
    load();
  };

  const edit = (p) => {
    setForm({ channel: p.channel, provider: p.provider, api_key: '', config: p.config || {}, is_active: !!p.is_active });
    setEditing(true);
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this provider?')) return;
    await api.delete(`/api/messaging/${id}`);
    load();
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>📧 Email & SMS Providers</h2>
      <p style={{ color: '#666', marginBottom: 20 }}>Configure how verification codes are sent. Settings are stored in the database — no .env changes needed.</p>

      {/* Existing providers */}
      {providers.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                <th style={{ padding: 8 }}>Channel</th>
                <th style={{ padding: 8 }}>Provider</th>
                <th style={{ padding: 8 }}>API Key</th>
                <th style={{ padding: 8 }}>Status</th>
                <th style={{ padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {providers.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: 8 }}>{p.channel === 'email' ? '📧' : '📱'} {p.channel}</td>
                  <td style={{ padding: 8 }}>{p.provider}</td>
                  <td style={{ padding: 8, fontFamily: 'monospace', fontSize: 13 }}>{p.api_key_masked}</td>
                  <td style={{ padding: 8 }}>
                    <span style={{ color: p.is_active ? '#27ae60' : '#e74c3c', fontWeight: 'bold' }}>
                      {p.is_active ? '● Active' : '○ Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: 8 }}>
                    <button onClick={() => edit(p)} style={{ marginRight: 8, cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => remove(p.id)} style={{ color: '#e74c3c', cursor: 'pointer' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit form */}
      <div className="card" style={{ maxWidth: 500 }}>
        <h4 style={{ marginBottom: 12 }}>{editing ? 'Edit Provider' : 'Add Provider'}</h4>

        <label>Channel</label>
        <select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value, provider: PROVIDERS[e.target.value][0].value, config: {} })} style={{ marginBottom: 12, width: '100%' }}>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
        </select>

        <label>Provider</label>
        <select value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value, config: {} })} style={{ marginBottom: 12, width: '100%' }}>
          {PROVIDERS[form.channel].map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>

        <label>API Key {providerDef?.apiKeyHint && <span style={{ fontSize: 11, color: '#888' }}>({providerDef.apiKeyHint})</span>}</label>
        <input type="password" value={form.api_key} onChange={e => setForm({ ...form, api_key: e.target.value })} placeholder={editing ? 'Leave blank to keep current' : 'Enter API key'} style={{ marginBottom: 12, width: '100%' }} />

        {providerDef?.fields?.map(f => (
          <div key={f.key}>
            <label>{f.label}</label>
            <input value={form.config[f.key] || ''} onChange={e => setForm({ ...form, config: { ...form.config, [f.key]: e.target.value } })} placeholder={f.placeholder} style={{ marginBottom: 12, width: '100%' }} />
          </div>
        ))}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 12 }}>
          <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} style={{ cursor: 'pointer', width: 16, height: 16, margin: 2 }} />
          <span style={{ lineHeight: '16px' }}>Active</span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={save}>Save</button>
          {editing && <button onClick={() => { setEditing(false); setForm({ channel: 'email', provider: 'resend', api_key: '', config: {}, is_active: true }); }}>Cancel</button>}
        </div>
        {saved && <p style={{ color: 'green', marginTop: 8, fontSize: 13 }}>{saved}</p>}
      </div>

      <div style={{ marginTop: 24, padding: 16, background: '#f8f9fa', borderRadius: 8, fontSize: 13, color: '#555' }}>
        <strong>How it works:</strong>
        <ul style={{ margin: '8px 0 0 16px' }}>
          <li><strong>Email:</strong> Resend (free: 3,000 emails/month) — used for verification codes & password reset</li>
          <li><strong>SMS Iran:</strong> Kavenegar — for Iranian phone numbers (+98)</li>
          <li><strong>SMS International:</strong> Twilio — for all other phone numbers</li>
          <li>You can start with email-only (free) and add SMS later when needed</li>
        </ul>
      </div>
    </div>
  );
}
