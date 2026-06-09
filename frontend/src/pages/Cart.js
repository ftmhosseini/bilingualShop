import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useButtonLabels } from '../context/ButtonLabelsContext';
import { useEffect, useState } from 'react';
import api from '../api';

export default function Cart() {
  const { t, i18n } = useTranslation();
  const { btn } = useButtonLabels();
  const { items, remove, clear, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const lang = i18n.language?.split('-')[0];

  const getSC = () => { try { return JSON.parse(localStorage.getItem('selectedCurrency')) || {}; } catch { return {}; } };
  const [sc, setSC] = useState(getSC);

  useEffect(() => {
    const handler = () => setSC(getSC());
    window.addEventListener('currencychange', handler);
    return () => window.removeEventListener('currencychange', handler);
  }, []);

  const symbol = sc.checkout_symbol || sc.symbol || '$';
  const fractionDigits = sc.fraction_digits ?? 2;
  const differ = sc.differ ?? 1;
  const fmt = (amount) => (amount*differ).toLocaleString(undefined, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });

  const isRTL = document.documentElement.dir === 'rtl';

  const DEFAULT_T = {
    empty: 'Cart is empty',
    qty: 'Qty',
    remove: 'Remove',
    summary: 'Order Summary',
    subtotal: (n) => `Subtotal (${n} items)`,
    checkout: 'Proceed to Checkout',
    clear: 'Clear Cart',
    unavailable: (names) => `These items are not available in the selected currency: ${names}`,
  };
  const [T, setT] = useState(DEFAULT_T);
  const [availabilityError, setAvailabilityError] = useState('');

  useEffect(() => {
    api.get(`/api/translations/${lang}`).then(r => {
      const d = r.data;
      setT({
        empty: d['cart.empty'] || DEFAULT_T.empty,
        qty: d['cart.qty'] || DEFAULT_T.qty,
        remove: d['cart.remove'] || DEFAULT_T.remove,
        summary: d['cart.summary'] || DEFAULT_T.summary,
        subtotal: (n) => (d['cart.subtotal'] || 'Subtotal ({n} items)').replace('{n}', n),
        checkout: d['cart.checkout'] || DEFAULT_T.checkout,
        clear: d['cart.clear'] || DEFAULT_T.clear,
        unavailable: (names) => (d['cart.unavailable'] || 'These items are not available in the selected currency: {names}').replace('{names}', names),
      });
    }).catch(() => {});
  }, [lang]);

  const currency = sc.currency_code || 'USD';
  useEffect(() => {
    if (!items.length) return;
    api.post('/api/orders/check-availability', { currency, items: items.map(i => ({ product_id: i.id, name: i.name })) })
      .then(r => setAvailabilityError(r.data.ok ? '' : T.unavailable(r.data.unavailable.join(', '))))
      .catch(() => {});
  }, [currency, items.length]);

  if (items.length === 0) return (
    <div className="page" style={{ textAlign: 'center', paddingTop: 60 }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div style={{ fontSize: 64 }}>🛒</div>
      <p style={{ fontSize: 18, margin: '16px 0' }}>{T.empty}</p>
      <button className="btn btn-primary" style={{ background: btn('continueShopping', lang).color }} onClick={() => navigate('/')}>{btn('continueShopping', lang).label}</button>
    </div>
  );

  const Price = ({ amount }) => (
    <span style={{color: '#b12704', 
    fontWeight: 'bold', 
    direction: 'ltr',           // Forces LTR text flow inside the container
    display: 'inline-block',unicodeBidi: 'bidi-override'}}>
    <span style={{color: '#b12704', 
    fontWeight: 'bold', 
    direction: 'rtl',           // Forces LTR text flow inside the container
    display: 'inline-block',unicodeBidi: 'bidi-override'}}>{symbol}</span>
    &nbsp;
    <span >{fmt(amount)}</span>
    </span>
  );
const styles = {
  container: { display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start'},
  itemsList: { flex: 1, minWidth: 300 },
  cardItem: { display: 'flex', gap: 16, marginBottom: 12, alignItems: 'center' },
  img: { width: 80, height: 80, objectFit: 'contain' },
  itemDetails: { flex: 1 },
  itemName: { fontWeight: 600 },
  itemPrice: { color: '#b12704', fontWeight: 'bold' },
  itemQty: { fontSize: 13, color: '#666' },
  summaryCard: { width: 260, flexShrink: 0 },
  summaryRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 },
  divider: { borderTop: '1px solid #ddd', paddingTop: 12, marginTop: 8 },
  error: { color: 'red', fontSize: 13, marginBottom: 10 }
};
  return (
    <div className="page" dir={isRTL ? 'rtl' : 'ltr'}>
      <h2 style={{ marginBottom: 20, alignContent:'center' }}>{t('cart.title')}</h2>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Items */}
        <div style={styles.container}>
      <div style={styles.itemsList}>
          {items.map(i => (
            <div key={i.id} className="card" style={styles.cardItem}>
              {i.banner?.url && <img src={`${process.env.REACT_APP_API_URL}${i.banner.url}`} alt={i.name} style={styles.img} />}
              <div style={styles.itemDetails}>
                <div style={styles.itemName}>{i.name}</div>
                <div style={styles.itemPrice}><Price amount={i.price} /></div>
                <div style={styles.itemQty}>{T.qty}: {i.qty}</div>
              </div>
              <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8, direction: 'ltr' }}><Price amount={i.price * i.qty} /></div>
                <button className="btn btn-danger" style={{ padding: '4px 10px' }} onClick={() => remove(i.id)}>{T.remove}</button>
              </div>
            </div>
          ))}
        </div></div>

        {/* Summary */}
        <div className="card" style={{ width: 260, flexShrink: 0 }}>
          <h3 style={{ marginBottom: 16 }}>{T.summary}</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>{T.subtotal(items.reduce((s, i) => s + i.qty, 0))}</span>
            <strong><Price amount={total} /></strong>
          </div>
          <div style={{ borderTop: '1px solid #ddd', paddingTop: 12, marginTop: 8 }}>
            {availabilityError && <p style={{ color: 'red', fontSize: 13, marginBottom: 10 }}>{availabilityError}</p>}
            <button className="btn btn-primary" style={{ width: '100%', padding: 12, fontSize: 15 }}
              onClick={() => user ? navigate('/checkout') : navigate('/login')}>
              {T.checkout}
            </button>
            <button className="btn btn-secondary" style={{ width: '100%', marginTop: 8 }} onClick={clear}>
              {T.clear}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
