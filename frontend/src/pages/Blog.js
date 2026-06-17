import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const BASE = process.env.REACT_APP_API_URL || '';
const EMPTY_POST = { title: '', excerpt: '', content: '', image: '', author: '', tags: '', published_at: '' };

function toFarsiDate(dateStr) {
  if (!dateStr) return '';
  try { return new Date(dateStr).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }); }
  catch { return dateStr; }
}

function PostForm({ form, setForm, onSave, onCancel, isRTL }) {
  return (
    <div style={{ background: '#f9f9f9', border: '1px solid #ddd', borderRadius: 8, padding: 20, marginBottom: 20 }}>
      <div className="form-group">
        <label>Title</label>
        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} dir={isRTL ? 'rtl' : 'ltr'} />
      </div>
      <div className="form-group">
        <label>Image URL</label>
        <input value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} placeholder="https://..." />
      </div>
      <div className="form-group">
        <label>Author</label>
        <input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} />
      </div>
      <div className="form-group">
        <label>Tags (comma separated)</label>
        <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
      </div>
      <div className="form-group">
        <label>Excerpt</label>
        <textarea rows={2} value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} dir={isRTL ? 'rtl' : 'ltr'} />
      </div>
      <div className="form-group">
        <label>Content</label>
        <textarea rows={8} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} dir={isRTL ? 'rtl' : 'ltr'} style={{ resize: 'vertical' }} />
      </div>
      <div className="form-group" style={{ maxWidth: 200 }}>
        <label>Publish date</label>
        <input type="date" value={form.published_at?.slice(0, 10) || ''} onChange={e => setForm(f => ({ ...f, published_at: e.target.value }))} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" onClick={onSave}>Save</button>
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

export default function Blog() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const lang = i18n.language?.split('-')[0];
  const isRTL = ['fa', 'ar'].includes(lang);
  const isAdmin = user && (user.role === 'admin' || user.role === 'cooperatore');
  const [posts, setPosts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgErr, setImgErr] = useState({});
  const [comment, setComment] = useState({ name: '', email: '', text: '' });
  const [submitted, setSubmitted] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_POST);
  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState(EMPTY_POST);

  const load = () => {
    setLoading(true);
    api.get(`/api/blogs/${lang}`).then(r => setPosts(r.data)).catch(() => setPosts([])).finally(() => setLoading(false));
  };

  useEffect(() => { setSelected(null); load(); }, [lang]);

  const fmt = d => isRTL ? toFarsiDate(d) : d?.slice(0, 10);

  const saveNew = async () => {
    if (!newForm.title.trim()) return;
    const fd = new FormData();
    Object.entries({ ...newForm, lang }).forEach(([k, v]) => fd.append(k, v || ''));
    fd.append('image_url', newForm.image || '');
    await api.post('/api/blogs', fd);
    setNewForm(EMPTY_POST); setAdding(false); load();
  };

  const saveEdit = async (id) => {
    const fd = new FormData();
    Object.entries(editForm).forEach(([k, v]) => fd.append(k, v || ''));
    fd.append('image_url', editForm.image || '');
    await api.put(`/api/blogs/${id}`, fd);
    setEditingId(null); load();
  };

  const del = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    await api.delete(`/api/blogs/${id}`); load();
  };

  if (selected) {
    const tags = selected.tags ? selected.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    return (
      <div className="page" dir={isRTL ? 'rtl' : 'ltr'} style={{ maxWidth: 800 }}>
        <button onClick={() => { setSelected(null); setSubmitted(false); setComment({ name: '', email: '', text: '' }); }}
          style={{ marginBottom: 16, background: 'none', border: '1px solid #ccc', borderRadius: 4, padding: '6px 14px', cursor: 'pointer', fontSize: 14 }}>
          {isRTL ? '‹ بازگشت به دانستنی‌ها' : '‹ Back to Blog'}
        </button>
        <div className="card" style={{ marginBottom: 20 }}>
          {selected.image && !imgErr[selected.id] && (
            <img src={selected.image} alt={selected.title}
              onError={() => setImgErr(e => ({ ...e, [selected.id]: true }))}
              style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 6, marginBottom: 20 }} />
          )}
          <h1 style={{ fontSize: 22, lineHeight: 1.6, marginBottom: 8 }}>{selected.title}</h1>
          <div style={{ fontSize: 13, color: '#999', marginBottom: 20, display: 'flex', gap: 16 }}>
            {selected.author && <span>✍️ {selected.author}</span>}
            {selected.published_at && <span>📅 {fmt(selected.published_at)}</span>}
          </div>
          <div style={{ fontSize: 15, lineHeight: 2.1, color: '#333', whiteSpace: 'pre-wrap' }}>{selected.content}</div>
          {tags.length > 0 && (
            <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#888' }}>{isRTL ? 'برچسب‌ها:' : 'Tags:'}</span>
              {tags.map(tag => (
                <span key={tag} style={{ background: '#fff3cd', color: '#856404', padding: '3px 10px', borderRadius: 12, fontSize: 12, border: '1px solid #ffc107' }}>{tag}</span>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>{isRTL ? '💬 نظر خود را بنویسید' : '💬 Leave a Comment'}</h3>
          {submitted ? (
            <p style={{ color: 'green' }}>✓ {isRTL ? 'نظر شما ثبت شد. با تشکر!' : 'Your comment was submitted. Thank you!'}</p>
          ) : (
            <form onSubmit={e => { e.preventDefault(); setSubmitted(true); }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input placeholder={isRTL ? 'نام *' : 'Name *'} value={comment.name} onChange={e => setComment(c => ({ ...c, name: e.target.value }))} required style={{ margin: 0 }} />
                <input type="email" placeholder={isRTL ? 'ایمیل' : 'Email'} value={comment.email} onChange={e => setComment(c => ({ ...c, email: e.target.value }))} style={{ margin: 0 }} />
              </div>
              <textarea rows={4} placeholder={isRTL ? 'دیدگاه شما *' : 'Your comment *'} value={comment.text} onChange={e => setComment(c => ({ ...c, text: e.target.value }))} required
                style={{ resize: 'vertical', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14, fontFamily: 'inherit' }} />
              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '8px 24px' }}>{isRTL ? 'ارسال نظر' : 'Submit'}</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page" dir={isRTL ? 'rtl' : 'ltr'}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1>{isRTL ? 'دانستنی‌ها' : 'Blog'}</h1>
        {isAdmin && <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => setAdding(a => !a)}>{adding ? '✕ Cancel' : '+ New Post'}</button>}
      </div>

      {isAdmin && adding && <PostForm form={newForm} setForm={setNewForm} onSave={saveNew} onCancel={() => setAdding(false)} isRTL={isRTL} />}

      {loading && <p style={{ color: '#aaa' }}>...</p>}
      {!loading && posts.length === 0 && !adding && <p style={{ color: '#aaa' }}>{isRTL ? 'مطلبی موجود نیست.' : 'No posts yet.'}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {posts.map(post => {
          if (editingId === post.id) {
            return <PostForm key={post.id} form={editForm} setForm={setEditForm} onSave={() => saveEdit(post.id)} onCancel={() => setEditingId(null)} isRTL={isRTL} />;
          }
          const oneLine = (post.excerpt || post.content || '').split('\n').find(l => l.trim()) || '';
          return (
            <div key={post.id} className="card" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              {post.image && !imgErr[post.id] && (
                <img src={post.image} alt={post.title} onError={() => setImgErr(e => ({ ...e, [post.id]: true }))}
                  style={{ width: 110, height: 80, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, lineHeight: 1.5 }}>{post.title}</h2>
                <p style={{ fontSize: 13, color: '#666', margin: '0 0 6px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{oneLine}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {post.published_at && <span style={{ fontSize: 11, color: '#aaa' }}>📅 {fmt(post.published_at)}</span>}
                  <button onClick={() => setSelected(post)}
                    style={{ background: 'none', border: 'none', color: '#f3a847', fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                    {isRTL ? 'ادامه مطلب ›' : 'Read more ›'}
                  </button>
                </div>
              </div>
              {isAdmin && (
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => { setEditForm({ ...EMPTY_POST, ...post, published_at: post.published_at?.slice(0, 10) || '', image: post.image || '', tags: post.tags || '' }); setEditingId(post.id); }} style={aBtn('#2980b9')}>✏️</button>
                  <button onClick={() => del(post.id)} style={aBtn('#e74c3c')}>🗑</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const aBtn = bg => ({ background: bg, color: '#fff', border: 'none', borderRadius: 4, padding: '6px 10px', cursor: 'pointer', fontSize: 13 });
