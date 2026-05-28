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
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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

  const handleRegister = async e => {
    e.preventDefault();
    setError('');
    if (!email && !phone) { setError('Email or phone is required'); return; }
    if (!username) { setError('Username is required'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/register', { username, email: email || undefined, phone: phone || undefined, password, first_name: firstName || undefined, last_name: lastName || undefined });
      if (data.requireVerification) {
        setInfo(data.dev_code ? `Dev mode — code: ${data.dev_code}` : 'Verification code sent!');
        setStep(2);
      } else {
        login(data.token, data.role, username);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    } finally { setLoading(false); }
  };

  const verify = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/api/auth/verify', { username, code });
      login(data.token, data.role, username);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code');
    } finally { setLoading(false); }
  };

  const [resendVia, setResendVia] = useState(null); // null, 'ask', 'email', 'sms'

  const resend = async (via) => {
    try {
      const { data } = await api.post('/api/auth/resend', { username, via });
      if (data.askPreference) {
        setResendVia('ask');
        return;
      }
      setResendVia(null);
      setInfo(data.dev_code ? `Dev mode — new code: ${data.dev_code}` : `Code resent via ${data.sentVia}`);
    } catch { setError('Failed to resend'); }
  };

  return (
    <div className="page" style={{ maxWidth: 400, marginTop: 40 }}>
      <div className="card">
        <h2 style={{ marginBottom: 20 }}>{L('register_title', t('register'))}</h2>
        {error && <p style={{ color: 'red', marginBottom: 12 }}>{error}</p>}
        {info && <p style={{ color: 'green', marginBottom: 12 }}>{info}</p>}

        {step === 1 ? (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>{L('register_username', 'Username')} *</label>
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required />
            </div>
            <div className="form-group">
              <label>{L('register_first_name', 'First Name')}</label>
              <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First Name" />
            </div>
            <div className="form-group">
              <label>{L('register_last_name', 'Last Name')}</label>
              <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last Name" />
            </div>
            <div className="form-group">
              <label>{L('register_email', 'Email')} *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
            </div>
            <div className="form-group">
              <label>{L('register_phone', 'Phone')} *</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1234567890" />
            </div>
            <p style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>* At least one of email or phone is required</p>
            <div className="form-group">
              <label>{L('register_password', t('password'))}</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
            </div>
            <div className="form-group">
              <label>{L('register_confirm_password', 'Confirm Password')}</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm Password" required />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/login" className="btn" style={{ flex: 1, background: '#232f3e', color: '#fff', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{L('login_button', t('login'))}</Link>
              <button type="submit" className="btn" style={{ flex: 1, background: '#febd69', color: '#131921' }} disabled={loading}>
                {loading ? '...' : L('register_button', 'Register')}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={verify}>
            <p style={{ marginBottom: 16, color: '#555', fontSize: 14 }}>
              {L('verify_title', 'Enter the 5-digit code sent to')} <strong>{username}</strong>
            </p>
            <div className="form-group">
              <input value={code} onChange={e => setCode(e.target.value)} placeholder="12345" maxLength={5}
                style={{ fontSize: 28, letterSpacing: 12, textAlign: 'center' }} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? '...' : L('verify_button', 'Verify & Create Account')}
            </button>
            {resendVia === 'ask' ? (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => resend('email')}>Email</button>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => resend('sms')}>SMS</button>
              </div>
            ) : (
              <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: 8 }} onClick={() => resend()}>
                {L('verify_resend', 'Resend Code')}
              </button>
            )}
          </form>
        )}

      </div>
    </div>
  );
}
