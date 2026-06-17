import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function ContactUs() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user && (user.role === 'admin' || user.role === 'cooperatore');
  const [info, setInfo] = useState({});
  const [labels, setLabels] = useState({});
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('');
  const isRTL = document.documentElement.dir === 'rtl';
  const lang = i18n.language?.split('-')[0];
  const [editingLabels, setEditingLabels] = useState(false);
  const [labelForm, setLabelForm] = useState({});

  useEffect(() => {
    api.get('/api/settings').then(r => setInfo(r.data));
    api.get('/api/content/contact').then(r => {
      const row = r.data.find(c => c.lang === lang) || r.data.find(c => c.lang === 'en');
      if (row) {
        const content = (() => { try { return JSON.parse(row.content || '{}'); } catch { return {}; } })();
        setLabels({ title: row.title || '', ...content });
      }
    }).catch(() => {});
  }, [lang]);

  const L = (key, fallback) => labels[key] || fallback;

  const saveLabels = async () => {
    const { title, ...rest } = labelForm;
    await api.put(`/api/content/contact/${lang}`, { title: title || '', content: JSON.stringify(rest) });
    setLabels(labelForm);
    setEditingLabels(false);
  };

  const submit = async e => {
    e.preventDefault();
    try { await api.post('/api/contact', form); setStatus('success'); setForm({ name: '', email: '', subject: '', message: '' }); }
    catch { setStatus('error'); }
  };

  return (
    <div className="page" dir={isRTL ? 'rtl' : 'ltr'}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1>{L('title', 'Contact Us')}</h1>
        {isAdmin && !editingLabels && (
          <button onClick={() => { setLabelForm(labels); setEditingLabels(true); }} style={{ background: '#2980b9', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 13 }}>✏️</button>
        )}
      </div>
      {editingLabels && (
        <div style={{ background: '#fffbe6', border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 24 }}>
          {[
            { key: 'title', label: 'Page Title', fallback: 'Contact Us' },
            { key: 'touch', label: 'Get in Touch heading', fallback: 'Get in Touch' },
            { key: 'email', label: 'Email label', fallback: 'Email' },
            { key: 'emailValue', label: 'Email value', fallback: info.contact_email || '' },
            { key: 'phone', label: 'Phone label', fallback: 'Phone' },
            { key: 'phoneValue', label: 'Phone value', fallback: info.contact_phone || '' },
            { key: 'address', label: 'Address label', fallback: 'Address' },
            { key: 'addressValue', label: 'Address value', fallback: info.contact_address || '' },
            { key: 'hours', label: 'Hours label', fallback: 'Hours' },
            { key: 'hoursValue', label: 'Hours value', fallback: info.contact_hours || '' },
            { key: 'sendMsg', label: 'Send Message heading', fallback: 'Send a Message' },
            { key: 'name', label: 'Name field label', fallback: 'Name *' },
            { key: 'emailField', label: 'Email field label', fallback: 'Email' },
            { key: 'subject', label: 'Subject field label', fallback: 'Subject' },
            { key: 'message', label: 'Message field label', fallback: 'Message *' },
            { key: 'send', label: 'Send button text', fallback: 'Send Message' },
            { key: 'success', label: 'Success message', fallback: '✓ Message sent!' },
            { key: 'error', label: 'Error message', fallback: 'Failed. Please try again.' },
          ].map(({ key, label, fallback }) => (
            <div className="form-group" key={key}>
              <label style={{ fontSize: 12, color: '#666' }}>{label}</label>
              <input value={labelForm[key] || ''} placeholder={fallback} dir={isRTL ? 'rtl' : 'ltr'}
                onChange={e => setLabelForm(f => ({ ...f, [key]: e.target.value }))} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={saveLabels}>Save</button>
            <button className="btn btn-secondary" onClick={() => setEditingLabels(false)}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }}>
        <div>
          <div className="card">
            <h3 style={{ marginBottom: 12 }}>{L('touch', 'Get in Touch')}</h3>
            {[
              { icon: '📧', label: L('email', 'Email'),   value: L('emailValue', info.contact_email) },
              { icon: '📞', label: L('phone', 'Phone'),   value: L('phoneValue', info.contact_phone) },
              { icon: '📍', label: L('address', 'Address'), value: L('addressValue', info.contact_address) },
              { icon: '🕐', label: L('hours', 'Hours'),   value: L('hoursValue', info.contact_hours) },
            ].filter(c => c.value).map(c => (
              <div key={c.label} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20 }}>{c.icon}</span>
                <div>
                  <div style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>{c.label}</div>
                  <div style={{ fontSize: 14 }}>{c.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>{L('sendMsg', 'Send a Message')}</h3>
          {status === 'success' && <p style={{ color: 'green', marginBottom: 12 }}>{L('success', '✓ Message sent!')}</p>}
          {status === 'error' && <p style={{ color: 'red', marginBottom: 12 }}>{L('error', 'Failed. Please try again.')}</p>}
          <form onSubmit={submit}>
            <div className="form-group"><label>{L('name', 'Name *')}</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
            <div className="form-group"><label>{L('emailField', 'Email')}</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="form-group"><label>{L('subject', 'Subject')}</label><input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} /></div>
            <div className="form-group"><label>{L('message', 'Message *')}</label><textarea rows={4} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required /></div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>{L('send', 'Send Message')}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
