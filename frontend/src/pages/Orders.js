import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const STATUS_COLOR = { pending: '#e67e22', paid: '#27ae60', shipped: '#2980b9', delivered: '#27ae60', cancelled: '#c0392b' };

export default function Orders() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.get('/api/orders/my').then(r => setOrders(r.data));
  }, [user, navigate]);

  if (orders.length === 0) return (
    <div className="page" style={{ textAlign: 'center', paddingTop: 60 }}>
      <div style={{ fontSize: 64 }}>📦</div>
      <p style={{ fontSize: 18, margin: '16px 0' }}>No orders yet</p>
      <button className="btn btn-primary" onClick={() => navigate('/')}>Start Shopping</button>
    </div>
  );

  return (
    <div className="page">
      <h2 style={{ marginBottom: 20 }}>{t('myOrders')}</h2>
      {orders.map(o => (
        <div key={o.id} className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <strong>Order #{o.id}</strong>
              <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{new Date(o.created_at).toLocaleDateString()}</div>
              {o.shipping_name && <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>📍 {o.shipping_name}, {o.shipping_city}, {o.shipping_country}</div>}
              {o.payment_method && <div style={{ fontSize: 13, color: '#555' }}>💳 {o.payment_method}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', fontSize: 18 }}>${o.total}</div>
              <span style={{ background: STATUS_COLOR[o.status] || '#888', color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>
                {o.status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
