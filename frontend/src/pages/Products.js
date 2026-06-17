import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useCart } from '../context/CartContext';
import { useButtonLabels } from '../context/ButtonLabelsContext';
import { useAuth } from '../context/AuthContext';
import CategoryManager from '../components/CategoryManager';

const base = process.env.REACT_APP_API_URL || '';

// ─── helpers ────────────────────────────────────────────────────────────────

function findPrice(prices, lang, currency) {
  if (!prices) return null;
  return prices.find(pr => pr.langs?.length ? pr.langs.includes(lang) : pr.currency === currency) || null;
}

function fmtPrice(symbol, amount, currency, lang, fractionDigits) {
  const num = Number(amount);
  const digits = fractionDigits ?? 0;
  if (document.documentElement.dir === 'rtl') {
    return `${num.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits })} ${symbol}`;
  }
  return `${symbol}${num.toFixed(digits)}`;
}

// ─── ProductCard ─────────────────────────────────────────────────────────────

function ProductCard({ p, lang, currency, symbol, fractionDigits = 2, onAdd, onClick }) {
  const { btn } = useButtonLabels();
  const { label: addLabel, color: addColor } = btn('addToCart', lang);
  const name = p.names?.[lang] || p.name;
  const priceObj = findPrice(p.prices, lang, currency);
  if (!priceObj) return null;
  const img = p.banner?.url ? `${base}${p.banner.url}` : null;
  const hasDiscount = priceObj.sale_price && priceObj.sale_price < priceObj.price;
  const discountPct = hasDiscount ? Math.round((1 - priceObj.sale_price / priceObj.price) * 100) : null;

  return (
    <div className="product-card" onClick={onClick} style={{ cursor: 'pointer' }}>
      {img
        ? <img src={img} alt={name} />
        : <div style={{ height: 180, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🛍️</div>
      }
      <h3>{name}</h3>
      {hasDiscount ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px' }}>
          <span style={{ textDecoration: 'line-through', color: '#999', fontSize: 13, marginRight: 6 }}>{fmtPrice(symbol, priceObj.price, currency, lang, fractionDigits)}</span>
          <span className="price">{fmtPrice(symbol, priceObj.sale_price, currency, lang, fractionDigits)}</span>
          <span style={{ background: '#e74c3c', color: '#fff', fontSize: 11, padding: '1px 6px', borderRadius: 4, marginLeft: 6 }}>-{discountPct}%</span>
        </div>
      ) : (
        <div className="price">{fmtPrice(symbol, priceObj.price, currency, lang, fractionDigits)}</div>
      )}
      <button className="btn btn-primary" style={{ marginTop: 8, width: '100%', background: addColor }}
        onClick={e => { e.stopPropagation(); onAdd({ ...p, name, price: priceObj.sale_price ?? priceObj.price, currency }); }}>
        {addLabel}
      </button>
    </div>
  );
}

// ─── Admin: sub-components ───────────────────────────────────────────────────

function PriceRow({ price, priceIdx, langCurrencies, pct, setPrice, removePrice }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
      <select value={price.currency} onChange={e => setPrice(priceIdx, 'currency', e.target.value)} style={{ marginBottom: 0, width: 180 }}>
        {langCurrencies.length > 0
          ? langCurrencies.map(c => <option key={c.currency_code} value={c.currency_code}>{c.flag} {c.country} ({c.currency_code})</option>)
          : <option value={price.currency}>{price.currency}</option>}
      </select>
      <input type="text" inputMode="decimal" placeholder="Regular price" value={price.price} dir="ltr"
        onChange={e => { if (/^\d*\.?\d*$/.test(e.target.value)) setPrice(priceIdx, 'price', e.target.value); }}
        onBlur={e => { if (e.target.value) setPrice(priceIdx, 'price', parseFloat(e.target.value).toFixed(2)); }}
        style={{ marginBottom: 0, width: 120 }} />
      <input type="text" inputMode="decimal" placeholder="Sale price" value={price.sale_price || ''} dir="ltr"
        onChange={e => { if (/^\d*\.?\d*$/.test(e.target.value)) setPrice(priceIdx, 'sale_price', e.target.value); }}
        onBlur={e => { if (e.target.value) setPrice(priceIdx, 'sale_price', parseFloat(e.target.value).toFixed(2)); }}
        style={{ marginBottom: 0, width: 120 }} />
      {pct && <span style={{ background: '#e74c3c', color: '#fff', fontSize: 11, padding: '2px 6px', borderRadius: 4 }}>-{pct}%</span>}
      <button type="button" className="btn btn-danger" style={{ padding: '4px 8px' }} onClick={() => removePrice(priceIdx)}>✕</button>
    </div>
  );
}

function CategoryDropdown({ value, onChange, flatCats }) {
  const [open, setOpen] = useState(false);
  const ref = useState(() => ({ current: null }))[0];
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref]);
  const selected = flatCats.find(c => String(c.id) === String(value));
  return (
    <div ref={el => ref.current = el} style={{ position: 'relative' }}>
      <div onClick={() => setOpen(o => !o)}
        style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{selected ? selected.label : '— No category —'}</span>
        <span style={{ fontSize: 11, opacity: 0.6 }}>▾</span>
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ddd', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1100, maxHeight: 240, overflowY: 'auto' }}>
          <div onClick={() => { onChange(''); setOpen(false); }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 14, color: '#888' }}>— No category —</div>
          {flatCats.map(c => (
            <div key={c.id} onClick={() => { onChange(c.id); setOpen(false); }}
              style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 14, background: String(value) === String(c.id) ? '#fffbe6' : '' }}>
              {c.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const emptyForm = {
  names: { en: '' },
  descriptions: { en: '' },
  stock: '',
  category_id: '',
  prices: [],
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
    <form onSubmit={submit} style={{ padding: '0 4px' }}>
      <h3 style={{ marginBottom: 16 }}>{editing ? (t('editProduct') || 'Edit Product') : (t('addProduct') || 'Add Product')}</h3>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {activeLangs.map(l => (
          <button key={l.code} type="button" onClick={() => setFormLang(l.code)}
            style={{ padding: '6px 14px', border: '1px solid #ddd', borderRadius: 6, background: formLang === l.code ? '#febd69' : '#fff', cursor: 'pointer', fontWeight: formLang === l.code ? 700 : 400, fontSize: 13 }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
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
                  ? <img src={`${base}${m.url}`} alt="" style={{ width: 72, height: 72, objectFit: 'cover', display: 'block' }} />
                  : <div style={{ width: 72, height: 72, background: '#222', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>▶</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.6)', padding: '2px 4px' }}>
                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }} onClick={() => setBannerMediaId(m.id)}>⭐</button>
                  <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f66', fontSize: 13 }} onClick={() => toggleDelete(m.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="form-group">
        <label>Add Images</label>
        <input id="admin-media-upload" type="file" accept="image/*" multiple />
      </div>

      <div className="form-group">
        <label style={{ display: 'block', marginBottom: 6 }}>Video URLs</label>
        {form.newVideos.map((v, i) => (
          <input key={i} placeholder="https://youtube.com/..." value={v} onChange={e => setVideo(i, e.target.value)} style={{ marginBottom: 6 }} />
        ))}
        <button type="button" className="btn btn-secondary" style={{ fontSize: 12 }}
          onClick={() => setForm(f => ({ ...f, newVideos: [...f.newVideos, ''] }))}>+ Add video</button>
      </div>

      {flatCats.length > 0 && (
        <div className="form-group" style={{ maxWidth: 280 }}>
          <label>Category</label>
          <CategoryDropdown value={form.category_id} onChange={v => setField('category_id', v)} flatCats={flatCats} />
        </div>
      )}

      <div className="form-group" style={{ maxWidth: 140 }}>
        <label>{t('stock') || 'Stock'} *</label>
        <input type="number" value={form.stock} onChange={e => setField('stock', e.target.value)} required />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button type="submit" className="btn btn-primary">{t('save') || 'Save'}</button>
        <button type="button" className="btn btn-secondary" onClick={cancel}>{t('cancel') || 'Cancel'}</button>
      </div>
    </form>
  );
}

// ─── AdminOverlay ────────────────────────────────────────────────────────────

function AdminOverlay({ onProductsChange }) {
  const { t } = useTranslation();
  // 'none' | 'addProduct' | 'editProduct' | 'categories'
  const [panel, setPanel] = useState('none');
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [formLang, setFormLang] = useState('en');
  const [availLangs, setAvailLangs] = useState([{ code: 'en', label: 'English', flag: '' }]);
  const [allCurrencies, setAllCurrencies] = useState([]);
  const [flatCats, setFlatCats] = useState([]);
  const [categories, setCategories] = useState([]);
  const [existingMedia, setExistingMedia] = useState([]);
  const [deleteIds, setDeleteIds] = useState([]);
  const [bannerMediaId, setBannerMediaId] = useState(null);
  const [products, setProducts] = useState([]);

  const loadCats = () => {
    api.get('/api/categories').then(r => setCategories(r.data));
    api.get(`/api/categories/flat?lang=${formLang}`).then(r => setFlatCats(r.data));
  };

  const loadProducts = () => api.get('/api/products').then(r => { setProducts(r.data); onProductsChange?.(); });

  useEffect(() => {
    loadCats();
    api.get('/api/languages').then(r => { if (r.data.length) setAvailLangs(r.data); });
    api.get('/api/currencies').then(r => setAllCurrencies(r.data));
    api.get('/api/products').then(r => setProducts(r.data));
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
  const toggleDelete = id => setDeleteIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const openAdd = () => {
    const prices = availLangs.map(l => {
      const cur = allCurrencies.find(c => c.language_code === l.code);
      return { currency: cur?.currency_code , price: '', sale_price: '', langs: [l.code] };
    });
    const names = Object.fromEntries(availLangs.map(l => [l.code, '']));
    const descriptions = Object.fromEntries(availLangs.map(l => [l.code, '']));
    setForm({ ...emptyForm, names, descriptions, prices });
    setExistingMedia([]); setDeleteIds([]); setBannerMediaId(null);
    setEditing(null); setPanel('addProduct');
  };

  const openEdit = p => {
    const names = { ...(p.names || {}), en: p.names?.en || p.name || '' };
    const descriptions = { ...(p.descriptions || {}), en: p.descriptions?.en || p.description || '' };
    setForm({
      names, descriptions,
      stock: p.stock,
      category_id: p.category_id || '',
      prices: p.prices?.length ? p.prices.map(pr => ({ currency: pr.currency, price: pr.price, sale_price: pr.sale_price || '', langs: pr.langs?.length ? pr.langs : [allCurrencies.find(c => c.currency_code === pr.currency)?.language_code || 'en'] })) : [],
      newVideos: [''],
    });
    setExistingMedia(p.media || []);
    setDeleteIds([]); setBannerMediaId(p.banner?.id || null);
    setEditing(p.id); setPanel('editProduct');
  };

  const cancel = () => { setEditing(null); setPanel('none'); };

  const submit = async e => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('names', JSON.stringify(form.names));
    fd.append('descriptions', JSON.stringify(form.descriptions));
    fd.append('stock', form.stock);
    fd.append('prices', JSON.stringify(form.prices));
    fd.append('video_urls', JSON.stringify(form.newVideos.filter(Boolean)));
    if (form.category_id) fd.append('category_id', form.category_id);
    const fileInput = document.getElementById('admin-media-upload');
    if (fileInput?.files) Array.from(fileInput.files).forEach(f => fd.append('media', f));
    if (editing) {
      fd.append('delete_media_ids', JSON.stringify(deleteIds));
      if (bannerMediaId) fd.append('banner_media_id', bannerMediaId);
      await api.put(`/api/products/${editing}`, fd);
    } else {
      fd.append('banner_index', 0);
      await api.post('/api/products', fd);
    }
    cancel(); loadProducts();
  };

  const del = async id => {
    if (!window.confirm('Delete this product?')) return;
    await api.delete(`/api/products/${id}`);
    loadProducts();
  };

  const isOpen = panel !== 'none';

  return (
    <>
      {/* Sticky admin bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 900,
        background: '#1a1a2e', color: '#fff',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px', borderRadius: 8, marginBottom: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
      }}>
        <span style={{ fontSize: 13, opacity: 0.7, marginRight: 4 }}>⚙️ Admin</span>
        <button className="btn btn-primary" style={{ fontSize: 13, padding: '6px 16px' }} onClick={openAdd}>
          + {t('addProduct') || 'Add Product'}
        </button>
        <button className="btn btn-secondary" style={{ fontSize: 13, padding: '6px 16px' }}
          onClick={() => setPanel(p => p === 'categories' ? 'none' : 'categories')}>
          🗂 {t('manageCategories') || 'Categories'}
        </button>

        {/* inline product list for editing / deleting */}
        {/* <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {products.map(p => (
            <div key={p.id} style={{ display: 'flex', gap: 4, alignItems: 'center', background: 'rgba(255,255,255,0.08)', borderRadius: 6, padding: '3px 8px', fontSize: 12 }}>
              <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.names?.en || p.name}</span>
              <button onClick={() => openEdit(p)} style={chipBtn('#febd69', '#000')} title="Edit">✏️</button>
              <button onClick={() => del(p.id)} style={chipBtn('#e74c3c', '#fff')} title="Delete">🗑</button>
            </div>
          ))}
        </div> */}
      </div>

      {/* Slide-in drawer */}
      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 480, maxWidth: '95vw',
          background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.18)',
          zIndex: 1000, overflowY: 'auto', padding: 24,
        }}>
          <button onClick={cancel} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#666' }}>✕</button>

          {(panel === 'addProduct' || panel === 'editProduct') && (
            <ProductForm form={form} editing={editing} formLang={formLang} setFormLang={setFormLang}
              availLangs={availLangs} allCurrencies={allCurrencies} existingMedia={existingMedia}
              deleteIds={deleteIds} bannerMediaId={bannerMediaId} flatCats={flatCats} t={t}
              setName={setName} setDesc={setDesc} setPrice={setPrice} removePrice={removePrice}
              setField={setField} setVideo={setVideo} setForm={setForm}
              setBannerMediaId={setBannerMediaId} toggleDelete={toggleDelete}
              submit={submit} cancel={cancel} />
          )}

          {panel === 'categories' && (
            <>
              <h3 style={{ marginBottom: 16 }}>🗂 {t('manageCategories') || 'Manage Categories'}</h3>
              <CategoryManager categories={categories} onRefresh={loadCats} inline />
            </>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div onClick={cancel} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 999
        }} />
      )}
    </>
  );
}

const chipBtn = (bg, color) => ({
  background: bg, color, border: 'none', borderRadius: 4,
  padding: '1px 5px', cursor: 'pointer', fontSize: 11, lineHeight: 1.4,
});

// ─── Products page ────────────────────────────────────────────────────────────

export default function Products() {
  const { i18n, t } = useTranslation();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [flatCats, setFlatCats] = useState([]);
  const [search, setSearch] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [uiTranslations, setUiTranslations] = useState({});
  const { add } = useCart();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const lang = i18n.language?.split('-')[0];
  const sc = (() => { try { return JSON.parse(localStorage.getItem('selectedCurrency')) || {}; } catch { return {}; } })();
  const currency = sc.currency_code || 'USD';
  const symbol = sc.symbol || '$';
  const fractionDigits = sc.fraction_digits ?? 2;

  const filterCatId = searchParams.get('cat') || '';
  const searchParam = searchParams.get('search') || '';

  const isAdmin = user && (user.role === 'admin' || user.role === 'cooperatore');

  const loadProducts = () => {
    api.get('/api/products').then(r => setProducts(r.data)).catch(() => {});
  };

  useEffect(() => { setSearch(searchParam); }, [searchParam]);

  useEffect(() => {
    loadProducts();
    api.get(`/api/categories/flat?lang=${lang}`).then(r => setFlatCats(r.data)).catch(() => {});
  }, [lang]);

  useEffect(() => {
    api.get(`/api/translations/${lang}`).then(r => setUiTranslations(r.data)).catch(() => {});
  }, [lang]);

  function getDescendantIds(catId) {
    if (!catId) return new Set();
    const ids = new Set([parseInt(catId)]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const c of flatCats) {
        if (!ids.has(c.id) && ids.has(c.parent_id)) { ids.add(c.id); changed = true; }
      }
    }
    return ids;
  }

  const matchIds = getDescendantIds(filterCatId);
  const available = products.filter(p => findPrice(p.prices, lang, currency));
  const filtered = available.filter(p => {
    const name = p.names?.[lang] || p.name;
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCatId || (p.category_id && matchIds.has(p.category_id));
    return matchSearch && matchCat;
  });

  const setFilter = (id) => {
    if (id) setSearchParams({ cat: id });
    else setSearchParams({});
  };

  return (
    <div className="page">
      {showSuccess && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#27ae60', color: 'white', padding: '12px 24px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, fontSize: 15, fontWeight: 500 }}>
          ✓ {t('successfullyAdded')}
        </div>
      )}

      {isAdmin && <AdminOverlay onProductsChange={loadProducts} />}

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center', flexDirection: 'column' }}>
        {flatCats.length > 0 && (
          <select value={filterCatId} onChange={e => setFilter(e.target.value)}>
            <option value="">{uiTranslations.allCategories || 'All Categories'}</option>
            {flatCats.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#888' }}>
          {(uiTranslations.productsCount || '{n} products').replace('{n}', filtered.length)}
        </span>
      </div>

      {filtered.length === 0
        ? <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <div style={{ fontSize: 64 }}>🔍</div>
            <p style={{ color: '#888', fontSize: 16, marginTop: 12 }}>No products found</p>
          </div>
        : <div className="grid">
            {filtered.map(p => (
              <ProductCard key={p.id} p={p} lang={lang} currency={currency} symbol={symbol} fractionDigits={fractionDigits}
                onAdd={(item) => {
                  add(item);
                  setShowSuccess(true);
                  setTimeout(() => setShowSuccess(false), 3000);
                }}
                onClick={() => navigate(`/products/${p.id}`)} />
            ))}
          </div>
      }
    </div>
  );
}
