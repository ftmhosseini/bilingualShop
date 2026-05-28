import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { FiShoppingCart } from 'react-icons/fi';
import { useEffect, useRef, useState } from 'react';
import api from '../api';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { items } = useCart();
  const { primaryColor, setDir } = useTheme();
  const [isRTL, setIsRTL] = useState(false);
  // Keep isRTL in sync with the document direction
  useEffect(() => {
    const obs = new MutationObserver(() => setIsRTL(document.documentElement.dir === 'rtl'));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] });
    setIsRTL(document.documentElement.dir === 'rtl');
    return () => obs.disconnect();
  }, []);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [languages, setLanguages] = useState([]);
  const [langOpen, setLangOpen] = useState(false);
  const [navLinks, setNavLinks] = useState([]);

  // Apply saved language/dir immediately on mount before any API call
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('selectedCurrency'));
      if (saved?.language_code) {
        i18n.changeLanguage(saved.language_code);
        setDir(saved.rtl ? 'rtl' : 'ltr');
        document.documentElement.lang = saved.language_code;
      }
    } catch { }
  }, []);
  const [showLocation, setShowLocation] = useState(true);
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [logoUrl, setLogoUrl] = useState('/logo192.png');
  const base = process.env.REACT_APP_API_URL || '';

  const [appName, setAppName] = useState('');
  const [siteIcon, setSiteIcon] = useState('');
  const [catTree, setCatTree] = useState([]);
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (q) navigate(`/products?search=${encodeURIComponent(q)}`);
  };

  useEffect(() => {
    api.get('/api/languages').then(r => {
      if (r.data.length) setLanguages(r.data);
    }).catch(() => { });
    api.get('/api/categories').then(r => setCatTree(r.data)).catch(() => { });
    api.get('/api/settings').then(r => {
      setShowLocation(String(r.data.show_location) === '1');
      if (r.data.logo_url) setLogoUrl(r.data.logo_url);
      try {
        const titles = JSON.parse(r.data.page_titles || '{}');
        setAppName(titles.title || {});
        setSiteIcon(titles._icons?.title || '');
      } catch { }
    }).catch(() => { });
    api.get('/api/currencies').then(r => {
      const active = r.data.filter(c => c.active);
      setCurrencies(active);
      if (active.length) {
        const saved = (() => { try { return JSON.parse(localStorage.getItem('selectedCurrency')); } catch { return null; } })();
        const initial = saved && active.find(c => c.currency_code === saved.currency_code) ? saved : active[0];
        setSelectedCurrency(initial);
        if (initial?.language_code) {
          i18n.changeLanguage(initial.language_code);
          api.get('/api/languages').then(r => {
            const langObj = r.data.find(l => l.code === initial.language_code);
            setDir(langObj?.rtl ? 'rtl' : 'ltr')
            document.documentElement.lang = initial.language_code;
            setLanguages(r.data);
          });
        }
      }
    }).catch(() => { });
  }, []);

  const lang = i18n.language?.split('-')[0] || (() => {
    try { return JSON.parse(localStorage.getItem('selectedCurrency'))?.language_code || 'en'; } catch { return 'en'; }
  })();

  useEffect(() => {
    const code = selectedCurrency?.language_code || lang;
    api.get(`/api/navlinks/${code}`).then(r => {
      if (r.data.length > 0) setNavLinks(r.data);
      else api.get('/api/navlinks/en').then(r2 => setNavLinks(r2.data)).catch(() => { });
    }).catch(() => { });
  }, [lang, selectedCurrency]);

  // If current language was removed, switch to first available
  useEffect(() => {
    if (languages.length > 0 && !languages.find(l => i18n.language?.startsWith(l.code))) {
      changeLanguage(languages[0].code);
    }
  }, [languages]);

  const changeLanguage = (code, rtl) => {
    i18n.changeLanguage(code);
    setDir(rtl ? 'rtl' : 'ltr');
    document.documentElement.lang = code;
  };

  // Re-apply dir/lang once currencies are loaded (covers page refresh)
  useEffect(() => {
    if (!selectedCurrency) return;
    setDir(selectedCurrency.rtl ? 'rtl' : 'ltr');
    document.documentElement.lang = selectedCurrency.language_code;
  }, [selectedCurrency]);

  // Close category dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function MegaMenu({ tree, navigate, close, lang, label }) {
    // path = array of active node ids, one per level
    const [path, setPath] = useState([]);

    const localName = (node) => node.names?.[lang] || node.names?.en || node.name;

    const setLevel = (depth, nodeId) => {
      setPath(p => [...p.slice(0, depth), nodeId]);
    };

    // Build columns: level 0 = tree, level N = children of path[N-1]
    const columns = [tree];
    for (let i = 0; i < path.length; i++) {
      const parent = columns[i].find(n => n.id === path[i]);
      if (parent?.children?.length) columns.push(parent.children);
      else break;
    }

    const colStyle = {
      minWidth: 180,
      borderRight: isRTL ? 'none' : `1px solid rgba(255,255,255,0.15)`,
      borderLeft: isRTL ? `1px solid rgba(255,255,255,0.15)` : 'none',
      padding: '6px 0', background: primaryColor,
    };
    const itemStyle = (active) => ({
      padding: '9px 18px', cursor: 'pointer', fontSize: 13, color: '#fff',
      background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
      whiteSpace: 'nowrap',
    });

    // const chevron = isRTL ? '‹' : '›';
    const chevron = '›';

    return (
      <div style={{
        position: 'absolute', top: '100%', ...(isRTL ? { right: 0 } : { left: 0 }),
        background: primaryColor, zIndex: 1000,
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'row', width: 'max-content',
        // display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', width: 'max-content',
      }}>
        <div style={colStyle}>
          <div onMouseEnter={() => setPath([])}
            onClick={() => { navigate('/products'); close(); }}
            style={{ ...itemStyle(path.length === 0), fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
            {label}
          </div>
          {tree.map(node => (
            <div key={node.id}
              onMouseEnter={() => setLevel(0, node.id)}
              onClick={() => { navigate(`/products?cat=${node.id}`); close(); }}
              style={itemStyle(path[0] === node.id)}>
              {localName(node)}
              {node.children?.length > 0 && <span style={{ opacity: 0.5, fontSize: 11 }}>{chevron}</span>}
            </div>
          ))}
        </div>

        {columns.slice(1).map((col, ci) => (
          <div key={ci} style={colStyle}>
            {col.map(node => (
              <div key={node.id}
                onMouseEnter={() => setLevel(ci + 1, node.id)}
                onClick={() => { navigate(`/products?cat=${node.id}`); close(); }}
                style={itemStyle(path[ci + 1] === node.id)}>
                {localName(node)}
                {node.children?.length > 0 && <span style={{ opacity: 0.5, fontSize: 11 }}>{chevron}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <nav style={{ background: primaryColor, color: '#fff' }}>
      {/* Main bar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', gap: 20 }}>

        {/* Left: Logo + Title */}
        <div style={{ flexShrink: 0 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', textDecoration: 'none' }}>
            <img src={logoUrl.startsWith('/uploads') ? `${base}${logoUrl}` : logoUrl} alt="logo" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
            <span style={{ fontWeight: 'bold', fontSize: 18, whiteSpace: 'nowrap' }}>
              {appName[lang] || t('appName')}
            </span>
          </Link>
        </div>

        {/* Center: Search — fills all available space */}
        <div style={{ flex: 1, display: 'flex', minWidth: 0, height: '50px', marginTop: '10px' }}>
          <input
            placeholder={t('search')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: 'none', fontSize: 14, minWidth: 0 }}
          />
          <button onClick={handleSearch} style={{ background: 'none', border: 'none', padding: '0 12px', borderRadius: '4px', cursor: 'pointer', fontSize: 28, flexShrink: 0, marginBottom: '12px' }}>
            🔍
          </button>
        </div>

        {/* Right: Language + Auth + Cart */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {/* Country / Currency picker */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setLangOpen(o => !o)}
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: 20 }}>{selectedCurrency?.flag || '🌐'}</span>
              <span>{selectedCurrency ? `${selectedCurrency.country} (${selectedCurrency.currency_code})` : 'Select Country'}</span>
              <span style={{ fontSize: 11, opacity: 0.8 }}>▾</span>
            </button>
            {langOpen && (
              <div style={{ position: 'absolute', top: '110%', ...(isRTL ? { textAlign: 'right'  , marginRight: 'auto', left: 0 } : { textAlign: 'left', marginLeft: 'auto' , right: 0  }), background: '#fff', border: '1px solid #ddd', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 999, minWidth: 220, overflow: 'hidden' }}>
                {currencies.map(c => (
                  <button key={c.currency_code} onClick={() => {
                    setSelectedCurrency(c);
                    localStorage.setItem('selectedCurrency', JSON.stringify(c));
                    changeLanguage(c.language_code, c.rtl);
                    setLangOpen(false);
                  }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', border: 'none', background: selectedCurrency?.currency_code === c.currency_code ? '#fffbe6' : '#fff', cursor: 'pointer', fontSize: 14 }}>
                    <span style={{ fontSize: 22 }}>{c.flag}</span>
                    <span style={{ color: '#111' }}>{c.country}</span>
                    <span style={{  fontSize: 12, color: '#888' }}>{c.symbol} {c.currency_code}</span>
                    {selectedCurrency?.currency_code === c.currency_code && <span style={{ color: '#febd69' }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom nav — dynamic per language */}
      <div style={{ background: '#232f3e', padding: '6px 16px', display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        {navLinks.filter(l => {
          const authOnly = ['/orders', '/profile'];
          return authOnly.includes(l.url) ? !!user : true;
        }).map(l => (
          l.url === '/products'
            ? <div key={l._id || l.id || l.url} ref={catRef} style={{ position: 'relative' }}>
              <button onClick={() => setCatOpen(o => !o)}
                style={{ background: catOpen || pathname === '/products' ? 'rgba(255,255,255,0.15)' : 'transparent', border: catOpen || pathname === '/products' ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent', color: '#fff', fontSize: 13, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, borderRadius: 4 }}>
                {l.icon}{l.label} <span style={{ fontSize: 10, opacity: 0.7 }}>{catOpen ? '▴' : '▾'}</span>
              </button>
              {catOpen && <MegaMenu tree={catTree} navigate={navigate} close={() => setCatOpen(false)} lang={lang} label={l.label} />}
            </div>
            : <Link key={l._id || l.id || l.url} to={l.url} style={{ color: '#fff', fontSize: 13, padding: '4px 10px', borderRadius: 4, whiteSpace: 'nowrap', background: pathname === l.url ? 'rgba(255,255,255,0.15)' : 'transparent', border: pathname === l.url ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent' }}>
              {l.icon}{l.label}
            </Link>
        ))}
        {/* {user && !navLinks.find(l => l.url === '/orders') && (
          <>
            <Link to="/orders" style={{ color: '#fff', fontSize: 13, padding: '4px 10px', borderRadius: 4, whiteSpace: 'nowrap', background: pathname === '/orders' ? 'rgba(255,255,255,0.15)' : 'transparent', border: pathname === '/orders' ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent' }}>{t('myOrders')}</Link>
            <Link to="/profile" style={{ color: '#fff', fontSize: 13, padding: '4px 10px', borderRadius: 4, whiteSpace: 'nowrap', background: pathname === '/profile' ? 'rgba(255,255,255,0.15)' : 'transparent', border: pathname === '/profile' ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent' }}>{t('myProfile')}</Link>
          </>)}

        {user && !navLinks.find(l => l.url === '/orders') && (
          <>
            <Link to="/orders" style={{ color: '#fff', fontSize: 13, padding: '4px 10px', borderRadius: 4, whiteSpace: 'nowrap', background: pathname === '/orders' ? 'rgba(255,255,255,0.15)' : 'transparent', border: pathname === '/orders' ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent' }}>{t('myOrders')}</Link>
            <Link to="/profile" style={{ color: '#fff', fontSize: 13, padding: '4px 10px', borderRadius: 4, whiteSpace: 'nowrap', background: pathname === '/profile' ? 'rgba(255,255,255,0.15)' : 'transparent', border: pathname === '/profile' ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent' }}>👤 Profile</Link>
          </>)} */}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          {user ? (
            <>
              {(user.role === 'admin' || user.role === 'cooperatore') && (
                <Link to="/admin" style={{ color: '#febd69', fontSize: 13, padding: '4px 10px', borderRadius: 4, whiteSpace: 'nowrap', background: pathname.startsWith('/admin') ? 'rgba(255,255,255,0.15)' : 'transparent', border: pathname.startsWith('/admin') ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent' }}>⚙ {t('admin')}</Link>
              )}
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: '#ccc', fontSize: 13, padding: '4px 10px', whiteSpace: 'nowrap' }}>{t('login')}</Link>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
              <Link to="/register" style={{ color: '#ccc', fontSize: 13, padding: '4px 10px', whiteSpace: 'nowrap' }}>{t('register')}</Link>
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link to="/cart" style={{ color: '#febd69', fontWeight: 'bold', fontSize: 13, padding: '4px 10px', whiteSpace: 'nowrap' }}>
            <FiShoppingCart size={20} />

            {items.length > 0 && <span style={{ background: '#f00', color: '#fff', borderRadius: '50%', padding: '1px 5px', fontSize: 11 }}>{items.length}</span>}
          </Link>
        {user && (
          <button onClick={() => { logout(); navigate('/'); }}
            title="Sign out"
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <span className="material-icons" style={{ fontSize: 20 }}>logout</span>
          </button>
        )}
        </div>
      </div>
    </nav>
  );
}
