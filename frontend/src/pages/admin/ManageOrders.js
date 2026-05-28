import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api';

const STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_COLOR = { pending: '#e67e22', paid: '#27ae60', processing: '#2980b9', shipped: '#8e44ad', delivered: '#27ae60', cancelled: '#c0392b' };

export default function ManageOrders() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState('');

  const load = () => api.get('/api/orders/all').then(r => setOrders(r.data));
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    await api.put(`/api/orders/${id}/status`, { status });
    load();
  };

  const filtered = orders.filter(o =>
    !search || o.user_email?.includes(search) || String(o.id).includes(search) || o.shipping_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>{t('orders')}</h2>
        <input placeholder="Search by email, name, order #..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 280, marginBottom: 0 }} />
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Date</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(o => (
            <>
              <tr key={o.id} style={{ background: expanded === o.id ? '#fffbe6' : 'white' }}>
                <td><strong>#{o.id}</strong></td>
                <td>
                  <div>{o.shipping_name || o.user_email}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{o.user_email}</div>
                </td>
                <td><strong>${o.total}</strong></td>
                <td style={{ fontSize: 13 }}>{o.payment_method}</td>
                <td>
                  <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                    style={{ background: STATUS_COLOR[o.status] || '#888', color: '#fff', border: 'none', borderRadius: 12, padding: '3px 10px', fontSize: 12, cursor: 'pointer', marginBottom: 0, width: 'auto' }}>
                    {STATUSES.map(s => <option key={s} value={s} style={{ background: '#fff', color: '#111' }}>{s}</option>)}
                  </select>
                </td>
                <td style={{ fontSize: 12, color: '#666' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                <td>
                  <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }}
                    onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                    {expanded === o.id ? 'Hide' : 'Details'}
                  </button>
                </td>
              </tr>
              {expanded === o.id && (
                <tr key={`detail-${o.id}`}>
                  <td colSpan={7} style={{ background: '#f9f9f9', padding: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <strong>📍 Shipping Address</strong>
                        <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.8 }}>
                          <div>{o.shipping_name}</div>
                          <div>{o.shipping_address}</div>
                          <div>{o.shipping_city}{o.shipping_postal ? `, ${o.shipping_postal}` : ''}</div>
                          <div>{o.shipping_country}</div>
                          {o.shipping_phone && <div>📞 {o.shipping_phone}</div>}
                        </div>
                      </div>
                      <div>
                        <strong>📝 Order Notes</strong>
                        <div style={{ marginTop: 8, fontSize: 14, color: o.notes ? '#333' : '#aaa' }}>
                          {o.notes || 'No notes'}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>

      {filtered.length === 0 && <p style={{ color: '#888', marginTop: 20 }}>No orders found.</p>}
    </div>
  );
}
