import { useState, useEffect, useRef, useCallback } from "react";

// --- Database & Services (Existing Logic) ---
if (!window.__vz) {
  window.__vz = { users: [], messages: [], requests: [], online: {}, privacy: {} };
}
const DB = window.__vz;

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const ts = () => Date.now();
const chatId = (a, b) => [a, b].sort().join("::");
const tf = (t) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const df = (t) => {
  const d = new Date(t), today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};
const ac = (n = "?") => {
  const cols = ["#7C3AED","#6D28D9","#5B21B6","#8B5CF6","#A78BFA","#9333EA"];
  let h = 0; for (let c of n) h = c.charCodeAt(0) + ((h << 5) - h);
  return cols[Math.abs(h) % cols.length];
};
const ini = (n = "?") => n.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

const Auth = {
  signup(name, email, pass) {
    email = email.trim().toLowerCase();
    if (DB.users.find(u => u.email === email)) return { err: "Email already registered" };
    const u = { id: uid(), name: name.trim(), email, pass, photo: null, bio: "", at: ts() };
    DB.users.push(u);
    DB.online[u.id] = ts();
    DB.privacy[u.id] = { online: true, photo: true, bio: true, seen: true };
    return { user: u };
  },
  login(email, pass) {
    email = email.trim().toLowerCase();
    const u = DB.users.find(u => u.email === email && u.pass === pass);
    if (!u) return { err: "Wrong email or password" };
    DB.online[u.id] = ts();
    return { user: u };
  },
  ping(id) { DB.online[id] = ts(); },
  isOnline(id) { const l = DB.online[id]; return !!l && ts() - l < 30000; },
  lastSeen(id) {
    const l = DB.online[id]; if (!l) return "never";
    return df(l);
  },
  priv(id) { return DB.privacy[id] || { online:true, photo:true, bio:true, seen:true }; }
};

// ... [Baqi sare functions: Msg, Fr, components: Av, AuthScreen, ChatScreen, etc.]
// NOTE: Yahan aap apna baki ka sara code paste karenge jo upar message mein tha.

export default function App() {
  const [user, setUser] = useState(null);
  const [chattingWith, setChattingWith] = useState(null);

  if (!user) return <AuthScreen onLogin={setUser} />;
  
  if (chattingWith) return (
    <ChatScreen me={user} other={chattingWith} onBack={() => setChattingWith(null)} />
  );

  return (
    <UsersListScreen me={user} onChat={setChattingWith} onLogout={() => setUser(null)} />
  );
}