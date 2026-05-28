import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';

export default function ContactUs() {
  const { i18n } = useTranslation();
  const [info, setInfo] = useState({});
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('');
  const isRTL = ['fa', 'ar'].includes(i18n.language?.split('-')[0]);
  const lang = i18n.language?.split('-')[0];
  const [pageTitle, setPageTitle] = useState('Contact Us');

  useEffect(() => {
    api.get('/api/settings').then(r => setInfo(r.data));
    api.get('/api/content/contact').then(r => {
      const entry = r.data.find(c => c.lang === lang) || r.data.find(c => c.lang === 'en');
      if (entry?.title) setPageTitle(entry.title);
    }).catch(() => {});
  }, [lang]);

  const submit = async e => {
    e.preventDefault();
    try { await api.post('/api/contact', form); setStatus('success'); setForm({ name: '', email: '', subject: '', message: '' }); }
    catch { setStatus('error'); }
  };

  return (
    <div className="page" dir={isRTL ? 'rtl' : 'ltr'}>
      <h1 style={{ marginBottom: 24 }}>{pageTitle}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }}>
        <div>
          <div className="card">
            <h3 style={{ marginBottom: 12 }}>{info[`contact_heading_touch_${lang}`] || 'Get in Touch'}</h3>
            {[
              { icon: '📧', label: 'Email', value: info.contact_email },
              { icon: '📞', label: 'Phone', value: info.contact_phone },
              { icon: '📍', label: 'Address', value: info.contact_address },
              { icon: '🕐', label: 'Hours', value: info.contact_hours },
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
          <h3 style={{ marginBottom: 16 }}>{info[`contact_heading_msg_${lang}`] || 'Send a Message'}</h3>
          {status === 'success' && <p style={{ color: 'green', marginBottom: 12 }}>✓ Message sent!</p>}
          {status === 'error' && <p style={{ color: 'red', marginBottom: 12 }}>Failed. Please try again.</p>}
          <form onSubmit={submit}>
            <div className="form-group"><label>Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
            <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="form-group"><label>Subject</label><input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} /></div>
            <div className="form-group"><label>Message *</label><textarea rows={4} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required /></div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              {info[`contact_btn_${lang}`] || 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
