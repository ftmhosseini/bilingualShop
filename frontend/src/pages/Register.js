import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [labels, setLabels] = useState({});

  const lang = i18n.language?.split('-')[0];

  useEffect(() => {
    api.get('/api/settings').then(r => {
      try {
        const all = JSON.parse(r.data.auth_page_labels || '{}');
        setLabels(all[lang] || all['en'] || {});
      } catch {}
    }).catch(() => {});
  }, [lang]);

  const L = (key, fallback) => labels[key] || fallback;

  const sendCode = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/api/auth/register', { identifier, password });
      setInfo(data.dev_code ? `Dev mode — code: ${data.dev_code}` : 'Verification code sent!');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    } finally { setLoading(false); }
  };

  const verify = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/api/auth/verify', { identifier, code });
      login(data.token, data.role, identifier);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code');
    } finally { setLoading(false); }
  };

  const resend = async () => {
    try {
      const { data } = await api.post('/api/auth/resend', { identifier });
      setInfo(data.dev_code ? `Dev mode — new code: ${data.dev_code}` : 'Code resent!');
    } catch { setError('Failed to resend'); }
  };

  return (
    <div className="page" style={{ maxWidth: 400, marginTop: 40 }}>
      <div className="card">
        <h2 style={{ marginBottom: 20 }}>{L('register_title', t('register'))}</h2>
        {error && <p style={{ color: 'red', marginBottom: 12 }}>{error}</p>}
        {info && <p style={{ color: 'green', marginBottom: 12 }}>{info}</p>}

        {step === 1 ? (
          <form onSubmit={sendCode}>
            <div className="form-group">
              <label>{L('register_identifier', 'Email or Phone')}</label>
              <input value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder={L('login_identifier_placeholder', 'email@example.com or +1234567890')} required />
            </div>
            <div className="form-group">
              <label>{L('register_password', t('password'))}</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/login" className="btn" style={{ flex: 1, background: '#232f3e', color: '#fff', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{L('login_button', t('login'))}</Link>
              <button type="submit" className="btn" style={{ flex: 1, background: '#febd69', color: '#131921' }} disabled={loading}>
                {loading ? '...' : L('register_button', 'Send Verification Code')}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={verify}>
            <p style={{ marginBottom: 16, color: '#555', fontSize: 14 }}>
              {L('verify_title', 'Enter the 5-digit code sent to')} <strong>{identifier}</strong>
            </p>
            <div className="form-group">
              <input value={code} onChange={e => setCode(e.target.value)} placeholder="12345" maxLength={5}
                style={{ fontSize: 28, letterSpacing: 12, textAlign: 'center' }} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? '...' : L('verify_button', 'Verify & Create Account')}
            </button>
            <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: 8 }} onClick={resend}>
              {L('verify_resend', 'Resend Code')}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
