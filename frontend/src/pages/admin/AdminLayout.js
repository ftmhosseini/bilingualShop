import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = ['fa', 'ar'].includes(i18n.language?.split('-')[0]);

  if (!user || (user.role !== 'admin' && user.role !== 'cooperatore')) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="admin-layout" dir={isRTL ? 'rtl' : 'ltr'}>
      <aside className="admin-sidebar">
        <div style={{ padding: '0 20px 20px', fontWeight: 'bold', fontSize: 16, borderBottom: '1px solid #444', marginBottom: 8 }}>
          {t('admin')}
        </div>
        <NavLink to="/admin" end>{t('dashboard')}</NavLink>
        <NavLink to="/admin/products">{t('manageProducts')}</NavLink>
        {user.role === 'admin' && <NavLink to="/admin/users">{t('manageUsers')}</NavLink>}
        <NavLink to="/admin/gallery">{t('Gallery')}</NavLink>
        <NavLink to="/admin/orders">{t('Orders')}</NavLink>
        {user.role === 'admin' && <NavLink to="/admin/theme">{t('themeSettings')}</NavLink>}
        {user.role === 'admin' && <NavLink to="/admin/content">Content</NavLink>}
        {user.role === 'admin' && <NavLink to="/admin/shipping">Shipping</NavLink>}
        {user.role === 'admin' && <NavLink to="/admin/payment">Payment</NavLink>}
        {user.role === 'admin' && <NavLink to="/admin/messaging">Messaging</NavLink>}
        {user.role === 'admin' && <NavLink to="/admin/blog">Blog</NavLink>}
        {user.role === 'admin' && <NavLink to="/admin/backup">🗄️ Backup</NavLink>}
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
