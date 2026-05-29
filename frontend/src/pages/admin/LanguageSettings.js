import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api';

export default function LanguageSettings() {
  const { t } = useTranslation();
  const [languages, setLanguages] = useState([]);
  const [saved, setSaved] = useState(false);
  const [newLang, setNewLang] = useState({ code: '', label: '', flag: '', rtl: false });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api.get('/api/languages').then(r => setLanguages(r.data));
  }, []);

  const toggle = i => {
    setLanguages(prev => {
      const l = [...prev];
      if (l[i].enabled && l.filter(x => x.enabled).length <= 1) return l;
      l[i] = { ...l[i], enabled: !l[i].enabled };
      return l;
    });
    setSaved(false);
  };

  const save = async () => {
    await api.put('/api/languages', languages);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const addLanguage = async () => {
    if (!newLang.code.trim() || !newLang.label.trim()) return;
    const updated = [...languages, { ...newLang, enabled: false, sort_order: languages.length + 1 }];
    await api.put('/api/languages', updated);
    setLanguages(updated);
    setNewLang({ code: '', label: '', flag: '', rtl: false });
    setAdding(false);
  };

  const remove = async (code) => {
    if (!window.confirm(`Delete language "${code}"?`)) return;
    await api.delete(`/api/languages/${code}`);
    setLanguages(prev => prev.filter(l => l.code !== code));
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>{t('selectLanguage')} Settings</h2>
      <div className="card" style={{ maxWidth: 460 }}>
        <p style={{ marginBottom: 16, color: '#666', fontSize: 14 }}>
          New languages start disabled. Add your content and translations first, then enable to show on the storefront.
        </p>
        {languages.map((lang, i) => (
          <div key={lang.code} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #eee', opacity: lang.enabled ? 1 : 0.6 }}>
            <input type="checkbox" checked={!!lang.enabled} onChange={() => toggle(i)} style={{ width: 18, height: 18, cursor: 'pointer' }} title={lang.enabled ? 'Visible on storefront' : 'Hidden from storefront'} />
            <span style={{ fontSize: 22 }}>{lang.flag}</span>
            <span style={{ fontSize: 15, flex: 1 }}>{lang.label}</span>
            <span style={{ fontSize: 11, color: lang.enabled ? '#27ae60' : '#e67e22', fontWeight: 500 }}>{lang.enabled ? '● Live' : '● Draft'}</span>
            <span style={{ fontSize: 12, color: '#888', fontFamily: 'monospace' }}>{lang.code}</span>
            {lang.rtl ? <span style={{ fontSize: 11, color: '#888' }}>RTL</span> : null}
            {!['en','fa','ar'].includes(lang.code) && (
              <button onClick={() => remove(lang.code)} style={{ background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer', fontSize: 16 }}>✕</button>
            )}
          </div>
        ))}

        {adding ? (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input value={newLang.code} onChange={e => setNewLang(p => ({ ...p, code: e.target.value.toLowerCase() }))}
                placeholder="Code (e.g. de, zh)" style={{ marginBottom: 0 }} />
              <input value={newLang.label} onChange={e => setNewLang(p => ({ ...p, label: e.target.value }))}
                placeholder="Name (e.g. Deutsch)" style={{ marginBottom: 0 }} />
              <input value={newLang.flag} onChange={e => setNewLang(p => ({ ...p, flag: e.target.value }))}
                placeholder="Flag emoji 🇩🇪" style={{ marginBottom: 0 }} maxLength={4} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <input type="checkbox" checked={newLang.rtl} onChange={e => setNewLang(p => ({ ...p, rtl: e.target.checked }))} />
                RTL direction
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={addLanguage}>Add</button>
              <button className="btn btn-secondary" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => setAdding(true)}>+ Add Language</button>
        )}

        <button className="btn btn-primary" style={{ marginTop: 12, width: '100%' }} onClick={save}>{t('save')}</button>
        {saved && <p style={{ color: 'green', marginTop: 8, fontSize: 13 }}>✓ Saved</p>}
      </div>
    </div>
  );
}
