import { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCkVFEOeVSjra0VnsNX3iNw2tT3Q6yRU",
  authDomain: "vibez-chat-b22b0.firebaseapp.com",
  projectId: "vibez-chat-b22b0",
  storageBucket: "vibez-chat-b22b0.firebasestorage.app",
  messagingSenderId: "781661198767",
  appId: "1:781661198767:web:80b99adb32d844adc2f75a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function AuthScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');

  const handleAuth = async () => {
    setError('');
    if (!email || !password) {
      setError('Bhai email password to daal');
      return;
    }
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onLogin(email);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Poppins, sans-serif', padding: '20px'
    }}>
      <div style={{
        background: '#1a1a1a', padding: '40px 30px', borderRadius: '20px',
        width: '100%', maxWidth: '350px', border: '1px solid #2a2a2a'
      }}>
        <h1 style={{ color: '#fff', textAlign: 'center', marginBottom: '10px', fontSize: '32px' }}>
          VibeZ ✨
        </h1>
        <p style={{ color: '#888', textAlign: 'center', marginBottom: '30px' }}>
          {isLogin ? 'Login to your vibe' : 'Create your vibe account'}
        </p>
        
        <input type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #333',
            background: '#0a0a0a', color: '#fff', fontSize: '16px', marginBottom: '15px', boxSizing: 'border-box'
          }}
        />
        <input type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #333',
            background: '#0a0a0a', color: '#fff', fontSize: '16px', marginBottom: '20px', boxSizing: 'border-box'
          }}
        />
        
        {error && <p style={{ color: '#ff5555', fontSize: '14px', marginBottom: '15px' }}>{error}</p>}
        
        <button onClick={handleAuth} style={{
          width: '100%', padding: '15px', borderRadius: '12px', border: 'none',
          background: '#8b5cf6', color: '#fff', fontSize: '16px', fontWeight: '600', cursor: 'pointer'
        }}>
          {isLogin ? 'Enter Vibe' : 'Create Vibe'}
        </button>
        
        <p onClick={() => setIsLogin(!isLogin)} style={{
          color: '#8b5cf6', textAlign: 'center', marginTop: '20px', cursor: 'pointer', fontSize: '14px'
        }}>
          {isLogin ? 'Need an account? Sign up' : 'Have an account? Login'}
        </p>
      </div>
    </div>
  );
}
