import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import CategoryManager from '../../components/CategoryManager';

const base = process.env.REACT_APP_API_URL || '';

const emptyForm = {
  names: { en: '' },        // { [langCode]: string }
  descriptions: { en: '' }, // { [langCode]: string }
  stock: '',
  category_id: '',
  prices: [],               // [{ currency, price, sale_price, langs: [langCode] }]
  newVideos: [''],
};

function ProductForm({ form, editing, formLang, setFormLang, availLangs, allCurrencies, existingMedia, deleteIds, bannerMediaId, flatCats, t,
  setName, setDesc, setPrice, removePrice, setField, setVideo, setForm, setBannerMediaId, toggleDelete, submit, cancel }) {
  const activeLangs = availLangs.filter(l => form.names[l.code] !== undefined);
  const unusedLangs = availLangs.filter(l => form.names[l.code] === undefined);

  const addLangToForm = (langCode) => {
    if (form.names[langCode] !== undefined) return;
    setName(langCode, '');
    setDesc(langCode, '');
    const cur = allCurrencies.find(c => c.language_code === langCode);
    const currency = cur?.currency_code || 'USD';
    if (!form.prices.find(p => (p.langs || []).includes(langCode))) {
      setForm(f => ({ ...f, prices: [...f.prices, { currency, price: '', sale_price: '', langs: [langCode] }] }));
    }
  };

  return (
    <form onSubmit={submit} style={{ background: '#f9f9f9', border: '1px solid #ddd', borderRadius: 8, padding: 20, marginBottom: 16 }}>
      <h3 style={{ marginBottom: 16 }}>{editing ? t('editProduct') : t('addProduct')}</h3>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {activeLangs.map(l => (
          <button key={l.code} type="button" onClick={() => setFormLang(l.code)}
            style={{ padding: '6px 16px', border: '1px solid #ddd', borderRadius: 6, background: formLang === l.code ? '#febd69' : '#fff', cursor: 'pointer', fontWeight: formLang === l.code ? 700 : 400, fontSize: 14 }}>
            {l.flag} {l.label || l.code.toUpperCase()}
          </button>
        ))}
        {unusedLangs.length > 0 && (
          <select defaultValue="" onChange={e => { if (e.target.value) { addLangToForm(e.target.value); setFormLang(e.target.value); } }}
            style={{ fontSize: 13, padding: '6px 10px', borderRadius: 6, border: '1px dashed #aaa', background: '#fff', cursor: 'pointer' }}>
            <option value="">+ Add language...</option>
            {unusedLangs.map(l => <option key={l.code} value={l.code}>{l.flag} {l.label || l.code.toUpperCase()}</option>)}
          </select>
        )}
      </div>

      {activeLangs.map(l => {
        const isRTL = l.rtl || ['fa', 'ar'].includes(l.code);
        const priceIdx = form.prices.findIndex(p => (p.langs || []).includes(l.code));
        const price = priceIdx >= 0 ? form.prices[priceIdx] : null;
        const pct = price?.sale_price && price?.price && price.sale_price < price.price
          ? Math.round((1 - price.sale_price / price.price) * 100) : null;
        const langCurrencies = allCurrencies.filter(c => c.language_code === l.code);
        const defaultCur = langCurrencies[0]?.currency_code || (l.code === 'fa' ? 'IRR' : l.code === 'ar' ? 'SAR' : 'USD');
        return (
          <div key={l.code} style={{ display: formLang === l.code ? 'block' : 'none' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div className="form-group">
                <label>Name {l.code === 'en' ? '*' : ''}</label>
                <input value={form.names[l.code] || ''} dir={isRTL ? 'rtl' : 'ltr'}
                  onChange={e => setName(l.code, e.target.value)} required={l.code === 'en'} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={2} value={form.descriptions[l.code] || ''} dir={isRTL ? 'rtl' : 'ltr'}
                  onChange={e => setDesc(l.code, e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: 6 }}>Price for {l.label || l.code.toUpperCase()}</label>
              {price
                ? <PriceRow price={price} priceIdx={priceIdx} langCurrencies={langCurrencies} pct={pct} setPrice={setPrice} removePrice={removePrice} />
                : <button type="button" className="btn btn-secondary" style={{ fontSize: 12 }}
                    onClick={() => setForm(f => ({ ...f, prices: [...f.prices, { currency: defaultCur, price: '', sale_price: '', langs: [l.code] }] }))}>
                    + Add price for {l.label || l.code.toUpperCase()}
                  </button>
              }
            </div>
          </div>
        );
      })}

      {editing && existingMedia.length > 0 && (
        <div className="form-group">
          <label style={{ display: 'block', marginBottom: 8 }}>Current Media — ⭐ set banner, ✕ remove</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {existingMedia.filter(m => !deleteIds.includes(m.id)).map(m => (
              <div key={m.id} style={{ position: 'relative', border: bannerMediaId === m.id ? '3px solid #febd69' : '2px solid #ddd', borderRadius: 6, overflow: 'hidden' }}>
                {m.type === 'image'
                  ? <img src={`${base}${m.url}`} alt="" style={{ width: 80, height: 80, objectFit: 'cover', display: 'block' }} />
                  : <div style={{ width: 80, height: 80, background: '#222', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>▶</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.6)', padding: '2px 4px' }}>
                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }} onClick={() => setBannerMediaId(m.id)}>⭐</button>
                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f66', fontSize: 14 }} onClick={() => toggleDelete(m.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="form-group">
        <label>Add Images</label>
        <input id="media-upload" type="file" accept="image/*" multiple />
      </div>

      <div className="form-group">
        <label style={{ display: 'block', marginBottom: 8 }}>Video URLs</label>
        {form.newVideos.map((v, i) => (
          <input key={i} placeholder="https://youtube.com/..." value={v} onChange={e => setVideo(i, e.target.value)} style={{ marginBottom: 6 }} />
        ))}
        <button type="button" className="btn btn-secondary" style={{ fontSize: 12 }}
          onClick={() => setForm(f => ({ ...f, newVideos: [...f.newVideos, ''] }))}>+ Add video</button>
      </div>

      {flatCats.length > 0 && (
        <div className="form-group" style={{ maxWidth: 320 }}>
          <label>Category</label>
          <CategoryDropdown value={form.category_id} onChange={v => setField('category_id', v)} flatCats={flatCats} />
        </div>
      )}

      <div className="form-group" style={{ maxWidth: 150 }}>
        <label>{t('stock')} *</label>
        <input type="number" value={form.stock} onChange={e => setField('stock', e.target.value)} required />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" className="btn btn-primary">{t('save')}</button>
        <button type="button" className="btn btn-secondary" onClick={cancel}>{t('cancel')}</button>
      </div>
    </form>
  );
}

function CategoryDropdown({ value, onChange, flatCats }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const selected = flatCats.find(c => String(c.id) === String(value));
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen(o => !o)}
        style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{selected ? selected.label : '— No category —'}</span>
        <span style={{ fontSize: 11, opacity: 0.6 }}>▾</span>
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ddd', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 999, maxHeight: 240, overflowY: 'auto' }}>
          <div onClick={() => { onChange(''); setOpen(false); }}
            style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 14, color: '#888' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
            onMouseLeave={e => e.currentTarget.style.background = ''}>
            — No category —
          </div>
          {flatCats.map(c => (
            <div key={c.id} onClick={() => { onChange(c.id); setOpen(false); }}
              style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 14, background: String(value) === String(c.id) ? '#fffbe6' : '' }}
              onMouseEnter={e => e.currentTarget.style.background = String(value) === String(c.id) ? '#fffbe6' : '#f5f5f5'}
              onMouseLeave={e => e.currentTarget.style.background = String(value) === String(c.id) ? '#fffbe6' : ''}>
              {c.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PriceRow({ price, priceIdx, langCurrencies, pct, setPrice, removePrice }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <select value={price.currency} onChange={e => setPrice(priceIdx, 'currency', e.target.value)} style={{ marginBottom: 0, width: 180 }}>
        {langCurrencies.length > 0
          ? langCurrencies.map(c => <option key={c.currency_code} value={c.currency_code}>{c.flag} {c.country} ({c.currency_code})</option>)
          : <option value={price.currency}>{price.currency}</option>}
      </select>
      <input type="text" inputMode="decimal" placeholder="Regular price" value={price.price} dir="ltr"
        onChange={e => { if (/^\d*\.?\d*$/.test(e.target.value)) setPrice(priceIdx, 'price', e.target.value); }}
        onBlur={e => { if (e.target.value) setPrice(priceIdx, 'price', parseFloat(e.target.value).toFixed(2)); }}
        style={{ marginBottom: 0, width: 130 }} />
      <input type="text" inputMode="decimal" placeholder="Sale price" value={price.sale_price || ''} dir="ltr"
        onChange={e => { if (/^\d*\.?\d*$/.test(e.target.value)) setPrice(priceIdx, 'sale_price', e.target.value); }}
        onBlur={e => { if (e.target.value) setPrice(priceIdx, 'sale_price', parseFloat(e.target.value).toFixed(2)); }}
        style={{ marginBottom: 0, width: 130 }} />
      {pct && <span style={{ background: '#e74c3c', color: '#fff', fontSize: 11, padding: '2px 6px', borderRadius: 4 }}>-{pct}%</span>}
      <button type="button" className="btn btn-danger" style={{ padding: '4px 8px' }} onClick={() => removePrice(priceIdx)}>✕</button>
    </div>
  );
}

export default function ManageProducts() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [existingMedia, setExistingMedia] = useState([]);
  const [deleteIds, setDeleteIds] = useState([]);
  const [bannerMediaId, setBannerMediaId] = useState(null);
  const [newBannerIdx, setNewBannerIdx] = useState(0);
  const [availLangs, setAvailLangs] = useState([{ code: 'en', label: 'English', flag: '' }]);
  const [allCurrencies, setAllCurrencies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [flatCats, setFlatCats] = useState([]);
  const [formLang, setFormLang] = useState('en');

  const loadCats = () => {
    api.get('/api/categories').then(r => setCategories(r.data));
    api.get(`/api/categories/flat?lang=${formLang}`).then(r => setFlatCats(r.data));
  };
  const load = () => api.get('/api/products').then(r => setProducts(r.data));

  useEffect(() => {
    load(); loadCats();
    api.get('/api/languages').then(r => { if (r.data.length) setAvailLangs(r.data); });
    api.get('/api/currencies').then(r => setAllCurrencies(r.data));
  }, []);

  useEffect(() => {
    api.get(`/api/categories/flat?lang=${formLang}`).then(r => setFlatCats(r.data));
  }, [formLang]);

  const setName = (lang, v) => setForm(f => ({ ...f, names: { ...f.names, [lang]: v } }));
  const setDesc = (lang, v) => setForm(f => ({ ...f, descriptions: { ...f.descriptions, [lang]: v } }));
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setPrice = (i, k, v) => setForm(f => { const p = [...f.prices]; p[i] = { ...p[i], [k]: v }; return { ...f, prices: p }; });
  const removePrice = i => setForm(f => ({ ...f, prices: f.prices.filter((_, idx) => idx !== i) }));
  const setVideo = (i, v) => setForm(f => { const vids = [...f.newVideos]; vids[i] = v; return { ...f, newVideos: vids }; });

  const startEdit = p => {
    // Build names/descriptions from JSON columns (with fallback to old columns)
    const names = { ...(p.names || {}), en: p.names?.en || p.name || '' };
    const descriptions = { ...(p.descriptions || {}), en: p.descriptions?.en || p.description || '' };
    setForm({
      names, descriptions,
      stock: p.stock,
      category_id: p.category_id || '',
      prices: p.prices?.length ? p.prices.map(pr => ({ currency: pr.currency, price: pr.price, sale_price: pr.sale_price || '', langs: pr.langs || [] })) : [],
      newVideos: [''],
    });
    setExistingMedia(p.media || []);
    setDeleteIds([]);
    setBannerMediaId(p.banner?.id || null);
    setEditing(p.id); setShowAdd(false);
  };

  const startAdd = () => {
    // Pre-populate one price per language based on currencies
    const prices = availLangs.map(l => {
      const cur = allCurrencies.find(c => c.language_code === l.code);
      return { currency: cur?.currency_code || (l.code === 'fa' ? 'IRR' : l.code === 'ar' ? 'SAR' : 'USD'), price: '', sale_price: '', langs: [l.code] };
    });
    const names = Object.fromEntries(availLangs.map(l => [l.code, '']));
    const descriptions = Object.fromEntries(availLangs.map(l => [l.code, '']));
    setForm({ ...emptyForm, names, descriptions, prices });
    setExistingMedia([]); setDeleteIds([]); setBannerMediaId(null); setNewBannerIdx(0);
    setEditing(null); setShowAdd(true);
  };

  const cancel = () => { setEditing(null); setShowAdd(false); };
  const toggleDelete = id => setDeleteIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const submit = async e => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('names', JSON.stringify(form.names));
    fd.append('descriptions', JSON.stringify(form.descriptions));
    fd.append('stock', form.stock);
    fd.append('prices', JSON.stringify(form.prices));
    fd.append('video_urls', JSON.stringify(form.newVideos.filter(Boolean)));
    if (form.category_id) fd.append('category_id', form.category_id);
    const fileInput = document.getElementById('media-upload');
    if (fileInput?.files) Array.from(fileInput.files).forEach(f => fd.append('media', f));
    if (editing) {
      fd.append('delete_media_ids', JSON.stringify(deleteIds));
      if (bannerMediaId) fd.append('banner_media_id', bannerMediaId);
      await api.put(`/api/products/${editing}`, fd);
    } else {
      fd.append('banner_index', newBannerIdx);
      await api.post('/api/products', fd);
    }
    cancel(); load();
  };

  const del = async id => { if (!window.confirm('Delete?')) return; await api.delete(`/api/products/${id}`); load(); };

  // Add a new language tab to the form (for future languages)
  const addLangToForm = (langCode) => {
    if (form.names[langCode] !== undefined) return;
    setName(langCode, '');
    setDesc(langCode, '');
    const cur = allCurrencies.find(c => c.language_code === langCode);
    const currency = cur?.currency_code || 'USD';
    if (!form.prices.find(p => (p.langs || []).includes(langCode))) {
      setForm(f => ({ ...f, prices: [...f.prices, { currency, price: '', sale_price: '', langs: [langCode] }] }));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>{t('manageProducts')}</h2>
        <button className="btn btn-primary" onClick={startAdd}>+ {t('addProduct')}</button>
      </div>

      {showAdd && <ProductForm form={form} editing={editing} formLang={formLang} setFormLang={setFormLang} availLangs={availLangs} allCurrencies={allCurrencies} existingMedia={existingMedia} deleteIds={deleteIds} bannerMediaId={bannerMediaId} flatCats={flatCats} t={t} setName={setName} setDesc={setDesc} setPrice={setPrice} removePrice={removePrice} setField={setField} setVideo={setVideo} setForm={setForm} setBannerMediaId={setBannerMediaId} toggleDelete={toggleDelete} submit={submit} cancel={cancel} />}

      <CategoryManager categories={categories} onRefresh={loadCats} />

      <table>
        <thead>
          <tr>
            <th style={{ width: 70 }}>Banner</th>
            <th>{t('name')}</th>
            <th>Translations</th>
            <th>Prices</th>
            <th style={{ width: 60 }}>{t('stock')}</th>
            <th style={{ width: 90 }}></th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <>
              <tr key={p.id} style={{ background: editing === p.id ? '#fffbe6' : 'white' }}>
                <td>
                  {p.banner?.type === 'image'
                    ? <img src={`${base}${p.banner.url}`} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 4 }} />
                    : p.banner?.type === 'video'
                    ? <div style={{ width: 56, height: 56, background: '#222', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>▶</div>
                    : <div style={{ width: 56, height: 56, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, fontSize: 24 }}>🥛</div>}
                </td>
                <td>
                  <strong>{p.names?.en || p.name}</strong>
                  {(p.descriptions?.en || p.description) && <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{(p.descriptions?.en || p.description)?.slice(0, 60)}</div>}
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{p.media?.length || 0} media</div>
                </td>
                <td>
                  {p.names && Object.entries(p.names).filter(([k, v]) => k !== 'en' && v).map(([lang, name]) => (
                    <div key={lang} style={{ direction: ['fa','ar'].includes(lang) ? 'rtl' : 'ltr', fontSize: 12, color: '#555' }}>
                      <span style={{ fontSize: 10, color: '#aaa', marginRight: 4 }}>{lang.toUpperCase()}</span>{name}
                    </div>
                  ))}
                </td>
                <td>
                  {p.prices?.map(pr => (
                    <div key={pr.currency} style={{ fontSize: 12 }}>
                      <strong>{pr.currency}</strong>: {Number(pr.price).toLocaleString()}
                      {pr.sale_price ? <span style={{ color: '#e74c3c', marginLeft: 4 }}>→ {Number(pr.sale_price).toLocaleString()}</span> : null}
                    </div>
                  ))}
                </td>
                <td>{p.stock}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-secondary" style={{ padding: '4px 10px' }} onClick={() => editing === p.id ? cancel() : startEdit(p)}>
                      {editing === p.id ? '✕' : '✏️'}
                    </button>
                    <button className="btn btn-danger" style={{ padding: '4px 10px' }} onClick={() => del(p.id)}>🗑️</button>
                  </div>
                </td>
              </tr>
              {editing === p.id && (
                <tr key={`edit-${p.id}`}>
                  <td colSpan={6} style={{ padding: 0 }}><ProductForm form={form} editing={editing} formLang={formLang} setFormLang={setFormLang} availLangs={availLangs} allCurrencies={allCurrencies} existingMedia={existingMedia} deleteIds={deleteIds} bannerMediaId={bannerMediaId} flatCats={flatCats} t={t} setName={setName} setDesc={setDesc} setPrice={setPrice} removePrice={removePrice} setField={setField} setVideo={setVideo} setForm={setForm} setBannerMediaId={setBannerMediaId} toggleDelete={toggleDelete} submit={submit} cancel={cancel} /></td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
