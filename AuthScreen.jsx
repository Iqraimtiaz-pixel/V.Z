import { useState } from 'react';
import { Auth } from '../services/auth';

const fieldStyle = {
  width: '100%',
  padding: '13px 16px',
  borderRadius: 12,
  background: '#111',
  border: '1.5px solid #222',
  color: '#fff',
  fontSize: 15,
  outline: 'none',
  fontFamily: "'Sora', sans-serif",
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

export default function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const switchMode = (m) => {
    setMode(m);
    setError('');
    setName('');
    setEmail('');
    setPassword('');
  };

  // Called directly from button onClick — no form submit involved
  const handleSubmit = () => {
    setError('');

    // Validate
    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    // Small delay for UX feel, then run sync logic
    setTimeout(() => {
      let result;
      if (mode === 'signup') {
        result = Auth.signup(name.trim(), email.trim(), password);
      } else {
        result = Auth.login(email.trim(), password);
      }

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setLoading(false);
      onLogin(result.user);
    }, 350);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 20px',
      backgroundImage:
        'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,58,237,0.22) 0%, transparent 70%)',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{
            fontSize: 52, fontWeight: 900, letterSpacing: '-2px',
            background: 'linear-gradient(135deg, #7C3AED 30%, #A78BFA 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            lineHeight: 1,
          }}>
            VibeZ
          </div>
          <div style={{ color: '#4B5563', fontSize: 14, marginTop: 8, letterSpacing: 0.5 }}>
            Private chats. Your vibe.
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#0A0A0A',
          border: '1px solid #1a1a1a',
          borderRadius: 24,
          padding: '32px 28px',
          boxShadow: '0 0 80px rgba(124,58,237,0.1)',
        }}>

          {/* Tab switcher */}
          <div style={{
            display: 'flex', background: '#111', borderRadius: 14, padding: 4, marginBottom: 28,
          }}>
            {[['login', 'Sign In'], ['signup', 'Sign Up']].map(([id, label]) => (
              <button
                key={id}
                onClick={() => switchMode(id)}
                style={{
                  flex: 1, padding: '11px 0', border: 'none', borderRadius: 10,
                  background: mode === id ? '#7C3AED' : 'transparent',
                  color: mode === id ? '#fff' : '#555',
                  fontWeight: mode === id ? 700 : 500,
                  fontSize: 14, cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: "'Sora', sans-serif",
                  boxShadow: mode === id ? '0 2px 12px rgba(124,58,237,0.4)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'signup' && (
              <div>
                <label style={{ color: '#6B7280', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6, letterSpacing: 0.8 }}>
                  FULL NAME
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Your full name"
                  autoComplete="name"
                  style={fieldStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#7C3AED')}
                  onBlur={(e) => (e.target.style.borderColor = '#222')}
                />
              </div>
            )}

            <div>
              <label style={{ color: '#6B7280', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6, letterSpacing: 0.8 }}>
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="you@example.com"
                autoComplete="email"
                style={fieldStyle}
                onFocus={(e) => (e.target.style.borderColor = '#7C3AED')}
                onBlur={(e) => (e.target.style.borderColor = '#222')}
              />
            </div>

            <div>
              <label style={{ color: '#6B7280', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6, letterSpacing: 0.8 }}>
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                style={fieldStyle}
                onFocus={(e) => (e.target.style.borderColor = '#7C3AED')}
                onBlur={(e) => (e.target.style.borderColor = '#222')}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginTop: 14,
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10, padding: '10px 14px',
              color: '#F87171', fontSize: 13, textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%',
              marginTop: 22,
              padding: '15px',
              borderRadius: 14,
              border: 'none',
              background: loading
                ? '#3b1f7a'
                : 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 16,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Sora', sans-serif",
              boxShadow: loading ? 'none' : '0 4px 24px rgba(124,58,237,0.45)',
              transition: 'all 0.2s',
              letterSpacing: 0.3,
            }}
          >
            {loading
              ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
              : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>

          {/* Switch hint */}
          <div style={{ textAlign: 'center', marginTop: 18, color: '#444', fontSize: 13 }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <span
              onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
              style={{ color: '#A78BFA', cursor: 'pointer', fontWeight: 600 }}
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
