import { useEffect, useState, useRef } from 'react';
import api from '../../api';

const TABS = ['About Us', 'Contact Us', 'Hero Slides', 'FAQ', 'Nav Bar', 'Languages', 'Currencies', 'Trust Badges', 'Translations', 'Auth Pages'];

export default function ContentSettings() {
  const [tab, setTab] = useState(0);
  const [settings, setSettings] = useState({});
  const [saved, setSaved] = useState('');

  useEffect(() => {
    api.get('/api/settings').then(r => setSettings(r.data)).catch(() => { });
  }, []);

  const save = async (key, value) => {
    const strValue = typeof value === 'string' ? value : JSON.stringify(value);
    await api.put(`/api/settings/${key}`, { value: strValue });
    setSettings(s => ({ ...s, [key]: strValue }));
    setSaved(key);
    setTimeout(() => setSaved(''), 2000);
  };

  const set = (key, value) => setSettings(s => ({ ...s, [key]: value }));

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Content Settings</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #ddd', flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{ padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: tab === i ? 700 : 400, borderBottom: tab === i ? '2px solid #febd69' : '2px solid transparent', marginBottom: -2, fontSize: 14 }}>
            {t}
          </button>
        ))}
      </div>

      {/* About Us */}
      {tab === 0 && <AboutTab settings={settings} set={set} save={save} saved={saved} />}
      {tab === 1 && <ContactTab settings={settings} set={set} save={save} saved={saved} />}
      {tab === 2 && <SlidesTab settings={settings} set={set} save={save} saved={saved} />}
      {tab === 3 && <FAQTab settings={settings} set={set} save={save} saved={saved} />}
      {tab === 4 && <NavBarTab settings={settings} save={save} saved={saved} />}
      {tab === 5 && <LanguagesTab settings={settings} set={set} save={save} saved={saved} />}
      {tab === 6 && <CurrenciesTab />}
      {tab === 7 && <TrustBadgesTab settings={settings} set={set} save={save} saved={saved} />}
      {tab === 8 && <TranslationsTab />}
      {tab === 9 && <AuthPagesTab settings={settings} save={save} saved={saved} />}
    </div>
  );
}

function SaveBtn({ keyName, saved, onSave }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
      <button className="btn btn-primary" onClick={onSave}>Save</button>
      {saved === keyName && <span style={{ color: 'green', fontSize: 13 }}>✓ Saved</span>}
    </div>
  );
}

function AboutTab({ settings, set, save, saved }) {
  const [langs, setLangs] = useState([]);
  const [previewLang, setPreviewLang] = useState('en');
  const [editing, setEditing] = useState(null);
  const [pickerIdx, setPickerIdx] = useState(null);
  const [uploading, setUploading] = useState(false);
  const logoFileRef = useRef();

  const DEFAULT_FEATURES = [
    { icon: '🌿', title: '100% Natural', desc: 'No preservatives' },
    { icon: '🏭', title: 'Fresh Made', desc: 'Small batches daily' },
    { icon: '🚚', title: 'Fast Delivery', desc: 'To your door' },
    { icon: '🌍', title: 'Worldwide', desc: '20+ countries' },
  ];

  const EMOJI_LIST = ['🌿', '🏭', '🚚', '🌍', '🥛', '🌾', '🌱', '🍃', '⭐', '🏆', '💚', '🔬', '🧪', '🫙', '🥜', '🌰', '🍫', '🧈', '🫐', '🍓', '🌻', '🌺', '🌸', '💧', '❄️', '🔥', '✅', '🎯', '💡', '🛡️', '🤝', '📦', '🚀', '💎', '🏅', '🎁'];

  useEffect(() => {
    api.get('/api/languages').then(r => {
      setLangs(r.data);
      if (r.data[0]) setPreviewLang(r.data[0].code);
    });
  }, []);

  const featKey = `about_features_${previewLang}`;
  const features = (() => { try { return JSON.parse(settings[featKey] || 'null') || DEFAULT_FEATURES; } catch { return DEFAULT_FEATURES; } })();
  const setFeatures = v => { set(featKey, JSON.stringify(v)); save(featKey, v); };

  const updateFeature = (i, k, v) => { const f = [...features]; f[i] = { ...f[i], [k]: v }; setFeatures(f); };
  const addFeature = () => setFeatures([...features, { icon: '⭐', title: 'New Feature', desc: 'Description' }]);
  const removeFeature = i => setFeatures(features.filter((_, idx) => idx !== i));

  const uploadLogo = async (file) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    const r = await api.post('/api/settings/upload-image', fd);
    set(logoKey, r.data.url);
    save(logoKey, r.data.url);
    setUploading(false);
    setPickerIdx(null);
  };

  const isRTL = ['fa', 'ar'].includes(previewLang);
  const introKey = `about_${previewLang}`;
  const logoKey = `about_logo_${previewLang}`;
  const previewContent = settings[introKey] || '';
  const previewLogo = settings[logoKey] || '🥛';

  // Inline editable text in preview
  const Editable = ({ eKey, value, placeholder, multiline, style = {}, textStyle = {} }) => {
    const active = editing === eKey;
    const onChange = v => set(eKey, v);
    const onBlur = () => { setEditing(null); save(eKey, settings[eKey]); };
    return active
      ? (multiline
        ? <textarea autoFocus rows={4} value={value} dir={isRTL ? 'rtl' : 'ltr'} onChange={e => onChange(e.target.value)} onBlur={onBlur}
          style={{ width: '100%', fontSize: 14, border: '2px solid #febd69', borderRadius: 4, padding: 6, resize: 'vertical', ...style }} />
        : <input autoFocus value={value} dir={isRTL ? 'rtl' : 'ltr'} onChange={e => onChange(e.target.value)} onBlur={onBlur}
          style={{ width: '100%', fontSize: 13, border: '2px solid #febd69', borderRadius: 4, padding: '3px 6px', ...style }} />
      )
      : <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, cursor: 'text', ...style }} onClick={() => setEditing(eKey)}>
        <span style={{ flex: 1, color: value ? '#333' : '#bbb', whiteSpace: 'pre-wrap', lineHeight: 1.7, ...textStyle }}>{value || placeholder}</span>
        <button type="button" onClick={e => { e.stopPropagation(); setEditing(eKey); }}
          style={{ background: 'none', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', fontSize: 10, padding: '1px 4px', color: '#888', flexShrink: 0, opacity: 0.7 }}>✏️</button>
      </div>;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

      {/* Left: language text editors */}
      <div style={{ maxWidth: 500 }}>
        {langs.map(l => (
          <div key={l.code} className="card" style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>{l.flag} {l.label} — About Text</label>
            <textarea rows={5} value={settings[`about_${l.code}`] || ''} dir={l.rtl ? 'rtl' : 'ltr'}
              onChange={e => { set(`about_${l.code}`, e.target.value); setPreviewLang(l.code); }}
              style={{ width: '100%', marginBottom: 0 }} />
            <SaveBtn keyName={`about_${l.code}`} saved={saved} onSave={() => save(`about_${l.code}`, settings[`about_${l.code}`])} />
          </div>
        ))}
      </div>

      {/* Right: live editable preview */}
      <div style={{ position: 'sticky', top: 16 }}>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>✏️ Click any text or icon to edit</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {langs.map(l => (
              <button key={l.code} type="button" onClick={() => { setPreviewLang(l.code); setEditing(null); }}
                style={{ padding: '2px 8px', border: '1px solid #ddd', borderRadius: 4, background: previewLang === l.code ? '#febd69' : '#fff', cursor: 'pointer', fontSize: 12 }}>
                {l.flag} {l.code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100vh' }}>
          <div style={{ background: '#131921', padding: '8px 16px', fontSize: 12, color: '#febd69', fontWeight: 600 }}>About Us — {previewLang.toUpperCase()}</div>
          <div style={{ padding: 20 }} dir={isRTL ? 'rtl' : 'ltr'}>

            {/* Logo / main icon */}
            <div style={{ textAlign: 'center', marginBottom: 12, position: 'relative', display: 'inline-block', width: '100%' }}>
              <div style={{ cursor: 'pointer', display: 'inline-block' }} onClick={() => setPickerIdx(pickerIdx === 'logo' ? null : 'logo')} title="Click to change">
                {previewLogo.startsWith('/') || previewLogo.startsWith('http')
                  ? <img src={`${process.env.REACT_APP_API_URL || ''}${previewLogo.startsWith('http') ? '' : ''}${previewLogo}`} alt="logo"
                    style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 8, border: '2px solid #eee' }} />
                  : <span style={{ fontSize: 48 }}>{previewLogo}</span>
                }
              </div>
              <div style={{ fontSize: 11, color: '#aaa' }}>click to change</div>
              {pickerIdx === 'logo' && (
                <div style={{ position: 'absolute', top: '110%', left: '50%', transform: 'translateX(-50%)', zIndex: 99, background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', width: 280 }}>
                  {/* Upload image option */}
                  <label style={{ display: 'block', marginBottom: 8, cursor: 'pointer' }}>
                    <div className="btn btn-primary" style={{ width: '100%', textAlign: 'center', fontSize: 13, padding: '6px 0' }}>
                      {uploading ? 'Uploading…' : '📁 Upload Image'}
                    </div>
                    <input ref={logoFileRef} type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={e => e.target.files[0] && uploadLogo(e.target.files[0])} />
                  </label>
                  <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6, textAlign: 'center' }}>— or pick an emoji —</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {EMOJI_LIST.map(e => (
                      <button key={e} type="button" onClick={() => { set(logoKey, e); save(logoKey, e); setPickerIdx(null); }}
                        style={{ fontSize: 22, background: previewLogo === e ? '#fffbe6' : 'none', border: previewLogo === e ? '2px solid #febd69' : '1px solid transparent', borderRadius: 4, cursor: 'pointer', padding: 2 }}>{e}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Intro text */}
            <div style={{ marginBottom: 16, padding: '8px 10px', background: '#fffbe6', borderRadius: 6, border: '1px dashed #febd69' }}>
              <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>Intro text</div>
              <Editable eKey={introKey} value={previewContent} placeholder="Click ✏️ to add about us text…" multiline />
            </div>

            {/* Features */}
            <div style={{ fontSize: 12, color: '#888', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Features</span>
              <button type="button" className="btn btn-secondary" style={{ fontSize: 11, padding: '2px 8px' }} onClick={addFeature}>+ Add</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {features.map((f, i) => (
                <div key={i} style={{ background: '#f9f9f9', borderRadius: 6, padding: 10, position: 'relative' }}>
                  {/* Remove button */}
                  <button type="button" onClick={() => removeFeature(i)}
                    style={{ position: 'absolute', top: 4, right: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#e74c3c', lineHeight: 1 }}>✕</button>

                  {/* Icon picker */}
                  <div style={{ textAlign: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 24, cursor: 'pointer' }} onClick={() => setPickerIdx(pickerIdx === i ? null : i)} title="Click to change">{f.icon}</span>
                    {pickerIdx === i && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 99, background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', display: 'flex', flexWrap: 'wrap', gap: 3, width: 220 }}>
                        {EMOJI_LIST.map(e => (
                          <button key={e} type="button" onClick={() => { updateFeature(i, 'icon', e); setPickerIdx(null); }}
                            style={{ fontSize: 18, background: f.icon === e ? '#fffbe6' : 'none', border: f.icon === e ? '2px solid #febd69' : '1px solid transparent', borderRadius: 4, cursor: 'pointer', padding: 2 }}>{e}</button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <div style={{ textAlign: 'center' }}>
                    {editing === `feat_${i}_title` ? (
                      <input autoFocus value={f.title} onChange={e => updateFeature(i, 'title', e.target.value)}
                        onBlur={() => setEditing(null)} dir={isRTL ? 'rtl' : 'ltr'}
                        style={{ width: '100%', fontSize: 11, fontWeight: 600, textAlign: 'center', border: '2px solid #febd69', borderRadius: 4, padding: '2px 4px' }} />
                    ) : (
                      <div style={{ fontSize: 11, fontWeight: 600, cursor: 'text', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}
                        onClick={() => setEditing(`feat_${i}_title`)}>
                        {f.title} <span style={{ opacity: 0.5, fontSize: 10 }}>✏️</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div style={{ textAlign: 'center', marginTop: 2 }}>
                    {editing === `feat_${i}_desc` ? (
                      <input autoFocus value={f.desc || ''} onChange={e => updateFeature(i, 'desc', e.target.value)}
                        onBlur={() => setEditing(null)} dir={isRTL ? 'rtl' : 'ltr'}
                        style={{ width: '100%', fontSize: 10, textAlign: 'center', border: '2px solid #febd69', borderRadius: 4, padding: '2px 4px' }} />
                    ) : (
                      <div style={{ fontSize: 10, color: '#888', cursor: 'text', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}
                        onClick={() => setEditing(`feat_${i}_desc`)}>
                        {f.desc || <span style={{ color: '#ccc' }}>description</span>} <span style={{ opacity: 0.5 }}>✏️</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>Changes auto-save. Switch language tabs to edit per language.</p>
      </div>
    </div>
  );
}

function MapPicker({ lat, lng, onPick }) {
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const mapLat = lat || 43.6532;
  const mapLng = lng || -79.3832;
  const zoom = lat ? 14 : 2;

  const geocode = async () => {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=1`);
      const data = await r.json();
      if (data[0]) onPick(parseFloat(data[0].lat), parseFloat(data[0].lon), data[0].display_name);
    } finally { setSearching(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && geocode()}
          placeholder="Search address or place..." style={{ flex: 1, marginBottom: 0 }} />
        <button type="button" className="btn btn-secondary" onClick={geocode} disabled={searching} style={{ whiteSpace: 'nowrap' }}>
          {searching ? '...' : '🔍 Find'}
        </button>
      </div>
      <iframe
        key={`${mapLat},${mapLng},${zoom}`}
        title="map"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapLng - 0.05},${mapLat - 0.05},${mapLng + 0.05},${mapLat + 0.05}&layer=mapnik&marker=${mapLat},${mapLng}`}
        style={{ width: '100%', height: 220, border: '1px solid #ddd', borderRadius: 6 }}
      />
      {lat && <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>📍 {lat}, {lng}</p>}
    </div>
  );
}

function ContactTab({ settings, set, save, saved }) {
  const [langs, setLangs] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [locations, setLocations] = useState([{ name: '', email: '', phone: '', address: '', hours: '', lat: '', lng: '', countries: [] }]);
  const [locSaved, setLocSaved] = useState(false);
  const [previewLang, setPreviewLang] = useState('en');
  const [editing, setEditing] = useState(null); // 'intro' | 'title' | 'email' | 'phone' | 'address' | 'hours' | 'getInTouch' | 'sendMsg'

  useEffect(() => {
    api.get('/api/languages').then(r => { const l = r.data; setLangs(l); if (l[0]) setPreviewLang(l[0].code); });
    api.get('/api/currencies').then(r => setCurrencies(r.data));
  }, []);
  useEffect(() => {
    try { const locs = JSON.parse(settings.contact_locations || '[]'); if (locs.length) setLocations(locs); } catch { }
  }, [settings.contact_locations]);

  const updateLoc = (i, k, v) => setLocations(prev => { const l = [...prev]; l[i] = { ...l[i], [k]: v }; return l; });
  const toggleCountry = (i, code) => { const cur = locations[i].countries || []; updateLoc(i, 'countries', cur.includes(code) ? cur.filter(c => c !== code) : [...cur, code]); };
  const addLoc = () => setLocations(prev => [...prev, { name: '', email: '', phone: '', address: '', hours: '', lat: '', lng: '', countries: [] }]);
  const removeLoc = i => setLocations(prev => prev.filter((_, idx) => idx !== i));
  const saveLocs = () => { save('contact_locations', locations); setLocSaved(true); setTimeout(() => setLocSaved(false), 2000); };
  const saveIntro = () => save(`contact_${previewLang}`, settings[`contact_${previewLang}`]);

  const loc = locations[0] || {};
  const introKey = `contact_${previewLang}`;
  const isRTL = ['fa', 'ar'].includes(previewLang);

  // Inline editable field in preview
  const EditableField = ({ fieldKey, value, placeholder, multiline, style = {} }) => {
    const isActive = editing === fieldKey;
    return (
      <div style={{ position: 'relative', ...style }} onMouseEnter={() => { }} >
        {isActive ? (
          multiline
            ? <textarea autoFocus rows={3} value={value} dir={isRTL ? 'rtl' : 'ltr'}
              onChange={e => set(introKey, e.target.value)}
              onBlur={() => { setEditing(null); saveIntro(); }}
              style={{ width: '100%', fontSize: 13, border: '2px solid #febd69', borderRadius: 4, padding: 6, resize: 'vertical' }} />
            : <input autoFocus value={value} dir={isRTL ? 'rtl' : 'ltr'}
              onChange={e => set(introKey, e.target.value)}
              onBlur={() => { setEditing(null); saveIntro(); }}
              style={{ width: '100%', fontSize: 13, border: '2px solid #febd69', borderRadius: 4, padding: '4px 6px' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, cursor: 'text' }} onClick={() => setEditing(fieldKey)}>
            <span style={{ flex: 1, color: value ? '#333' : '#bbb', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {value || placeholder}
            </span>
            <button type="button" title="Edit" onClick={e => { e.stopPropagation(); setEditing(fieldKey); }}
              style={{ background: 'none', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', fontSize: 11, padding: '1px 5px', color: '#888', flexShrink: 0, opacity: 0.7 }}>✏️</button>
          </div>
        )}
      </div>
    );
  };

  // Inline editable for location fields (not settings keys, but locations state)
  const EditableLocField = ({ locIdx, field, value, placeholder, icon, style = {} }) => {
    const key = `loc_${locIdx}_${field}`;
    const isActive = editing === key;
    return (
      <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start', ...style }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
        {isActive
          ? <input autoFocus value={value} onChange={e => updateLoc(locIdx, field, e.target.value)}
            onBlur={() => { setEditing(null); saveLocs(); }}
            style={{ flex: 1, fontSize: 12, border: '2px solid #febd69', borderRadius: 4, padding: '2px 6px' }} />
          : <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, cursor: 'text' }} onClick={() => setEditing(key)}>
            <span style={{ fontSize: 12, color: value ? '#444' : '#bbb', flex: 1 }}>{value || placeholder}</span>
            <button type="button" onClick={e => { e.stopPropagation(); setEditing(key); }}
              style={{ background: 'none', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', fontSize: 10, padding: '1px 4px', color: '#888', opacity: 0.7 }}>✏️</button>
          </div>
        }
      </div>
    );
  };

  // Editable section heading
  const EditableHeading = ({ settingKey, value, placeholder, style = {} }) => {
    const isActive = editing === settingKey;
    return isActive
      ? <input autoFocus value={value || ''} onChange={e => set(settingKey, e.target.value)}
        onBlur={() => { setEditing(null); save(settingKey, settings[settingKey]); }}
        style={{ fontWeight: 600, fontSize: 13, border: '2px solid #febd69', borderRadius: 4, padding: '2px 6px', marginBottom: 8, width: '100%', ...style }} />
      : <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8, cursor: 'text', ...style }} onClick={() => setEditing(settingKey)}>
        <span style={{ fontWeight: 600, fontSize: 13, flex: 1, color: value ? '#111' : '#bbb' }}>{value || placeholder}</span>
        <button type="button" onClick={e => { e.stopPropagation(); setEditing(settingKey); }}
          style={{ background: 'none', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', fontSize: 10, padding: '1px 4px', color: '#888', opacity: 0.7 }}>✏️</button>
      </div>;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

      {/* Left: location details + country visibility + map */}
      <div style={{ maxWidth: 500 }}>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 12 }}>Locations</h3>
          {locations.map((loc, i) => (
            <div key={i} className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <strong>Location {i + 1}</strong>
                {locations.length > 1 && <button className="btn btn-danger" style={{ padding: '2px 8px' }} onClick={() => removeLoc(i)}>✕</button>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group"><label>Location Name</label><input value={loc.name} onChange={e => updateLoc(i, 'name', e.target.value)} placeholder="Head Office" /></div>
                <div className="form-group"><label>Email</label><input type="email" value={loc.email} onChange={e => updateLoc(i, 'email', e.target.value)} /></div>
                <div className="form-group"><label>Phone</label><input value={loc.phone} onChange={e => updateLoc(i, 'phone', e.target.value)} /></div>
                <div className="form-group"><label>Business Hours</label><input value={loc.hours} onChange={e => updateLoc(i, 'hours', e.target.value)} /></div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}><label>Address</label><input value={loc.address} onChange={e => updateLoc(i, 'address', e.target.value)} /></div>
              </div>
              {currencies.length > 0 && (
                <div className="form-group" style={{ marginTop: 8 }}>
                  <label style={{ display: 'block', marginBottom: 6 }}>Show for countries <span style={{ fontSize: 12, color: '#888' }}>(leave all unchecked = show everywhere)</span></label>
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'nowrap' }}>
                    {currencies.map(c => (
                      <div key={c.currency_code} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', alignContent:'center',gap: 2, marginRight: 16, fontSize: 13 }}>
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                          <input type="checkbox" checked={(loc.countries || []).includes(c.currency_code)} onChange={() => toggleCountry(i, c.currency_code)} style={{ cursor: 'pointer', width: 16, height: 16, margin: 0 }} />
                          <span style={{ fontSize: 18, lineHeight: '16px' }}>{c.flag}</span>
                        </div>
                        <span>{c.country}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="form-group" style={{ marginTop: 8 }}>
                <label style={{ display: 'block', marginBottom: 6 }}>Map Location</label>
                <MapPicker lat={parseFloat(loc.lat) || 0} lng={parseFloat(loc.lng) || 0}
                  onPick={(lat, lng, addr) => { updateLoc(i, 'lat', String(lat)); updateLoc(i, 'lng', String(lng)); if (!loc.address) updateLoc(i, 'address', addr); }} />
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={addLoc}>+ Add Location</button>
            <button className="btn btn-primary" onClick={saveLocs}>Save Locations</button>
            {locSaved && <span style={{ color: 'green', fontSize: 13, alignSelf: 'center' }}>✓ Saved</span>}
          </div>
        </div>
      </div>

      {/* Right: live editable preview */}
      <div style={{ position: 'sticky', top: 16 }}>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>✏️ Click any text to edit</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {langs.map(l => (
              <button key={l.code} type="button" onClick={() => setPreviewLang(l.code)}
                style={{ padding: '2px 8px', border: '1px solid #ddd', borderRadius: 4, background: previewLang === l.code ? '#febd69' : '#fff', cursor: 'pointer', fontSize: 12 }}>
                {l.flag} {l.code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ background: '#131921', padding: '8px 16px', fontSize: 12, color: '#febd69', fontWeight: 600 }}>
            Contact Us — {previewLang.toUpperCase()}
          </div>
          <div style={{ padding: 16 }} dir={isRTL ? 'rtl' : 'ltr'}>

            {/* Intro text */}
            <div style={{ marginBottom: 12, padding: '8px 10px', background: '#fffbe6', borderRadius: 6, border: '1px dashed #febd69' }}>
              <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>Intro text</div>
              <EditableField fieldKey="intro" value={settings[introKey] || ''} placeholder="Click ✏️ to add intro text for this language…" multiline />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Get in Touch card */}
              <div style={{ background: '#f9f9f9', borderRadius: 6, padding: 12 }}>
                <EditableHeading settingKey={`contact_heading_touch_${previewLang}`}
                  value={settings[`contact_heading_touch_${previewLang}`]}
                  placeholder="Get in Touch" />
                <EditableLocField locIdx={0} field="email" value={loc.email} placeholder="your@email.com" icon="📧" />
                <EditableLocField locIdx={0} field="phone" value={loc.phone} placeholder="+1 234 567 8900" icon="📞" />
                <EditableLocField locIdx={0} field="address" value={loc.address} placeholder="123 Main St, City" icon="📍" />
                <EditableLocField locIdx={0} field="hours" value={loc.hours} placeholder="Mon–Fri 9am–5pm" icon="🕐" />
              </div>

              {/* Send a Message card */}
              <div style={{ background: '#f9f9f9', borderRadius: 6, padding: 12 }}>
                <EditableHeading settingKey={`contact_heading_msg_${previewLang}`}
                  value={settings[`contact_heading_msg_${previewLang}`]}
                  placeholder="Send a Message" />
                {['Name', 'Email', 'Subject'].map(p => (
                  <div key={p} style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 4, padding: '5px 8px', marginBottom: 6, fontSize: 11, color: '#bbb' }}>{p}</div>
                ))}
                <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 4, padding: '5px 8px', height: 36, marginBottom: 6 }} />
                {/* Editable button label */}
                <div style={{ background: '#131921', borderRadius: 4, padding: '6px', textAlign: 'center' }}>
                  <EditableHeading settingKey={`contact_btn_${previewLang}`}
                    value={settings[`contact_btn_${previewLang}`]}
                    placeholder="Send Message"
                    style={{ color: '#febd69', fontSize: 11, marginBottom: 0 }} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <p style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>Changes auto-save on blur. Switch language tabs to edit each language separately.</p>
      </div>
    </div>
  );
}

function SlidesTab({ settings, set, save, saved }) {
  const [availLangs, setAvailLangs] = useState([]);
  const [uploading, setUploading] = useState(null);
  const [previewIdx, setPreviewIdx] = useState(0);
  const base = process.env.REACT_APP_API_URL || '';
  useEffect(() => { api.get('/api/languages').then(r => setAvailLangs(r.data)); }, []);
  const slides = (() => { try { return JSON.parse(settings.hero_slides || '[]'); } catch { return []; } })();
  const setSlides = v => set('hero_slides', JSON.stringify(v));

  const update = (i, k, v) => { const s = [...slides]; s[i] = { ...s[i], [k]: v }; setSlides(s); };
  const toggleLang = (i, code) => {
    const langs = slides[i].langs || availLangs.map(l => l.code);
    const next = langs.includes(code) ? langs.filter(l => l !== code) : [...langs, code];
    update(i, 'langs', next.length ? next : [code]);
  };
  const add = () => { setSlides([...slides, { title: '', subtitle: '', image: '', video: '', mediaType: 'image', link: '/products', bg: '#131921', langs: availLangs.map(l => l.code), fit: 'cover', position: 'center', height: 300 }]); setPreviewIdx(slides.length); };
  const remove = i => { setSlides(slides.filter((_, idx) => idx !== i)); setPreviewIdx(0); };

  const uploadMedia = async (i, file) => {
    setUploading(i);
    const fd = new FormData();
    fd.append('image', file);
    const r = await api.post('/api/settings/upload-image', fd);
    const isVideo = file.type.startsWith('video/');
    const s = [...slides];
    if (isVideo) {
      s[i] = { ...s[i], video: r.data.url, mediaType: 'video' };
    } else {
      s[i] = { ...s[i], image: r.data.url, mediaType: 'image' };
    }
    setSlides(s);
    save('hero_slides', s);
    setUploading(null);
  };

  const preview = slides[previewIdx] || {};
  const previewBg = preview.bg || '#131921';
  const previewMedia = preview.mediaType === 'video' && preview.video
    ? (preview.video.startsWith('http') ? preview.video : `${base}${preview.video}`)
    : preview.image ? (preview.image.startsWith('http') ? preview.image : `${base}${preview.image}`) : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
      {/* Editor */}
      <div style={{ maxWidth: 520 }}>
        {slides.map((s, i) => {
          const activeLangs = s.langs || availLangs.map(l => l.code);
          const mediaSrc = s.mediaType === 'video' && s.video
            ? (s.video.startsWith('http') ? s.video : `${base}${s.video}`)
            : s.image ? (s.image.startsWith('http') ? s.image : `${base}${s.image}`) : null;
          return (
            <div key={i} className="card" style={{ marginBottom: 16, outline: previewIdx === i ? '2px solid #febd69' : 'none', cursor: 'pointer' }}
              onClick={() => setPreviewIdx(i)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <strong>Slide {i + 1} {previewIdx === i && <span style={{ fontSize: 11, color: '#febd69' }}>● previewing</span>}</strong>
                <button className="btn btn-danger" style={{ padding: '2px 10px' }} onClick={e => { e.stopPropagation(); remove(i); }}>Remove</button>
              </div>
              <div className="form-group"><label>Title</label>
                <input value={s.title} onChange={e => update(i, 'title', e.target.value)} onClick={e => e.stopPropagation()} />
              </div>
              <div className="form-group"><label>Subtitle</label>
                <input value={s.subtitle} onChange={e => update(i, 'subtitle', e.target.value)} onClick={e => e.stopPropagation()} />
              </div>
              <div className="form-group">
                <label>Media (Image / Video)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {mediaSrc && s.mediaType !== 'video' && <img src={mediaSrc} alt=""
                    style={{ width: 60, height: 45, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }} />}
                  {mediaSrc && s.mediaType === 'video' && <video src={mediaSrc} muted style={{ width: 60, height: 45, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }} />}
                  <label className="btn btn-secondary" style={{ cursor: 'pointer', fontSize: 13, marginBottom: 0 }} onClick={e => e.stopPropagation()}>
                    {uploading === i ? 'Uploading...' : mediaSrc ? '🔄 Change' : '📁 Upload'}
                    <input type="file" accept="image/*,video/*" style={{ display: 'none' }}
                      onChange={e => e.target.files[0] && uploadMedia(i, e.target.files[0])} />
                  </label>
                  {mediaSrc && <button type="button" className="btn btn-danger" style={{ fontSize: 12, padding: '4px 8px' }}
                    onClick={e => { e.stopPropagation(); update(i, 'image', ''); update(i, 'video', ''); }}>✕</button>}
                </div>
              </div>
              {/* Display Options */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                <div className="form-group" style={{ flex: 1, minWidth: 100 }}>
                  <label>Fit</label>
                  <select value={s.fit || 'cover'} onChange={e => update(i, 'fit', e.target.value)} style={{ marginBottom: 0 }}>
                    <option value="cover">Cover (crop to fill)</option>
                    <option value="contain">Contain (show all)</option>
                    <option value="fill">Stretch</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: 100 }}>
                  <label>Crop Position</label>
                  <select value={s.position || 'center'} onChange={e => update(i, 'position', e.target.value)} style={{ marginBottom: 0 }}>
                    <option value="center">Center</option>
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="top left">Top Left</option>
                    <option value="top right">Top Right</option>
                    <option value="bottom left">Bottom Left</option>
                    <option value="bottom right">Bottom Right</option>
                  </select>
                </div>
                <div className="form-group" style={{ width: 80 }}>
                  <label>Height</label>
                  <input type="number" value={s.height || 300} onChange={e => update(i, 'height', Number(e.target.value))} min={100} max={800} style={{ marginBottom: 0 }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}><label>Link</label>
                  <input value={s.link} onChange={e => update(i, 'link', e.target.value)} placeholder="/products" onClick={e => e.stopPropagation()} />
                </div>
                <div className="form-group" style={{ flex: 1 }}><label>Button Text</label>
                  <input value={s.btnText || ''} onChange={e => update(i, 'btnText', e.target.value)} placeholder="Shop Now" onClick={e => e.stopPropagation()} />
                </div>
                <div className="form-group"><label>Background</label>
                  <input type="color" value={s.bg || '#131921'} onChange={e => update(i, 'bg', e.target.value)} style={{ width: 60, height: 38, padding: 2 }} onClick={e => e.stopPropagation()} />
                </div>
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: 6 }}>Show in languages</label>
                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                  {availLangs.map(l => (
                    <label key={l.code} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', alignContent:'center',gap: 2, marginRight: 16, fontSize: 13 }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                      <input type="checkbox" checked={activeLangs.includes(l.code)} onChange={() => toggleLang(i, l.code)} style={{ cursor: 'pointer', width: 16, height: 16, margin: 0 }}/>
                      <span style={{ fontSize: 18, lineHeight: '16px' }}>{l.flag}</span>
                      </div> <span>{l.label || l.code.toUpperCase()}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={add}>+ Add Slide</button>
          <button className="btn btn-primary" onClick={() => save('hero_slides', slides)}>Save All Slides</button>
          {saved === 'hero_slides' && <span style={{ color: 'green', fontSize: 13, alignSelf: 'center' }}>✓ Saved</span>}
        </div>
      </div>

      {/* Preview */}
      <div style={{ position: 'sticky', top: 16 }}>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>👁 Preview — Slide {previewIdx + 1}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {slides.map((_, i) => (
              <button key={i} type="button" onClick={() => setPreviewIdx(i)}
                style={{ width: 24, height: 8, borderRadius: 4, border: 'none', cursor: 'pointer', background: previewIdx === i ? '#febd69' : '#ddd', padding: 0 }} />
            ))}
          </div>
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {slides.length === 0 ? (
            <div style={{ background: '#131921', padding: 40, textAlign: 'center', color: '#666' }}>Add a slide to preview</div>
          ) : (
            <div style={{ background: previewBg, padding: '40px 24px', textAlign: 'center', minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s' }}>
              {previewMedia && preview.mediaType === 'video' ? (
                <video src={previewMedia} autoPlay muted loop style={{ width: '100%', height: preview.height || 300, objectFit: preview.fit || 'cover', objectPosition: preview.position || 'center', marginBottom: 12, borderRadius: 4 }} />
              ) : previewMedia ? (
                <img src={previewMedia} alt="" style={{ width: '100%', height: preview.height || 300, objectFit: preview.fit || 'cover', objectPosition: preview.position || 'center', marginBottom: 12, borderRadius: 4 }} />
              ) : null}
              <h2 style={{ color: '#fff', fontSize: 22, marginBottom: 6 }}>{preview.title || <span style={{ color: 'rgba(255,255,255,0.3)' }}>Slide Title</span>}</h2>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginBottom: 12 }}>{preview.subtitle || <span style={{ color: 'rgba(255,255,255,0.2)' }}>Subtitle text</span>}</p>
              {preview.link && <div style={{ background: '#febd69', color: '#131921', padding: '6px 20px', borderRadius: 4, fontSize: 13, fontWeight: 600, display: 'inline-block' }}>{preview.btnText || 'Shop Now'}</div>}
              {slides.length > 1 && (
                <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
                  {slides.map((_, i) => (
                    <div key={i} style={{ width: i === previewIdx ? 20 : 7, height: 7, borderRadius: 4, background: i === previewIdx ? '#febd69' : 'rgba(255,255,255,0.4)', transition: 'all 0.3s' }} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FAQTab({ settings, set, save, saved }) {
  const [langs, setLangs] = useState([]);
  useEffect(() => { api.get('/api/languages').then(r => setLangs(r.data)); }, []);

  return (
    <div style={{ width: '100%' }}>
      {langs.map(l => {
        const lang = l.code; const label = l.label;
        const key = `faq_${lang}`;
        const faqs = (() => { try { return JSON.parse(settings[key] || '[]'); } catch { return []; } })();
        const setFaqs = v => set(key, JSON.stringify(v));
        const update = (i, k, v) => { const f = [...faqs]; f[i] = { ...f[i], [k]: v }; setFaqs(f); };
        const add = () => setFaqs([...faqs, { q: '', a: '' }]);
        const remove = i => setFaqs(faqs.filter((_, idx) => idx !== i));
        const isRTL = !!l.rtl;

        return (
          <div key={lang} className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 12 }}>{l.flag} {label}</h3>
            {faqs.map((f, i) => (
              <div key={i} style={{ background: '#f9f9f9', borderRadius: 6, padding: 12, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <strong style={{ fontSize: 13 }}>Q{i + 1}</strong>
                  <button className="btn btn-danger" style={{ padding: '2px 8px', fontSize: 12 }} onClick={() => remove(i)}>✕</button>
                </div>
                <div className="form-group"><label>Question</label>
                  <input value={f.q} dir={isRTL ? 'rtl' : 'ltr'} onChange={e => update(i, 'q', e.target.value)} />
                </div>
                <div className="form-group"><label>Answer</label>
                  <textarea rows={2} value={f.a} dir={isRTL ? 'rtl' : 'ltr'} onChange={e => update(i, 'a', e.target.value)} />
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" style={{ fontSize: 12 }} onClick={add}>+ Add</button>
              <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => save(key, faqs)}>Save {label}</button>
              {saved === key && <span style={{ color: 'green', fontSize: 13, alignSelf: 'center' }}>✓</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// function PageTitlesTab({ settings, set, save, saved }) {
//   const [langs, setLangs] = useState([]);
//   const [rows, setRows] = useState([]); // [{lang, faq, about, contact}]
//   const [pageSaved, setPageSaved] = useState(false);

//   const pages = ['title', 'home', 'products', 'faq', 'about', 'contact', 'orders', 'profile'];
//   const DEFAULT_ICONS = { title: '🥛', home: '🏠', products: '🛍️', faq: '❓', about: 'ℹ️', contact: '📞', orders: '📦', profile: '👤' };
//   const [icons, setIcons] = useState(DEFAULT_ICONS);

//   useEffect(() => {
//     api.get('/api/languages').then(r => setLangs(r.data));
//   }, []);

//   useEffect(() => {
//     const titles = (() => { try { return JSON.parse(settings.page_titles || '{}'); } catch { return {}; } })();
//     if (titles._icons) setIcons(prev => ({ ...prev, ...titles._icons }));
//     const usedLangs = new Set();
//     pages.forEach(p => Object.keys(titles[p] || {}).forEach(l => usedLangs.add(l)));
//     const built = [...usedLangs].map(lang => {
//       const row = { lang };
//       pages.forEach(p => row[p] = titles[p]?.[lang] || '');
//       return row;
//     });
//     setRows(built);
//   }, [settings.page_titles]);

//   const usedLangs = rows.map(r => r.lang);
//   const availableLangs = langs.filter(l => !usedLangs.includes(l.code));

//   const updateRow = (i, k, v) => setRows(prev => { const r = [...prev]; r[i] = { ...r[i], [k]: v }; return r; });
//   const addRow = () => {
//     const next = availableLangs[0];
//     if (!next) return;
//     setRows(prev => [...prev, { lang: next.code, faq: '', about: '', contact: '' }]);
//   };
//   const removeRow = i => {
//     const newRows = rows.filter((_, idx) => idx !== i);
//     setRows(newRows);
//     const titles = { _icons: icons };
//     pages.forEach(p => {
//       titles[p] = {};
//       newRows.forEach(r => { if (r.lang) titles[p][r.lang] = r[p] || ''; });
//     });
//     save('page_titles', titles);
//   };

//   const buildTitles = (onlyLang = null) => {
//     const titles = { _icons: icons };
//     pages.forEach(p => {
//       titles[p] = {};
//       rows.forEach(r => { if (r.lang && (!onlyLang || r.lang === onlyLang)) titles[p][r.lang] = r[p] || ''; });
//     });
//     return titles;
//   };

//   const saveAll = () => {
//     const requiredLangs = langs.map(l => l.code);
//     for (const lang of requiredLangs) {
//       const row = rows.find(r => r.lang === lang);
//       if (!row) { alert(`Please add a row for language "${lang}" and fill all columns before saving.`); return; }
//       const missing = pages.filter(p => !row[p]?.trim());
//       if (missing.length > 0) { alert(`Please fill all columns for "${lang}": missing ${missing.join(', ')}.`); return; }
//     }
//     save('page_titles', buildTitles());
//     setPageSaved(true); setTimeout(() => setPageSaved(false), 2000);
//   };

//   const saveRow = (row) => {
//     const missing = pages.filter(p => !row[p]?.trim());
//     if (missing.length > 0) { alert(`Please fill all columns for "${row.lang}": missing ${missing.join(', ')}.`); return; }
//     // Merge current row into the full titles object built from all rows
//     save('page_titles', buildTitles());
//     setPageSaved(row.lang); setTimeout(() => setPageSaved(false), 2000);
//   };

//   return (
//     <div className="card" style={{ maxWidth: 1150 }}>
//       <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>Set page titles per language. Each language can only appear once.</p>
//       <table style={{ marginBottom: 12, tableLayout: 'fixed', width: '100%' }}>
//         <thead>
//           <tr>
//             <th style={{ width: '12%' }}>Language</th>
//             {pages.map(p => <th key={p} style={{ width: `${80 / pages.length}%`, textTransform: 'capitalize' }}>{p}</th>)}
//             <th style={{ width: 100 }}></th>
//           </tr>
//         </thead>
//         <tbody>
//           <tr style={{ background: '#fffbe6' }}>
//             <td style={{ fontSize: 12, fontWeight: 600, color: '#888' }}>Icons</td>
//             {pages.map(p => (
//               <td key={p}>
//                 <input value={icons[p] || ''} onChange={e => setIcons(ic => ({ ...ic, [p]: e.target.value }))}
//                   placeholder="emoji" style={{ marginBottom: 0, textAlign: 'center', fontSize: 18 }} maxLength={4} />
//               </td>
//             ))}
//             <td>
//               <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: 12 }}
//                 onClick={() => save('page_titles', buildTitles())}>Save</button>
//             </td>
//           </tr>
//           {rows.map((row, i) => {
//             const isRTL = ['fa', 'ar'].includes(row.lang);
//             const langInfo = langs.find(l => l.code === row.lang);
//             return (
//               <tr key={i}>
//                 <td>
//                   <select value={row.lang} onChange={e => updateRow(i, 'lang', e.target.value)} style={{ marginBottom: 0, width: '100%' }}>
//                     <option value={row.lang}>{langInfo?.flag} {langInfo?.label || row.lang}</option>
//                     {availableLangs.map(l => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
//                   </select>
//                 </td>
//                 {pages.map(p => (
//                   <td key={p}>
//                     <input value={row[p] || ''} dir={isRTL ? 'rtl' : 'ltr'} onChange={e => updateRow(i, p, e.target.value)} style={{ marginBottom: 0 }} />
//                   </td>
//                 ))}
//                 <td style={{ whiteSpace: 'nowrap' }}>
//                   <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: 12, marginRight: 4 }} onClick={() => saveRow(row)}>
//                     {pageSaved === row.lang ? '\u2713' : 'Save'}
//                   </button>
//                   <button className="btn btn-danger" style={{ padding: '4px 8px' }} onClick={() => removeRow(i)}>&times;</button>
//                 </td>
//               </tr>
//             );
//           })}
//         </tbody>
//       </table>
//       <div style={{ display: 'flex', gap: 8 }}>
//         <button className="btn btn-secondary" onClick={addRow} disabled={availableLangs.length === 0}>+ Add Language</button>
//         {pageSaved === true && <span style={{ color: 'green', fontSize: 13, alignSelf: 'center' }}>&check; All Saved</span>}
//       </div>
//     </div>
//   );
// }

const NAV_ICONS = ['🏠', '🛍️', '📦', '👤', '❓', 'ℹ️', '📞', '⭐', '🔥', '🎁', '💳', '🚚', '📋', '🔑', '💬', '🌐', '📸', '🎉', '🏷️', '❤️', '🔔', '📌', '🗂️', '⚙️', '🛒'];

function IconPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ fontSize: 20, width: 44, height: 36, border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', background: '#fff' }}>
        {value || '＋'}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 999, background: '#fff', border: '1px solid #ddd', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', padding: 8, display: 'grid', gridTemplateColumns: 'repeat(5, 36px)', gap: 4 }}>
          {NAV_ICONS.map(icon => (
            <button key={icon} type="button" onClick={() => { onChange(icon); setOpen(false); }}
              style={{ fontSize: 18, width: 36, height: 36, border: value === icon ? '2px solid #febd69' : '1px solid #eee', borderRadius: 4, cursor: 'pointer', background: value === icon ? '#fffbe6' : '#fff' }}>
              {icon}
            </button>
          ))}
          <button type="button" onClick={() => { onChange(''); setOpen(false); }}
            style={{ fontSize: 11, width: 36, height: 36, border: '1px solid #eee', borderRadius: 4, cursor: 'pointer', background: '#fff', color: '#999' }}>
            none
          </button>
        </div>
      )}
    </div>
  );
}

const APP_PAGES = [
  { url: '/',          label: '🏠 Home' },
  { url: '/products',  label: '🛍️ Products' },
  { url: '/cart',      label: '🛒 Cart' },
  { url: '/orders',    label: '📦 My Orders' },
  { url: '/profile',   label: '👤 Profile' },
  { url: '/about',     label: 'ℹ️ About Us' },
  { url: '/contact',   label: '📞 Contact Us' },
  { url: '/faq',       label: '❓ FAQ' },
  { url: '/login',     label: '🔑 Login' },
  { url: '/register',  label: '📝 Register' },
];

const NAV_ICON_OPTIONS = [
  { icon: '🏠', label: 'Home' },
  { icon: '🛍️', label: 'Shop' },
  { icon: '🛒', label: 'Cart' },
  { icon: '📦', label: 'Orders' },
  { icon: '👤', label: 'Profile' },
  { icon: 'ℹ️', label: 'About' },
  { icon: '📞', label: 'Contact' },
  { icon: '❓', label: 'FAQ' },
  { icon: '🔑', label: 'Login' },
  { icon: '⭐', label: 'Star' },
  { icon: '🔥', label: 'Hot' },
  { icon: '🎁', label: 'Gift' },
  { icon: '💳', label: 'Payment' },
  { icon: '🚚', label: 'Delivery' },
  { icon: '📋', label: 'List' },
  { icon: '💬', label: 'Chat' },
  { icon: '🌐', label: 'Global' },
  { icon: '📸', label: 'Gallery' },
  { icon: '🏷️', label: 'Tag' },
  { icon: '❤️', label: 'Favorite' },
  { icon: '🔔', label: 'Notify' },
  { icon: '📌', label: 'Pin' },
  { icon: '⚙️', label: 'Settings' },
  { icon: '🎉', label: 'Event' },
  { icon: '—',  label: 'No icon' },
];

function NavIconPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const display = value && value !== '—' ? value : '＋';
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width: '100%', height: 36, border: '1px solid #ccc', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 20 }}>
        {display}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 999, background: '#fff', border: '1px solid #ddd', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', padding: 8, width: 220 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 4 }}>
            {NAV_ICON_OPTIONS.map(o => (
              <button key={o.icon} type="button" title={o.label} onClick={() => { onChange(o.icon === '—' ? '' : o.icon); setOpen(false); }}
                style={{ fontSize: 20, height: 36, border: value === o.icon ? '2px solid #febd69' : '1px solid #eee', borderRadius: 4, cursor: 'pointer', background: value === o.icon ? '#fffbe6' : '#fff' }}>
                {o.icon}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HomeTabLabels({ langs, activeLang, saveSetting, settings }) {
  const TABS_DEF = {
    // all:   { en: 'All Products',  fa: 'همه محصولات',      ar: 'جميع المنتجات' },
    // new:   { en: 'New Arrivals',  fa: 'جدیدترین‌ها',      ar: 'الوافدون الجدد' },
    // deals: { en: 'Best Deals',    fa: 'بهترین تخفیف‌ها',  ar: 'أفضل العروض' },
    all:   {  },
    new:   {  },
    deals: { },
  };
  const [labels, setLabels] = useState(TABS_DEF);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try { if (settings.home_tab_labels) setLabels(JSON.parse(settings.home_tab_labels)); } catch {}
  }, [settings.home_tab_labels]);

  const update = (tab, lang, val) =>
    setLabels(prev => ({ ...prev, [tab]: { ...prev[tab], [lang]: val } }));

  const save = () => {
    saveSetting('home_tab_labels', JSON.stringify(labels));
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const activeLangObj = langs.find(l => l.code === activeLang) || langs[0];

  return (
    <div className="card">
      <table style={{ width: '100%', marginBottom: 12 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', width: 120 }}>Tab</th>
            <th style={{ textAlign: 'left' }}>{activeLangObj?.flag} {activeLangObj?.label}</th>
          </tr>
        </thead>
        <tbody>
          {[['all','All Products'],['new','New Arrivals'],['deals','Best Deals']].map(([key, name]) => (
            <tr key={key}>
              <td style={{ fontWeight: 600, fontSize: 13, paddingRight: 12 }}>{name}</td>
              <td>
                <input value={labels[key]?.[activeLangObj?.code] || ''} dir={activeLangObj?.rtl ? 'rtl' : 'ltr'}
                  onChange={e => update(key, activeLangObj?.code, e.target.value)}
                  style={{ marginBottom: 0, width: '100%' }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" onClick={save}>Save</button>
        {saved && <span style={{ color: 'green', fontSize: 13, alignSelf: 'center' }}>✓ Saved</span>}
      </div>
    </div>
  );
}

function NavBarTab({ settings, save: saveSetting }) {
  const [langs, setLangs] = useState([]);
  const [activeLang, setActiveLang] = useState('en');
  const [links, setLinks] = useState([]);
  const [saved, setSaved] = useState(false);
  const [showLocation, setShowLocation] = useState(true);
  const [locationSaved, setLocationSaved] = useState(false);
  const dragIdx = useRef(null);

  useEffect(() => {
    api.get('/api/languages').then(r => {
      const all = r.data;
      setLangs(all);
      if (all.length) setActiveLang(all[0].code);
    });
    api.get('/api/settings').then(r => setShowLocation(r.data.show_location !== '0'));
  }, []);

  useEffect(() => {
    if (!activeLang) return;
    api.get(`/api/navlinks/${activeLang}`).then(r => setLinks(r.data));
  }, [activeLang]);

  const update = (i, k, v) => setLinks(prev => { const l = [...prev]; l[i] = { ...l[i], [k]: v }; return l; });
  const add = () => setLinks(prev => [...prev, { label: '', url: '/', sort_order: prev.length + 1 }]);
  const remove = i => setLinks(prev => prev.filter((_, idx) => idx !== i));

  const saveLinks = async () => {
    await api.put(`/api/navlinks/${activeLang}`, links.map((l, i) => ({ ...l, sort_order: i + 1 })));
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };
    // ── Button labels ──────────────────────────────────────────────────────────
  const BUTTONS = ['addToCart', 'buyNow', 'shopNow', 'login', 'register', 'logout', 'save', 'cancel', 'search', 'back', 'placeOrder', 'continueShopping', 'viewOrders'];
  const BTN_LABEL_DEFAULTS = {
    addToCart: { en: 'Add to Cart', fa: '\u0627\u0641\u0632\u0648\u062f\u0646 \u0628\u0647 \u0633\u0628\u062f', ar: '\u0623\u0636\u0641 \u0644\u0644\u0633\u0644\u0629' },
    buyNow: { en: 'Buy Now', fa: '\u062e\u0631\u06cc\u062f \u0641\u0648\u0631\u06cc', ar: '\u0627\u0634\u062a\u0631 \u0627\u0644\u0622\u0646' },
    shopNow: { en: 'Shop Now', fa: '\u062e\u0631\u06cc\u062f \u06a9\u0646\u06cc\u062f', ar: '\u062a\u0633\u0648\u0642 \u0627\u0644\u0622\u0646' },
    login: { en: 'Login', fa: '\u0648\u0631\u0648\u062f', ar: '\u062a\u0633\u062c\u06cc\u0644 \u0627\u0644\u062f\u062e\u0648\u0644' },
    register: { en: 'Register', fa: '\u062b\u0628\u062a\u200c\u0646\u0627\u0645', ar: '\u0625\u0646\u0634\u0627\u0621 \u062d\u0633\u0627\u0628' },
    logout: { en: 'Logout', fa: '\u062e\u0631\u0648\u062c', ar: '\u062e\u0631\u0648\u062c' },
    save: { en: 'Save', fa: '\u0630\u062e\u06cc\u0631\u0647', ar: '\u062d\u0641\u0638' },
    cancel: { en: 'Cancel', fa: '\u0627\u0646\u0635\u0631\u0627\u0641', ar: '\u0625\u0644\u063a\u0627\u0621' },
    search: { en: 'Search', fa: '\u062c\u0633\u062a\u062c\u0648', ar: '\u0628\u062d\u062b' },
    back: { en: 'Back', fa: '\u0628\u0627\u0632\u06af\u0634\u062a', ar: '\u0631\u062c\u0648\u0639' },
    placeOrder: { en: 'Place Order', fa: '\u062b\u0628\u062a \u0633\u0641\u0627\u0631\u0634', ar: '\u062a\u0642\u062f\u06cc\u0645 \u0627\u0644\u0637\u0644\u0628' },
    continueShopping: { en: 'Continue Shopping', fa: '\u0627\u062f\u0627\u0645\u0647 \u062e\u0631\u06cc\u062f', ar: '\u0645\u0648\u0627\u0635\u0644\u0629 \u0627\u0644\u062a\u0633\u0648\u0642' },
    viewOrders: { en: 'View Orders', fa: '\u0633\u0641\u0627\u0631\u0634\u200c\u0647\u0627', ar: '\u0637\u0644\u0628\u0627\u062a\u06cc' },
  };
  const BTN_COLOR_DEFAULTS = {
    addToCart: '#febd69', buyNow: '#f90', shopNow: '#f90', login: '#232f3e', register: '#232f3e',
    logout: '#c0392b', save: '#27ae60', cancel: '#888888', search: '#232f3e', back: '#888888',
    placeOrder: '#27ae60', continueShopping: '#232f3e', viewOrders: '#232f3e',
  };
  const [btnData, setBtnData] = useState({});
  const [btnSaved, setBtnSaved] = useState(false);

  useEffect(() => {
    const stored = (() => { try { return JSON.parse(settings.button_labels || '{}'); } catch { return {}; } })();
    const data = {};
    BUTTONS.forEach(b => {
      data[b] = {
        color: stored[b]?.color || BTN_COLOR_DEFAULTS[b] || '#232f3e',
        labels: {},
      };
      langs.forEach(l => {
        data[b].labels[l.code] = stored[b]?.labels?.[l.code] ?? BTN_LABEL_DEFAULTS[b]?.[l.code] ?? '';
      });
    });
    setBtnData(data);
  }, [settings.button_labels, langs]);

  const updateBtnColor = (b, color) => setBtnData(prev => ({ ...prev, [b]: { ...prev[b], color } }));
  const updateBtnLabel = (b, lang, val) => setBtnData(prev => ({ ...prev, [b]: { ...prev[b], labels: { ...prev[b].labels, [lang]: val } } }));
  const saveBtnRows = () => {
    saveSetting('button_labels', JSON.stringify(btnData));
    setBtnSaved(true); setTimeout(() => setBtnSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: 600 }}>
      {/* Language tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {langs.map(l => (
          <button key={l.code} onClick={() => setActiveLang(l.code)}
            style={{ padding: '6px 14px', border: '1px solid #ddd', borderRadius: 6, background: activeLang === l.code ? '#febd69' : '#fff', cursor: 'pointer', fontWeight: activeLang === l.code ? 700 : 400, fontSize: 14 }}>
            {l.flag} {l.label}
          </button>
        ))}
      </div>
      {/* app title-name */}
      <div className="card" style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>
          App Title — {langs.find(l => l.code === activeLang)?.flag} {langs.find(l => l.code === activeLang)?.label}
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={(() => { try { return JSON.parse(settings.page_titles || '{}').title?.[activeLang] || ''; } catch { return ''; } })()}
            onChange={e => {
              const titles = (() => { try { return JSON.parse(settings.page_titles || '{}'); } catch { return {}; } })();
              titles.title = { ...(titles.title || {}), [activeLang]: e.target.value };
              saveSetting('page_titles', JSON.stringify(titles));
            }}
            placeholder={`App name in ${langs.find(l => l.code === activeLang)?.label || activeLang}`}
            dir={langs.find(l => l.code === activeLang)?.rtl ? 'rtl' : 'ltr'}
            style={{ flex: 1, marginBottom: 0, fontSize: 15 }}
          />
        </div>
      </div>

      <div className="card">
        <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>Edit the secondary navigation bar for <strong>{langs.find(l => l.code === activeLang)?.label}</strong>.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '24px 70px 1fr 1fr auto', gap: 8, marginBottom: 6 }}>
          <span />
          <span style={{ fontSize: 12, color: '#888' }}>Icon</span>
          <span style={{ fontSize: 12, color: '#888' }}>Label</span>
          <span style={{ fontSize: 12, color: '#888' }}>Page</span>
          <span />
        </div>
        {links.map((l, i) => (
          <div key={i}
            draggable
            onDragStart={() => { dragIdx.current = i; }}
            onDragOver={e => { e.preventDefault(); }}
            onDrop={() => {
              const from = dragIdx.current;
              if (from === null || from === i) return;
              const next = [...links];
              const [moved] = next.splice(from, 1);
              next.splice(i, 0, moved);
              setLinks(next);
              dragIdx.current = null;
            }}
            style={{ display: 'grid', gridTemplateColumns: '24px 70px 1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'center', cursor: 'grab' }}>
            <span style={{ color: '#aaa', fontSize: 16, userSelect: 'none' }}>⠿</span>
            {/* Icon picker */}
            <NavIconPicker value={l.icon || ''} onChange={v => update(i, 'icon', v)} />
            <input value={l.label} onChange={e => update(i, 'label', e.target.value)} placeholder="Label" style={{ marginBottom: 0 }} dir={['fa', 'ar'].includes(activeLang.toLowerCase()) ? 'rtl' : 'ltr'} />
            {/* URL dropdown */}
            <select value={l.url} onChange={e => update(i, 'url', e.target.value)} style={{ marginBottom: 0 }}>
              {APP_PAGES.map(p => <option key={p.url} value={p.url}>{p.label}</option>)}
            </select>
            <button className="btn btn-danger" style={{ padding: '4px 8px' }} onClick={() => remove(i)}>✕</button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-secondary" onClick={add}>+ Add Link</button>
          <button className="btn btn-primary" onClick={saveLinks}>Save</button>
          {saved && <span style={{ color: 'green', fontSize: 13, alignSelf: 'center' }}>✓ Saved</span>}
        </div>
      </div>

      {/* Home Tab Labels */}
      <h3 style={{ marginTop: 32, marginBottom: 8 }}>Home Page Tab Labels</h3>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>Set the tab names shown on the home page per language.</p>
      <HomeTabLabels langs={langs} activeLang={activeLang} saveSetting={saveSetting} settings={settings} />

      {/* Button Labels */}
      <h3 style={{ marginTop: 32, marginBottom: 8 }}>Button Labels</h3>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>Set label and color for each button per language.</p>
      <div className="card">
        {BUTTONS.map(b => {
          const activeLangObj = langs.find(l => l.code === activeLang);
          return (
            <div key={b} style={{ display: 'grid', gridTemplateColumns: '140px 44px 110px 1fr', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 12, color: '#555' }}>{b}</span>
              <input type="color" value={btnData[b]?.color || '#232f3e'}
                onChange={e => updateBtnColor(b, e.target.value)}
                style={{ width: 40, height: 32, border: 'none', padding: 0, cursor: 'pointer', background: 'none' }} />
              <span style={{ background: btnData[b]?.color || '#232f3e', color: '#fff', padding: '3px 10px', borderRadius: 4, fontSize: 12, whiteSpace: 'nowrap', textAlign: 'center' }}>
                {btnData[b]?.labels?.[activeLang] || b}
              </span>
              <input value={btnData[b]?.labels?.[activeLang] || ''} dir={activeLangObj?.rtl ? 'rtl' : 'ltr'}
                onChange={e => updateBtnLabel(b, activeLang, e.target.value)}
                style={{ marginBottom: 0 }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="btn btn-primary" onClick={saveBtnRows}>Save Button Labels</button>
        {btnSaved && <span style={{ color: 'green', fontSize: 13, alignSelf: 'center' }}>&check; Saved</span>}
      </div>
    </div>
  );
}

function LanguagesTab({ settings, set, save }) {
  const [langs, setLangs] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/api/languages').then(r => setLangs(r.data));
  }, []);

  const update = (i, k, v) => setLangs(prev => { const l = [...prev]; l[i] = { ...l[i], [k]: v }; return l; });

  const toggleActive = (i) => {
    const l = langs[i];
    if (l.enabled && langs.filter(x => x.enabled).length <= 1) return;
    update(i, 'enabled', !l.enabled);
  };

  const add = () => setLangs(prev => [...prev, { code: '', label: '', enabled: false, sort_order: prev.length + 1 }]);
  const remove = async (i) => {
    const l = langs[i];
    if (l.code) {
      try {
        await api.delete(`/api/languages/${l.code}`);
      } catch (err) {
        alert(`Failed to delete language: ${err?.response?.data?.error || err.message}`);
        return;
      }
    }
    setLangs(prev => prev.filter((_, idx) => idx !== i));
  };
  const saveAll = async () => {
    await api.put('/api/languages', langs.filter(l => l.code));
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="card" style={{ maxWidth: 460 }}>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>Manage languages. Active languages appear in the storefront.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px 60px auto', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: '#888' }}>Code</span>
        <span style={{ fontSize: 12, color: '#888' }}>Label</span>
        <span style={{ fontSize: 12, color: '#888', textAlign: 'center' }}>
          RTL
          <span title="Right-to-Left: enable for languages like Arabic and Persian that are written from right to left. This flips the page layout direction."
            style={{ marginLeft: 4, cursor: 'help', color: '#aaa', fontSize: 11 }}>ⓘ</span>
        </span>
        <span style={{  marginRight: 4,fontSize: 12, color: '#888', textAlign: 'left' }}>Active</span>
        <span/>
      </div>
      {langs.map((l, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px 60px auto', gap: 6, marginBottom: 8, alignItems: 'center' }}>
          <input value={l.code} onChange={e => update(i, 'code', e.target.value)} placeholder="en" style={{ marginBottom: 0 }} />
          <input value={l.label} onChange={e => update(i, 'label', e.target.value)} placeholder="English" style={{ marginBottom: 0 }} />
          <div style={{ textAlign: 'center' }}>
            <input type="checkbox" checked={!!l.rtl} onChange={() => update(i, 'rtl', !l.rtl)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <input type="checkbox" checked={!!l.enabled} onChange={() => toggleActive(i)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
          </div>
          <button className="btn btn-danger" style={{ padding: '4px 8px' }} onClick={() => remove(i)}>✕</button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-secondary" onClick={add}>+ Add Language</button>
        <button className="btn btn-primary" onClick={saveAll}>Save All</button>
        {saved && <span style={{ color: 'green', fontSize: 13, alignSelf: 'center' }}>✓ Saved</span>}
      </div>
    </div>
  );
}

function CurrenciesTab() {
  const [currencies, setCurrencies] = useState([]);
  const [langs, setLangs] = useState([]);
  const [saved, setSaved] = useState(false);
  const [pickerIdx, setPickerIdx] = useState(null);

  const FLAGS = [
    '🇬🇧', '🇺🇸', '🇨🇦', '🇮🇷', '🇸🇦', '🇦🇪', '🇫🇷', '🇩🇪', '🇪🇸', '🇮🇹', '🇵🇹', '🇷🇺', '🇨🇳', '🇯🇵', '🇰🇷',
    '🇹🇷', '🇮🇳', '🇵🇰', '🇧🇩', '🇮🇩', '🇲🇾', '🇳🇱', '🇸🇪', '🇳🇴', '🇩🇰', '🇵🇱', '🇺🇦', '🇬🇷', '🇮🇱', '🇪🇬',
    '🇲🇦', '🇩🇿', '🇹🇳', '🇱🇧', '🇯🇴', '🇮🇶', '🇸🇾', '🇾🇪', '🇴🇲', '🇶🇦', '🇰🇼', '🇧🇭', '🇦🇫', '🇦🇿', '🇺🇿',
  ];

  useEffect(() => {
    api.get('/api/currencies').then(r => setCurrencies(r.data));
    api.get('/api/languages').then(r => setLangs(r.data));
  }, []);

  const update = (i, k, v) => setCurrencies(prev => { const c = [...prev]; c[i] = { ...c[i], [k]: v }; return c; });
  const add = () => setCurrencies(prev => [...prev, { language_code: langs[0]?.code || 'en', country: '', flag: '', currency_code: '', symbol: '', active: true }]);
  const remove = i => setCurrencies(prev => prev.filter((_, idx) => idx !== i));
  const saveAll = async () => {
    await api.put('/api/currencies', currencies.filter(c => c.currency_code));
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="card" style={{ maxWidth: 860 }}>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>Define currencies per language. Active currencies appear in the top bar and as price filters in products.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 70px 90px 70px 50px 60px auto', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: '#888' }}>Language</span>
        <span style={{ fontSize: 12, color: '#888' }}>Country</span>
        <span style={{ fontSize: 12, color: '#888' }}>Flag</span>
        <span style={{ fontSize: 12, color: '#888' }}>Currency</span>
        <span style={{ fontSize: 12, color: '#888' }}>Symbol</span>
        <span style={{ fontSize: 12, color: '#888', textAlign: 'center' }}>Dec.</span>
        <span style={{ fontSize: 12, color: '#888', textAlign: 'center' }}>Active</span>
        <span />
      </div>
      {currencies.map((c, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 70px 90px 70px 50px 60px auto', gap: 6, marginBottom: 8, alignItems: 'center' }}>
          <select value={c.language_code} onChange={e => update(i, 'language_code', e.target.value)} style={{ marginBottom: 0 }}>
            {langs.map(l => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
          </select>
          <input value={c.country} onChange={e => update(i, 'country', e.target.value)} placeholder="United States" style={{ marginBottom: 0 }} />
          <div style={{ position: 'relative' }}>
            <button type="button" onClick={() => setPickerIdx(pickerIdx === i ? null : i)}
              style={{ width: '100%', padding: '5px', border: '1px solid #ddd', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 20, textAlign: 'center' }}>
              {c.flag || '🏳️'} <span style={{ fontSize: 10, color: '#888' }}>▾</span>
            </button>
            {pickerIdx === i && (
              <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 999, background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', width: 260 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {FLAGS.map(f => (
                    <button key={f} type="button" onClick={() => { update(i, 'flag', f); setPickerIdx(null); }}
                      style={{ fontSize: 20, background: c.flag === f ? '#fffbe6' : 'none', border: c.flag === f ? '2px solid #febd69' : '1px solid transparent', borderRadius: 4, cursor: 'pointer', padding: 2 }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <input value={c.currency_code} onChange={e => update(i, 'currency_code', e.target.value.toUpperCase())} placeholder="USD" style={{ marginBottom: 0 }} maxLength={10} />
          <input value={c.symbol} onChange={e => update(i, 'symbol', e.target.value)} placeholder="$" style={{ marginBottom: 0 }} maxLength={10} />
          <input type="number" value={c.fraction_digits ?? 2} onChange={e => update(i, 'fraction_digits', Number(e.target.value))}
            min={0} max={6} title="Decimal places" style={{ marginBottom: 0, textAlign: 'center' }} />
          <div style={{ textAlign: 'center' }}>
            <input type="checkbox" checked={!!c.active} onChange={() => update(i, 'active', !c.active)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
          </div>
          <button className="btn btn-danger" style={{ padding: '4px 8px' }} onClick={() => remove(i)}>✕</button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-secondary" onClick={add}>+ Add Currency</button>
        <button className="btn btn-primary" onClick={saveAll}>Save All</button>
        {saved && <span style={{ color: 'green', fontSize: 13, alignSelf: 'center' }}>✓ Saved</span>}
      </div>
    </div>
  );
}

// ─── Trust Badges ────────────────────────────────────────────────────────────

const PRESET_BADGES = [
  { country: 'Iran', name: 'Enamad', url: 'https://trustseal.enamad.ir', img: 'https://trustseal.enamad.ir/logo.png' },
  { country: 'Iran', name: 'Samandehi', url: 'https://logo.samandehi.ir', img: 'https://logo.samandehi.ir/logo.png' },
  { country: 'Canada / US', name: 'BBB', url: 'https://www.bbb.org', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/BBB_logo.svg/200px-BBB_logo.svg.png' },
  { country: 'Canada / US', name: 'Trustpilot', url: 'https://www.trustpilot.com', img: 'https://cdn.trustpilot.net/brand-assets/4.1.0/logo-white.svg' },
  { country: 'Global', name: 'SSL Secure', url: '', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Lock-green.svg/120px-Lock-green.svg.png' },
  { country: 'Global', name: 'Visa / MC', url: '', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png' },
  { country: 'Saudi Arabia', name: 'CITC', url: 'https://www.citc.gov.sa', img: '' },
  { country: 'UAE', name: 'TRA', url: 'https://www.tra.gov.ae', img: '' },
];

function TrustBadgesTab({ settings, set, save, saved }) {
  const badges = (() => { try { return JSON.parse(settings.trust_badges || '[]'); } catch { return []; } })();
  const setBadges = (b) => set('trust_badges', JSON.stringify(b));

  const update = (i, k, v) => {
    const next = [...badges];
    next[i] = { ...next[i], [k]: v };
    setBadges(next);
  };
  const add = (preset = {}) => setBadges([...badges, { name: preset.name || '', url: preset.url || '', img: preset.img || '', width: preset.width || 80, height: preset.height || 40, active: true }]);
  const remove = (i) => setBadges(badges.filter((_, idx) => idx !== i));

  const uploadBadgeImg = async (i, file) => {
    const fd = new FormData();
    fd.append('image', file);
    const r = await api.post('/api/settings/upload-image', fd);
    update(i, 'img', r.data.url);
  };

  return (
    <div>
      {/* Presets */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 8 }}>Quick-add known badges</h3>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>Click a badge to add it to your list, then customise as needed.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {PRESET_BADGES.map((p, i) => (
            <button key={i} type="button" onClick={() => add(p)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 14px',
                border: '1px solid #ddd', borderRadius: 8, background: '#fafafa', cursor: 'pointer', minWidth: 90
              }}
            >
              {p.img
                ? <img src={p.img} alt={p.name}
                  style={{ width: 50, height: 50, objectFit: 'contain', objectPosition: 'center' }}
                  onError={e => e.target.style.display = 'none'} />
                : <span style={{ fontSize: 22 }}>🏅</span>
              }
              <span style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</span>
              <span style={{ fontSize: 11, color: '#aaa' }}>{p.country}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Current badges */}
      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Your badges ({badges.length})</h3>
        {badges.length === 0 && <p style={{ fontSize: 13, color: '#aaa' }}>No badges yet. Add from presets above or click "+ Custom".</p>}
        {badges.map((b, i) => (
          <div key={i} style={{ border: '1px solid #eee', borderRadius: 8, padding: 10, marginBottom: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <input value={b.name} onChange={e => update(i, 'name', e.target.value)} placeholder="Badge name" style={{ marginBottom: 0 }} />
              <input value={b.url} onChange={e => update(i, 'url', e.target.value)} placeholder="Link URL (optional)" style={{ marginBottom: 0 }} />
              <input type="checkbox" checked={!!b.active} onChange={() => update(i, 'active', !b.active)}
                title="Show in footer" style={{ width: 18, height: 18, cursor: 'pointer' }} />
              <button className="btn btn-danger" style={{ padding: '4px 8px' }} onClick={() => remove(i)}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
              <input value={b.img} onChange={e => update(i, 'img', e.target.value)} placeholder="Image URL (or upload below)"
                style={{ marginBottom: 0, fontSize: 12, flex: 1 }} />
              <label className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 10px', cursor: 'pointer', marginBottom: 0, whiteSpace: 'nowrap' }}>
                📁 Upload
                <input type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => e.target.files[0] && uploadBadgeImg(i, e.target.files[0])} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#888' }}>Size:</span>
              <input type="number" value={b.width || 80} onChange={e => update(i, 'width', Number(e.target.value))}
                placeholder="W" title="Width (px)" style={{ marginBottom: 0, width: 60 }} min={10} max={400} />
              <span style={{ fontSize: 12, color: '#aaa' }}>×</span>
              <input type="number" value={b.height || 40} onChange={e => update(i, 'height', Number(e.target.value))}
                placeholder="H" title="Height (px)" style={{ marginBottom: 0, width: 60 }} min={10} max={400} />
              {b.img && <img src={b.img} alt={b.name} style={{ width: b.width || 80, height: b.height || 40, objectFit: 'contain', marginLeft: 8 }} onError={e => e.target.style.display = 'none'} />}
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-secondary" onClick={() => add()}>+ Custom</button>
          <button className="btn btn-primary" onClick={() => save('trust_badges', JSON.stringify(badges))}>Save</button>
          {saved === 'trust_badges' && <span style={{ color: 'green', fontSize: 13, alignSelf: 'center' }}>✓ Saved</span>}
        </div>
      </div>
    </div>
  );
}


function TranslationsTab() {
  const [langs, setLangs] = useState([]);
  const [selectedLang, setSelectedLang] = useState('en');
  const [translations, setTranslations] = useState({});
  const [saved, setSaved] = useState(false);

  const KEYS = ['successfullyAdded'];

  useEffect(() => {
    api.get('/api/languages').then(r => {
      const all = r.data;
      setLangs(all);
      if (all[0]) setSelectedLang(all[0].code);
    });
  }, []);

  useEffect(() => {
    if (!selectedLang) return;
    setTranslations({});
    api.get(`/api/translations/${selectedLang}`).then(r => setTranslations(r.data)).catch(() => {});
  }, [selectedLang]);

  const update = (key, value) => setTranslations(t => ({ ...t, [key]: value }));

  const saveAll = async () => {
    await api.put(`/api/translations/${selectedLang}`, translations);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const activeLangObj = langs.find(l => l.code === selectedLang);

  return (
    <div className="card">
      <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
        Manage translatable messages shown to users. Add translations for each enabled language.
      </p>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {langs.map(l => (
          <button key={l.code} onClick={() => setSelectedLang(l.code)}
            style={{ padding: '6px 14px', border: '1px solid #ddd', borderRadius: 6, background: selectedLang === l.code ? '#febd69' : '#fff', cursor: 'pointer', fontWeight: selectedLang === l.code ? 700 : 400, fontSize: 14 }}>
            {l.flag} {l.label}
          </button>
        ))}
      </div>

      <table style={{ width: '100%', marginBottom: 16 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', width: '30%' }}>Key</th>
            <th style={{ textAlign: 'left' }}>Translation</th>
          </tr>
        </thead>
        <tbody>
          {KEYS.map(key => (
            <tr key={key}>
              <td style={{ padding: '8px 0', fontFamily: 'monospace', fontSize: 13, color: '#555' }}>{key}</td>
              <td style={{ padding: '8px 0' }}>
                <input
                  value={translations[key] || ''}
                  onChange={e => update(key, e.target.value)}
                  placeholder=""
                  style={{ marginBottom: 0, width: '100%' }}
                  dir={activeLangObj?.rtl ? 'rtl' : 'ltr'}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button className="btn btn-primary" onClick={saveAll}>Save</button>
        {saved && <span style={{ color: 'green', fontSize: 13 }}>✓ Saved</span>}
      </div>
    </div>
  );
}

function AuthPagesTab({ settings, save, saved }) {
  const [langs, setLangs] = useState([]);
  const [activeLang, setActiveLang] = useState('en');
  const [labels, setLabels] = useState({});
  const [localSaved, setLocalSaved] = useState(false);

  const FIELDS = [
    { key: 'login_title', label: 'Login — Page Title', default: 'Login' },
    { key: 'login_identifier', label: 'Login — Email/Phone Label', default: 'Email or Phone' },
    { key: 'login_identifier_placeholder', label: 'Login — Email/Phone Placeholder', default: 'email@example.com or +1234567890' },
    { key: 'login_password', label: 'Login — Password Label', default: 'Password' },
    { key: 'login_button', label: 'Login — Button Text', default: 'Login' },
    { key: 'login_forgot', label: 'Login — Forgot Password Link', default: 'Forgot Password?' },
    { key: 'login_no_account', label: 'Login — No Account Text', default: 'Don\'t have an account?' },
    { key: 'register_title', label: 'Register — Page Title', default: 'Register' },
    { key: 'register_button_short', label: 'Register — Button (on Login page)', default: 'Register' },
    { key: 'register_identifier', label: 'Register — Email/Phone Label', default: 'Email or Phone' },
    { key: 'register_password', label: 'Register — Password Label', default: 'Password' },
    { key: 'register_button', label: 'Register — Button Text', default: 'Send Verification Code' },
    { key: 'register_has_account', label: 'Register — Has Account Text', default: 'Already have an account?' },
    { key: 'verify_title', label: 'Verify — Instruction Text', default: 'Enter the 5-digit code sent to' },
    { key: 'verify_button', label: 'Verify — Button Text', default: 'Verify & Create Account' },
    { key: 'verify_resend', label: 'Verify — Resend Button', default: 'Resend Code' },
    { key: 'forgot_title', label: 'Forgot Password — Title', default: 'Forgot Password' },
    { key: 'forgot_button', label: 'Forgot Password — Button', default: 'Send Reset Code' },
    { key: 'forgot_back', label: 'Forgot Password — Back Link', default: '← Back to Login' },
    { key: 'reset_title', label: 'Reset Password — Title', default: 'Reset Password' },
    { key: 'reset_code_label', label: 'Reset — Code Label', default: 'Code' },
    { key: 'reset_newpass_label', label: 'Reset — New Password Label', default: 'New Password' },
    { key: 'reset_button', label: 'Reset — Button Text', default: 'Reset Password' },
  ];

  useEffect(() => {
    api.get('/api/languages').then(r => {
      const all = r.data;
      setLangs(all);
      if (all[0]) setActiveLang(all[0].code);
    });
  }, []);

  useEffect(() => {
    try { setLabels(JSON.parse(settings.auth_page_labels || '{}')); } catch { setLabels({}); }
  }, [settings.auth_page_labels]);

  const get = (key) => labels[activeLang]?.[key] || '';
  const update = (key, val) => setLabels(prev => ({ ...prev, [activeLang]: { ...(prev[activeLang] || {}), [key]: val } }));

  const saveAll = () => {
    save('auth_page_labels', labels);
    setLocalSaved(true); setTimeout(() => setLocalSaved(false), 2000);
  };

  const activeLangObj = langs.find(l => l.code === activeLang);

  return (
    <div style={{ maxWidth: 600 }}>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
        Define the text shown on Login, Register, Verify, and Forgot Password pages for each language.
      </p>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {langs.map(l => (
          <button key={l.code} onClick={() => setActiveLang(l.code)}
            style={{ padding: '6px 14px', border: '1px solid #ddd', borderRadius: 6, background: activeLang === l.code ? '#febd69' : '#fff', cursor: 'pointer', fontWeight: activeLang === l.code ? 700 : 400, fontSize: 14 }}>
            {l.flag} {l.label}
          </button>
        ))}
      </div>

      <div className="card">
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', width: '40%', fontSize: 13 }}>Field</th>
              <th style={{ textAlign: 'left', fontSize: 13 }}>{activeLangObj?.flag} {activeLangObj?.label} Text</th>
            </tr>
          </thead>
          <tbody>
            {FIELDS.map(f => (
              <tr key={f.key}>
                <td style={{ padding: '6px 8px 6px 0', fontSize: 13, color: '#555' }}>{f.label}</td>
                <td style={{ padding: '6px 0' }}>
                  <input value={get(f.key)} onChange={e => update(f.key, e.target.value)}
                    placeholder={f.default} dir={activeLangObj?.rtl ? 'rtl' : 'ltr'}
                    style={{ marginBottom: 0, width: '100%' }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn btn-primary" onClick={saveAll}>Save</button>
          {(localSaved || saved === 'auth_page_labels') && <span style={{ color: 'green', fontSize: 13, alignSelf: 'center' }}>✓ Saved</span>}
        </div>
      </div>
    </div>
  );
}
