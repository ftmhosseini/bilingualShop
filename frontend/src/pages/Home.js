import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useCart } from '../context/CartContext';
import { useButtonLabels } from '../context/ButtonLabelsContext';

const base = process.env.REACT_APP_API_URL || '';

// Find the price for the current language — checks langs[] first, falls back to currency match
function findPrice(prices, lang, currency) {
  if (!prices) return null;
  return prices.find(pr => pr.langs?.length ? pr.langs.includes(lang) : pr.currency === currency) || null;
}

function fmtPrice(symbol, amount, currency, lang, fractionDigits = 2) {
  const num = Number(amount);
  const digits = fractionDigits ?? 2;
  if (lang === 'fa') {
    const formatted = num.toLocaleString('fa-IR', { maximumFractionDigits: digits, minimumFractionDigits: digits });
    return `${formatted} ${symbol}`;
  }
  if (document.documentElement.dir === 'rtl') {
    return `${num.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits })} ${symbol}`;
  }
  return `${symbol}${num.toFixed(digits)}`;
}
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
        : <div style={{ height: 180, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🥛</div>
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

export default function Home() {
  const { i18n, t } = useTranslation();
  const { btn } = useButtonLabels();
  const [products, setProducts] = useState([]);
  const [allSlides, setSlides] = useState([]);
  const [slideIdx, setSlideIdx] = useState(0);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('new');
  const [showSuccess, setShowSuccess] = useState(false);
  const { add } = useCart();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);   // flat list with breadcrumbs
  const [filterCatId, setFilterCatId] = useState('');
  const [tabLabels, setTabLabels] = useState({
    all:   { en: 'All Products',  fa: 'همه محصولات',      ar: 'جميع المنتجات' },
    new:   { en: 'New Arrivals',  fa: 'جدیدترین‌ها',      ar: 'الوافدون الجدد' },
    deals: { en: 'Best Deals',    fa: 'بهترین تخفیف‌ها',  ar: 'أفضل العروض' },
  });

  const lang = i18n.language?.split('-')[0];
  const sc = (() => { try { return JSON.parse(localStorage.getItem('selectedCurrency')) || {}; } catch { return {}; } })();
  const currency = sc.currency_code || 'USD';
  const symbol = sc.symbol || '$';
  const fractionDigits = sc.fraction_digits ?? 2;
  const slides = allSlides.filter(s => !s.langs || s.langs.length === 0 || s.langs.includes(lang));
  const safeIdx = slides.length > 0 ? slideIdx % slides.length : 0;

  useEffect(() => {
    api.get('/api/products').then(r => setProducts(r.data)).catch(() => {});
    api.get(`/api/categories/flat?lang=${lang}`).then(r => setCategories(r.data)).catch(() => {});
    api.get('/api/settings').then(r => {
      if (r.data.hero_slides) {
        const allSlides = JSON.parse(r.data.hero_slides);
        setSlides(allSlides);
      }
      if (r.data.home_tab_labels) {
        try { setTabLabels(JSON.parse(r.data.home_tab_labels)); } catch {}
      }
    }).catch(() => {});
  }, []);

  // Reset slide index when language changes (filtered slides change)
  useEffect(() => { setSlideIdx(0); }, [lang]);

  // Auto-advance slider
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setSlideIdx(i => (i + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, [slides.length]);

  const available = products.filter(p => findPrice(p.prices, lang, currency));
  const discounted = [...available].filter(p => {
    const pr = findPrice(p.prices, lang, currency);
    return pr?.sale_price && pr.sale_price < pr.price;
  }).sort((a, b) => {
    const pa = findPrice(a.prices, lang, currency);
    const pb = findPrice(b.prices, lang, currency);
    const pctA = pa ? Math.round((1 - pa.sale_price / pa.price) * 100) : 0;
    const pctB = pb ? Math.round((1 - pb.sale_price / pb.price) * 100) : 0;
    return pctB - pctA;
  }).slice(0, 8);
  const newest = [...available].slice(0, 8); // already sorted by created_at DESC

  // Category filter: match product's category_id OR any ancestor
  // Build a set of matching ids (selected + all its descendants)
  function getDescendantIds(catId) {
    if (!catId) return new Set();
    const all = categories; // flat list
    const ids = new Set([parseInt(catId)]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const c of all) {
        if (!ids.has(c.id) && ids.has(c.parent_id)) { ids.add(c.id); changed = true; }
      }
    }
    return ids;
  }

  const matchIds = getDescendantIds(filterCatId);

  const catFiltered = (list) => {
    if (!filterCatId) return list;
    return list.filter(p => p.category_id && matchIds.has(p.category_id));
  };

  const filtered = catFiltered(search ? available.filter(p => {
    const name = p.names?.[lang] || p.name;
    return name.toLowerCase().includes(search.toLowerCase());
  }) : available);

  const cardProps = p => ({ p, lang, currency, symbol, fractionDigits, onAdd: (item) => { 
    add(item); 
    setShowSuccess(true); 
    setTimeout(() => setShowSuccess(false), 3000); 
  }, onClick: () => navigate(`/products/${p.id}`) });

  return (
    <div>
      {showSuccess && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#27ae60', color: 'white', padding: '12px 24px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, fontSize: 15, fontWeight: 500 }}>
          ✓ {t('successfullyAdded')}
        </div>
      )}
      {/* Section 1: Hero Slider */}
      {slides.length > 0 && (
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <div dir="ltr" style={{ display: 'flex', transition: 'transform 0.5s ease', transform: `translateX(${safeIdx * -100}%)` }}>
            {slides.map((s, i) => {
              const mediaSrc = s.mediaType === 'video' && s.video
                ? (s.video.startsWith('http') ? s.video : `${base}${s.video}`)
                : s.image ? (s.image.startsWith('http') ? s.image : `${base}${s.image}`) : null;
              const mediaStyle = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: s.fit || 'cover', objectPosition: s.position || 'center' };
              return (
                <div key={i} style={{ minWidth: '100%', aspectRatio: '3 / 1', position: 'relative', background: s.bg || 'var(--primary)', cursor: s.link ? 'pointer' : 'default' }}
                  onClick={() => s.link && navigate(s.link)}>
                  {mediaSrc && s.mediaType === 'video'
                    ? <video src={mediaSrc} autoPlay muted loop playsInline style={mediaStyle} />
                    : mediaSrc && <img src={mediaSrc} alt={s.title} style={mediaStyle} />}
                  {/* overlay */}
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
                  {/* content centered on top */}
                  <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px' }}>
                    <h1 style={{ color: '#fff', fontSize: 'clamp(28px,5vw,56px)', marginBottom: 12, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{s.title}</h1>
                    <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 'clamp(14px,2vw,20px)', maxWidth: 600, marginBottom: 28, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{s.subtitle}</p>
                    {s.link && <button className="btn btn-primary" style={{ background: btn('shopNow', lang).color, fontSize: 16, padding: '12px 32px' }} onClick={e => { e.stopPropagation(); navigate(s.link); }}>{s.btnText || btn('shopNow', lang).label}</button>}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Dots */}
          <div style={{ position: 'absolute', bottom: 12, width: '100%', display: 'flex', justifyContent: 'center', gap: 6 }}>
            {slides.map((_, i) => (
              <div key={i} onClick={() => setSlideIdx(i)}
                style={{ width: i === safeIdx ? 24 : 8, height: 8, borderRadius: 4, background: i === safeIdx ? '#febd69' : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.3s' }} />
            ))}
          </div>
          {/* Arrows */}
          {slides.length > 1 && <>
            <button onClick={() => setSlideIdx(i => (i - 1 + slides.length) % slides.length)}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: 18 }}>{document.documentElement.dir === 'rtl'?'›':'‹'}</button>
            <button onClick={() => setSlideIdx(i => (i + 1) % slides.length)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: 18 }}>{document.documentElement.dir === 'rtl'?'‹':'›'}</button>
          </>}
        </div>
      )}

      {/* Tabs: Best Deals / New Arrivals / All Products */}
      <div className="page">
        <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #eee', marginBottom: 20 ,...(document.documentElement.dir === 'rtl' ? { textAlign: 'right'  , marginRight: 'auto', left: 0 } : { textAlign: 'left', marginLeft: 'auto' , right: 0  }),}}>
          
          <button type="button" onClick={() => setTab('all')}
            style={{ padding: '8px 20px', border: 'none', borderBottom: tab === 'all' ? '2px solid var(--primary)' : '2px solid transparent', background: 'none', cursor: 'pointer', fontWeight: tab === 'all' ? 700 : 400, fontSize: 15, marginBottom: -2 }}>
            {tabLabels.all[lang] || tabLabels.all.en}
          </button>
          <button type="button" onClick={() => setTab('new')}
            style={{ padding: '8px 20px', border: 'none', borderBottom: tab === 'new' ? '2px solid var(--primary)' : '2px solid transparent', background: 'none', cursor: 'pointer', fontWeight: tab === 'new' ? 700 : 400, fontSize: 15, marginBottom: -2 }}>
            ✨ {tabLabels.new[lang] || tabLabels.new.en}
          </button>
          {discounted.length > 0 && (
            <button type="button" onClick={() => setTab('deals')}
              style={{ padding: '8px 20px', border: 'none', borderBottom: tab === 'deals' ? '2px solid var(--primary)' : '2px solid transparent', background: 'none', cursor: 'pointer', fontWeight: tab === 'deals' ? 700 : 400, fontSize: 15, marginBottom: -2 }}>
              🔥 {tabLabels.deals[lang] || tabLabels.deals.en}
            </button>
          )}
        </div>

        {tab === 'deals' && (
          <div className="grid">
            {discounted.map(p => <ProductCard key={p.id} {...cardProps(p)} />)}
          </div>
        )}
        {tab === 'new' && (
          <div className="grid">
            {newest.map(p => <ProductCard key={p.id} {...cardProps(p)} />)}
          </div>
        )}
        {tab === 'all' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              {categories.length > 0 && (
                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                  <select value={filterCatId} onChange={e => setFilterCatId(e.target.value)}
                    style={{ paddingRight: filterCatId ? 28 : undefined }}>
                    <option value="">{t('allCategories')}</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                  {filterCatId && (
                    <span onClick={() => setFilterCatId('')}
                      style={{ position: 'absolute', right: 22, cursor: 'pointer', fontSize: 14, color: '#888', lineHeight: 1, userSelect: 'none' }}>✕</span>
                  )}
                </div>
              )}
            </div>
            {filtered.length === 0
              ? <p style={{ color: '#888' }}>No products found</p>
              : <div className="grid">{filtered.map(p => <ProductCard key={p.id} {...cardProps(p)} />)}</div>
            }
          </>
        )}
      </div>
    </div>
  );
}
