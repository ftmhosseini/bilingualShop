import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';

const COUNTRIES = ['Canada', 'United States', 'United Kingdom', 'Iran', 'Saudi Arabia', 'UAE', 'Other'];
const IRAN_PROVINCES = [
  'Tehran','Isfahan','Fars','Khorasan Razavi','Khuzestan','East Azerbaijan','West Azerbaijan',
  'Kerman','Mazandaran','Gilan','Alborz','Hormozgan','Sistan and Baluchestan','Lorestan',
  'Hamadan','Kermanshah','Golestan','Markazi','Ardabil','Zanjan','Semnan','Yazd','Ilam',
  'Chaharmahal and Bakhtiari','Kohgiluyeh and Boyer-Ahmad','North Khorasan','South Khorasan',
  'Qazvin','Qom','Bushehr','Kurdestan',
];

const emptyAddr = { label: '', name: '', address: '', city: '', province: '', country: 'Iran', postal: '', phone: '', is_default: false };

function AddressForm({ initial, onSave, onCancel, tr = {} }) {
  const T = (key, fallback) => tr[key] || fallback;
  const [form, setForm] = useState(initial || emptyAddr);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div style={{ background: '#f9f9f9', border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="form-group" style={{ gridColumn: '1/-1' }}>
          <label>{T('address.label', 'Label (e.g. Home, Work)')}</label>
          <input value={form.label} onChange={e => set('label', e.target.value)} placeholder="Home" />
        </div>
        <div className="form-group" style={{ gridColumn: '1/-1' }}>
          <label>{T('address.fullName', 'Full Name')}</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div className="form-group" style={{ gridColumn: '1/-1' }}>
          <label>{T('address.street', 'Street Address')}</label>
          <input value={form.address} onChange={e => set('address', e.target.value)} />
        </div>
        <div className="form-group">
          <label>{T('address.country', 'Country')}</label>
          <select value={form.country} onChange={e => set('country', e.target.value)}>
            {COUNTRIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        {form.country === 'Iran' ? (<>
          <div className="form-group">
            <label>{T('address.province', 'Province')}</label>
            <select value={form.province} onChange={e => set('province', e.target.value)}>
              <option value="">Select...</option>
              {IRAN_PROVINCES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>{T('address.city', 'City')}</label>
            <input value={form.city} onChange={e => set('city', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{T('address.postal', 'Postal Code')}</label>
            <input value={form.postal} onChange={e => set('postal', e.target.value)} maxLength={10} placeholder="1234567890" />
          </div>
        </>) : (<>
          <div className="form-group">
            <label>{T('address.city', 'City')}</label>
            <input value={form.city} onChange={e => set('city', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{T('address.postalZip', 'Postal / ZIP')}</label>
            <input value={form.postal} onChange={e => set('postal', e.target.value)} />
          </div>
        </>)}
        <div className="form-group">
          <label>{T('address.phone', 'Phone')}</label>
          <input value={form.phone} onChange={e => set('phone', e.target.value)} />
        </div>
        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 24 }}>
          <input type="checkbox" id="is_default" checked={!!form.is_default} onChange={e => set('is_default', e.target.checked)} style={{ width: 16, height: 16 }} />
          <label htmlFor="is_default" style={{ marginBottom: 0 }}>{T('address.setDefault', 'Set as default')}</label>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-primary" onClick={() => onSave(form)}>{T('address.saveAddress', 'Save Address')}</button>
        <button className="btn btn-secondary" onClick={onCancel}>{T('address.cancel', 'Cancel')}</button>
      </div>
    </div>
  );
}

export default function Profile() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.split('-')[0];
  const isRTL = ['fa', 'ar'].includes(lang);
  const [tr, setTr] = useState({});
  const [form, setForm] = useState({ email: '', phone: '', first_name: '', last_name: '', current_password: '', new_password: '', confirm_password: '' });
  const [addresses, setAddresses] = useState([]);
  const [editingAddr, setEditingAddr] = useState(null);
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');

  const T = (key, fallback) => tr[key] || fallback;

  useEffect(() => {
    api.get(`/api/translations/${lang}`).then(r => setTr(r.data)).catch(() => {});
    api.get('/api/auth/profile').then(r => setForm(f => ({ ...f, email: r.data.email || '', phone: r.data.phone || '', first_name: r.data.first_name || '', last_name: r.data.last_name || '' })));
    api.get('/api/auth/addresses').then(r => setAddresses(r.data));
  }, [lang]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async e => {
    e.preventDefault();
    setError('');
    if (form.new_password && form.new_password !== form.confirm_password) { setError(T('profile.passwordMismatch', 'New passwords do not match')); return; }
    try {
      await api.put('/api/auth/profile', {
        email: form.email, phone: form.phone,
        first_name: form.first_name, last_name: form.last_name,
        current_password: form.current_password || undefined,
        new_password: form.new_password || undefined,
      });
      setSaved('profile'); setTimeout(() => setSaved(''), 2000);
      setForm(f => ({ ...f, current_password: '', new_password: '', confirm_password: '' }));
    } catch (err) { setError(err.response?.data?.error || 'Failed to save'); }
  };

  const saveAddress = async (addr) => {
    if (editingAddr === 'new') {
      const { data } = await api.post('/api/auth/addresses', addr);
      setAddresses(prev => {
        const updated = addr.is_default ? prev.map(a => ({ ...a, is_default: 0 })) : prev;
        return [...updated, { ...addr, id: data.id }];
      });
    } else {
      await api.put(`/api/auth/addresses/${editingAddr.id}`, addr);
      setAddresses(prev => prev.map(a => {
        if (addr.is_default) return a.id === editingAddr.id ? { ...addr, id: a.id } : { ...a, is_default: 0 };
        return a.id === editingAddr.id ? { ...addr, id: a.id } : a;
      }));
    }
    setEditingAddr(null);
  };

  const deleteAddress = async (id) => {
    await api.delete(`/api/auth/addresses/${id}`);
    setAddresses(prev => prev.filter(a => a.id !== id));
  };

  const setDefault = async (id) => {
    await api.put(`/api/auth/addresses/${id}/default`);
    setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === id ? 1 : 0 })));
  };

  return (
    <div className="page" dir={isRTL ? 'rtl' : 'ltr'}>
      <h2 style={{ marginBottom: 20 }}>{T('profile.title', 'Edit Profile')}</h2>
      <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
        {/* Profile form */}
        <form className="card" onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>{T('profile.firstName', 'First Name')}</label>
              <input value={form.first_name} onChange={e => set('first_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label>{T('profile.lastName', 'Last Name')}</label>
              <input value={form.last_name} onChange={e => set('last_name', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>{T('profile.email', 'Email')}</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{T('profile.phone', 'Phone')}</label>
            <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1..." />
          </div>
          <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #eee' }} />
          <p style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>{T('profile.passwordHint', 'Leave password fields empty to keep current password.')}</p>
          <div className="form-group">
            <label>{T('profile.currentPassword', 'Current Password')}</label>
            <input type="password" value={form.current_password} onChange={e => set('current_password', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{T('profile.newPassword', 'New Password')}</label>
            <input type="password" value={form.new_password} onChange={e => set('new_password', e.target.value)} />
          </div>
          <div className="form-group">
            <label>{T('profile.confirmPassword', 'Confirm New Password')}</label>
            <input type="password" value={form.confirm_password} onChange={e => set('confirm_password', e.target.value)} />
          </div>
          {error && <p style={{ color: '#e74c3c', fontSize: 13, marginBottom: 8 }}>{error}</p>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="submit" className="btn btn-primary">{T('profile.saveChanges', 'Save Changes')}</button>
            {saved === 'profile' && <span style={{ color: 'green', fontSize: 13 }}>✓ {T('profile.saved', 'Saved')}</span>}
          </div>
        </form>

        {/* Addresses column */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>{T('address.saved', 'Saved Addresses')}</h3>
            {editingAddr === null && <button className="btn btn-secondary" onClick={() => setEditingAddr('new')}>{T('address.add', '+ Add')}</button>}
          </div>

          {editingAddr === 'new' && <AddressForm tr={tr} onSave={saveAddress} onCancel={() => setEditingAddr(null)} />}

          {addresses.map(a => (
            <div key={a.id}>
              {editingAddr?.id === a.id ? (
                <AddressForm tr={tr} initial={a} onSave={saveAddress} onCancel={() => setEditingAddr(null)} />
              ) : (
                <div style={{ border: a.is_default ? '2px solid #febd69' : '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 10, background: a.is_default ? '#fffbe6' : '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong>{a.label || T('address.saved', 'Address')}</strong>
                      {a.is_default ? <span style={{ marginLeft: 8, fontSize: 11, background: '#febd69', padding: '2px 6px', borderRadius: 4 }}>{T('address.default', 'Default')}</span> : null}
                      <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>
                        {a.name && <div>{a.name}</div>}
                        <div>{a.address}</div>
                        <div>{[a.city, a.province, a.country].filter(Boolean).join(', ')} {a.postal}</div>
                        {a.phone && <div>{a.phone}</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      {!a.is_default && <button className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => setDefault(a.id)}>{T('address.default', 'Default')}</button>}
                      <button className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => setEditingAddr(a)}>{T('address.edit', 'Edit')}</button>
                      <button className="btn btn-danger" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => deleteAddress(a.id)}>✕</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {addresses.length === 0 && editingAddr === null && <p style={{ color: '#888', fontSize: 13 }}>{T('address.none', 'No saved addresses yet.')}</p>}
        </div>
      </div>
    </div>
  );
}
