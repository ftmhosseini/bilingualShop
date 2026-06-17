import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function FAQ() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [faqs, setFaqs] = useState([]);
  const [labels, setLabels] = useState({});
  const [open, setOpen] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const lang = i18n.language?.split('-')[0];
  const isRTL = document.documentElement.dir === 'rtl';
  const isAdmin = user && (user.role === 'admin' || user.role === 'cooperatore');

  // admin state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ question: '', answer: '' });
  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState({ question: '', answer: '' });
  const [editingLabels, setEditingLabels] = useState(false);
  const [labelForm, setLabelForm] = useState({});

  const load = () => {
    api.get(`/api/faq/${lang}`).then(r => {
      if (r.data.length > 0) setFaqs(r.data);
      else api.get('/api/faq/en').then(r2 => setFaqs(r2.data)).catch(() => {});
    }).catch(() => {});
  };

  useEffect(() => {
    load();
    api.get('/api/content/faq').then(r => {
      const row = r.data.find(c => c.lang === lang) || r.data.find(c => c.lang === 'en');
      if (row) {
        const content = (() => { try { return JSON.parse(row.content || '{}'); } catch { return {}; } })();
        setLabels({ title: row.title || '', ...content });
      }
    }).catch(() => {});
  }, [lang]);

  const L = (key, fallback) => labels[key] || fallback;

  const startEdit = (f) => { setEditingId(f.id); setEditForm({ question: f.question, answer: f.answer }); };

  const saveEdit = async (id) => {
    await api.put(`/api/faq/${id}`, { ...editForm, sort_order: 0 });
    setEditingId(null); load();
  };

  const del = async (id) => {
    if (!window.confirm('Delete this FAQ?')) return;
    await api.delete(`/api/faq/${id}`); load();
  };

  const addNew = async () => {
    if (!newForm.question.trim() || !newForm.answer.trim()) return;
    await api.post('/api/faq', { lang, ...newForm, sort_order: faqs.length });
    setNewForm({ question: '', answer: '' }); setAdding(false); load();
  };

  const handleSubmit = e => { e.preventDefault(); setSubmitted(true); };

  const saveLabels = async () => {
    const { title, ...rest } = labelForm;
    await api.put(`/api/content/faq/${lang}`, { title: title || '', content: JSON.stringify(rest) });
    setLabels(labelForm);
    setEditingLabels(false);
  };

  return (
    <div className="page" dir={isRTL ? 'rtl' : 'ltr'} style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1>{L('title', 'FAQ')}</h1>
        {isAdmin && (
          <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => setAdding(a => !a)}>
            {adding ? '✕ Cancel' : '+ Add FAQ'}
          </button>
        )}
      </div>

      {/* Add form */}
      {isAdmin && adding && (
        <div style={{ background: '#f9f9f9', border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div className="form-group">
            <label>Question</label>
            <input value={newForm.question} onChange={e => setNewForm(f => ({ ...f, question: e.target.value }))} dir={isRTL ? 'rtl' : 'ltr'} />
          </div>
          <div className="form-group">
            <label>Answer</label>
            <textarea rows={4} value={newForm.answer} onChange={e => setNewForm(f => ({ ...f, answer: e.target.value }))} dir={isRTL ? 'rtl' : 'ltr'} />
          </div>
          <button className="btn btn-primary" onClick={addNew}>Save</button>
        </div>
      )}

      {faqs.map((f, i) => (
        <div key={f.id} style={{ border: '1px solid #ddd', borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
          {editingId === f.id ? (
            <div style={{ padding: 16, background: '#fffbe6' }}>
              <div className="form-group">
                <label>Question</label>
                <input value={editForm.question} onChange={e => setEditForm(p => ({ ...p, question: e.target.value }))} dir={isRTL ? 'rtl' : 'ltr'} />
              </div>
              <div className="form-group">
                <label>Answer</label>
                <textarea rows={4} value={editForm.answer} onChange={e => setEditForm(p => ({ ...p, answer: e.target.value }))} dir={isRTL ? 'rtl' : 'ltr'} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={() => saveEdit(f.id)}>Save</button>
                <button className="btn btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button onClick={() => setOpen(open === i ? null : i)}
                  style={{ flex: 1, padding: '14px 16px', background: open === i ? '#fffbe6' : '#fff', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 15, fontWeight: 600, textAlign: isRTL ? 'right' : 'left' }}>
                  {f.question}
                  <span style={{ fontSize: 20, color: '#febd69', flexShrink: 0 }}>{open === i ? '−' : '+'}</span>
                </button>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 4, padding: '0 8px', flexShrink: 0 }}>
                    <button onClick={() => startEdit(f)} style={adminBtn('#2980b9')}>✏️</button>
                    <button onClick={() => del(f.id)} style={adminBtn('#e74c3c')}>🗑</button>
                  </div>
                )}
              </div>
              {open === i && <div style={{ padding: '12px 16px', background: '#fafafa', fontSize: 14, color: '#444', lineHeight: 1.7 }}>{f.answer}</div>}
            </>
          )}
        </div>
      ))}
      {faqs.length === 0 && !adding && <p style={{ color: '#aaa' }}>No FAQs available in this language yet.</p>}

      <div className="card" style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ marginBottom: 8, fontSize: 18 }}>{L('askTitle', '❓ Do you have any questions? Ask us')}</h2>
          {isAdmin && !editingLabels && (
            <button onClick={() => { setLabelForm(labels); setEditingLabels(true); }} style={adminBtn('#2980b9')}>✏️</button>
          )}
        </div>
        {editingLabels ? (
          <div style={{ background: '#fffbe6', border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
            {[
              { key: 'title', label: 'Page Title', fallback: 'FAQ' },
              { key: 'askTitle', label: 'Form Title', fallback: '❓ Do you have any questions? Ask us' },
              { key: 'askSubtitle', label: 'Form Subtitle', fallback: 'Please read the questions above...' },
              { key: 'askNamePlaceholder', label: 'Name Placeholder', fallback: 'Full Name *' },
              { key: 'askEmailPlaceholder', label: 'Email Placeholder', fallback: 'Email *' },
              { key: 'askMsgPlaceholder', label: 'Message Placeholder', fallback: 'Your message *' },
              { key: 'askBtn', label: 'Button Text', fallback: 'Send' },
              { key: 'askSuccess', label: 'Success Message', fallback: 'Your message was sent. Thank you!' },
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
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}

const adminBtn = (bg) => ({
  background: bg, color: '#fff', border: 'none', borderRadius: 4,
  padding: '4px 8px', cursor: 'pointer', fontSize: 13,
});
