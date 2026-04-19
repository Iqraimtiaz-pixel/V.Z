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
      setError('Bhai email password to daal 😭');
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
   
