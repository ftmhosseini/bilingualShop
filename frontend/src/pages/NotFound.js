import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 16px' }}>
      <div style={{ fontSize: 72 }}>🔍</div>
      <h1 style={{ fontSize: 48, margin: '16px 0 8px' }}>404</h1>
      <p style={{ fontSize: 18, color: '#666', marginBottom: 24 }}>Page not found</p>
      <Link to="/" className="btn btn-primary" style={{ fontSize: 15 }}>← Back to Home</Link>
    </div>
  );
}
