import '../i18n';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { ThemeProvider } from '../context/ThemeContext';
import { ButtonLabelsProvider } from '../context/ButtonLabelsContext';
import Navbar from './Navbar';
import Footer from './Footer';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import Orders from '../pages/Orders';
import AboutUs from '../pages/AboutUs';
import FAQ from '../pages/FAQ';
import ContactUs from '../pages/ContactUs';
import ProductDetail from '../pages/ProductDetail';
import Products from '../pages/Products';
import AdminLayout from '../pages/admin/AdminLayout';
import Dashboard from '../pages/admin/Dashboard';
import ManageProducts from '../pages/admin/ManageProducts';
import ManageUsers from '../pages/admin/ManageUsers';
import ManageOrders from '../pages/admin/ManageOrders';
import ThemeSettings from '../pages/admin/ThemeSettings';
import LanguageSettings from '../pages/admin/LanguageSettings';
import ShippingSettings from '../pages/admin/ShippingSettings';
import PaymentSettings from '../pages/admin/PaymentSettings';
import ContentSettings from '../pages/admin/ContentSettings';
import MessagingSettings from '../pages/admin/MessagingSettings';
import ManageBlog from '../pages/admin/ManageBlog';
import Gallery from '../pages/admin/Gallery';
import Backup from '../pages/admin/Backup';
import Profile from '../pages/Profile';
import Blog from '../pages/Blog';
import NotFound from '../pages/NotFound';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';

const ROUTE_PAGE = {
  '/': 'home', '/products': 'products',
  '/faq': 'faq', '/about': 'about',
  '/contact': 'contact', '/orders': 'orders', '/profile': 'profile',
};

function PageTitleSetter({ pageTitles }) {
  const location = useLocation();
  const { i18n } = useTranslation();
  const lang = i18n.language?.split('-')[0];

  useEffect(() => {
    const pageKey = ROUTE_PAGE[location.pathname] || 'home';
    const siteTitle = pageTitles?.title?.[lang] || 'Nutty Milk';
    const siteIcon = pageTitles?._icons?.title || '';
    const pageTitle = pageTitles?.[pageKey]?.[lang];
    const pageIcon = pageTitles?._icons?.[pageKey] || '';
    document.title = pageTitle
      ? `${pageIcon} ${pageTitle} — ${siteIcon} ${siteTitle}`.trim()
      : `${siteIcon} ${siteTitle}`.trim();
  }, [location.pathname, lang, pageTitles]);

  return null;
}

export default function App() {
  const [pageTitles, setPageTitles] = useState(null);
  const [dir, setDir] = useState(() => localStorage.getItem('dir') || 'rtl'); 

  // Expose setDir globally so Navbar can call it                      
  useEffect(() => { window.__setAppDir = setDir; }, []); 

  useEffect(() => {
    api.get('/api/settings').then(r => {
      try { setPageTitles(JSON.parse(r.data.page_titles || '{}')); } catch {}
      if (r.data.logo_url) {
        const base = process.env.REACT_APP_API_URL || '';
        const href = r.data.logo_url.startsWith('/uploads') ? `${base}${r.data.logo_url}` : r.data.logo_url;
        document.querySelector("link[rel='icon']")?.setAttribute('href', href);
      }
    }).catch(() => {});
  }, []);

  return (
    <ThemeProvider>
      <ButtonLabelsProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <PageTitleSetter pageTitles={pageTitles} />
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="*" element={<NotFound />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<ManageProducts />} />
                <Route path="orders" element={<ManageOrders />} />
                <Route path="users" element={<ManageUsers />} />
                <Route path="theme" element={<ThemeSettings />} />
                <Route path="languages" element={<LanguageSettings />} />
                <Route path="shipping" element={<ShippingSettings />} />
                <Route path="payment" element={<PaymentSettings />} />
                <Route path="content" element={<ContentSettings />} />
                <Route path="messaging" element={<MessagingSettings />} />
                <Route path="blog" element={<ManageBlog />} />
                <Route path="gallery" element={<Gallery />} />
                <Route path="backup" element={<Backup />} />
              </Route>
            </Routes>
            <Footer />
            </div>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
      </ButtonLabelsProvider>
    </ThemeProvider>
  );
}
