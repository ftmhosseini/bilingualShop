import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';

export default function FAQ() {
  const { i18n } = useTranslation();
  const [faqs, setFaqs] = useState([]);
  const [labels, setLabels] = useState({});
  const [open, setOpen] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const lang = i18n.language?.split('-')[0];
  const isRTL = ['fa', 'ar'].includes(lang);

  useEffect(() => {
    api.get(`/api/faq/${lang}`).then(r => {
      if (r.data.length > 0) setFaqs(r.data);
      else api.get('/api/faq/en').then(r2 => setFaqs(r2.data)).catch(() => {});
    }).catch(() => {});
    api.get('/api/content/faq').then(r => {
      const row = r.data.find(c => c.lang === lang) || r.data.find(c => c.lang === 'en');
      if (row) {
        const content = (() => { try { return JSON.parse(row.content || '{}'); } catch { return {}; } })();
        setLabels({ title: row.title || '', ...content });
      }
    }).catch(() => {});
  }, [lang]);

  const L = (key, fallback) => labels[key] || fallback;

  const handleSubmit = e => { e.preventDefault(); setSubmitted(true); };

  return (
    <div className="page" dir={isRTL ? 'rtl' : 'ltr'} style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: 24 }}>{L('title', 'FAQ')}</h1>
      {faqs.map((f, i) => (
        <div key={f.id} style={{ border: '1px solid #ddd', borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
          <button onClick={() => setOpen(open === i ? null : i)}
            style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', background: open === i ? '#fffbe6' : '#fff', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 15, fontWeight: 600, textAlign: isRTL ? 'right' : 'left' }}>
            {f.question}
            <span style={{ fontSize: 20, color: '#febd69', flexShrink: 0 }}>{open === i ? '−' : '+'}</span>
          </button>
          {open === i && <div style={{ padding: '12px 16px', background: '#fafafa', fontSize: 14, color: '#444', lineHeight: 1.7 }}>{f.answer}</div>}
        </div>
      ))}
      {faqs.length === 0 && <p style={{ color: '#aaa' }}>No FAQs available in this language yet.</p>}

      <div className="card" style={{ marginTop: 32 }}>
        <h2 style={{ marginBottom: 8, fontSize: 18 }}>{L('askTitle', '❓ Do you have any questions? Ask us')}</h2>
        <p style={{ color: '#666', fontSize: 13, marginBottom: 20 }}>{L('askSubtitle', 'Please read the questions above, and if you cannot find your answer, send us your question. We will reply as soon as possible.')}</p>
        {submitted ? (
          <p style={{ color: 'green', fontWeight: 600 }}>✓ {L('askSuccess', 'Your message was sent. Thank you!')}</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <input placeholder={L('askNamePlaceholder', 'Full Name *')} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required style={{ margin: 0 }} />
              <input type="email" placeholder={L('askEmailPlaceholder', 'Email *')} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required style={{ margin: 0 }} />
            </div>
            <textarea rows={4} placeholder={L('askMsgPlaceholder', 'Your message *')} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required
              style={{ resize: 'vertical', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14, fontFamily: 'inherit', marginTop: 12 }} />
            <button type="submit" className="btn btn-primary" style={{ marginTop: 12, alignSelf: 'flex-start', padding: '8px 28px' }}>
              {L('askBtn', 'Send')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
