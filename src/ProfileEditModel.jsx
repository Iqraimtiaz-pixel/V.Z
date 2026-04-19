import { useState, useRef } from 'react';
import { Auth } from '../services/auth';
import { avatarColor, getInitials } from '../utils/helpers';

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  background: '#1a1a1a', border: '1px solid #2a2a2a',
  color: '#fff', fontSize: 14, outline: 'none',
  fontFamily: "'Sora', sans-serif", boxSizing: 'border-box',
};

export default function ProfileEditModal({ user, onClose, onSave }) {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [photo, setPhoto] = useState(user.photo || null);
  const [preview, setPreview] = useState(user.photo || null);
  const initPriv = Auth.getPrivacy(user.id);
  const [priv, setPriv] = useState({ ...initPriv });
  const fileRef = useRef();

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhoto(ev.target.result);
      setPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const updated = Auth.updateProfile(user.id, { name: name.trim() || user.name, bio, photo });
    Auth.updatePrivacy(user.id, priv);
    onSave(updated || { ...user, name, bio, photo });
    onClose();
  };

  const togglePriv = (key) => setPriv((p) => ({ ...p, [key]: !p[key] }));

  const privOptions = [
    { key: 'showOnline', label: 'Show online status' },
    { key: 'lastSeen', label: 'Show last seen' },
    { key: 'showPhoto', label: 'Show profile photo' },
    { key: 'showBio', label: 'Show bio to others' },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '0 16px',
    }}>
      <div style={{
        background: '#0D0D0D', border: '1px solid #222', borderRadius: 20,
        padding: '28px 24px', width: '100%', maxWidth: 380,
        boxShadow: '0 0 80px rgba(124,58,237,0.2)', maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>Edit Profile</span>
          <button onClick={onClose} style={{
            background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa',
            width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Photo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div
            style={{ position: 'relative', cursor: 'pointer' }}
            onClick={() => fileRef.current.click()}
          >
            {preview ? (
              <img src={preview} alt="avatar"
                style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: '3px solid #7C3AED' }} />
            ) : (
              <div style={{
                width: 88, height: 88, borderRadius: '50%',
                background: `linear-gradient(135deg, ${avatarColor(name)} 0%, #4C1D95 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 30, fontWeight: 700, color: '#fff', border: '3px solid #7C3AED',
              }}>
                {getInitials(name)}
              </div>
            )}
            <div style={{
              position: 'absolute', bottom: 2, right: 2,
              background: '#7C3AED', borderRadius: '50%',
              width: 28, height: 28, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 14, border: '2px solid #000',
            }}>📷</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
          <span style={{ color: '#555', fontSize: 12, marginTop: 8 }}>Tap to change photo</span>
        </div>

        {/* Name */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ color: '#6B7280', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 5, letterSpacing: 1 }}>
            DISPLAY NAME
          </label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="Your name" />
        </div>

        {/* Bio */}
        <div style={{ marginBottom: 22 }}>
          <label style={{ color: '#6B7280', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 5, letterSpacing: 1 }}>
            BIO
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Something about you..."
            rows={3}
            style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
          />
        </div>

        {/* Privacy */}
        <div style={{ marginBottom: 26 }}>
          <div style={{ color: '#6B7280', fontSize: 11, fontWeight: 600, marginBottom: 12, letterSpacing: 1 }}>
            PRIVACY SETTINGS
          </div>
          {privOptions.map(({ key, label }) => (
            <div key={key} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid #111',
            }}>
              <span style={{ color: '#ccc', fontSize: 13 }}>{label}</span>
              <div
                onClick={() => togglePriv(key)}
                style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: priv[key] ? '#7C3AED' : '#2a2a2a',
                  cursor: 'pointer', position: 'relative', transition: 'background 0.25s',
                  flexShrink: 0,
                }}
              >
                <div style={{
                  position: 'absolute', top: 3,
                  left: priv[key] ? 22 : 3,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#fff', transition: 'left 0.25s',
                }} />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          style={{
            width: '100%', padding: 13, borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
            color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
          }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
