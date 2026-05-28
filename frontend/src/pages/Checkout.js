import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { useButtonLabels } from '../context/ButtonLabelsContext';

const COUNTRIES = ['Canada', 'United States', 'United Kingdom', 'Iran', 'Saudi Arabia', 'UAE', 'Other'];
const COUNTRIES_FA = ['کانادا', 'ایالات متحده', 'بریتانیا', 'ایران', 'عربستان سعودی', 'امارات', 'سایر'];
const COUNTRY_CODES = { 'Canada': 'CA', 'United States': 'US', 'United Kingdom': 'GB', 'Iran': 'IR', 'Saudi Arabia': 'SA', 'UAE': 'AE', 'کانادا': 'CA', 'ایالات متحده': 'US', 'بریتانیا': 'GB', 'ایران': 'IR', 'عربستان سعودی': 'SA', 'امارات': 'AE' };
const LANG_CURRENCY = { en: 'USD', fa: 'IRR', ar: 'SAR' };
const CURRENCY_SYMBOL = { USD: '$', CAD: 'CA$', IRR: '﷼', SAR: 'ر.س' };
const emptyAddress = { name: '', address: '', city: '', province: '', country: '', postal: '', phone: '' };

const IRAN_PROVINCES_EN = [
  'Tehran','Isfahan','Fars','Khorasan Razavi','Khuzestan','East Azerbaijan','West Azerbaijan',
  'Kerman','Mazandaran','Gilan','Alborz','Hormozgan','Sistan and Baluchestan','Lorestan',
  'Hamadan','Kermanshah','Golestan','Markazi','Ardabil','Zanjan','Semnan','Yazd','Ilam',
  'Chaharmahal and Bakhtiari','Kohgiluyeh and Boyer-Ahmad','North Khorasan','South Khorasan',
  'Qazvin','Qom','Bushehr','Kurdestan',
];
const IRAN_PROVINCES_FA = [
  'تهران','اصفهان','فارس','خراسان رضوی','خوزستان','آذربایجان شرقی','آذربایجان غربی',
  'کرمان','مازندران','گیلان','البرز','هرمزگان','سیستان و بلوچستان','لرستان',
  'همدان','کرمانشاه','گلستان','مرکزی','اردبیل','زنجان','سمنان','یزد','ایلام',
  'چهارمحال و بختیاری','کهگیلویه و بویراحمد','خراسان شمالی','خراسان جنوبی',
  'قزوین','قم','بوشهر','کردستان',
];

const L = {
  en: {
    fullName: 'Full Name', street: 'Street Address', city: 'City', province: 'Province',
    country: 'Country', postal: 'Postal / ZIP', postalIran: 'Postal Code (10 digits)',
    phone: 'Phone', shippingMethod: 'Shipping Method', notes: 'Order Notes',
    notesPlaceholder: 'e.g. Leave at door', optional: 'optional',
    continue: 'Continue to Payment →', fetchingRates: 'Fetching shipping rates...',
    selectProvince: 'Select province...', free: 'Free', days: 'days',
  },
  fa: {
    fullName: 'نام و نام خانوادگی', street: 'آدرس', city: 'شهر', province: 'استان',
    country: 'کشور', postal: 'کد پستی', postalIran: 'کد پستی (۱۰ رقم)',
    phone: 'شماره تماس', shippingMethod: 'روش ارسال', notes: 'توضیحات سفارش',
    notesPlaceholder: 'مثلاً: زنگ نزنید، پشت در بگذارید', optional: 'اختیاری',
    continue: 'ادامه به پرداخت ←', fetchingRates: 'در حال دریافت نرخ ارسال...',
    selectProvince: 'انتخاب استان...', free: 'رایگان', days: 'روز',
  },
  ar: {
    fullName: 'الاسم الكامل', street: 'العنوان', city: 'المدينة', province: 'المنطقة',
    country: 'الدولة', postal: 'الرمز البريدي', postalIran: 'الرمز البريدي',
    phone: 'رقم الهاتف', shippingMethod: 'طريقة الشحن', notes: 'ملاحظات الطلب',
    notesPlaceholder: 'مثلاً: اتركه عند الباب', optional: 'اختياري',
    continue: 'متابعة للدفع ←', fetchingRates: 'جارٍ جلب أسعار الشحن...',
    selectProvince: 'اختر المنطقة...', free: 'مجاني', days: 'أيام',
  },
};

export default function Checkout() {
  const { i18n, t } = useTranslation();
  const { btn } = useButtonLabels();
  const lang = i18n.language?.split('-')[0] || 'en';
  const lbl = L[lang] || L.en;
  const currency = LANG_CURRENCY[lang] || 'USD';
  const symbol = CURRENCY_SYMBOL[currency] || '$';
  const isIran = lang === 'fa';
  const defaultCountry = isIran ? 'ایران' : lang === 'ar' ? 'Saudi Arabia' : 'Canada';
  const countryList = lang === 'fa' ? COUNTRIES_FA : COUNTRIES;
  const provinces = lang === 'fa' ? IRAN_PROVINCES_FA : IRAN_PROVINCES_EN;
  const iranCountryValue = lang === 'fa' ? 'ایران' : 'Iran';

  const { items, total, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [shipping, setShipping] = useState({ ...emptyAddress, country: defaultCountry });
  const [notes, setNotes] = useState('');
  const [shippingMethods, setShippingMethods] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [ratesError, setRatesError] = useState('');
  const [payMethod, setPayMethod] = useState('card');
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    api.get('/api/settings').then(r => {
      const pm = JSON.parse(r.data.payment_methods || '[]').filter(m => m.enabled);
      setPaymentMethods(pm);
      if (pm[0]) setPayMethod(pm[0].id);
      const sm = JSON.parse(r.data.shipping_methods || '[]');
      setShippingMethods(sm);
      setSelectedShipping(sm[0] || null);
    });
  }, []);

  const fetchLiveRates = async (overrideShipping) => {
    const addr = overrideShipping || shipping;
    if (!addr.city || !addr.country) return;
    setLoadingRates(true); setRatesError('');
    try {
      const { data } = await api.post('/api/shipping/rates', {
        toAddress: { name: addr.name, street: addr.address, city: addr.city, province: addr.province || '', state: addr.province || '', postal: addr.postal, country_code: COUNTRY_CODES[addr.country] || 'CA' },
        parcel: { weight: '1', length: '20', width: '15', height: '10' },
      });
      if (data.length > 0) {
        const mapped = data.map(r => ({ id: r.id, label: `${r.provider} ${r.service}`, price: r.price, currency: r.currency || currency, days: r.days ? `${r.days}` : '' }));
        setShippingMethods(mapped);
        setSelectedShipping(mapped[0]);
      }
    } catch {
      setRatesError('Could not fetch live rates — using manual rates.');
    } finally { setLoadingRates(false); }
  };

  // Re-fetch rates when country changes (if city is already filled)
  const setAddr = (k, v) => {
    const updated = { ...shipping, [k]: v };
    setShipping(updated);
    if (k === 'country' && updated.city) fetchLiveRates(updated);
  };

  if (!user) { navigate('/login'); return null; }
  if (items.length === 0 && !orderId) { navigate('/cart'); return null; }
  const shippingCost = selectedShipping?.price || 0;
  const shippingSymbol = selectedShipping?.currency ? (CURRENCY_SYMBOL[selectedShipping.currency] || selectedShipping.currency) : symbol;
  const grandTotal = total + (selectedShipping?.currency === currency ? shippingCost : 0);

  const placeOrder = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/api/orders', {
        items: items.map(i => ({ product_id: i.id, quantity: i.qty, price: i.price })),
        total: grandTotal,
        shipping,
        payment_method: payMethod,
        shipping_method: selectedShipping?.label,
        notes,
      });

      // Check if there's an active payment plugin for this currency
      try {
        const gw = await api.post('/api/orders/initiate-payment', { order_id: data.id, currency });
        if (gw.data?.redirect_url) {
          clear();
          window.location.href = gw.data.redirect_url; // redirect to bank/gateway
          return;
        }
      } catch {
        // No plugin for this currency — continue with normal confirmation
      }

      setOrderId(data.id);
      clear();
      setStep(3);
    } catch {
      setError('Order failed. Please try again.');
    } finally { setLoading(false); }
  };

  const steps = ['Address', 'Payment', 'Confirmation'];

  return (
    <div className="page" style={{ maxWidth: 700 }}>
      {/* Step indicator */}
      <div style={{ display: 'flex', marginBottom: 32 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: step > i ? '#febd69' : step === i+1 ? '#131921' : '#ddd', color: step === i+1 ? '#fff' : '#111', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 14 }}>
              {step > i ? '✓' : i+1}
            </div>
            <div style={{ fontSize: 12, marginTop: 4, color: step === i+1 ? '#131921' : '#888' }}>{s}</div>
          </div>
        ))}
      </div>

      {/* Step 1: Address */}
      {step === 1 && (
        <div className="card">
          <h2 style={{ marginBottom: 20 }}>{lang === 'fa' ? 'آدرس ارسال' : lang === 'ar' ? 'عنوان الشحن' : 'Shipping Address'}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label>{lbl.fullName} *</label>
              <input value={shipping.name} onChange={e => setAddr('name', e.target.value)} required dir={lang === 'fa' || lang === 'ar' ? 'rtl' : 'ltr'} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label>{lbl.street} *</label>
              <input value={shipping.address} onChange={e => setAddr('address', e.target.value)} required dir={lang === 'fa' || lang === 'ar' ? 'rtl' : 'ltr'} />
            </div>
            {shipping.country === iranCountryValue ? (<>
              <div className="form-group">
                <label>{lbl.province} *</label>
                <select value={shipping.province || ''} onChange={e => setAddr('province', e.target.value)} dir={lang === 'fa' ? 'rtl' : 'ltr'}>
                  <option value="">{lbl.selectProvince}</option>
                  {provinces.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>{lbl.city} *</label>
                <input value={shipping.city} onChange={e => setAddr('city', e.target.value)} required dir={lang === 'fa' ? 'rtl' : 'ltr'} />
              </div>
              <div className="form-group">
                <label>{lbl.postalIran}</label>
                <input value={shipping.postal} onChange={e => setAddr('postal', e.target.value)} maxLength={10} />
              </div>
            </>) : (<>
              <div className="form-group">
                <label>{lbl.city} *</label>
                <input value={shipping.city} onChange={e => setAddr('city', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>{lbl.postal}</label>
                <input value={shipping.postal} onChange={e => setAddr('postal', e.target.value)} />
              </div>
            </>)}
            <div className="form-group">
              <label>{lbl.country} *</label>
              <select value={shipping.country} onChange={e => setAddr('country', e.target.value)}>
                {countryList.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>{lbl.phone}</label>
              <input value={shipping.phone} onChange={e => setAddr('phone', e.target.value)} />
            </div>
          </div>

          {/* Shipping method */}
          {shippingMethods.length > 0 && (
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: 8 }}>Shipping Method</label>
              {shippingMethods.map(m => (
                <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: selectedShipping?.id === m.id ? '2px solid #febd69' : '1px solid #ddd', borderRadius: 6, marginBottom: 8, cursor: 'pointer', background: selectedShipping?.id === m.id ? '#fffbe6' : '#fff' }}>
                  <input type="radio" name="ship" checked={selectedShipping?.id === m.id} onChange={() => setSelectedShipping(m)} />
                  <div style={{ flex: 1 }}>
                    <strong>{m.label}</strong>
                    {m.days && <span style={{ fontSize: 12, color: '#666', marginLeft: 8 }}>{m.days} {lbl.days}</span>}
                  </div>
                  <strong>{m.price === 0 ? lbl.free : `${CURRENCY_SYMBOL[m.currency] || shippingSymbol}${Number(m.price).toLocaleString()}`}</strong>
                </label>
              ))}
            </div>
          )}

          {/* Notes */}
          <div className="form-group">
            <label>{lbl.notes} <span style={{ color: '#888', fontWeight: 400 }}>({lbl.optional})</span></label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder={lbl.notesPlaceholder} dir={lang === 'fa' || lang === 'ar' ? 'rtl' : 'ltr'} />
          </div>

          {ratesError && <p style={{ color: '#e67e22', fontSize: 13 }}>{ratesError}</p>}

          <button className="btn btn-primary" style={{ width: '100%', padding: 12 }}
            disabled={!shipping.name || !shipping.address || !shipping.city || loadingRates}
            onClick={async () => { if (shippingMethods.length === 0) await fetchLiveRates(); setStep(2); }}>
            {loadingRates ? lbl.fetchingRates : lbl.continue}
          </button>
        </div>
      )}

      {/* Step 2: Payment */}
      {step === 2 && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginBottom: 12 }}>{lang === 'fa' ? 'خلاصه سفارش' : lang === 'ar' ? 'ملخص الطلب' : 'Order Summary'}</h3>
            {items.map(i => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '4px 0' }}>
                <span>{i.name} × {i.qty}</span>
                <span>{symbol}{Number(i.price * i.qty).toLocaleString()}</span>
              </div>
            ))}
            {selectedShipping && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '4px 0', color: '#555' }}>
                <span>{lang === 'fa' ? 'هزینه ارسال' : lang === 'ar' ? 'الشحن' : 'Shipping'} ({selectedShipping.label})</span>
                <span>{shippingCost === 0 ? lbl.free : `${CURRENCY_SYMBOL[selectedShipping.currency] || shippingSymbol}${Number(shippingCost).toLocaleString()}`}</span>
              </div>
            )}
            <div style={{ borderTop: '1px solid #ddd', marginTop: 8, paddingTop: 8, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
              <span>{t('total')}</span><span>{symbol}{Number(total).toLocaleString()} {selectedShipping && selectedShipping.currency !== currency ? `+ ${CURRENCY_SYMBOL[selectedShipping.currency] || ''}${Number(shippingCost).toLocaleString()}` : ''}</span>
            </div>
            {notes && <div style={{ marginTop: 8, fontSize: 13, color: '#666', background: '#f9f9f9', padding: 8, borderRadius: 4 }}>📝 {notes}</div>}
          </div>

          <div className="card">
            <h2 style={{ marginBottom: 20 }}>Payment Method</h2>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              {(paymentMethods.length > 0 ? paymentMethods : [{ id: 'card', label: 'Credit / Debit Card' }, { id: 'cod', label: 'Cash on Delivery' }]).map(m => (
                <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', border: payMethod === m.id ? '2px solid #febd69' : '1px solid #ddd', borderRadius: 8, cursor: 'pointer', background: payMethod === m.id ? '#fffbe6' : '#fff' }}>
                  <input type="radio" name="pay" value={m.id} checked={payMethod === m.id} onChange={() => setPayMethod(m.id)} />
                  {m.label}
                </label>
              ))}
            </div>

            {payMethod === 'card' && (
              <div>
                <div className="form-group"><label>Card Number</label>
                  <input value={card.number} onChange={e => setCard(c => ({ ...c, number: e.target.value.replace(/\D/g,'').slice(0,16) }))} placeholder="1234 5678 9012 3456" />
                </div>
                <div className="form-group"><label>Name on Card</label>
                  <input value={card.name} onChange={e => setCard(c => ({ ...c, name: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group"><label>Expiry (MM/YY)</label>
                    <input value={card.expiry} onChange={e => setCard(c => ({ ...c, expiry: e.target.value }))} placeholder="12/27" maxLength={5} />
                  </div>
                  <div className="form-group"><label>CVV</label>
                    <input value={card.cvv} onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g,'').slice(0,4) }))} type="password" placeholder="123" />
                  </div>
                </div>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>🔒 Demo — no real payment processed.</p>
              </div>
            )}

            {payMethod === 'paypal' && (
              <div style={{ padding: 20, background: '#f5f5f5', borderRadius: 8, textAlign: 'center', marginBottom: 16 }}>
                <p style={{ color: '#003087', fontWeight: 'bold', fontSize: 18 }}>PayPal</p>
                <p style={{ fontSize: 13, color: '#666' }}>Demo mode — no redirect.</p>
              </div>
            )}

            {payMethod === 'cod' && (
              <div style={{ padding: 16, background: '#f9f9e6', border: '1px solid #e6e600', borderRadius: 8, marginBottom: 16 }}>
                <p style={{ fontSize: 14 }}>💵 Pay with cash when your order is delivered.</p>
              </div>
            )}

            {error && <p style={{ color: 'red', marginBottom: 12 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setStep(1)}>{btn('back', lang).label}</button>
              <button className="btn btn-primary" style={{ flex: 1, padding: 12, background: btn('placeOrder', lang).color }} onClick={placeOrder} disabled={loading}>
                {loading
                  ? (lang === 'fa' ? 'در حال ثبت سفارش...' : lang === 'ar' ? 'جارٍ تقديم الطلب...' : 'Placing order...')
                  : `${btn('placeOrder', lang).label} — ${symbol}${Number(grandTotal).toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ marginBottom: 8 }}>{lang === 'fa' ? 'سفارش ثبت شد!' : lang === 'ar' ? 'تم تقديم الطلب!' : 'Order Placed!'}</h2>
          <p style={{ color: '#555', marginBottom: 4 }}>{lang === 'fa' ? 'شماره سفارش' : 'Order'} #{orderId}</p>
          <p style={{ color: '#555', marginBottom: 24 }}>📍 {shipping.name}, {shipping.city}, {shipping.country}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-primary" style={{ background: btn('continueShopping', lang).color }} onClick={() => navigate('/')}>{btn('continueShopping', lang).label}</button>
            <button className="btn btn-secondary" onClick={() => navigate('/orders')}>{btn('viewOrders', lang).label}</button>
          </div>
        </div>
      )}
    </div>
  );
}
