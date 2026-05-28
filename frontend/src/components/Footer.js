import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { FaAndroid, FaApple } from 'react-icons/fa';
import api from '../api';

export default function Footer() {
  const { primaryColor } = useTheme();
  const [androidUrl, setAndroidUrl] = useState('');
  const [iosUrl, setIosUrl] = useState('');
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    api.get('/api/settings').then(r => {
      setAndroidUrl(r.data.android_app_url || '');
      setIosUrl(r.data.ios_app_url || '');
      try { setBadges(JSON.parse(r.data.trust_badges || '[]').filter(b => b.active)); } catch {}
    }).catch(() => {});
  }, []);

  return (
    <footer style={{ background: '#232f3e', color: '#ccc', textAlign: 'center', padding: '24px 16px', marginTop: 40 }}>
<div style={{display:'flex', justifyContent:'space-evenly'}}>
      {/* Trust badges */}
      {badges.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
          {badges.map((b, i) => {
            const inner = b.img
              ? <img src={b.img} alt={b.name} style={{ width: b.width || 80, height: b.height || 40, objectFit: 'contain' }} onError={e => e.target.style.display='none'} />
              : <span style={{ fontSize: 13, color: '#ccc', border: '1px solid #555', borderRadius: 6, padding: '4px 10px' }}>🏅 {b.name}</span>;
            return b.url
              ? <a key={i} href={b.url} target="_blank" rel="noopener noreferrer" title={b.name}>{inner}</a>
              : <span key={i} title={b.name}>{inner}</span>;
          })}
        </div>
      )}

      {/* App download buttons */}
      {(androidUrl || iosUrl) && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {androidUrl && (
            <a href={androidUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#111', color: '#fff', padding: '8px 18px', borderRadius: 8, textDecoration: 'none', fontSize: 14 }}>
              <span style={{ fontSize: 22 }}><FaAndroid style={{ color: '#3DDC84' }} /></span>
              <span>Get it on<br /><strong>Google Play</strong></span>
            </a>
          )}
          {iosUrl && (
            <a href={iosUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#111', color: '#fff', padding: '8px 18px', borderRadius: 8, textDecoration: 'none', fontSize: 14 }}>
              <span style={{ fontSize: 22 }}><FaApple style={{ color: '#3DDC84' }} /></span>
              <span>Download on the<br /><strong>App Store</strong></span>
            </a>
          )}
        </div>
      )}
</div>
      <div style={{ fontSize: 13 }}>© {new Date().getFullYear()} Nutty Milk. All rights reserved.</div>
    </footer>
  );
}
