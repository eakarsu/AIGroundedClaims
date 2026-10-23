import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, setToken, setStoredUser } from '../services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const demoAvailable = Boolean(process.env.REACT_APP_DEMO_EMAIL && process.env.REACT_APP_DEMO_PASSWORD);
  const navigate = useNavigate();
  const signInWith = async (loginEmail, loginPassword) => {
    setBusy(true); setError(null);
    try {
      const { token, user } = await login(loginEmail, loginPassword);
      setToken(token); setStoredUser(user);
      navigate('/');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const submit = async (e) => {
    e.preventDefault();
    await signInWith(email, password);
  };
  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={submit}>
        <h2 className="login-brand">GROUNDED CLAIMS VERIFIER</h2>
        <p className="login-sub">Per-claim provenance. Every sentence ships with a verifiable source span.</p>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <div className="ai-error">{error}</div>}
        <button
          type="button"
          onClick={() => {
            const demoEmail = process.env.REACT_APP_DEMO_EMAIL || '';
            const demoPassword = process.env.REACT_APP_DEMO_PASSWORD || '';
            setEmail(demoEmail);
            setPassword(demoPassword);
            signInWith(demoEmail, demoPassword);
          }}
          disabled={!demoAvailable || busy}
          aria-label="Fill demo credentials"
          style={{ width: '100%', marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', border: '1px solid currentColor', background: 'transparent', cursor: 'pointer' }}
        >
          Fill demo credentials
        </button>
        <button className="btn" type="submit" disabled={busy} style={{ width: '100%', marginTop: 10 }}>
          {busy ? 'Signing in...' : 'Sign In'}
        </button>
        {!demoAvailable && <p className="login-hint">Demo credentials are not configured for this frontend build.</p>}
      </form>
    </div>
  );
}
