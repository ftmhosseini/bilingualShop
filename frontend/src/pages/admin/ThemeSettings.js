import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';

const NAV_PRESETS = [
  { label: 'Amazon Dark', value: '#131921' },
  { label: 'Navy', value: '#1a237e' },
  { label: 'Forest', value: '#1b5e20' },
  { label: 'Burgundy', value: '#4a0000' },
  { label: 'Slate', value: '#37474f' },
];

const BTN_PRESETS = [
  { label: 'Amber', value: '#febd69' },
  { label: 'Orange', value: '#e47911' },
  { label: 'Green', value: '#2ecc71' },
  { label: 'Blue', value: '#2980b9' },
  { label: 'Red', value: '#e74c3c' },
  { label: 'Purple', value: '#8e44ad' },
];

export default function ThemeSettings() {
  const { t } = useTranslation();
  const { primaryColor, setPrimaryColor, accentColor, setAccentColor } = useTheme();

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>{t('themeSettings')}</h2>

      {/* Navbar color */}
      <div className="card" style={{ maxWidth: 420, marginBottom: 20 }}>
        <h3 style={{ marginBottom: 16 }}>🎨 Navbar Color</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
            style={{ width: 60, height: 40, padding: 2, cursor: 'pointer' }} />
          <span style={{ fontFamily: 'monospace' }}>{primaryColor}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {NAV_PRESETS.map(p => (
            <button key={p.value} onClick={() => setPrimaryColor(p.value)}
              style={{ background: p.value, color: '#fff', border: primaryColor === p.value ? '3px solid #febd69' : '2px solid transparent',
                borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>
              {p.label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: 12, background: primaryColor, color: '#fff', borderRadius: 8, fontSize: 14 }}>
          Preview navbar
        </div>
      </div>

      {/* Button / accent color */}
      <div className="card" style={{ maxWidth: 420 }}>
        <h3 style={{ marginBottom: 16 }}>🖱 Button Color</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)}
            style={{ width: 60, height: 40, padding: 2, cursor: 'pointer' }} />
          <span style={{ fontFamily: 'monospace' }}>{accentColor}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {BTN_PRESETS.map(p => (
            <button key={p.value} onClick={() => setAccentColor(p.value)}
              style={{ background: p.value, color: '#fff', border: accentColor === p.value ? '3px solid #333' : '2px solid transparent',
                borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>
              {p.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={{ fontSize: 14 }}>Add to Cart</button>
          <button className="btn btn-buy" style={{ fontSize: 14 }}>Buy Now</button>
          <button className="btn btn-primary" style={{ fontSize: 14 }}>Shop Now</button>
        </div>
      </div>
    </div>
  );
}
