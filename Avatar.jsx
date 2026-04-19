import { Auth } from '../services/auth';
import { avatarColor, getInitials } from '../utils/helpers';

export default function Avatar({ user, size = 40, showOnline = false }) {
  const privacy = Auth.getPrivacy(user?.id);
  const online = showOnline && privacy.showOnline !== false && Auth.isOnline(user?.id);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {user?.photo && privacy.showPhoto !== false ? (
        <img
          src={user.photo}
          alt={user.name}
          style={{
            width: size, height: size, borderRadius: '50%',
            objectFit: 'cover', border: '2px solid #7C3AED',
          }}
        />
      ) : (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: `linear-gradient(135deg, ${avatarColor(user?.name || '?')} 0%, ${avatarColor((user?.name || '?') + 'x')} 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.36, fontWeight: 700, color: '#fff',
          border: '2px solid #7C3AED',
        }}>
          {getInitials(user?.name)}
        </div>
      )}
      {showOnline && (
        <div style={{
          position: 'absolute', bottom: 1, right: 1,
          width: size * 0.27, height: size * 0.27,
          borderRadius: '50%',
          background: online ? '#22C55E' : '#4B5563',
          border: '2px solid #000',
          transition: 'background 0.3s',
        }} />
      )}
    </div>
  );
}
