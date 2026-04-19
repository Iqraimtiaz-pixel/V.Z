import { useState, useEffect } from 'react';
import { DB } from '../services/db';
import { Auth } from '../services/auth';
import { Friends } from '../services/friends';
import { Messages } from '../services/messages';
import Avatar from '../components/Avatar';
import ProfileEditModal from '../components/ProfileEditModal';
import { fmtTime, fmtDate } from '../utils/helpers';

const smallBtn = (bg, text = '#fff') => ({
  background: bg, border: 'none', color: text,
  padding: '7px 13px', borderRadius: 8, cursor: 'pointer',
  fontSize: 12, fontWeight: 600, fontFamily: "'Sora', sans-serif",
  whiteSpace: 'nowrap',
});

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '70px 20px', color: '#333' }}>
      <div style={{ fontSize: 44, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 14 }}>{text}</div>
    </div>
  );
}

export default function UsersListScreen({ currentUser, onOpenChat, onLogout }) {
  const [tab, setTab] = useState('people');
  const [showProfile, setShowProfile] = useState(false);
  const [me, setMe] = useState(() => DB.users.find((u) => u.id === currentUser.id) || currentUser);
  const [search, setSearch] = useState('');
  const [tick, setTick] = useState(0);

  // Polling for online statuses and new data
  useEffect(() => {
    Auth.updateOnline(me.id);
    const iv = setInterval(() => {
      Auth.updateOnline(me.id);
      setTick((t) => t + 1);
    }, 4000);
    return () => clearInterval(iv);
  }, [me.id]);

  // Refresh me from DB when profile changes
  const refreshMe = (updated) => {
    setMe(updated || DB.users.find((u) => u.id === me.id) || me);
  };

  const others = DB.users.filter(
    (u) =>
      u.id !== me.id &&
      (u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const friends = DB.users.filter(
    (u) => u.id !== me.id && Friends.isFriend(me.id, u.id)
  );

  const incoming = Friends.pendingIncoming(me.id);
  const sent = Friends.pendingSent(me.id);

  const FriendAction = ({ user }) => {
    const rel = Friends.getStatus(me.id, user.id);
    if (!rel) {
      return (
        <button
          onClick={(e) => { e.stopPropagation(); Friends.send(me.id, user.id); setTick((t) => t + 1); }}
          style={smallBtn('#7C3AED')}
        >
          Add Friend
        </button>
      );
    }
    if (rel.status === 'pending' && rel.fromId === me.id) {
      return <span style={{ color: '#6B7280', fontSize: 12 }}>Sent ✓</span>;
    }
    if (rel.status === 'pending' && rel.toId === me.id) {
      return (
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={(e) => { e.stopPropagation(); Friends.accept(rel.id); setTick((t) => t + 1); }} style={smallBtn('#22C55E')}>Accept</button>
          <button onClick={(e) => { e.stopPropagation(); Friends.reject(rel.id); setTick((t) => t + 1); }} style={smallBtn('#EF4444')}>Decline</button>
        </div>
      );
    }
    if (rel.status === 'accepted') {
      return (
        <button onClick={(e) => { e.stopPropagation(); onOpenChat(user); }} style={smallBtn('#7C3AED')}>
          Chat
        </button>
      );
    }
    return null;
  };

  const UserRow = ({ user, onClick, action }) => {
    const privacy = Auth.getPrivacy(user.id);
    const online = privacy.showOnline !== false && Auth.isOnline(user.id);
    const last = Messages.getLastMessage(me.id, user.id);

    return (
      <div
        onClick={onClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '13px 20px', cursor: 'pointer',
          borderBottom: '1px solid #0a0a0a', transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#0d0d0d')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <Avatar user={user} size={50} showOnline />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '65%' }}>
              {user.name}
            </div>
            {last && (
              <div style={{ color: '#444', fontSize: 11, flexShrink: 0 }}>
                {fmtTime(last.timestamp)}
              </div>
            )}
          </div>
          <div style={{ color: '#555', fontSize: 13, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {last
              ? (last.senderId === me.id ? `You: ${last.text}` : last.text)
              : (privacy.showBio !== false && user.bio ? user.bio : (online ? '🟢 Online' : (privacy.lastSeen !== false ? `Last seen ${Auth.lastSeen(user.id)}` : user.email)))
            }
          </div>
        </div>
        {action && <div onClick={(e) => e.stopPropagation()}>{action}</div>}
      </div>
    );
  };

  const tabs = [
    ['people', 'People'],
    ['friends', `Friends${friends.length ? ` (${friends.length})` : ''}`],
    ['requests', `Requests${incoming.length ? ` · ${incoming.length}` : ''}`],
  ];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#000', fontFamily: "'Sora', sans-serif" }}>

      {/* Header */}
      <div style={{
        background: '#000',
        borderBottom: '1px solid #111',
        backgroundImage: 'linear-gradient(180deg, rgba(124,58,237,0.09) 0%, transparent 100%)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 12px' }}>
          <div style={{
            fontSize: 28, fontWeight: 900, letterSpacing: '-1px',
            background: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            VibeZ
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {incoming.length > 0 && (
              <div style={{
                background: '#EF4444', borderRadius: '50%',
                width: 20, height: 20, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 700,
              }}>
                {incoming.length}
              </div>
            )}
            <div onClick={() => setShowProfile(true)} style={{ cursor: 'pointer' }}>
              <Avatar user={me} size={38} showOnline />
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '0 16px 12px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: 28, top: '50%', transform: 'translateY(-60%)', color: '#444', fontSize: 15 }}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people..."
            style={{
              width: '100%', padding: '10px 14px 10px 38px',
              borderRadius: 20, background: '#111', border: '1px solid #1a1a1a',
              color: '#fff', fontSize: 14, outline: 'none',
              fontFamily: "'Sora', sans-serif", boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex' }}>
          {tabs.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                flex: 1, padding: '10px 4px 11px', border: 'none',
                background: 'transparent', cursor: 'pointer',
                color: tab === id ? '#A78BFA' : '#444',
                fontWeight: tab === id ? 700 : 400, fontSize: 12,
                borderBottom: tab === id ? '2px solid #7C3AED' : '2px solid transparent',
                fontFamily: "'Sora', sans-serif", transition: 'all 0.2s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'people' && (
          <>
            {others.length === 0
              ? <EmptyState icon="👥" text={search ? 'No users found.' : 'No other users yet!'} />
              : others.map((u) => (
                  <UserRow key={u.id} user={u}
                    onClick={() => Friends.isFriend(me.id, u.id) ? onOpenChat(u) : undefined}
                    action={<FriendAction user={u} />}
                  />
                ))
            }
          </>
        )}

        {tab === 'friends' && (
          <>
            {friends.length === 0
              ? <EmptyState icon="🤝" text="No friends yet. Send some requests!" />
              : friends.map((u) => (
                  <UserRow key={u.id} user={u}
                    onClick={() => onOpenChat(u)}
                    action={
                      <button onClick={(e) => { e.stopPropagation(); onOpenChat(u); }} style={smallBtn('#7C3AED')}>
                        Chat
                      </button>
                    }
                  />
                ))
            }
          </>
        )}

        {tab === 'requests' && (
          <>
            {incoming.length > 0 && (
              <div>
                <div style={{ padding: '14px 20px 6px', color: '#6B7280', fontSize: 11, fontWeight: 600, letterSpacing: 1 }}>
                  INCOMING REQUESTS
                </div>
                {incoming.map((req) => {
                  const from = DB.users.find((u) => u.id === req.fromId);
                  if (!from) return null;
                  return (
                    <div key={req.id} style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '12px 20px', borderBottom: '1px solid #0a0a0a',
                    }}>
                      <Avatar user={from} size={46} />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{from.name}</div>
                        <div style={{ color: '#555', fontSize: 12 }}>{from.email}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { Friends.accept(req.id); setTick((t) => t + 1); }} style={smallBtn('#22C55E')}>Accept</button>
                        <button onClick={() => { Friends.reject(req.id); setTick((t) => t + 1); }} style={smallBtn('#1a1a1a', '#EF4444')}>Decline</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {sent.length > 0 && (
              <div>
                <div style={{ padding: '14px 20px 6px', color: '#6B7280', fontSize: 11, fontWeight: 600, letterSpacing: 1 }}>
                  SENT REQUESTS
                </div>
                {sent.map((req) => {
                  const to = DB.users.find((u) => u.id === req.toId);
                  if (!to) return null;
                  return (
                    <div key={req.id} style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '12px 20px', borderBottom: '1px solid #0a0a0a',
                    }}>
                      <Avatar user={to} size={46} />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{to.name}</div>
                        <div style={{ color: '#7C3AED', fontSize: 12 }}>Request pending...</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {incoming.length === 0 && sent.length === 0 && (
              <EmptyState icon="📨" text="No pending friend requests." />
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 20px', borderTop: '1px solid #111',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#050505',
      }}>
        <div>
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{me.name}</div>
          <div style={{ color: '#22C55E', fontSize: 11, marginTop: 1 }}>● Online</div>
        </div>
        <button
          onClick={onLogout}
          style={{
            background: '#111', border: '1px solid #222', color: '#6B7280',
            padding: '7px 16px', borderRadius: 10, cursor: 'pointer',
            fontSize: 13, fontFamily: "'Sora', sans-serif",
          }}
        >
          Sign Out
        </button>
      </div>

      {showProfile && (
        <ProfileEditModal
          user={me}
          onClose={() => setShowProfile(false)}
          onSave={(updated) => refreshMe(updated)}
        />
      )}
    </div>
  );
}
