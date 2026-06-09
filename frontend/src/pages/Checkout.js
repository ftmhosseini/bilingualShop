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

// Hardcoded fallbacks (used when DB has no entry yet)
const DEFAULTS = {
  en: {
    stepAddress: 'Address', stepPayment: 'Payment', stepConfirm: 'Confirmation',
    shippingAddress: 'Shipping Address',
    fullName: 'Full Name', street: 'Street Address', city: 'City', province: 'Province',
    country: 'Country', postal: 'Postal / ZIP', postalIran: 'Postal Code (10 digits)',
    phone: 'Phone', shippingMethod: 'Shipping Method', notes: 'Order Notes',
    notesPlaceholder: 'e.g. Leave at door', optional: 'optional',
    continue: 'Continue to Payment →', fetchingRates: 'Fetching shipping rates...',
    selectProvince: 'Select province...', free: 'Free', days: 'days',
    orderSummary: 'Order Summary', shipping: 'Shipping', total: 'Total',
    paymentMethod: 'Payment Method', cardNumber: 'Card Number', nameOnCard: 'Name on Card',
    expiry: 'Expiry (MM/YY)', cvv: 'CVV', cardNote: '🔒 Demo — no real payment processed.',
    codNote: '💵 Pay with cash when your order is delivered.',
    placing: 'Placing order...', placeOrderBtn: 'Place Order',
    orderPlaced: 'Order Placed!', orderNumber: 'Order',
    continueShopping: 'Continue Shopping', viewOrders: 'View Orders',
  },
  fa: {
    stepAddress: 'آدرس', stepPayment: 'پرداخت', stepConfirm: 'تأیید',
    shippingAddress: 'آدرس ارسال',
    fullName: 'نام و نام خانوادگی', street: 'آدرس', city: 'شهر', province: 'استان',
    country: 'کشور', postal: 'کد پستی', postalIran: 'کد پستی (۱۰ رقم)',
    phone: 'شماره تماس', shippingMethod: 'روش ارسال', notes: 'توضیحات سفارش',
    notesPlaceholder: 'مثلاً: زنگ نزنید، پشت در بگذارید', optional: 'اختیاری',
    continue: 'ادامه به پرداخت ←', fetchingRates: 'در حال دریافت نرخ ارسال...',
    selectProvince: 'انتخاب استان...', free: 'رایگان', days: 'روز',
    orderSummary: 'خلاصه سفارش', shipping: 'هزینه ارسال', total: 'مجموع',
    paymentMethod: 'روش پرداخت', cardNumber: 'شماره کارت', nameOnCard: 'نام روی کارت',
    expiry: 'تاریخ انقضا (MM/YY)', cvv: 'CVV', cardNote: '🔒 پرداخت واقعی انجام نمی‌شود.',
    codNote: '💵 هنگام تحویل سفارش پرداخت کنید.',
    placing: 'در حال ثبت سفارش...', placeOrderBtn: 'ثبت سفارش',
    orderPlaced: 'سفارش ثبت شد!', orderNumber: 'شماره سفارش',
    continueShopping: 'ادامه خرید', viewOrders: 'مشاهده سفارش‌ها',
  },
  ar: {
    stepAddress: 'العنوان', stepPayment: 'الدفع', stepConfirm: 'التأكيد',
    shippingAddress: 'عنوان الشحن',
    fullName: 'الاسم الكامل', street: 'العنوان', city: 'المدينة', province: 'المنطقة',
    country: 'الدولة', postal: 'الرمز البريدي', postalIran: 'الرمز البريدي',
    phone: 'رقم الهاتف', shippingMethod: 'طريقة الشحن', notes: 'ملاحظات الطلب',
    notesPlaceholder: 'مثلاً: اتركه عند الباب', optional: 'اختياري',
    continue: 'متابعة للدفع ←', fetchingRates: 'جارٍ جلب أسعار الشحن...',
    selectProvince: 'اختر المنطقة...', free: 'مجاني', days: 'أيام',
    orderSummary: 'ملخص الطلب', shipping: 'الشحن', total: 'المجموع',
    paymentMethod: 'طريقة الدفع', cardNumber: 'رقم البطاقة', nameOnCard: 'الاسم على البطاقة',
    expiry: 'تاريخ الانتهاء', cvv: 'CVV', cardNote: '🔒 لا يتم معالجة أي دفع حقيقي.',
    codNote: '💵 ادفع نقداً عند التسليم.',
    placing: 'جارٍ تقديم الطلب...', placeOrderBtn: 'تقديم الطلب',
    orderPlaced: 'تم تقديم الطلب!', orderNumber: 'الطلب',
    continueShopping: 'مواصلة التسوق', viewOrders: 'عرض الطلبات',
  },
};

export default function Checkout() {
  const { i18n } = useTranslation();
  const { btn } = useButtonLabels();
  const lang = i18n.language?.split('-')[0] || 'en';
  const isIran = lang === 'fa';
  const defaultCountry = isIran ? 'ایران' : lang === 'ar' ? 'Saudi Arabia' : 'Canada';
  const [countryList, setCountryList] = useState(lang === 'fa' ? COUNTRIES_FA : COUNTRIES);
  const provinces = lang === 'fa' ? IRAN_PROVINCES_FA : IRAN_PROVINCES_EN;
  const iranCountryValue = lang === 'fa' ? 'ایران' : 'Iran';

  // Use the same selectedCurrency as Products/Cart pages
  const sc = (() => { try { return JSON.parse(localStorage.getItem('selectedCurrency')) || {}; } catch { return {}; } })();
  const currency = sc.currency_code || LANG_CURRENCY[lang] || 'USD';
  const symbol = sc.checkout_symbol || sc.symbol || CURRENCY_SYMBOL[currency] || '$';
  const fractionDigits = sc.fraction_digits ?? 2;
  const differ = sc.differ ?? 1;
  const toDisplay = (amount) => amount * differ;
  const fmt = (amount) => toDisplay(amount).toLocaleString(undefined, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
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
  const [stockError, setStockError] = useState('');
  const [availabilityError, setAvailabilityError] = useState('');
  const [lbl, setLbl] = useState(DEFAULTS[lang] || DEFAULTS.en);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const checkStock = async () => {
    try {
      const res = await api.post('/api/orders/check-stock', { items: items.map(i => ({ product_id: i.id, quantity: i.qty })) });
      if (res.data.ok) return true;
      setStockError(res.data.errors.join('\n'));
      return false;
    } catch { return true; } // fail open if endpoint missing
  };

  const checkAvailability = async () => {
    try {
      const res = await api.post('/api/orders/check-availability', {
        currency,
        items: items.map(i => ({ product_id: i.id, name: i.name })),
      });
      if (res.data.ok) { setAvailabilityError(''); return true; }
      const names = res.data.unavailable.join(', ');
      const msg = isRTL
        ? `این محصولات در این ارز موجود نیستند: ${names}`
        : `These items are not available in the selected currency: ${names}`;
      setAvailabilityError(msg);
      return false;
    } catch { return true; }
  };

  // Re-check availability whenever currency changes
  useEffect(() => { if (items.length > 0) checkAvailability(); }, [currency]);

  // Load labels from DB, fall back to hardcoded defaults per key
  useEffect(() => {
    api.get('/api/content/checkout').then(r => {
      const row = r.data.find(c => c.lang === lang) || r.data.find(c => c.lang === 'en');
      if (row) {
        const saved = (() => { try { return JSON.parse(row.content || '{}'); } catch { return {}; } })();
        setLbl({ ...(DEFAULTS[lang] || DEFAULTS.en), ...saved });
      } else {
        setLbl(DEFAULTS[lang] || DEFAULTS.en);
      }
    }).catch(() => setLbl(DEFAULTS[lang] || DEFAULTS.en));
  }, [lang]);

  useEffect(() => {
    api.get('/api/settings').then(r => {
      const pm = JSON.parse(r.data.payment_methods || '[]').filter(m => m.enabled);
      setPaymentMethods(pm);
      if (pm[0]) setPayMethod(pm[0].id);
      const sm = JSON.parse(r.data.shipping_methods || '[]');
      setShippingMethods(sm);
      setSelectedShipping(sm[0] || null);
      const mults = JSON.parse(r.data.shipping_multipliers || '[]');
      if (mults.length > 0) {
        const countries = mults.map(m => m.country).filter(Boolean);
        setCountryList(countries);
        setShipping(prev => ({ ...prev, country: countries[0] || prev.country }));
      }
    });
  }, []);

  const fetchLiveRates = async (overrideShipping) => {
    const addr = overrideShipping || shipping;
    if (!addr.city || !addr.country) return;
    setLoadingRates(true); setRatesError('');
    try {
      const [ratesRes, settingsRes] = await Promise.all([
        api.post('/api/shipping/rates', {
          toAddress: { name: addr.name, street: addr.address, city: addr.city, province: addr.province || '', state: addr.province || '', postal: addr.postal, country_code: COUNTRY_CODES[addr.country] || 'CA' },
          parcel: { weight: '1', length: '20', width: '15', height: '10' },
        }),
        api.get('/api/settings'),
      ]);
      const multipliers = JSON.parse(settingsRes.data.shipping_multipliers || '[]');
      const mul = multipliers.find(m => m.country?.toLowerCase() === addr.country?.toLowerCase());
      const factor = mul ? (parseFloat(mul.multiplier) || 1) : 1;
      if (ratesRes.data.length > 0) {
        const mapped = ratesRes.data.map(r => ({ id: r.id, label: `${r.provider} ${r.service}`, price: Math.round(r.price * factor), currency: r.currency || currency, days: r.days ? `${r.days}` : '' }));
        setShippingMethods(mapped);
        setSelectedShipping(mapped[0]);
      }
    } catch {
      setRatesError('Could not fetch live rates — using manual rates.');
    } finally { setLoadingRates(false); }
  };

  const setAddr = (k, v) => {
    const updated = { ...shipping, [k]: v };
    setShipping(updated);
    if (k === 'country' && updated.city) fetchLiveRates(updated);
  };

  if (!user) { navigate('/login'); return null; }
  if (items.length === 0 && !orderId) { navigate('/cart'); return null; }

  const shippingCost = selectedShipping?.price || 0;
  const shippingSymbol = selectedShipping?.currency ? (CURRENCY_SYMBOL[selectedShipping.currency] || selectedShipping.currency) : symbol;
  const grandTotal = total + shippingCost;

  const placeOrder = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/api/orders', {
        items: items.map(i => ({ product_id: i.id, quantity: i.qty, price: i.price })),
        total: grandTotal, shipping, payment_method: payMethod,
        shipping_method: selectedShipping?.label, notes,
      });
      try {
        const gw = await api.post('/api/orders/initiate-payment', { order_id: data.id, currency });
        if (gw.data?.redirect_url) { clear(); window.location.href = gw.data.redirect_url; return; }
      } catch {}
      // Fetch manual payment info (card / PayPal)
      try {
        const pi = await api.get(`/api/orders/payment-info?currency=${currency}`);
        setPaymentInfo(pi.data);
      } catch {}
      setOrderId(data.id); clear(); setStep(3);
    } catch {
      setError('Order failed. Please try again.');
    } finally { setLoading(false); }
  };

  const isRTL = ['fa', 'ar'].includes(lang);
  const steps = [lbl.stepAddress, lbl.stepPayment, lbl.stepConfirm];

  return (
    <div className="page" style={{ maxWidth: 700 }} dir={isRTL ? 'rtl' : 'ltr'}>
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
          <h2 style={{ marginBottom: 20 }}>{lbl.shippingAddress}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>{lbl.fullName} *</label>
              <input value={shipping.name} onChange={e => setAddr('name', e.target.value)} required dir={isRTL ? 'rtl' : 'ltr'} />
            </div>

            <div className="form-group">
              <label>{lbl.phone}</label>
              <input value={shipping.phone} onChange={e => setAddr('phone', e.target.value)} />
            </div>
            <div className="form-group">
              <label>{lbl.country} *</label>
              <select value={shipping.country} onChange={e => setAddr('country', e.target.value)}>
                {countryList.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            {shipping.country === iranCountryValue ? (<>
              <div className="form-group">
                <label>{lbl.province} *</label>
                <select value={shipping.province || ''} onChange={e => setAddr('province', e.target.value)} dir={isRTL ? 'rtl' : 'ltr'}>
                  <option value="">{lbl.selectProvince}</option>
                  {provinces.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>{lbl.city} *</label>
                <input value={shipping.city} onChange={e => setAddr('city', e.target.value)} required dir={isRTL ? 'rtl' : 'ltr'} />
              </div>
              <div className="form-group">
                <label>{lbl.postalIran}</label>
                <input value={shipping.postal} onChange={e => setAddr('postal', e.target.value)} maxLength={10} />
              </div>
            </>) : (<>
            <div className="form-group">
                <label>{lbl.province} *</label>
                <input value={shipping.province} onChange={e => setAddr('province', e.target.value)} required dir={isRTL ? 'rtl' : 'ltr'} />
              </div>
              <div className="form-group">
                <label>{lbl.city} *</label>
                <input value={shipping.city} onChange={e => setAddr('city', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>{lbl.postal}</label>
                <input value={shipping.postal} onChange={e => setAddr('postal', e.target.value)} />
              </div>
            </>)}
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label>{lbl.street} *</label>
              <input value={shipping.address} onChange={e => setAddr('address', e.target.value)} required dir={isRTL ? 'rtl' : 'ltr'} />
            </div>
          </div>

          {/* {shippingMethods.length > 0 && (
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: 8 }}>{lbl.shippingMethod}</label>
              {shippingMethods.map(m => (
                <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: selectedShipping?.id === m.id ? '2px solid #febd69' : '1px solid #ddd', borderRadius: 6, marginBottom: 8, cursor: 'pointer', background: selectedShipping?.id === m.id ? '#fffbe6' : '#fff' }}>
                  <input type="radio" name="ship" checked={selectedShipping?.id === m.id} onChange={() => setSelectedShipping(m)} />
                  <div style={{ flex: 1 }}>
                    <strong>{m.label}</strong>
                    {m.days && <span style={{ fontSize: 12, color: '#666', marginLeft: 8 }}>{m.days} {lbl.days}</span>}
                  </div>
                  <strong>{m.price === 0 ? lbl.free : <Price amount={m.price} />}</strong>
                </label>
              ))}
            </div>
          )} */}
          {shippingMethods.length > 0 && (
  <div className="form-group">
    <label style={{ display: 'block', marginBottom: 8 }}>{lbl.shippingMethod}</label>
    {shippingMethods.map(m => (
      <label 
        key={m.id} 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', // Pushes the price to the far end
          gap: 12, 
          padding: '10px 12px', 
          border: selectedShipping?.id === m.id ? '2px solid #febd69' : '1px solid #ddd', 
          borderRadius: 6, 
          marginBottom: 8, 
          cursor: 'pointer', 
          background: selectedShipping?.id === m.id ? '#fffbe6' : '#fff',
          whiteSpace: 'nowrap' // Prevents text from breaking onto a second line
        }}
      >
        {/* Left Section: Radio input and Label Content */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <input 
            type="radio" 
            name="ship" 
            checked={selectedShipping?.id === m.id} 
            onChange={() => setSelectedShipping(m)} 
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
            <strong style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>{m.label}</strong>
            {m.days && (
              <span style={{ fontSize: 12, color: '#666', flexShrink: 0 }}>
                ({m.days} {lbl.days})
              </span>
            )}
          </div>
        </div>

        {/* Right Section: Price status */}
        <strong style={{ flexShrink: 0 }}>
          {m.price === 0 ? lbl.free : <Price amount={m.price} />}
        </strong>
      </label>
    ))}
  </div>
)}

          <div className="form-group">
            <label>{lbl.notes} <span style={{ color: '#888', fontWeight: 400 }}>({lbl.optional})</span></label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder={lbl.notesPlaceholder} dir={isRTL ? 'rtl' : 'ltr'} />
          </div>

          {ratesError && <p style={{ color: '#e67e22', fontSize: 13 }}>{ratesError}</p>}
          {stockError && <p style={{ color: 'red', fontSize: 13, whiteSpace: 'pre-line' }}>{stockError}</p>}
          {availabilityError && <p style={{ color: 'red', fontSize: 13 }}>{availabilityError}</p>}

          <button className="btn btn-primary" style={{ width: '100%', padding: 12 }}
            disabled={!shipping.name || !shipping.address || !shipping.city || loadingRates}
            onClick={async () => {
              setStockError('');
              await fetchLiveRates();
              const avail = await checkAvailability();
              if (!avail) return;
              const ok = await checkStock();
              if (ok) setStep(2);
            }}>
            {loadingRates ? lbl.fetchingRates : lbl.continue}
          </button>
        </div>
      )}

      {/* Step 2: Payment */}
      {step === 2 && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginBottom: 12 }}>{lbl.orderSummary}</h3>
            {items.map(i => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '4px 0' }}>
                <span>{i.name} × {i.qty}</span>
                <Price amount={Number(i.price * i.qty)}/>
              </div>
            ))}
            {selectedShipping && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '4px 0', color: '#555' }}>
                <span>{lbl.shipping} — {selectedShipping.label}{selectedShipping.days ? ` (${selectedShipping.days} ${lbl.days})` : ''}</span>
                <span>{shippingCost === 0 ? lbl.free : <Price amount={Number(shippingCost)}/>}</span>
              </div>
            )}
            <div style={{ borderTop: '1px solid #ddd', marginTop: 8, paddingTop: 8, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
              <span>{lbl.total}</span>
              <Price amount={Number(grandTotal)}/>
            </div>
            {notes && <div style={{ marginTop: 8, fontSize: 13, color: '#666', background: '#f9f9f9', padding: 8, borderRadius: 4 }}>📝 {notes}</div>}
          </div>

          <div className="card">
            <h2 style={{ marginBottom: 20 }}>{lbl.paymentMethod}</h2>
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
                <div className="form-group"><label>{lbl.cardNumber}</label>
                  <input value={card.number} onChange={e => setCard(c => ({ ...c, number: e.target.value.replace(/\D/g,'').slice(0,16) }))} placeholder="1234 5678 9012 3456" />
                </div>
                <div className="form-group"><label>{lbl.nameOnCard}</label>
                  <input value={card.name} onChange={e => setCard(c => ({ ...c, name: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group"><label>{lbl.expiry}</label>
                    <input value={card.expiry} onChange={e => setCard(c => ({ ...c, expiry: e.target.value }))} placeholder="12/27" maxLength={5} />
                  </div>
                  <div className="form-group"><label>{lbl.cvv}</label>
                    <input value={card.cvv} onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g,'').slice(0,4) }))} type="password" placeholder="123" />
                  </div>
                </div>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>{lbl.cardNote}</p>
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
                <p style={{ fontSize: 14 }}>{lbl.codNote}</p>
              </div>
            )}

            {error && <p style={{ color: 'red', marginBottom: 12 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setStep(1)}>{btn('back', lang).label}</button>
              <button className="btn btn-primary" style={{ flex: 1, padding: 12, background: btn('placeOrder', lang).color }} onClick={placeOrder} disabled={loading}>
                {loading ? lbl.placing : <>{btn('placeOrder', lang).label} — <Price amount={Number(grandTotal)}/></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Payment Info + Receipt Upload */}
      {step === 3 && (
        <div className="card" style={{ padding: 32 }}>
          <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 12 }}>✅</div>
          <h2 style={{ textAlign: 'center', marginBottom: 4 }}>{lbl.orderPlaced}</h2>
          <p style={{ textAlign: 'center', color: '#555', marginBottom: 24 }}>{lbl.orderNumber} #{orderId}</p>

          {/* Payment instructions */}
          {paymentInfo && (
            <div style={{ background: '#fffbe6', border: '1px solid #febd69', borderRadius: 8, padding: 20, marginBottom: 24 }}>
              {paymentInfo.type === 'card' ? (<>
                <h3 style={{ marginBottom: 12 }}>💳 {isIran ? 'اطلاعات پرداخت کارت' : 'Card Payment Info'}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#666', fontSize: 14 }}>{isIran ? 'شماره کارت' : 'Card Number'}</span>
                    <strong style={{ fontSize: 18, letterSpacing: 2, direction: 'ltr' }}>{paymentInfo.card_number || '—'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#666', fontSize: 14 }}>{isIran ? 'نام صاحب کارت' : 'Card Holder'}</span>
                    <strong>{paymentInfo.card_holder || '—'}</strong>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: '#888', marginTop: 12 }}>
                  {isIran ? 'لطفاً مبلغ سفارش را به این کارت واریز کنید و سپس تصویر رسید را آپلود کنید.' : 'Please transfer the order amount to this card, then upload your receipt below.'}
                </p>
              </>) : (<>
                <h3 style={{ marginBottom: 12 }}>💰 PayPal Payment</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#666', fontSize: 14 }}>PayPal Email</span>
                  <strong>{paymentInfo.paypal_email || '—'}</strong>
                </div>
                <p style={{ fontSize: 13, color: '#888', marginTop: 12 }}>
                  Please send payment via PayPal to the email above, then upload your receipt below.
                </p>
              </>)}
              <div style={{ fontWeight: 'bold', marginTop: 12, fontSize: 16 }}>
                {isIran ? 'مبلغ' : 'Amount'}: <Price amount={Number(grandTotal)}/>
              </div>
            </div>
          )}

          {/* Receipt upload */}
          {!receiptUploaded ? (
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
                📎 {isIran ? 'آپلود تصویر رسید پرداخت' : 'Upload Payment Receipt'}
              </label>
              <input type="file" accept="image/*" onChange={e => setReceipt(e.target.files[0])} style={{ marginBottom: 12 }} />
              <button className="btn btn-primary" disabled={!receipt || uploadingReceipt}
                onClick={async () => {
                  if (!receipt || !orderId) return;
                  setUploadingReceipt(true);
                  try {
                    const fd = new FormData();
                    fd.append('receipt', receipt);
                    await api.post(`/api/orders/${orderId}/receipt`, fd);
                    setReceiptUploaded(true);
                  } catch { alert('Upload failed, please try again.'); }
                  finally { setUploadingReceipt(false); }
                }}>
                {uploadingReceipt ? '...' : (isIran ? 'ارسال رسید' : 'Submit Receipt')}
              </button>
            </div>
          ) : (
            <div style={{ background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: 8, padding: 16, marginBottom: 24, textAlign: 'center' }}>
              ✅ {isIran ? 'رسید با موفقیت ارسال شد. سفارش شما پس از تأیید پرداخت پردازش می‌شود.' : 'Receipt submitted! Your order will be processed after payment is confirmed.'}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-primary" style={{ background: btn('continueShopping', lang).color }} onClick={() => navigate('/')}>{btn('continueShopping', lang).label}</button>
            <button className="btn btn-secondary" onClick={() => navigate('/orders')}>{btn('viewOrders', lang).label}</button>
          </div>
        </div>
      )}
    </div>
  );
}
