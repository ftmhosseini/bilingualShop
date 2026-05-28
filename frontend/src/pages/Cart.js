import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useButtonLabels } from '../context/ButtonLabelsContext';

const CURRENCY_SYMBOL = { USD: '$', CAD: 'CA$', IRR: '﷼', SAR: 'ر.س' };

export default function Cart() {
  const { t, i18n } = useTranslation();
  const { btn } = useButtonLabels();
  const { items, remove, clear, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const lang = i18n.language?.split('-')[0];

  const currency = items[0]?.currency || 'USD';
  const symbol = CURRENCY_SYMBOL[currency] || '$';

  if (items.length === 0) return (
    <div className="page" style={{ textAlign: 'center', paddingTop: 60 }}>
      <div style={{ fontSize: 64 }}>🛒</div>
      <p style={{ fontSize: 18, margin: '16px 0' }}>{t('cart')} is empty</p>
      <button className="btn btn-primary" style={{ background: btn('continueShopping', lang).color }} onClick={() => navigate('/')}>{btn('continueShopping', lang).label}</button>
    </div>
  );

  return (
    <div className="page">
      <h2 style={{ marginBottom: 20 }}>{t('cart')}</h2>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Items */}
        <div style={{ flex: 1, minWidth: 300 }}>
          {items.map(i => (
            <div key={i.id} className="card" style={{ display: 'flex', gap: 16, marginBottom: 12, alignItems: 'center' }}>
              {i.banner?.url && <img src={`${process.env.REACT_APP_API_URL}${i.banner.url}`} alt={i.name} style={{ width: 80, height: 80, objectFit: 'contain' }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{i.name}</div>
                <div style={{ color: '#b12704', fontWeight: 'bold' }}>{symbol}{i.price}</div>
                <div style={{ fontSize: 13, color: '#666' }}>Qty: {i.qty}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>{symbol}{(i.price * i.qty).toFixed(2)}</div>
                <button className="btn btn-danger" style={{ padding: '4px 10px' }} onClick={() => remove(i.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="card" style={{ width: 260, flexShrink: 0 }}>
          <h3 style={{ marginBottom: 16 }}>Order Summary</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>Subtotal ({items.reduce((s,i)=>s+i.qty,0)} items)</span>
            <strong>{symbol}{total.toFixed(2)}</strong>
          </div>
          <div style={{ borderTop: '1px solid #ddd', paddingTop: 12, marginTop: 8 }}>
            <button className="btn btn-primary" style={{ width: '100%', padding: 12, fontSize: 15 }}
              onClick={() => user ? navigate('/checkout') : navigate('/login')}>
              Proceed to Checkout
            </button>
            <button className="btn btn-secondary" style={{ width: '100%', marginTop: 8 }} onClick={clear}>
              Clear Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
