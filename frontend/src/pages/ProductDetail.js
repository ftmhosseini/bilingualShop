import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { useCart } from '../context/CartContext';
import NotFound from './NotFound';
import { useButtonLabels } from '../context/ButtonLabelsContext';

const base = process.env.REACT_APP_API_URL || '';

function getSelectedCurrency() {
  try { return JSON.parse(localStorage.getItem('selectedCurrency')) || {}; } catch { return {}; }
}

export default function ProductDetail() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const { add } = useCart();
  const { btn } = useButtonLabels();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [qty, setQty] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/api/products/${id}`).then(r => {
      setProduct(r.data);
      setSelectedMedia(r.data.banner || r.data.media?.[0] || null);
    }).catch(() => setNotFound(true));
  }, [id]);

  if (notFound) return <NotFound />;
  if (!product) return <div className="page">Loading...</div>;

  const lang = i18n.language?.split('-')[0];
  const sc = getSelectedCurrency();
  const currency = sc.currency_code || 'USD';
  const symbol = sc.symbol || '$';
  const fractionDigits = sc.fraction_digits ?? 2;
  const name = product.names?.[lang] || product.name;
  const desc = product.descriptions?.[lang] || product.description;
  const priceObj = product.prices?.find(p => p.langs?.includes(lang) || p.currency === currency);

  const fmtPrice = (amount) => {
    const num = Number(amount).toFixed(fractionDigits);
    return document.documentElement.dir === 'rtl'
      ? `${Number(amount).toLocaleString(undefined, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })} ${symbol}`
      : `${symbol}${num}`;
  };

  return (
    <div style={{ width: '100%' }}>
      {showSuccess && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#27ae60', color: 'white', padding: '12px 24px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, fontSize: 15, fontWeight: 500 }}>
          ✓ {t('successfullyAdded')}
        </div>
      )}

      <div style={{ padding: '12px 16px' }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Back</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
        {/* Media column — sticky */}
        <div style={{ flex: '0 0 50%', position: 'sticky', top: 0, padding: '0 24px 24px', boxSizing: 'border-box' }}>
          <div style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden', background: '#fff', aspectRatio: '1 / 1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {selectedMedia?.type === 'video' ? (
              <iframe
                src={selectedMedia.url.replace('watch?v=', 'embed/')}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allowFullScreen title="product video"
              />
            ) : selectedMedia?.url ? (
              <img src={`${base}${selectedMedia.url}`} alt={name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{ fontSize: 80 }}>🥛</div>
            )}
          </div>

          {product.media?.length > 1 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              {product.media.map(m => (
                <div key={m.id}
                  onClick={() => setSelectedMedia(m)}
                  style={{ width: 64, height: 64, border: selectedMedia?.id === m.id ? '2px solid #febd69' : '1px solid #ddd', borderRadius: 4, overflow: 'hidden', cursor: 'pointer', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {m.type === 'image'
                    ? <img src={`${base}${m.url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 24 }}>▶</span>
                  }
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info column — scrolls with page */}
        <div style={{ flex: '0 0 50%', padding: '0 24px 24px', boxSizing: 'border-box' }}>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>{name}</h1>

          {priceObj ? (
            <div style={{ fontSize: 28, color: '#b12704', fontWeight: 'bold', margin: '12px 0' }}>
              {fmtPrice(priceObj.price)}
            </div>
          ) : (
            <div style={{ color: '#888', margin: '12px 0' }}>Price not available in your region</div>
          )}

          <div style={{ color: product.stock > 0 ? '#007600' : '#c00', fontWeight: 600, marginBottom: 16 }}>
            {product.stock === 0 ? 'Out of Stock' : product.stock < 10 ? `Only ${product.stock} left in stock` : 'In Stock'}
          </div>

          {desc && (
            <p style={{ fontSize: 15, lineHeight: 1.6, color: '#333', marginBottom: 20 }} dir={['fa','ar'].includes(lang) ? 'rtl' : 'ltr'}>
              {desc}
            </p>
          )}

          {priceObj && product.stock > 0 && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: 4 }}>
                <button className="btn" style={{ padding: '6px 14px', fontSize: 18 }} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span style={{ padding: '0 16px', fontSize: 16 }}>{qty}</span>
                <button className="btn" style={{ padding: '6px 14px', fontSize: 18 }} onClick={() => setQty(q => q + 1)}>+</button>
              </div>
              <button className="btn btn-primary" style={{ padding: '10px 24px', fontSize: 15, background: btn('addToCart', lang).color }}
                onClick={() => {
                  for (let i = 0; i < qty; i++) add({ ...product, name, price: priceObj.price, currency });
                  setShowSuccess(true);
                  setTimeout(() => setShowSuccess(false), 3000);
                }}>
                {btn('addToCart', lang).label}
              </button>
              <button className="btn btn-buy" style={{ padding: '10px 24px', fontSize: 15, background: btn('buyNow', lang).color }}
                onClick={() => { add({ ...product, name, price: priceObj.price, currency }); navigate('/cart'); }}>
                {btn('buyNow', lang).label}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
