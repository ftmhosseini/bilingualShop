import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [forgot, setForgot] = useState(0);
  const [resetId, setResetId] = useState('');
  const [code, setCode] = useState('');
  const [newPass, setNewPass] = useState('');
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

  const submit = async e => {
    e.preventDefault();
    try {
      const { data } = await api.post('/api/auth/login', { username, password });
      login(data.token, data.role, username);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      const needsVerification = err.response?.data?.needsVerification;
      setError(needsVerification ? 'Account not verified. Please register again to get a new code.' : msg);
    }
  };

  const sendResetCode = async e => {
    e.preventDefault();
    setError(''); setInfo(''); setLoading(true);
    try {
      const { data } = await api.post('/api/auth/forgot-password', { username: resetId });
      setInfo(data.dev_code ? `Dev mode — code: ${data.dev_code}` : 'Reset code sent! Check your email/phone.');
      setForgot(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send code');
    } finally { setLoading(false); }
  };

  const resetPassword = async e => {
    e.preventDefault();
    setError(''); setInfo(''); setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { username: resetId, code, password: newPass });
      setInfo('Password reset! You can now login.');
      setForgot(0);
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed');
    } finally { setLoading(false); }
  };

  if (forgot === 1) {
    return (
      <div className="page" style={{ maxWidth: 400, marginTop: 40 }}>
        <div className="card">
          <h2 style={{ marginBottom: 20 }}>{L('forgot_title', 'Forgot Password')}</h2>
          {error && <p style={{ color: 'red', marginBottom: 12 }}>{error}</p>}
          {info && <p style={{ color: 'green', marginBottom: 12 }}>{info}</p>}
          <form onSubmit={sendResetCode}>
            <div className="form-group">
              <label>{L('forgot_username', 'Username')}</label>
              <input value={resetId} onChange={e => setResetId(e.target.value)} placeholder="Username" required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? '...' : L('forgot_button', 'Send Reset Code')}
            </button>
          </form>
          <p style={{ marginTop: 16, fontSize: 13 }}>
            <button type="button" onClick={() => { setForgot(0); setError(''); setInfo(''); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, fontSize: 13 }}>{L('forgot_back', '← Back to Login')}</button>
          </p>
        </div>
      </div>
    );
  }

  if (forgot === 2) {
    return (
      <div className="page" style={{ maxWidth: 400, marginTop: 40 }}>
        <div className="card">
          <h2 style={{ marginBottom: 20 }}>{L('reset_title', 'Reset Password')}</h2>
          {error && <p style={{ color: 'red', marginBottom: 12 }}>{error}</p>}
          {info && <p style={{ color: 'green', marginBottom: 12 }}>{info}</p>}
          <p style={{ marginBottom: 16, color: '#555', fontSize: 14 }}>
            {L('verify_title', 'Enter the 5-digit code sent to')} <strong>{resetId}</strong>
          </p>
          <form onSubmit={resetPassword}>
            <div className="form-group">
              <label>{L('reset_code_label', 'Code')}</label>
              <input value={code} onChange={e => setCode(e.target.value)} placeholder="12345" maxLength={5}
                style={{ fontSize: 28, letterSpacing: 12, textAlign: 'center' }} required />
            </div>
            <div className="form-group">
              <label>{L('reset_newpass_label', 'New Password')}</label>
              <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? '...' : L('reset_button', 'Reset Password')}
            </button>
          </form>
          <p style={{ marginTop: 16, fontSize: 13 }}>
            <button type="button" onClick={() => { setForgot(1); setError(''); setInfo(''); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, fontSize: 13 }}>{L('forgot_back', '← Back')}</button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: 400, marginTop: 40 }}>
      <div className="card">
        <h2 style={{ marginBottom: 20 }}>{L('login_title', t('login'))}</h2>
        {error && <p style={{ color: 'red', marginBottom: 12 }}>{error}</p>}
        {info && <p style={{ color: 'green', marginBottom: 12 }}>{info}</p>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>{L('login_username', 'Username')}</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required />
          </div>
          <div className="form-group">
            <label>{L('login_password', t('password'))}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <p style={{ marginTop: 12, marginBottom: 16, fontSize: 13 }}>
            <button type="button" onClick={() => { setForgot(1); setError(''); setInfo(''); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, fontSize: 13 }}>{L('login_forgot', 'Forgot Password?')}</button>
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn" style={{ flex: 1, background: '#232f3e', color: '#fff' }}>{L('login_button', t('login'))}</button>
            <Link to="/register" className="btn" style={{ flex: 1, background: '#febd69', color: '#131921', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{L('register_button_short', t('register'))}</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
