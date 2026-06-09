import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';

function toFarsiDate(dateStr) {
  if (!dateStr) return '';
  try { return new Date(dateStr).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }); }
  catch { return dateStr; }
}

export default function Blog() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.split('-')[0];
  const isRTL = ['fa', 'ar'].includes(lang);
  const [posts, setPosts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgErr, setImgErr] = useState({});
  const [comment, setComment] = useState({ name: '', email: '', text: '' });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setLoading(true); setSelected(null);
    api.get(`/api/blogs/${lang}`).then(r => setPosts(r.data)).catch(() => setPosts([])).finally(() => setLoading(false));
  }, [lang]);

  const fmt = d => isRTL ? toFarsiDate(d) : d?.slice(0, 10);

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
          <div style={{ fontSize: 15, lineHeight: 2.1, color: '#333', whiteSpace: 'pre-wrap' }}>
            {selected.content}
          </div>

          {tags.length > 0 && (
            <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#888' }}>{isRTL ? 'برچسب‌ها:' : 'Tags:'}</span>
              {tags.map(tag => (
                <span key={tag} style={{ background: '#fff3cd', color: '#856404', padding: '3px 10px', borderRadius: 12, fontSize: 12, border: '1px solid #ffc107' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Comments / Opinion section */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>{isRTL ? '💬 نظر خود را بنویسید' : '💬 Leave a Comment'}</h3>
          {submitted ? (
            <p style={{ color: 'green' }}>✓ {isRTL ? 'نظر شما ثبت شد. با تشکر!' : 'Your comment was submitted. Thank you!'}</p>
          ) : (
            <form onSubmit={e => { e.preventDefault(); setSubmitted(true); }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input placeholder={isRTL ? 'نام *' : 'Name *'} value={comment.name}
                  onChange={e => setComment(c => ({ ...c, name: e.target.value }))} required style={{ margin: 0 }} />
                <input type="email" placeholder={isRTL ? 'ایمیل' : 'Email'} value={comment.email}
                  onChange={e => setComment(c => ({ ...c, email: e.target.value }))} style={{ margin: 0 }} />
              </div>
              <textarea rows={4} placeholder={isRTL ? 'دیدگاه شما *' : 'Your comment *'} value={comment.text}
                onChange={e => setComment(c => ({ ...c, text: e.target.value }))} required
                style={{ resize: 'vertical', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14, fontFamily: 'inherit' }} />
              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '8px 24px' }}>
                {isRTL ? 'ارسال نظر' : 'Submit'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page" dir={isRTL ? 'rtl' : 'ltr'}>
      <h1 style={{ marginBottom: 24 }}>{isRTL ? 'دانستنی‌ها' : 'Blog'}</h1>
      {loading && <p style={{ color: '#aaa' }}>...</p>}
      {!loading && posts.length === 0 && <p style={{ color: '#aaa' }}>{isRTL ? 'مطلبی موجود نیست.' : 'No posts yet.'}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {posts.map(post => {
          // one line of excerpt
          const oneLine = (post.excerpt || post.content || '').split('\n').find(l => l.trim()) || '';
          return (
            <div key={post.id} className="card" style={{ display: 'flex', gap: 14, alignItems: 'center', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
              {post.image && !imgErr[post.id] && (
                <img src={post.image} alt={post.title}
                  onError={() => setImgErr(e => ({ ...e, [post.id]: true }))}
                  style={{ width: 110, height: 80, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, lineHeight: 1.5 }}>{post.title}</h2>
                <p style={{ fontSize: 13, color: '#666', margin: '0 0 6px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {oneLine}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {post.published_at && <span style={{ fontSize: 11, color: '#aaa' }}>📅 {fmt(post.published_at)}</span>}
                  <button onClick={() => setSelected(post)}
                    style={{ background: 'none', border: 'none', color: '#f3a847', fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                    {isRTL ? 'ادامه مطلب ›' : 'Read more ›'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
