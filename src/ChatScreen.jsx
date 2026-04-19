import { useState, useEffect, useRef, useCallback } from 'react';
import { DB } from '../services/db';
import { Auth } from '../services/auth';
import { Messages } from '../services/messages';
import Avatar from '../components/Avatar';
import { fmtTime, fmtDate, EMOJIS } from '../utils/helpers';

export default function ChatScreen({ currentUser, otherUser: initialOther, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showVanishConfirm, setShowVanishConfirm] = useState(false);
  const [otherUser, setOtherUser] = useState(initialOther);
  const [me] = useState(() => DB.users.find((u) => u.id === currentUser.id) || currentUser);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  const loadMessages = useCallback(() => {
    const fresh = DB.users.find((u) => u.id === otherUser.id);
    if (fresh) setOtherUser(fresh);
    setMessages(Messages.getChat(currentUser.id, otherUser.id));
  }, [currentUser.id, otherUser.id]);

  useEffect(() => {
    loadMessages();
    Auth.updateOnline(currentUser.id);
    const iv = setInterval(() => {
      Auth.updateOnline(currentUser.id);
      loadMessages();
    }, 3000);
    return () => clearInterval(iv);
  }, [loadMessages, currentUser.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    Messages.send(currentUser.id, otherUser.id, trimmed);
    setText('');
    setShowEmoji(false);
    // Hide keyboard on mobile
    if (inputRef.current) {
      inputRef.current.blur();
      setTimeout(() => inputRef.current?.focus(), 10);
    }
    loadMessages();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleVanish = () => {
    Messages.vanishChat(currentUser.id, otherUser.id);
    setShowVanishConfirm(false);
    loadMessages();
  };

  const privacy = Auth.getPrivacy(otherUser.id);
  const online = privacy.showOnline !== false && Auth.isOnline(otherUser.id);
  const lastSeenText = privacy.lastSeen !== false ? Auth.lastSeen(otherUser.id) : null;

  // Group by date
  const grouped = [];
  let lastDate = null;
  messages.forEach((msg) => {
    const d = fmtDate(msg.timestamp);
    if (d !== lastDate) {
      grouped.push({ type: 'date', label: d, key: `date-${d}` });
      lastDate = d;
    }
    grouped.push({ type: 'msg', msg, key: msg.id });
  });

  const freshMe = DB.users.find((u) => u.id === currentUser.id) || me;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#000', fontFamily: "'Sora', sans-serif" }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px', background: '#050505',
        borderBottom: '1px solid #111',
        backgroundImage: 'linear-gradient(180deg, rgba(124,58,237,0.07) 0%, transparent 100%)',
        flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', color: '#7C3AED',
            fontSize: 22, cursor: 'pointer', padding: '4px 8px 4px 0',
            display: 'flex', alignItems: 'center',
          }}
        >
          ←
        </button>
        <Avatar user={otherUser} size={42} showOnline />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {otherUser.name}
          </div>
          <div style={{ fontSize: 12, color: online ? '#22C55E' : '#555', marginTop: 1 }}>
            {online ? '● Online now' : lastSeenText ? `Last seen ${lastSeenText}` : ''}
          </div>
        </div>
        <button
          onClick={() => setShowVanishConfirm(true)}
          title="Vanish chat"
          style={{
            background: '#111', border: '1px solid #1a1a1a',
            borderRadius: '50%', width: 38, height: 38,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, cursor: 'pointer',
          }}
        >
          👻
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '12px 14px',
        display: 'flex', flexDirection: 'column',
      }}>
        {messages.length === 0 && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', color: '#333',
          }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>💬</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#444' }}>Start the conversation</div>
            <div style={{ fontSize: 13, color: '#333', marginTop: 6 }}>Say hi to {otherUser.name}!</div>
          </div>
        )}

        {grouped.map((item) => {
          if (item.type === 'date') {
            return (
              <div key={item.key} style={{ textAlign: 'center', margin: '10px 0' }}>
                <span style={{
                  color: '#555', fontSize: 11,
                  background: '#0d0d0d', padding: '4px 12px', borderRadius: 10,
                }}>
                  {item.label}
                </span>
              </div>
            );
          }

          const { msg } = item;
          const isMine = msg.senderId === currentUser.id;
          const displayUser = isMine ? freshMe : otherUser;

          return (
            <div
              key={item.key}
              style={{
                display: 'flex',
                flexDirection: isMine ? 'row-reverse' : 'row',
                alignItems: 'flex-end',
                gap: 8, marginBottom: 6,
              }}
            >
              {!isMine && <Avatar user={displayUser} size={30} />}

              <div style={{ maxWidth: '74%' }}>
                {!isMine && (
                  <div style={{ color: '#A78BFA', fontSize: 11, marginBottom: 3, marginLeft: 2 }}>
                    {displayUser.name}
                  </div>
                )}
                <div style={{
                  background: isMine
                    ? 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)'
                    : '#1F1F1F',
                  color: '#fff',
                  padding: '10px 14px',
                  borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  fontSize: 14, lineHeight: 1.55, wordBreak: 'break-word',
                  boxShadow: isMine ? '0 2px 16px rgba(124,58,237,0.3)' : 'none',
                }}>
                  {msg.text}
                </div>
                <div style={{
                  color: '#3a3a3a', fontSize: 10, marginTop: 3,
                  textAlign: isMine ? 'right' : 'left',
                }}>
                  {fmtTime(msg.timestamp)}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Emoji Picker */}
      {showEmoji && (
        <div style={{
          background: '#0d0d0d', borderTop: '1px solid #1a1a1a',
          padding: '12px 14px', display: 'flex', flexWrap: 'wrap',
          gap: 6, maxHeight: 160, overflowY: 'auto', flexShrink: 0,
        }}>
          {EMOJIS.map((em) => (
            <button
              key={em}
              onClick={() => {
                setText((t) => t + em);
                inputRef.current?.focus();
              }}
              style={{
                background: 'none', border: 'none', fontSize: 23,
                cursor: 'pointer', padding: '2px 3px',
                borderRadius: 6, transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#1a1a1a')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              {em}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 8,
        padding: '10px 14px 12px',
        background: '#050505', borderTop: '1px solid #111', flexShrink: 0,
      }}>
        {/* Emoji toggle */}
        <button
          onClick={() => setShowEmoji((e) => !e)}
          style={{
            background: showEmoji ? '#7C3AED' : '#111',
            border: '1px solid #1a1a1a',
            borderRadius: '50%', width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 19, cursor: 'pointer', flexShrink: 0,
            transition: 'background 0.2s',
          }}
        >
          😊
        </button>

        {/* Text input */}
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          rows={1}
          style={{
            flex: 1, background: '#111', border: '1.5px solid #1a1a1a',
            borderRadius: 22, padding: '10px 16px',
            color: '#fff', fontSize: 14, resize: 'none',
            outline: 'none', fontFamily: "'Sora', sans-serif",
            lineHeight: 1.5, maxHeight: 110, overflowY: 'auto',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#7C3AED')}
          onBlur={(e) => (e.target.style.borderColor = '#1a1a1a')}
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 110) + 'px';
          }}
        />

        {/* Send button */}
        <button
          onClick={sendMessage}
          disabled={!text.trim()}
          style={{
            background: text.trim()
              ? 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)'
              : '#111',
            border: '1px solid ' + (text.trim() ? 'transparent' : '#1a1a1a'),
            borderRadius: '50%', width: 42, height: 42,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: text.trim() ? 'pointer' : 'not-allowed', flexShrink: 0,
            transition: 'all 0.2s',
            boxShadow: text.trim() ? '0 2px 16px rgba(124,58,237,0.5)' : 'none',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Vanish Confirm Modal */}
      {showVanishConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '0 20px',
        }}>
          <div style={{
            background: '#0d0d0d', border: '1px solid #222',
            borderRadius: 20, padding: '32px 24px', maxWidth: 320,
            width: '100%', textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>👻</div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 10 }}>
              Vanish this chat?
            </div>
            <div style={{ color: '#666', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
              All messages with <span style={{ color: '#A78BFA' }}>{otherUser.name}</span> will be permanently deleted for both of you.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowVanishConfirm(false)}
                style={{
                  flex: 1, padding: '13px', borderRadius: 12,
                  border: '1px solid #2a2a2a', background: 'transparent',
                  color: '#aaa', cursor: 'pointer', fontFamily: "'Sora', sans-serif",
                  fontWeight: 500, fontSize: 14,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleVanish}
                style={{
                  flex: 1, padding: '13px', borderRadius: 12,
                  border: 'none', background: '#EF4444',
                  color: '#fff', cursor: 'pointer',
                  fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 14,
                }}
              >
                Vanish 🔥
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
