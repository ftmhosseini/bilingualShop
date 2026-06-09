import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api';

const BASE = window.location.origin;

function GalleryPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [gallery, setGallery] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const load = () => api.get('/api/settings/images').then(r => setGallery(r.data)).catch(() => {});

  const upload = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const r = await api.post('/api/settings/upload-image', fd);
      onChange(r.data.url);
      setOpen(false);
    } finally { setUploading(false); }
  };

  const preview = value ? (value.startsWith('http') ? value : `${BASE}${value}`) : null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {preview && (
          <img src={preview} alt="selected" style={{ width: 80, height: 55, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }} />
        )}
        <button type="button" className="btn btn-secondary" style={{ fontSize: 12 }} onClick={() => { load(); setOpen(o => !o); }}>
          {open ? 'Close Gallery' : '🖼 Pick from Gallery'}
        </button>
        {value && (
          <button type="button" className="btn btn-secondary" style={{ fontSize: 12, color: '#c00' }} onClick={() => onChange('')}>
            ✕ Remove
          </button>
        )}
      </div>

      {open && (
        <div style={{ border: '1px solid #ddd', borderRadius: 6, padding: 12, background: '#fafafa', marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
            <button type="button" className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => fileRef.current.click()} disabled={uploading}>
              {uploading ? 'Uploading…' : '⬆ Upload New Image'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={upload} />
          </div>
          {gallery.length === 0 && <p style={{ color: '#aaa', fontSize: 13 }}>No images in gallery yet.</p>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
            {gallery.map(img => (
              <img
                key={img.filename}
                src={`${BASE}${img.url}`}
                alt={img.filename}
                title={img.filename}
                onClick={() => { onChange(img.url); setOpen(false); }}
                style={{
                  width: 90, height: 65, objectFit: 'cover', borderRadius: 4, cursor: 'pointer',
                  border: value === img.url ? '3px solid #febd69' : '2px solid transparent',
                  transition: 'border 0.15s',
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const EMPTY = { lang: 'fa', title: '', slug: '', excerpt: '', content: '', image: '', author: '', tags: '', published_at: '' };

export default function ManageBlog() {
  const { i18n } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(null); // null = list, 'new' = new form, id = edit form
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [langFilter, setLangFilter] = useState('fa');
  const [langs, setLangs] = useState([{ code: 'fa', label: 'FA' }, { code: 'en', label: 'EN' }]);

  useEffect(() => {
    api.get('/api/languages').then(r => { if (r.data?.length) setLangs(r.data.map(l => ({ code: l.code, label: l.label || l.code }))); }).catch(() => {});
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/api/blogs/${langFilter}`);
      setPosts(r.data);
    } catch { setPosts([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [langFilter]); // eslint-disable-line

  const startEdit = post => { setForm({ ...EMPTY, ...post, published_at: post.published_at?.slice(0, 10) || '', image: post.image || '', tags: post.tags || '' }); setEditing(post.id); };
  const startNew = () => { setForm({ ...EMPTY, lang: langFilter }); setEditing('new'); };
  const cancel = () => setEditing(null);

  const save = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (k !== 'image') fd.append(k, v || ''); });
      // image_url carries the gallery URL; no file upload from this form
      fd.append('image_url', form.image || '');
      if (editing === 'new') await api.post('/api/blogs', fd);
      else await api.put(`/api/blogs/${editing}`, fd);
      cancel(); load();
    } finally { setSaving(false); }
  };

  const del = async id => {
    if (!window.confirm('Delete this post?')) return;
    await api.delete(`/api/blogs/${id}`);
    load();
  };

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  if (editing !== null) {
    return (
      <div>
        <h2 style={{ marginBottom: 20 }}>{editing === 'new' ? '➕ New Blog Post' : '✏️ Edit Blog Post'}</h2>
        <form onSubmit={save} style={{ maxWidth: 700 }}>
          <div className="form-group" style={{ maxWidth: 200 }}>
            <label>Language</label>
            <select value={form.lang} onChange={e => setField('lang', e.target.value)}>
              {langs.map(l => <option key={l.code} value={l.code}>{l.label || l.code}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Title *</label>
            <input value={form.title} onChange={e => setField('title', e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Slug (URL-friendly)</label>
            <input value={form.slug} onChange={e => setField('slug', e.target.value)} placeholder="my-post-title" />
          </div>

          <div className="form-group">
            <label>Image</label>
            <GalleryPicker value={form.image} onChange={v => setField('image', v)} />
          </div>

          <div className="form-group">
            <label>Excerpt (short summary)</label>
            <textarea rows={3} value={form.excerpt} onChange={e => setField('excerpt', e.target.value)} />
          </div>

          <div className="form-group">
            <label>Content</label>
            <textarea rows={10} value={form.content} onChange={e => setField('content', e.target.value)} style={{ fontFamily: 'inherit', lineHeight: 1.8 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Author</label>
              <input value={form.author} onChange={e => setField('author', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Published At</label>
              <input type="date" value={form.published_at} onChange={e => setField('published_at', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Tags (comma-separated)</label>
            <input value={form.tags} onChange={e => setField('tags', e.target.value)} placeholder="health, nutrition, vegan" />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            <button type="button" className="btn btn-secondary" onClick={cancel}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>📝 Blog Posts</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={langFilter} onChange={e => setLangFilter(e.target.value)} style={{ padding: '6px 10px' }}>
            {langs.map(l => <option key={l.code} value={l.code}>{l.label || l.code}</option>)}
          </select>
          <button className="btn btn-primary" onClick={startNew}>+ New Post</button>
        </div>
      </div>

      {loading && <p style={{ color: '#aaa' }}>Loading…</p>}
      {!loading && posts.length === 0 && <p style={{ color: '#aaa' }}>No blog posts for this language.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {posts.map(post => (
          <div key={post.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {post.image ? (
              <img src={post.image.startsWith('http') ? post.image : `${BASE}${post.image}`}
                alt={post.title} style={{ width: 90, height: 65, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
            ) : (
              <div style={{ width: 90, height: 65, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#ccc', fontSize: 24 }}>🖼</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{post.title}</div>
              <div style={{ fontSize: 12, color: '#aaa' }}>
                {post.author && <span>{post.author} · </span>}
                {post.published_at?.slice(0, 10)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button className="btn btn-secondary" style={{ fontSize: 12 }} onClick={() => startEdit(post)}>Edit</button>
              <button className="btn btn-secondary" style={{ fontSize: 12, color: '#c00' }} onClick={() => del(post.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
