import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';

export default function FAQ() {
  const { i18n } = useTranslation();
  const [faqs, setFaqs] = useState([]);
  const [pageTitle, setPageTitle] = useState('FAQ');
  const [open, setOpen] = useState(null);
  const lang = i18n.language?.split('-')[0];
  const isRTL = ['fa', 'ar'].includes(lang);

  useEffect(() => {
    api.get(`/api/faq/${lang}`).then(r => {
      if (r.data.length > 0) setFaqs(r.data);
      else api.get('/api/faq/en').then(r2 => setFaqs(r2.data)).catch(() => {});
    }).catch(() => {});
    api.get('/api/content/faq').then(r => {
      const entry = r.data.find(c => c.lang === lang) || r.data.find(c => c.lang === 'en');
      if (entry?.title) setPageTitle(entry.title);
    }).catch(() => {});
  }, [lang]);

  return (
    <div className="page" dir={isRTL ? 'rtl' : 'ltr'}>
      <h1 style={{ marginBottom: 24 }}>{pageTitle}</h1>
      {faqs.map((f, i) => (
        <div key={f.id} style={{ border: '1px solid #ddd', borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
          <button onClick={() => setOpen(open === i ? null : i)}
            style={{ width: '100%', padding: '14px 16px', background: open === i ? '#fffbe6' : '#fff', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 15, fontWeight: 600, textAlign: isRTL ? 'right' : 'left' }}>
            {f.question}
            <span style={{ fontSize: 20, color: '#febd69', flexShrink: 0 }}>{open === i ? '−' : '+'}</span>
          </button>
          {open === i && <div style={{ padding: '12px 16px', background: '#fafafa', fontSize: 14, color: '#444', lineHeight: 1.7 }}>{f.answer}</div>}
        </div>
      ))}
      {faqs.length === 0 && <p style={{ color: '#aaa' }}>No FAQs available in this language yet.</p>}
    </div>
  );
}
