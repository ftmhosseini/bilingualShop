import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { FiLogOut, FiShoppingCart } from 'react-icons/fi';
import { useEffect, useRef, useState } from 'react';
import api from '../api';

// ─── Currency + Language Manager Modal (admin only) ──────────────────────────

const emptyCur = { language_code: '', country: '', flag: '', currency_code: '', symbol: '', checkout_symbol: '', fraction_digits: 2, active: true, differ: 1 };

// All country flags with name + emoji
// flag, country name, ISO currency code, symbol
const ALL_FLAGS = [
  { flag: '🇦🇫', country: 'Afghanistan', currency_code: 'AFN', symbol: '؋' },
  { flag: '🇦🇱', country: 'Albania', currency_code: 'ALL', symbol: 'L' },
  { flag: '🇩🇿', country: 'Algeria', currency_code: 'DZD', symbol: 'دج' },
  { flag: '🇦🇩', country: 'Andorra', currency_code: 'EUR', symbol: '€' },
  { flag: '🇦🇴', country: 'Angola', currency_code: 'AOA', symbol: 'Kz' },
  { flag: '🇦🇬', country: 'Antigua & Barbuda', currency_code: 'XCD', symbol: '$' },
  { flag: '🇦🇷', country: 'Argentina', currency_code: 'ARS', symbol: '$' },
  { flag: '🇦🇲', country: 'Armenia', currency_code: 'AMD', symbol: '֏' },
  { flag: '🇦🇺', country: 'Australia', currency_code: 'AUD', symbol: 'A$' },
  { flag: '🇦🇹', country: 'Austria', currency_code: 'EUR', symbol: '€' },
  { flag: '🇦🇿', country: 'Azerbaijan', currency_code: 'AZN', symbol: '₼' },
  { flag: '🇧🇸', country: 'Bahamas', currency_code: 'BSD', symbol: '$' },
  { flag: '🇧🇭', country: 'Bahrain', currency_code: 'BHD', symbol: 'BD' },
  { flag: '🇧🇩', country: 'Bangladesh', currency_code: 'BDT', symbol: '৳' },
  { flag: '🇧🇧', country: 'Barbados', currency_code: 'BBD', symbol: '$' },
  { flag: '🇧🇾', country: 'Belarus', currency_code: 'BYN', symbol: 'Br' },
  { flag: '🇧🇪', country: 'Belgium', currency_code: 'EUR', symbol: '€' },
  { flag: '🇧🇿', country: 'Belize', currency_code: 'BZD', symbol: 'BZ$' },
  { flag: '🇧🇯', country: 'Benin', currency_code: 'XOF', symbol: 'Fr' },
  { flag: '🇧🇹', country: 'Bhutan', currency_code: 'BTN', symbol: 'Nu' },
  { flag: '🇧🇴', country: 'Bolivia', currency_code: 'BOB', symbol: 'Bs.' },
  { flag: '🇧🇦', country: 'Bosnia & Herzegovina', currency_code: 'BAM', symbol: 'KM' },
  { flag: '🇧🇼', country: 'Botswana', currency_code: 'BWP', symbol: 'P' },
  { flag: '🇧🇷', country: 'Brazil', currency_code: 'BRL', symbol: 'R$' },
  { flag: '🇧🇳', country: 'Brunei', currency_code: 'BND', symbol: '$' },
  { flag: '🇧🇬', country: 'Bulgaria', currency_code: 'BGN', symbol: 'лв' },
  { flag: '🇧🇫', country: 'Burkina Faso', currency_code: 'XOF', symbol: 'Fr' },
  { flag: '🇧🇮', country: 'Burundi', currency_code: 'BIF', symbol: 'Fr' },
  { flag: '🇨🇻', country: 'Cabo Verde', currency_code: 'CVE', symbol: '$' },
  { flag: '🇰🇭', country: 'Cambodia', currency_code: 'KHR', symbol: '៛' },
  { flag: '🇨🇲', country: 'Cameroon', currency_code: 'XAF', symbol: 'Fr' },
  { flag: '🇨🇦', country: 'Canada', currency_code: 'CAD', symbol: 'C$' },
  { flag: '🇨🇫', country: 'Central African Republic', currency_code: 'XAF', symbol: 'Fr' },
  { flag: '🇹🇩', country: 'Chad', currency_code: 'XAF', symbol: 'Fr' },
  { flag: '🇨🇱', country: 'Chile', currency_code: 'CLP', symbol: '$' },
  { flag: '🇨🇳', country: 'China', currency_code: 'CNY', symbol: '¥' },
  { flag: '🇨🇴', country: 'Colombia', currency_code: 'COP', symbol: '$' },
  { flag: '🇰🇲', country: 'Comoros', currency_code: 'KMF', symbol: 'Fr' },
  { flag: '🇨🇩', country: 'Congo (DRC)', currency_code: 'CDF', symbol: 'Fr' },
  { flag: '🇨🇬', country: 'Congo (Republic)', currency_code: 'XAF', symbol: 'Fr' },
  { flag: '🇨🇷', country: 'Costa Rica', currency_code: 'CRC', symbol: '₡' },
  { flag: '🇭🇷', country: 'Croatia', currency_code: 'EUR', symbol: '€' },
  { flag: '🇨🇺', country: 'Cuba', currency_code: 'CUP', symbol: '$' },
  { flag: '🇨🇾', country: 'Cyprus', currency_code: 'EUR', symbol: '€' },
  { flag: '🇨🇿', country: 'Czech Republic', currency_code: 'CZK', symbol: 'Kč' },
  { flag: '🇩🇰', country: 'Denmark', currency_code: 'DKK', symbol: 'kr' },
  { flag: '🇩🇯', country: 'Djibouti', currency_code: 'DJF', symbol: 'Fr' },
  { flag: '🇩🇲', country: 'Dominica', currency_code: 'XCD', symbol: '$' },
  { flag: '🇩🇴', country: 'Dominican Republic', currency_code: 'DOP', symbol: 'RD$' },
  { flag: '🇪🇨', country: 'Ecuador', currency_code: 'USD', symbol: '$' },
  { flag: '🇪🇬', country: 'Egypt', currency_code: 'EGP', symbol: '£' },
  { flag: '🇸🇻', country: 'El Salvador', currency_code: 'USD', symbol: '$' },
  { flag: '🇬🇶', country: 'Equatorial Guinea', currency_code: 'XAF', symbol: 'Fr' },
  { flag: '🇪🇷', country: 'Eritrea', currency_code: 'ERN', symbol: 'Nfk' },
  { flag: '🇪🇪', country: 'Estonia', currency_code: 'EUR', symbol: '€' },
  { flag: '🇸🇿', country: 'Eswatini', currency_code: 'SZL', symbol: 'L' },
  { flag: '🇪🇹', country: 'Ethiopia', currency_code: 'ETB', symbol: 'Br' },
  { flag: '🇫🇯', country: 'Fiji', currency_code: 'FJD', symbol: '$' },
  { flag: '🇫🇮', country: 'Finland', currency_code: 'EUR', symbol: '€' },
  { flag: '🇫🇷', country: 'France', currency_code: 'EUR', symbol: '€' },
  { flag: '🇬🇦', country: 'Gabon', currency_code: 'XAF', symbol: 'Fr' },
  { flag: '🇬🇲', country: 'Gambia', currency_code: 'GMD', symbol: 'D' },
  { flag: '🇬🇪', country: 'Georgia', currency_code: 'GEL', symbol: '₾' },
  { flag: '🇩🇪', country: 'Germany', currency_code: 'EUR', symbol: '€' },
  { flag: '🇬🇭', country: 'Ghana', currency_code: 'GHS', symbol: '₵' },
  { flag: '🇬🇷', country: 'Greece', currency_code: 'EUR', symbol: '€' },
  { flag: '🇬🇩', country: 'Grenada', currency_code: 'XCD', symbol: '$' },
  { flag: '🇬🇹', country: 'Guatemala', currency_code: 'GTQ', symbol: 'Q' },
  { flag: '🇬🇳', country: 'Guinea', currency_code: 'GNF', symbol: 'Fr' },
  { flag: '🇬🇼', country: 'Guinea-Bissau', currency_code: 'XOF', symbol: 'Fr' },
  { flag: '🇬🇾', country: 'Guyana', currency_code: 'GYD', symbol: '$' },
  { flag: '🇭🇹', country: 'Haiti', currency_code: 'HTG', symbol: 'G' },
  { flag: '🇭🇳', country: 'Honduras', currency_code: 'HNL', symbol: 'L' },
  { flag: '🇭🇺', country: 'Hungary', currency_code: 'HUF', symbol: 'Ft' },
  { flag: '🇮🇸', country: 'Iceland', currency_code: 'ISK', symbol: 'kr' },
  { flag: '🇮🇳', country: 'India', currency_code: 'INR', symbol: '₹' },
  { flag: '🇮🇩', country: 'Indonesia', currency_code: 'IDR', symbol: 'Rp' },
  { flag: '🇮🇷', country: 'Iran', currency_code: 'IRR', symbol: '﷼' },
  { flag: '🇮🇶', country: 'Iraq', currency_code: 'IQD', symbol: 'ع.د' },
  { flag: '🇮🇪', country: 'Ireland', currency_code: 'EUR', symbol: '€' },
  { flag: '🇮🇱', country: 'Israel', currency_code: 'ILS', symbol: '₪' },
  { flag: '🇮🇹', country: 'Italy', currency_code: 'EUR', symbol: '€' },
  { flag: '🇯🇲', country: 'Jamaica', currency_code: 'JMD', symbol: '$' },
  { flag: '🇯🇵', country: 'Japan', currency_code: 'JPY', symbol: '¥' },
  { flag: '🇯🇴', country: 'Jordan', currency_code: 'JOD', symbol: 'JD' },
  { flag: '🇰🇿', country: 'Kazakhstan', currency_code: 'KZT', symbol: '₸' },
  { flag: '🇰🇪', country: 'Kenya', currency_code: 'KES', symbol: 'Ksh' },
  { flag: '🇰🇮', country: 'Kiribati', currency_code: 'AUD', symbol: 'A$' },
  { flag: '🇰🇼', country: 'Kuwait', currency_code: 'KWD', symbol: 'KD' },
  { flag: '🇰🇬', country: 'Kyrgyzstan', currency_code: 'KGS', symbol: 'с' },
  { flag: '🇱🇦', country: 'Laos', currency_code: 'LAK', symbol: '₭' },
  { flag: '🇱🇻', country: 'Latvia', currency_code: 'EUR', symbol: '€' },
  { flag: '🇱🇧', country: 'Lebanon', currency_code: 'LBP', symbol: 'ل.ل' },
  { flag: '🇱🇸', country: 'Lesotho', currency_code: 'LSL', symbol: 'L' },
  { flag: '🇱🇷', country: 'Liberia', currency_code: 'LRD', symbol: '$' },
  { flag: '🇱🇾', country: 'Libya', currency_code: 'LYD', symbol: 'LD' },
  { flag: '🇱🇮', country: 'Liechtenstein', currency_code: 'CHF', symbol: 'Fr' },
  { flag: '🇱🇹', country: 'Lithuania', currency_code: 'EUR', symbol: '€' },
  { flag: '🇱🇺', country: 'Luxembourg', currency_code: 'EUR', symbol: '€' },
  { flag: '🇲🇬', country: 'Madagascar', currency_code: 'MGA', symbol: 'Ar' },
  { flag: '🇲🇼', country: 'Malawi', currency_code: 'MWK', symbol: 'MK' },
  { flag: '🇲🇾', country: 'Malaysia', currency_code: 'MYR', symbol: 'RM' },
  { flag: '🇲🇻', country: 'Maldives', currency_code: 'MVR', symbol: 'Rf' },
  { flag: '🇲🇱', country: 'Mali', currency_code: 'XOF', symbol: 'Fr' },
  { flag: '🇲🇹', country: 'Malta', currency_code: 'EUR', symbol: '€' },
  { flag: '🇲🇭', country: 'Marshall Islands', currency_code: 'USD', symbol: '$' },
  { flag: '🇲🇷', country: 'Mauritania', currency_code: 'MRU', symbol: 'UM' },
  { flag: '🇲🇺', country: 'Mauritius', currency_code: 'MUR', symbol: '₨' },
  { flag: '🇲🇽', country: 'Mexico', currency_code: 'MXN', symbol: '$' },
  { flag: '🇫🇲', country: 'Micronesia', currency_code: 'USD', symbol: '$' },
  { flag: '🇲🇩', country: 'Moldova', currency_code: 'MDL', symbol: 'L' },
  { flag: '🇲🇨', country: 'Monaco', currency_code: 'EUR', symbol: '€' },
  { flag: '🇲🇳', country: 'Mongolia', currency_code: 'MNT', symbol: '₮' },
  { flag: '🇲🇪', country: 'Montenegro', currency_code: 'EUR', symbol: '€' },
  { flag: '🇲🇦', country: 'Morocco', currency_code: 'MAD', symbol: 'MAD' },
  { flag: '🇲🇿', country: 'Mozambique', currency_code: 'MZN', symbol: 'MT' },
  { flag: '🇲🇲', country: 'Myanmar', currency_code: 'MMK', symbol: 'K' },
  { flag: '🇳🇦', country: 'Namibia', currency_code: 'NAD', symbol: '$' },
  { flag: '🇳🇷', country: 'Nauru', currency_code: 'AUD', symbol: 'A$' },
  { flag: '🇳🇵', country: 'Nepal', currency_code: 'NPR', symbol: '₨' },
  { flag: '🇳🇱', country: 'Netherlands', currency_code: 'EUR', symbol: '€' },
  { flag: '🇳🇿', country: 'New Zealand', currency_code: 'NZD', symbol: 'NZ$' },
  { flag: '🇳🇮', country: 'Nicaragua', currency_code: 'NIO', symbol: 'C$' },
  { flag: '🇳🇪', country: 'Niger', currency_code: 'XOF', symbol: 'Fr' },
  { flag: '🇳🇬', country: 'Nigeria', currency_code: 'NGN', symbol: '₦' },
  { flag: '🇰🇵', country: 'North Korea', currency_code: 'KPW', symbol: '₩' },
  { flag: '🇲🇰', country: 'North Macedonia', currency_code: 'MKD', symbol: 'ден' },
  { flag: '🇳🇴', country: 'Norway', currency_code: 'NOK', symbol: 'kr' },
  { flag: '🇴🇲', country: 'Oman', currency_code: 'OMR', symbol: '﷼' },
  { flag: '🇵🇰', country: 'Pakistan', currency_code: 'PKR', symbol: '₨' },
  { flag: '🇵🇼', country: 'Palau', currency_code: 'USD', symbol: '$' },
  { flag: '🇵🇦', country: 'Panama', currency_code: 'PAB', symbol: 'B/.' },
  { flag: '🇵🇬', country: 'Papua New Guinea', currency_code: 'PGK', symbol: 'K' },
  { flag: '🇵🇾', country: 'Paraguay', currency_code: 'PYG', symbol: '₲' },
  { flag: '🇵🇪', country: 'Peru', currency_code: 'PEN', symbol: 'S/.' },
  { flag: '🇵🇭', country: 'Philippines', currency_code: 'PHP', symbol: '₱' },
  { flag: '🇵🇱', country: 'Poland', currency_code: 'PLN', symbol: 'zł' },
  { flag: '🇵🇹', country: 'Portugal', currency_code: 'EUR', symbol: '€' },
  { flag: '🇶🇦', country: 'Qatar', currency_code: 'QAR', symbol: '﷼' },
  { flag: '🇷🇴', country: 'Romania', currency_code: 'RON', symbol: 'lei' },
  { flag: '🇷🇺', country: 'Russia', currency_code: 'RUB', symbol: '₽' },
  { flag: '🇷🇼', country: 'Rwanda', currency_code: 'RWF', symbol: 'Fr' },
  { flag: '🇰🇳', country: 'Saint Kitts & Nevis', currency_code: 'XCD', symbol: '$' },
  { flag: '🇱🇨', country: 'Saint Lucia', currency_code: 'XCD', symbol: '$' },
  { flag: '🇻🇨', country: 'Saint Vincent', currency_code: 'XCD', symbol: '$' },
  { flag: '🇼🇸', country: 'Samoa', currency_code: 'WST', symbol: 'T' },
  { flag: '🇸🇲', country: 'San Marino', currency_code: 'EUR', symbol: '€' },
  { flag: '🇸🇹', country: 'São Tomé & Príncipe', currency_code: 'STN', symbol: 'Db' },
  { flag: '🇸🇦', country: 'Saudi Arabia', currency_code: 'SAR', symbol: '﷼' },
  { flag: '🇸🇳', country: 'Senegal', currency_code: 'XOF', symbol: 'Fr' },
  { flag: '🇷🇸', country: 'Serbia', currency_code: 'RSD', symbol: 'din' },
  { flag: '🇸🇨', country: 'Seychelles', currency_code: 'SCR', symbol: '₨' },
  { flag: '🇸🇱', country: 'Sierra Leone', currency_code: 'SLL', symbol: 'Le' },
  { flag: '🇸🇬', country: 'Singapore', currency_code: 'SGD', symbol: 'S$' },
  { flag: '🇸🇰', country: 'Slovakia', currency_code: 'EUR', symbol: '€' },
  { flag: '🇸🇮', country: 'Slovenia', currency_code: 'EUR', symbol: '€' },
  { flag: '🇸🇧', country: 'Solomon Islands', currency_code: 'SBD', symbol: '$' },
  { flag: '🇸🇴', country: 'Somalia', currency_code: 'SOS', symbol: 'Sh' },
  { flag: '🇿🇦', country: 'South Africa', currency_code: 'ZAR', symbol: 'R' },
  { flag: '🇸🇸', country: 'South Sudan', currency_code: 'SSP', symbol: '£' },
  { flag: '🇪🇸', country: 'Spain', currency_code: 'EUR', symbol: '€' },
  { flag: '🇱🇰', country: 'Sri Lanka', currency_code: 'LKR', symbol: '₨' },
  { flag: '🇸🇩', country: 'Sudan', currency_code: 'SDG', symbol: '£' },
  { flag: '🇸🇷', country: 'Suriname', currency_code: 'SRD', symbol: '$' },
  { flag: '🇸🇪', country: 'Sweden', currency_code: 'SEK', symbol: 'kr' },
  { flag: '🇨🇭', country: 'Switzerland', currency_code: 'CHF', symbol: 'Fr' },
  { flag: '🇸🇾', country: 'Syria', currency_code: 'SYP', symbol: '£' },
  { flag: '🇹🇼', country: 'Taiwan', currency_code: 'TWD', symbol: 'NT$' },
  { flag: '🇹🇯', country: 'Tajikistan', currency_code: 'TJS', symbol: 'SM' },
  { flag: '🇹🇿', country: 'Tanzania', currency_code: 'TZS', symbol: 'Sh' },
  { flag: '🇹🇭', country: 'Thailand', currency_code: 'THB', symbol: '฿' },
  { flag: '🇹🇱', country: 'Timor-Leste', currency_code: 'USD', symbol: '$' },
  { flag: '🇹🇬', country: 'Togo', currency_code: 'XOF', symbol: 'Fr' },
  { flag: '🇹🇴', country: 'Tonga', currency_code: 'TOP', symbol: 'T$' },
  { flag: '🇹🇹', country: 'Trinidad & Tobago', currency_code: 'TTD', symbol: '$' },
  { flag: '🇹🇳', country: 'Tunisia', currency_code: 'TND', symbol: 'DT' },
  { flag: '🇹🇷', country: 'Turkey', currency_code: 'TRY', symbol: '₺' },
  { flag: '🇹🇲', country: 'Turkmenistan', currency_code: 'TMT', symbol: 'T' },
  { flag: '🇹🇻', country: 'Tuvalu', currency_code: 'AUD', symbol: 'A$' },
  { flag: '🇺🇬', country: 'Uganda', currency_code: 'UGX', symbol: 'Sh' },
  { flag: '🇺🇦', country: 'Ukraine', currency_code: 'UAH', symbol: '₴' },
  { flag: '🇦🇪', country: 'UAE', currency_code: 'AED', symbol: 'د.إ' },
  { flag: '🇬🇧', country: 'United Kingdom', currency_code: 'GBP', symbol: '£' },
  { flag: '🇺🇸', country: 'United States', currency_code: 'USD', symbol: '$' },
  { flag: '🇺🇾', country: 'Uruguay', currency_code: 'UYU', symbol: '$' },
  { flag: '🇺🇿', country: 'Uzbekistan', currency_code: 'UZS', symbol: 'лв' },
  { flag: '🇻🇺', country: 'Vanuatu', currency_code: 'VUV', symbol: 'Vt' },
  { flag: '🇻🇪', country: 'Venezuela', currency_code: 'VES', symbol: 'Bs.' },
  { flag: '🇻🇳', country: 'Vietnam', currency_code: 'VND', symbol: '₫' },
  { flag: '🇾🇪', country: 'Yemen', currency_code: 'YER', symbol: '﷼' },
  { flag: '🇿🇲', country: 'Zambia', currency_code: 'ZMW', symbol: 'ZK' },
  { flag: '🇿🇼', country: 'Zimbabwe', currency_code: 'ZWL', symbol: '$' },
];

function FlagPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = ALL_FLAGS.filter(f => f.country.toLowerCase().includes(search.toLowerCase()) || f.flag.includes(search));
  const selected = ALL_FLAGS.find(f => f.flag === value);

  return (
    <div ref={ref} style={{ position: 'relative', color:'black' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', background: '#fff', fontSize: 14 }}>
        <span style={{ fontSize: 20 }}>{value || '🌐'}</span>
        <span style={{ flex: 1, color: value ? '#111' : '#999' }}>{selected ? selected.country : 'Select flag…'}</span>
        <span style={{ fontSize: 11, color: '#aaa' }}>▾</span>
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ddd', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 1200, maxHeight: 260, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <input autoFocus placeholder="Search country…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ margin: 8, marginBottom: 4, padding: '6px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13 }} />
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.map(f => (
              <div key={f.flag} onClick={() => { onChange(f); setOpen(false); setSearch(''); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', cursor: 'pointer', background: value === f.flag ? '#fffbe6' : '', fontSize: 13 }}
                onMouseEnter={e => e.currentTarget.style.background = value === f.flag ? '#fffbe6' : '#f5f5f5'}
                onMouseLeave={e => e.currentTarget.style.background = value === f.flag ? '#fffbe6' : ''}>
                <span style={{ fontSize: 20 }}>{f.flag}</span>
                <span style={{ flex: 1 }}>{f.country}</span>
                {f.currency_code && <span style={{ fontSize: 11, color: '#888', fontFamily: 'monospace' }}>{f.currency_code} {f.symbol}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CurrencyLangModal({ onClose, initialTab = 'currencies' }) {
  const [tab, setTab] = useState(initialTab);
  const [currencies, setCurrencies] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [curForm, setCurForm] = useState(emptyCur);
  const [editIdx, setEditIdx] = useState(null);
  const [langForm, setLangForm] = useState({ code: '', label: '', flag: '', rtl: false });
  const [addingLang, setAddingLang] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');

  const flash = (m, type = 'success') => { setMsg(m); setMsgType(type); setTimeout(() => setMsg(''), 2500); };

  useEffect(() => {
    api.get('/api/currencies').then(r => setCurrencies(r.data));
    api.get('/api/languages').then(r => setLanguages(r.data));
  }, []);

  // ── Currencies ──
  const saveCurrencies = async (list) => {
    await api.put('/api/currencies', list);
    setCurrencies(list);
    flash('✓ Saved');
  };

  const submitCur = async (e) => {
    e.preventDefault();
    if (!curForm.currency_code || !curForm.language_code) return;
    let updated;
    if (editIdx !== null) {
      updated = currencies.map((c, i) => i === editIdx ? { ...curForm } : c);
      setEditIdx(null);
    } else {
      updated = [...currencies, { ...curForm }];
    }
    await saveCurrencies(updated);
    setCurForm(emptyCur);
  };

  const deleteCur = async (i) => {
    if (!window.confirm('Delete this currency?')) return;
    await saveCurrencies(currencies.filter((_, idx) => idx !== i));
  };

  const toggleActive = async (i) => {
    const updated = currencies.map((c, idx) => idx === i ? { ...c, active: c.active ? 0 : 1 } : c);
    await saveCurrencies(updated);
  };

  // ── Languages ──
  const saveLangs = async (list) => {
    await api.put('/api/languages', list);
    setLanguages(list);
    flash('✓ Saved');
  };

  const toggleLang = async (i) => {
    const updated = languages.map((l, idx) => idx === i ? { ...l, enabled: l.enabled ? 0 : 1 } : l);
    if (!updated[i].enabled && languages.filter(l => l.enabled).length <= 1) return;
    await saveLangs(updated);
  };

  const addLang = async () => {
    if (!langForm.code.trim() || !langForm.label.trim()) {
      flash('Please fill in both the language name and code', 'error'); return;
    }
    if (languages.find(l => l.code === langForm.code.trim())) {
      flash(`Language code "${langForm.code}" already exists`, 'error'); return;
    }
    const updated = [...languages, { ...langForm, enabled: 0 }];
    await saveLangs(updated);
    setLangForm({ code: '', label: '', flag: '', rtl: false });
    setAddingLang(false);
  };

  const deleteLang = async (code) => {
    const lang = languages.find(l => l.code === code);
    const activeCount = languages.filter(l => l.enabled).length;
    if (lang?.enabled && activeCount <= 1) {
      flash('Cannot delete the last active language', 'error'); return;
    }
    if (!window.confirm(`Delete language "${code}"?`)) return;
    await api.delete(`/api/languages/${code}`);
    setLanguages(prev => prev.filter(l => l.code !== code));
  };

  const tabStyle = (active) => ({
    padding: '8px 20px', cursor: 'pointer', fontWeight: active ? 700 : 400,
    borderBottom: active ? '3px solid #febd69' : '3px solid transparent',
    background: 'none', border: 'none', fontSize: 14, color: active ? '#111' : '#666',
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: 620, maxWidth: '96vw', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px 0', borderBottom: '1px solid #eee' }}>
          <button onClick={() => setTab('currencies')} style={tabStyle(tab === 'currencies')}>💱 Currencies</button>
          <button onClick={() => setTab('languages')} style={tabStyle(tab === 'languages')}>🌐 Languages</button>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888', paddingBottom: 8 }}>✕</button>
        </div>

        <div style={{ overflowY: 'auto', padding: 20, flex: 1 }}>
          {msg && <div style={{ background: msgType === 'error' ? '#fdecea' : '#e8f8e8', color: msgType === 'error' ? '#c0392b' : '#27ae60', padding: '8px 14px', borderRadius: 6, marginBottom: 12, fontSize: 13 }}>{msg}</div>}

          {/* ── Currencies tab ── */}
          {tab === 'currencies' && (
            <>
              <form onSubmit={submitCur} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16, padding: 14, background: '#f9f9f9', borderRadius: 8, border: '1px solid #eee' }}>
                {/* Language dropdown */}
                <div>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 3 }}>Language *</label>
                  <select value={curForm.language_code} onChange={e => {
                    const code = e.target.value;
                    const lang = languages.find(l => l.code === code);
                    // find matching country data by flag
                    const flagData = lang ? ALL_FLAGS.find(f => f.flag === lang.flag) : null;
                    setCurForm(p => ({
                      ...p,
                      language_code: code,
                      ...(flagData && {
                        flag: flagData.flag,
                        country: p.country || flagData.country,
                        currency_code: p.currency_code || flagData.currency_code,
                        symbol: p.symbol || flagData.symbol,
                      }),
                    }));
                  }} style={{ width: '100%', marginBottom: 0 }} required>
                    <option value="">— Select language —</option>
                    {languages.map(l => (
                      <option key={l.code} value={l.code}>{l.flag} {l.label} ({l.code})</option>
                    ))}
                  </select>
                </div>
                {/* Currency code */}
                <div>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 3 }}>Currency code *</label>
                  <input placeholder="USD, EUR, IRR…" value={curForm.currency_code}
                    onChange={e => setCurForm(p => ({ ...p, currency_code: e.target.value.toUpperCase() }))}
                    style={{ width: '100%', marginBottom: 0 }} required />
                </div>
                {/* Flag picker */}
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 3 }}>Flag & Country</label>
                  <FlagPicker value={curForm.flag}
                    onChange={(f) => setCurForm(p => ({
                      ...p,
                      flag: f.flag,
                      country: p.country || f.country,
                      currency_code: p.currency_code || f.currency_code,
                      symbol: p.symbol || f.symbol,
                    }))} />
                </div>
                {/* Country name (auto-filled but editable) */}
                <div>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 3 }}>Country name</label>
                  <input placeholder="United States" value={curForm.country}
                    onChange={e => setCurForm(p => ({ ...p, country: e.target.value }))}
                    style={{ width: '100%', marginBottom: 0 }} />
                </div>
                {/* Symbol */}
                <div>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 3 }}>Symbol</label>
                  <input placeholder="$" value={curForm.symbol}
                    onChange={e => setCurForm(p => ({ ...p, symbol: e.target.value }))}
                    style={{ width: '100%', marginBottom: 0 }} />
                </div>
                {/* Checkout symbol */}
                <div>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 3 }}>Checkout symbol</label>
                  <input placeholder="USD" value={curForm.checkout_symbol}
                    onChange={e => setCurForm(p => ({ ...p, checkout_symbol: e.target.value }))}
                    style={{ width: '100%', marginBottom: 0 }} />
                </div>
                {/* Decimal digits */}
                <div>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 3 }}>Decimal digits</label>
                  <input type="number" value={curForm.fraction_digits}
                    onChange={e => setCurForm(p => ({ ...p, fraction_digits: Number(e.target.value) }))}
                    style={{ width: '100%', marginBottom: 0 }} min={0} max={6} />
                </div>
                {curForm.symbol!==curForm.checkout_symbol &&
                <div>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 3 }}>symbol/checkout_symbol</label>
                  <input type="number" value={curForm.differ}
                    onChange={e => setCurForm(p => ({ ...p, differ: Number(e.target.value) }))}
                    style={{ width: '100%', marginBottom: 0 }} min={0} max={6} />
                </div>}
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 , color:'black'}}>
                  <input type="checkbox" checked={!!curForm.active} onChange={e => setCurForm(p => ({ ...p, active: e.target.checked ? 1 : 0 }))} />
                  Active (visible in dropdown)
                </label>
                <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8 }}>
                  <button type="submit" className="btn btn-primary">{editIdx !== null ? 'Update' : '+ Add Currency'}</button>
                  {editIdx !== null && <button type="button" className="btn btn-secondary" onClick={() => { setEditIdx(null); setCurForm(emptyCur); }}>Cancel</button>}
                </div>
              </form>

              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={th}>Flag</th>
                    <th style={th}>Country</th>
                    <th style={th}>Code</th>
                    <th style={th}>Symbol</th>
                    <th style={th}>Lang</th>
                    <th style={th}>Show</th>
                    <th style={th}></th>
                  </tr>
                </thead>
                <tbody>
                  {currencies.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #eee', background: editIdx === i ? '#fffbe6' : '' }}>
                      <td style={td}>{c.flag}</td>
                      <td style={td}>{c.country}</td>
                      <td style={{ ...td, fontFamily: 'monospace' }}>{c.currency_code}</td>
                      <td style={td}>{c.symbol}</td>
                      <td style={{ ...td, fontFamily: 'monospace', fontSize: 11 }}>{c.language_code}</td>
                      <td style={td}>
                        <input type="checkbox" checked={!!c.active} onChange={() => toggleActive(i)} />
                      </td>
                      <td style={td}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => { setEditIdx(i); setCurForm({ ...c }); }} style={iconBtn('#2980b9')}>✏️</button>
                          <button onClick={() => deleteCur(i)} style={iconBtn('#c0392b')}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* ── Languages tab ── */}
          {tab === 'languages' && (
            <>
              {languages.map((l, i) => (
                <div key={l.code} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #eee', opacity: l.enabled ? 1 : 0.6 }}>
                  <input type="checkbox" checked={!!l.enabled} onChange={() => toggleLang(i)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                  {/* <span style={{ fontSize: 22}}>{l.flag}</span> */}
                  <span style={{ flex: 1, fontSize: 14, color:'black' }}>{l.label}</span>
                  <span style={{ fontSize: 11, color: l.enabled ? '#27ae60' : '#e67e22', fontWeight: 600 }}>{l.enabled ? '● Show' : '● Hidden'}</span>
                  <span style={{ fontSize: 12, color: '#888', fontFamily: 'monospace' }}>{l.code}</span>
                  {l.rtl ? 
                    <span style={{ fontSize: 11, background: '#f0f0f0', padding: '1px 5px', borderRadius: 3 }}>RTL</span>:
                    <span style={{ fontSize: 11, background: '#f0f0f0', padding: '1px 5px', borderRadius: 3 }}>LTR</span>
                  }
                  <button onClick={() => deleteLang(l.code)} style={{ background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer', fontSize: 16 }}>✕</button>
                </div>
              ))}

              {addingLang ? (
                <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input value={langForm.label} onChange={e => setLangForm(p => ({ ...p, label: e.target.value }))}
                    placeholder="Name (e.g. Deutsch)" style={{ marginBottom: 0 }} />
                  <input value={langForm.code} onChange={e => setLangForm(p => ({ ...p, code: e.target.value.toLowerCase() }))}
                    placeholder="Code (e.g. de)" style={{ marginBottom: 0 }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color:'black' }}>
                    <input type="checkbox" checked={langForm.rtl} onChange={e => setLangForm(p => ({ ...p, rtl: e.target.checked }))} />
                    RTL direction
                  </label>
                  <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" onClick={addLang}>Add</button>
                    <button className="btn btn-secondary" onClick={() => setAddingLang(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => setAddingLang(true)}>+ Add Language</button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const th = { padding: '6px 8px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: '#fff' };
const td = { padding: '6px 8px', color:'black' };
const iconBtn = (bg) => ({ background: bg, color: '#fff', border: 'none', borderRadius: 3, padding: '2px 6px', cursor: 'pointer', fontSize: 12 });

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
  const [langDropOpen, setLangDropOpen] = useState(false);
  const [navLinks, setNavLinks] = useState([]);
  const [showCurrencyModal, setShowCurrencyModal] = useState(null);
  const [editMode, setEditMode] = useState(false);

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
  const [authLabels, setAuthLabels] = useState({});
  const [catTree, setCatTree] = useState([]);
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [uiTranslations, setUiTranslations] = useState({});

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
      try { setAuthLabels(JSON.parse(r.data.auth_page_labels || '{}')); } catch { }
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
      else api.get('/api/navlinks/en').then(r2 => {
        setNavLinks(r2.data);
        // Auto-seed for this language so admin can edit
        if (user && (user.role === 'admin' || user.role === 'cooperatore') && r2.data.length > 0 && code !== 'en') {
          api.put(`/api/navlinks/${code}`, r2.data).catch(() => {});
        }
      }).catch(() => { });
    }).catch(() => { });
    api.get(`/api/translations/${code}`).then(r => setUiTranslations(r.data)).catch(() => {});
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
            {editMode ? (
              <input
                defaultValue={appName[lang] || t('appName')}
                style={{ fontWeight: 'bold', fontSize: 18, background: 'rgba(255,255,255,0.15)', border: '1px dashed rgba(255,255,255,0.6)', borderRadius: 4, color: '#fff', padding: '2px 6px', width: 160 }}
                onBlur={async e => {
                  const val = e.target.value.trim(); if (!val) return;
                  const updated = { ...appName, [lang]: val };
                  setAppName(updated);
                  const settings = await api.get('/api/settings');
                  let titles = {}; try { titles = JSON.parse(settings.data.page_titles || '{}'); } catch {}
                  titles.title = updated;
                  await api.put('/api/settings', { page_titles: JSON.stringify(titles) });
                }}
                onKeyDown={e => e.key === 'Enter' && e.target.blur()}
                onClick={e => e.preventDefault()}
              />
            ) : (
              <span style={{ fontWeight: 'bold', fontSize: 18, whiteSpace: 'nowrap' }}>
                {appName[lang] || t('appName')}
              </span>
            )}
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
          {user && (user.role === 'admin' || user.role === 'cooperatore') && (
            <button onClick={() => setEditMode(m => !m)} title={editMode ? 'Exit edit mode' : 'Edit translations'}
              style={{ background: editMode ? '#febd69' : 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: editMode ? '#000' : '#fff', fontSize: 13, whiteSpace: 'nowrap' }}>
              ✏️ {editMode ? 'Editing' : 'Edit'}
            </button>
          )}
          {/* Language selector — admin only */}
          {user && (user.role === 'admin' || user.role === 'cooperatore') && languages.filter(l => l.enabled).length > 1 && (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setLangDropOpen(o => !o)}
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                🌐 {languages.find(l => l.code === lang)?.label || lang} <span style={{ fontSize: 11, opacity: 0.8 }}>▾</span>
              </button>
              {langDropOpen && (
                <div style={{ position: 'absolute', top: '110%', ...(isRTL ? { left: 0 } : { right: 0 }), background: '#fff', border: '1px solid #ddd', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 999, minWidth: 160, overflow: 'hidden' }}>
                  {languages.filter(l => l.enabled).map(l => (
                    <button key={l.code} onClick={() => { changeLanguage(l.code, l.rtl); setLangDropOpen(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', border: 'none', background: lang === l.code ? '#fffbe6' : '#fff', cursor: 'pointer', fontSize: 14, color: '#111' }}>
                      {l.label || l.code}
                      {lang === l.code && <span style={{ color: '#febd69' }}>✓</span>}
                    </button>
                  ))}
                  <button onClick={() => { setLangDropOpen(false); setShowCurrencyModal('languages'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', border: 'none', borderTop: '1px solid #eee', background: '#f9f9f9', cursor: 'pointer', fontSize: 13, color: '#555' }}>
                    ⚙️ Manage Languages
                  </button>
                </div>
              )}
            </div>
          )}
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
                    window.dispatchEvent(new CustomEvent('currencychange', { detail: c }));
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
                {user && (user.role === 'admin' || user.role === 'cooperatore') && (
                  <button onClick={() => { setLangOpen(false); setShowCurrencyModal('currencies'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', border: 'none', borderTop: '1px solid #eee', background: '#f9f9f9', cursor: 'pointer', fontSize: 13, color: '#555' }}>
                    ⚙️ Manage Currencies
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCurrencyModal && <CurrencyLangModal onClose={() => setShowCurrencyModal(null)} initialTab={showCurrencyModal} />}

      {/* Bottom nav — dynamic per language */}
      <div style={{ background: '#232f3e', padding: '6px 16px', display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        {navLinks.filter(l => {
          const authOnly = ['/orders', '/profile'];
          return authOnly.includes(l.url) ? !!user : true;
        }).map((l, idx) => {
          const saveNavLabel = async (newLabel) => {
            if (!newLabel.trim() || newLabel === l.label) return;
            const updated = navLinks.map((n, i) => i === idx ? { ...n, label: newLabel } : n);
            setNavLinks(updated);
            await api.put(`/api/navlinks/${lang}`, updated);
          };
          const labelEl = editMode ? (
            <input
              defaultValue={l.label}
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px dashed rgba(255,255,255,0.6)', borderRadius: 3, color: '#fff', fontSize: 13, padding: '2px 6px', width: Math.max(60, l.label.length * 9) }}
              onBlur={e => saveNavLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && e.target.blur()}
              onClick={e => e.stopPropagation()}
            />
          ) : null;

          return l.url === '/products'
            ? <div key={l._id || l.id || l.url} ref={catRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 2 }}>
                <button onClick={() => !editMode && setCatOpen(o => !o)}
                  style={{ background: catOpen || pathname === '/products' ? 'rgba(255,255,255,0.15)' : 'transparent', border: catOpen || pathname === '/products' ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent', color: '#fff', fontSize: 13, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, borderRadius: 4 }}>
                  {l.icon}{editMode ? labelEl : <>{l.label} <span style={{ fontSize: 10, opacity: 0.7 }}>{catOpen ? '▴' : '▾'}</span></>}
                </button>
                {catOpen && !editMode && <MegaMenu tree={catTree} navigate={navigate} close={() => setCatOpen(false)} lang={lang} label={l.label} />}
              </div>
            : <div key={l._id || l.id || l.url} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {editMode ? labelEl : (
                  <Link to={l.url} style={{ color: '#fff', fontSize: 13, padding: '4px 10px', borderRadius: 4, whiteSpace: 'nowrap', background: pathname === l.url ? 'rgba(255,255,255,0.15)' : 'transparent', border: pathname === l.url ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent' }}>
                    {l.icon}{l.label}
                  </Link>
                )}
              </div>;
        })}
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
              <Link to="/login" style={{ color: '#ccc', fontSize: 13, padding: '4px 10px', whiteSpace: 'nowrap' }}>{authLabels[i18n.language?.split('-')[0]]?.login_button || authLabels['en']?.login_button || t('login')}</Link>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
              <Link to="/register" style={{ color: '#ccc', fontSize: 13, padding: '4px 10px', whiteSpace: 'nowrap' }}>{authLabels[i18n.language?.split('-')[0]]?.register_button_short || authLabels['en']?.register_button_short || t('register')}</Link>
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link to="/cart" style={{ color: '#febd69', fontWeight: 'bold', fontSize: 13, padding: '4px 8px', whiteSpace: 'nowrap' }}>
            <FiShoppingCart size={25} />

            {items.length > 0 && <span style={{ background: '#f00', color: '#fff', borderRadius: '50%', padding: '1px 5px', fontSize: 11 }}>{items.length}</span>}
          </Link>
        {user && (
          <button onClick={() => { logout(); navigate('/'); }}
            title={uiTranslations.logout || t('logout')}
            style={{ background: 'transparent', whiteSpace: 'nowrap',// border: '1px solid rgba(255,255,255,0.4)',
               color: '#febd69', //borderRadius: 4, 
               padding: '2px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center'
              
            }}>
            <FiLogOut size={20} />
          </button>
        )}
        </div>
      </div>
    </nav>
  );
}
