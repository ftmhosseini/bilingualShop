import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import api from '../../api';

const base = process.env.REACT_APP_API_URL || '';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [logoUrl, setLogoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [images, setImages] = useState([]);
  const fileRef = useRef();
  const [androidUrl, setAndroidUrl] = useState('');
  const [iosUrl, setIosUrl] = useState('');
  const [appSaved, setAppSaved] = useState('');

  useEffect(() => {
    api.get('/api/settings').then(r => {
      if (r.data.logo_url) setLogoUrl(r.data.logo_url);
      setAndroidUrl(r.data.android_app_url || '');
      setIosUrl(r.data.ios_app_url || '');
    });
    if (user?.role === 'admin') loadImages();
  }, []);

  const loadImages = () => api.get('/api/settings/images').then(r => setImages(r.data));

  const saveAppUrl = async (key, value) => {
    await api.put(`/api/settings/${key}`, { value });
    setAppSaved(key);
    setTimeout(() => setAppSaved(''), 2000);
  };

  const upload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('logo', file);
    const r = await api.post('/api/settings/upload-logo', fd);
    setLogoUrl(r.data.url);
    setUploading(false);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const deleteImage = async (filename) => {
    if (!window.confirm('Delete this image?')) return;
    await api.delete(`/api/settings/images/${filename}`);
    loadImages();
  };

  return (
    <div>
      <h2>{t('dashboard')}</h2>
      <p style={{ marginTop: 8, color: '#666' }}>{t('welcome')}, {user?.email}</p>

      {/* Logo upload */}
      <div className="card" style={{ maxWidth: 360, marginTop: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
        <img src={logoUrl ? `${base}${logoUrl}` : '/logo192.png'} alt="logo"
          style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid #ddd' }} />
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Site Logo</div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={upload} />
          <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => fileRef.current.click()} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload New Logo'}
          </button>
          {saved && <span style={{ color: 'green', fontSize: 13, marginLeft: 8 }}>✓ Saved</span>}
        </div>
      </div>

      {/* Mobile App Links — admin only */}
      {user?.role === 'admin' && (
        <div className="card" style={{ maxWidth: 480, marginTop: 24 }}>
          <h3 style={{ margin: '0 0 16px' }}>📱 Mobile App Download Links</h3>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
            Paste the store links below. They will appear as download buttons in the website footer.
          </p>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>🤖 Android (Google Play URL)</label>
            <div style={{ display: 'flex', gap: 8}}>
              <input value={androidUrl} onChange={e => setAndroidUrl(e.target.value)}
                placeholder="https://play.google.com/store/apps/details?id=..."
                style={{ flex: 1, fontSize: 13, height:30 }} />
              <button className="btn btn-primary" style={{ fontSize: 13, whiteSpace: 'nowrap' , height:30}}
                onClick={() => saveAppUrl('android_app_url', androidUrl)}>Save</button>
            </div>
            {appSaved === 'android_app_url' && <span style={{ color: 'green', fontSize: 12 }}>✓ Saved</span>}
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>🍎 iOS (App Store URL)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={iosUrl} onChange={e => setIosUrl(e.target.value)}
                placeholder="https://apps.apple.com/app/..."
                style={{ flex: 1, fontSize: 13 , height:30}} />
              <button className="btn btn-primary" style={{ fontSize: 13, whiteSpace: 'nowrap', height:30 }}
                onClick={() => saveAppUrl('ios_app_url', iosUrl)}>Save</button>
            </div>
            {appSaved === 'ios_app_url' && <span style={{ color: 'green', fontSize: 12 }}>✓ Saved</span>}
          </div>
        </div>
      )}

      {/* Image Gallery — admin only */}
      {user?.role === 'admin' && (
      <div className="card" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>🖼️ Image Gallery</h3>
          <span style={{ fontSize: 13, color: '#888' }}>{images.length} image{images.length !== 1 ? 's' : ''}</span>
        </div>
        {images.length === 0 ? (
          <p style={{ color: '#aaa', fontSize: 14 }}>No uploaded images yet. Upload images via Hero Slides in Content Settings.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {images.map(img => (
              <div key={img.filename} style={{ position: 'relative', border: '1px solid #ddd', borderRadius: 6, overflow: 'hidden', width: 120 }}>
                <img src={`${base}${img.url}`} alt={img.filename}
                  style={{ width: 120, height: 90, objectFit: 'cover', display: 'block' }} />
                <div style={{ padding: '4px 6px', background: '#f9f9f9', fontSize: 11, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {img.filename.replace(/^\d+-/, '')}
                </div>
                <button onClick={() => deleteImage(img.filename)}
                  style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      <div style={{ display: 'flex', gap: 16, marginTop: 24, flexWrap: 'wrap' }}>
        <Link to="/admin/products" className="card" style={{ flex: 1, minWidth: 160, textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 32 }}>📦</div>
          <div style={{ marginTop: 8, fontWeight: 600 }}>{t('manageProducts')}</div>
        </Link>
        {user?.role === 'admin' && (
          <>
            <Link to="/admin/users" className="card" style={{ flex: 1, minWidth: 160, textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: 32 }}>👥</div>
              <div style={{ marginTop: 8, fontWeight: 600 }}>{t('manageUsers')}</div>
            </Link>
            <Link to="/admin/theme" className="card" style={{ flex: 1, minWidth: 160, textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: 32 }}>🎨</div>
              <div style={{ marginTop: 8, fontWeight: 600 }}>{t('themeSettings')}</div>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
