import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function AboutUs() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user && (user.role === 'admin' || user.role === 'cooperatore');
  const [pageData, setPageData] = useState({ title: 'About Us', content: '' });
  const [labels, setLabels] = useState({});
  const [settings, setSettings] = useState({});
  const [translations, setTranslations] = useState({});
  const lang = i18n.language?.split('-')[0];
  const isRTL = document.documentElement.dir === 'rtl';
  const [editingLabels, setEditingLabels] = useState(false);
  const [labelForm, setLabelForm] = useState({});

  const DEFAULT_FEATURES = [
    { icon: '🌿', title: '100% Natural', desc: 'No preservatives' },
    { icon: '🏭', title: 'Fresh Made', desc: 'Small batches daily' },
    { icon: '🚚', title: 'Fast Delivery', desc: 'To your door' },
    { icon: '🌍', title: 'Worldwide', desc: '20+ countries' },
  ];

  useEffect(() => {
    api.get('/api/content/about').then(r => {
      const entry = r.data.find(c => c.lang === lang) || r.data.find(c => c.lang === 'en');
      if (entry) {
        setPageData({ title: entry.title, content: entry.content });
        const content = (() => { try { return JSON.parse(entry.content || '{}'); } catch { return {}; } })();
        setLabels({ title: entry.title || '', ...content });
      }
    }).catch(() => {});
    api.get('/api/settings').then(r => setSettings(r.data)).catch(() => {});
    api.get(`/api/translations/${lang}`).then(r => setTranslations(r.data)).catch(() => {});
  }, [lang]);

  const L = (key, fallback) => labels[key] || fallback;

  const saveLabels = async () => {
    const { title, ...rest } = labelForm;
    await api.put(`/api/content/about/${lang}`, { title: title || '', content: JSON.stringify(rest) });
    setLabels(labelForm);
    setPageData({ title: title || pageData.title, content: JSON.stringify(rest) });
    setEditingLabels(false);
  };

  const features = (() => { try { return JSON.parse(settings[`about_features_${lang}`] || 'null') || DEFAULT_FEATURES; } catch { return DEFAULT_FEATURES; } })();
  const logo = settings[`about_logo_${lang}`] || '🥛';
  const introText = L('introText', settings[`about_${lang}`] || pageData.content);

  const lat = settings.store_lat || '43.6532';
  const lng = settings.store_lng || '-79.3832';
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(lng)-0.01}%2C${parseFloat(lat)-0.01}%2C${parseFloat(lng)+0.01}%2C${parseFloat(lat)+0.01}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className="page" style={{ maxWidth: 900 }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1>{L('title', pageData.title || 'About Us')}</h1>
        {isAdmin && !editingLabels && (
          <button onClick={() => { setLabelForm(labels); setEditingLabels(true); }} style={{ background: '#2980b9', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 13 }}>✏️</button>
        )}
      </div>
      {editingLabels && (
        <div style={{ background: '#fffbe6', border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 24 }}>
          {[
            { key: 'title', label: 'Page Title', fallback: 'About Us' },
            { key: 'introText', label: 'Intro Text', fallback: '', textarea: true },
            { key: 'findUs', label: 'Find Us heading', fallback: 'Find Us' },
          ].map(({ key, label, fallback, textarea }) => (
            <div className="form-group" key={key}>
              <label style={{ fontSize: 12, color: '#666' }}>{label}</label>
              {textarea
                ? <textarea rows={4} value={labelForm[key] || ''} placeholder={fallback} dir={isRTL ? 'rtl' : 'ltr'}
                    onChange={e => setLabelForm(f => ({ ...f, [key]: e.target.value }))} />
                : <input value={labelForm[key] || ''} placeholder={fallback} dir={isRTL ? 'rtl' : 'ltr'}
                    onChange={e => setLabelForm(f => ({ ...f, [key]: e.target.value }))} />
              }
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={saveLabels}>Save</button>
            <button className="btn btn-secondary" onClick={() => setEditingLabels(false)}>Cancel</button>
          </div>
        </div>
      )}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 64, textAlign: 'center', marginBottom: 16 }}>{logo}</div>
        <p style={{ fontSize: 16, lineHeight: 1.8, color: '#333' }}>{introText}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginTop: 32 }}>
          {features.map((f, i) => (
            <div key={i} style={{ textAlign: 'center', padding: 16, background: '#f9f9f9', borderRadius: 8 }}>
              <div style={{ fontSize: 32 }}>{f.icon}</div>
              <div style={{ fontWeight: 600, marginTop: 8 }}>{f.title}</div>
              {f.desc && <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{f.desc}</div>}
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h2 style={{ marginBottom: 16 }}>📍 {L('findUs', translations.findUs || 'Find Us')}</h2>
        <p style={{ fontSize: 14, color: '#555', marginBottom: 12 }}>{settings.contact_address || '123 Nut Street, Toronto, ON, Canada'}</p>
        <iframe title="Store Location" src={mapUrl} style={{ width: '100%', height: 350, border: '1px solid #ddd', borderRadius: 8 }} allowFullScreen />
      </div>
    </div>
  );
}
