import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useCart } from '../context/CartContext';
import { useButtonLabels } from '../context/ButtonLabelsContext';

const base = process.env.REACT_APP_API_URL || '';

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

export default function Products() {
  const { i18n, t } = useTranslation();
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

  useEffect(() => {
    setSearch(searchParam);
  }, [searchParam]);

  useEffect(() => {
    api.get('/api/products').then(r => setProducts(r.data)).catch(() => {});
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
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' , flexDirection:'column'}}>
        {/* <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 220 }} /> */}
        {flatCats.length > 0 && (
          <select value={filterCatId} onChange={e => setFilter(e.target.value)}>
            <option value="">{uiTranslations.allCategories || 'All Categories'}</option>
            {flatCats.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        )}
        {/* {filterCatId && (
          <button onClick={() => setFilter('')}
            style={{ background: 'none', border: '1px solid #ccc', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 13 }}>
            ✕ Clear
          </button>
        )} */}
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
