import { useState, useEffect, useRef, useCallback } from "react";

// ─── Google Font ───────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

// ─── In-Memory Database ────────────────────────────────────
if (!window.__vz) {
  window.__vz = { users: [], messages: [], requests: [], online: {}, privacy: {} };
}
const DB = window.__vz;

// ─── Helpers ──────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const ts = () => Date.now();
const chatId = (a, b) => [a, b].sort().join("::");
const tf = (t) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const df = (t) => {
  const d = new Date(t), today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};
const ac = (n = "?") => {
  const cols = ["#7C3AED","#6D28D9","#5B21B6","#8B5CF6","#A78BFA","#9333EA"];
  let h = 0; for (let c of n) h = c.charCodeAt(0) + ((h << 5) - h);
  return cols[Math.abs(h) % cols.length];
};
const ini = (n = "?") => n.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
const EMOJIS = ["😀","😂","😍","🥰","😎","🤔","😢","😡","👍","👎","❤️","🔥","✨","🎉","💯","🙏","👀","💪","😭","🤣","😊","😏","🥺","😴","🤗","💀","👋","🎊","🌟","💫","⚡","🎯","🌈","💎","🚀","🍕","🎮","🏆","💰","🌸"];

// ─── Services ─────────────────────────────────────────────
const Auth = {
  signup(name, email, pass) {
    email = email.trim().toLowerCase();
    if (DB.users.find(u => u.email === email)) return { err: "Email already registered" };
    if (pass.length < 6) return { err: "Password needs 6+ characters" };
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
    const d = ts() - l;
    if (d < 60000) return "just now";
    if (d < 3600000) return `${Math.floor(d/60000)}m ago`;
    if (d < 86400000) return `${Math.floor(d/3600000)}h ago`;
    return df(l);
  },
  priv(id) { return DB.privacy[id] || { online:true, photo:true, bio:true, seen:true }; },
  updateProfile(id, fields) {
    const i = DB.users.findIndex(u => u.id === id);
    if (i !== -1) { DB.users[i] = { ...DB.users[i], ...fields }; return DB.users[i]; }
    return null;
  },
  setPriv(id, p) { DB.privacy[id] = { ...DB.privacy[id], ...p }; },
};

const Msg = {
  send(from, to, text) {
    const m = { id: uid(), text, from, to, cid: chatId(from, to), at: ts(), gone: false };
    DB.messages.push(m); return m;
  },
  get(a, b) {
    const cid = chatId(a, b);
    return DB.messages.filter(m => m.cid === cid && !m.gone).sort((a, b) => a.at - b.at).slice(-50);
  },
  vanish(a, b) {
    const cid = chatId(a, b); DB.messages.forEach(m => { if (m.cid === cid) m.gone = true; });
  },
  last(a, b) {
    const cid = chatId(a, b);
    return DB.messages.filter(m => m.cid === cid && !m.gone).sort((a, b) => b.at - a.at)[0] || null;
  },
};

const Fr = {
  send(from, to) {
    if (DB.requests.find(r => (r.from===from&&r.to===to)||(r.from===to&&r.to===from))) return;
    DB.requests.push({ id: uid(), from, to, st: "pending", at: ts() });
  },
  accept(rid) { const r = DB.requests.find(r=>r.id===rid); if(r) r.st="accepted"; },
  reject(rid) { const r = DB.requests.find(r=>r.id===rid); if(r) r.st="rejected"; },
  rel(a, b) { return DB.requests.find(r=>(r.from===a&&r.to===b)||(r.from===b&&r.to===a))||null; },
  incoming(id) { return DB.requests.filter(r=>r.to===id&&r.st==="pending"); },
  sent(id) { return DB.requests.filter(r=>r.from===id&&r.st==="pending"); },
};

// ─── Shared styles ─────────────────────────────────────────
const inp = {
  width:"100%", padding:"12px 14px", borderRadius:12,
  background:"#111", border:"1.5px solid #222", color:"#fff",
  fontSize:14, outline:"none", fontFamily:"Sora,sans-serif", boxSizing:"border-box",
};
const sBtn = (bg="#7C3AED") => ({
  background:bg, border:"none", color:"#fff",
  padding:"6px 12px", borderRadius:8, cursor:"pointer",
  fontSize:12, fontWeight:600, fontFamily:"Sora,sans-serif", whiteSpace:"nowrap",
});

// ─── Avatar ───────────────────────────────────────────────
function Av({ user, size=40, showOnline=false }) {
  const p = Auth.priv(user?.id);
  const isOn = showOnline && p.online && Auth.isOnline(user?.id);
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      {user?.photo && p.photo
        ? <img src={user.photo} alt="" style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", border:"2px solid #7C3AED" }}/>
        : <div style={{ width:size, height:size, borderRadius:"50%", background:`linear-gradient(135deg,${ac(user?.name)},${ac((user?.name||"")+"1")})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*.35, fontWeight:700, color:"#fff", border:"2px solid #7C3AED" }}>{ini(user?.name)}</div>
      }
      {showOnline && <div style={{ position:"absolute", bottom:1, right:1, width:size*.27, height:size*.27, borderRadius:"50%", background:isOn?"#22C55E":"#374151", border:"2px solid #000", transition:"background .3s" }}/>}
    </div>
  );
}

// ─── Profile Modal ────────────────────────────────────────
function ProfileModal({ user, onClose, onSave }) {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio||"");
  const [photo, setPhoto] = useState(user.photo||null);
  const [priv, setPriv] = useState(Auth.priv(user.id));
  const fr = useRef();

  const save = () => {
    const u = Auth.updateProfile(user.id, { name:name.trim()||user.name, bio, photo });
    Auth.setPriv(user.id, priv);
    onSave(u || {...user,name,bio,photo});
    onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.92)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999, padding:"0 16px" }}>
      <div style={{ background:"#0a0a0a", border:"1px solid #1f1f1f", borderRadius:20, padding:"26px 22px", width:"100%", maxWidth:360, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 0 60px rgba(124,58,237,.2)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <span style={{ color:"#fff", fontWeight:700, fontSize:17 }}>Edit Profile</span>
          <button onClick={onClose} style={{ background:"#1a1a1a", border:"1px solid #222", color:"#aaa", width:30, height:30, borderRadius:"50%", cursor:"pointer", fontSize:13 }}>✕</button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:20 }}>
          <div style={{ position:"relative", cursor:"pointer" }} onClick={()=>fr.current.click()}>
            {photo
              ? <img src={photo} alt="" style={{ width:80, height:80, borderRadius:"50%", objectFit:"cover", border:"3px solid #7C3AED" }}/>
              : <div style={{ width:80, height:80, borderRadius:"50%", background:`linear-gradient(135deg,${ac(name)},#4C1D95)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, fontWeight:700, color:"#fff", border:"3px solid #7C3AED" }}>{ini(name)}</div>
            }
            <div style={{ position:"absolute", bottom:2, right:2, background:"#7C3AED", borderRadius:"50%", width:24, height:24, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, border:"2px solid #000" }}>📷</div>
          </div>
          <input ref={fr} type="file" accept="image/*" style={{display:"none"}}
            onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setPhoto(ev.target.result);r.readAsDataURL(f);}}/>
          <span style={{ color:"#555", fontSize:12, marginTop:6 }}>Tap to change</span>
        </div>

        <div style={{ marginBottom:12 }}>
          <div style={{ color:"#6B7280", fontSize:11, fontWeight:600, marginBottom:5, letterSpacing:1 }}>NAME</div>
          <input value={name} onChange={e=>setName(e.target.value)} style={inp}/>
        </div>
        <div style={{ marginBottom:18 }}>
          <div style={{ color:"#6B7280", fontSize:11, fontWeight:600, marginBottom:5, letterSpacing:1 }}>BIO</div>
          <textarea value={bio} onChange={e=>setBio(e.target.value)} rows={3} placeholder="About you..." style={{...inp,resize:"none",lineHeight:1.5}}/>
        </div>

        <div style={{ marginBottom:22 }}>
          <div style={{ color:"#6B7280", fontSize:11, fontWeight:600, marginBottom:10, letterSpacing:1 }}>PRIVACY</div>
          {[["online","Show online status"],["seen","Show last seen"],["photo","Show photo"],["bio","Show bio"]].map(([k,l])=>(
            <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10, paddingBottom:10, borderBottom:"1px solid #111" }}>
              <span style={{ color:"#ccc", fontSize:13 }}>{l}</span>
              <div onClick={()=>setPriv(p=>({...p,[k]:!p[k]}))} style={{ width:42, height:22, borderRadius:11, background:priv[k]?"#7C3AED":"#2a2a2a", cursor:"pointer", position:"relative", transition:"background .25s" }}>
                <div style={{ position:"absolute", top:2, left:priv[k]?21:2, width:18, height:18, borderRadius:"50%", background:"#fff", transition:"left .25s" }}/>
              </div>
            </div>
          ))}
        </div>
        <button onClick={save} style={{ width:"100%", padding:"13px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#7C3AED,#6D28D9)", color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"Sora,sans-serif", boxShadow:"0 4px 20px rgba(124,58,237,.35)" }}>
          Save Changes
        </button>
      </div>
    </div>
  );
}

// ─── Auth Screen ──────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = () => {
    setErr("");
    if (mode === "signup" && !name.trim()) { setErr("Please enter your name"); return; }
    if (!email.trim()) { setErr("Please enter your email"); return; }
    if (!pass) { setErr("Please enter your password"); return; }
    setBusy(true);
    // Use setTimeout so React renders the "busy" state before running sync logic
    setTimeout(() => {
      const res = mode === "signup"
        ? Auth.signup(name, email, pass)
        : Auth.login(email, pass);
      setBusy(false);
      if (res.err) { setErr(res.err); return; }
      onLogin(res.user);
    }, 280);
  };

  const sw = (m) => { setMode(m); setErr(""); setName(""); setEmail(""); setPass(""); };
  const onKey = (e) => { if (e.key === "Enter") submit(); };

  const field = (extra) => ({
    ...inp, marginBottom:0,
    onFocus: e => e.target.style.borderColor = "#7C3AED",
    onBlur: e => e.target.style.borderColor = "#222",
    onKeyDown: onKey,
    ...extra,
  });

  return (
    <div style={{ minHeight:"100vh", background:"#000", display:"flex", alignItems:"center", justifyContent:"center", padding:"0 20px", backgroundImage:"radial-gradient(ellipse 80% 45% at 50% -5%,rgba(124,58,237,.25) 0%,transparent 70%)", fontFamily:"Sora,sans-serif" }}>
      <div style={{ width:"100%", maxWidth:400 }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ fontSize:52, fontWeight:900, letterSpacing:"-2px", background:"linear-gradient(135deg,#7C3AED 30%,#A78BFA)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", lineHeight:1 }}>VibeZ</div>
          <div style={{ color:"#374151", fontSize:13, marginTop:8, letterSpacing:.5 }}>Private chats. Your vibe.</div>
        </div>

        <div style={{ background:"#0A0A0A", border:"1px solid #1a1a1a", borderRadius:22, padding:"28px 24px", boxShadow:"0 0 80px rgba(124,58,237,.1)" }}>
          {/* Tabs */}
          <div style={{ display:"flex", background:"#111", borderRadius:13, padding:4, marginBottom:24 }}>
            {[["login","Sign In"],["signup","Sign Up"]].map(([id,l])=>(
              <button key={id} onClick={()=>sw(id)} style={{ flex:1, padding:"11px 0", border:"none", borderRadius:10, background:mode===id?"#7C3AED":"transparent", color:mode===id?"#fff":"#555", fontWeight:mode===id?700:500, fontSize:14, cursor:"pointer", fontFamily:"Sora,sans-serif", boxShadow:mode===id?"0 2px 12px rgba(124,58,237,.4)":"none", transition:"all .2s" }}>{l}</button>
            ))}
          </div>

          {/* Inputs */}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {mode === "signup" && (
              <div>
                <div style={{ color:"#6B7280", fontSize:11, fontWeight:600, marginBottom:5, letterSpacing:1 }}>FULL NAME</div>
                <input {...field({ type:"text", value:name, onChange:e=>setName(e.target.value), placeholder:"Your full name", autoComplete:"name" })}/>
              </div>
            )}
            <div>
              <div style={{ color:"#6B7280", fontSize:11, fontWeight:600, marginBottom:5, letterSpacing:1 }}>EMAIL</div>
              <input {...field({ type:"email", value:email, onChange:e=>setEmail(e.target.value), placeholder:"you@example.com", autoComplete:"email" })}/>
            </div>
            <div>
              <div style={{ color:"#6B7280", fontSize:11, fontWeight:600, marginBottom:5, letterSpacing:1 }}>PASSWORD</div>
              <input {...field({ type:"password", value:pass, onChange:e=>setPass(e.target.value), placeholder:mode==="signup"?"Min 6 characters":"••••••••", autoComplete:mode==="signup"?"new-password":"current-password" })}/>
            </div>
          </div>

          {/* Error */}
          {err && (
            <div style={{ marginTop:12, background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.22)", borderRadius:10, padding:"9px 13px", color:"#F87171", fontSize:13, textAlign:"center" }}>
              {err}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={submit}
            disabled={busy}
            style={{
              width:"100%", marginTop:18, padding:"14px", borderRadius:13, border:"none",
              background: busy ? "#1f1f1f" : "linear-gradient(135deg,#7C3AED 0%,#6D28D9 100%)",
              color: busy ? "#555" : "#fff", fontWeight:700, fontSize:15,
              cursor: busy ? "not-allowed" : "pointer",
              fontFamily:"Sora,sans-serif",
              boxShadow: busy ? "none" : "0 4px 24px rgba(124,58,237,.45)",
              transition:"all .2s",
            }}
          >
            {busy ? "Please wait..." : mode === "login" ? "Sign In →" : "Create Account →"}
          </button>

          <div style={{ textAlign:"center", marginTop:15, color:"#374151", fontSize:13 }}>
            {mode==="login" ? "New here? " : "Have an account? "}
            <span onClick={()=>sw(mode==="login"?"signup":"login")} style={{ color:"#A78BFA", cursor:"pointer", fontWeight:600 }}>
              {mode==="login" ? "Sign Up" : "Sign In"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Users List Screen ────────────────────────────────────
function UsersListScreen({ me: initMe, onChat, onLogout }) {
  const [me, setMe] = useState(initMe);
  const [tab, setTab] = useState("people");
  const [search, setSearch] = useState("");
  const [showProf, setShowProf] = useState(false);
  const [tick, setTick] = useState(0);
  const rerender = () => setTick(t=>t+1);

  useEffect(() => {
    Auth.ping(me.id);
    const iv = setInterval(() => { Auth.ping(me.id); rerender(); }, 4000);
    return () => clearInterval(iv);
  }, [me.id]);

  const others = DB.users.filter(u => u.id !== me.id && (
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  ));
  const friends = DB.users.filter(u => u.id !== me.id && Fr.rel(me.id,u.id)?.st === "accepted");
  const inc = Fr.incoming(me.id);
  const snt = Fr.sent(me.id);

  const Row = ({ user, onClick, right }) => {
    const p = Auth.priv(user.id);
    const on = p.online && Auth.isOnline(user.id);
    const last = Msg.last(me.id, user.id);
    return (
      <div onClick={onClick} style={{ display:"flex", alignItems:"center", gap:13, padding:"12px 18px", cursor:onClick?"pointer":"default", borderBottom:"1px solid #080808", transition:"background .15s" }}
        onMouseEnter={e=>e.currentTarget.style.background="#0a0a0a"}
        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
        <Av user={user} size={50} showOnline/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <div style={{ color:"#fff", fontWeight:600, fontSize:15, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"64%" }}>{user.name}</div>
            {last && <div style={{ color:"#333", fontSize:11 }}>{tf(last.at)}</div>}
          </div>
          <div style={{ color:"#444", fontSize:13, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {last ? (last.from===me.id ? `You: ${last.text}` : last.text)
              : on ? "🟢 Online"
              : p.seen ? `Last seen ${Auth.lastSeen(user.id)}`
              : user.email}
          </div>
        </div>
        {right && <div onClick={e=>e.stopPropagation()}>{right}</div>}
      </div>
    );
  };

  const FrBtn = ({ user }) => {
    const r = Fr.rel(me.id, user.id);
    if (!r) return <button onClick={()=>{Fr.send(me.id,user.id);rerender();}} style={sBtn()}>Add Friend</button>;
    if (r.st==="pending"&&r.from===me.id) return <span style={{color:"#6B7280",fontSize:12}}>Sent ✓</span>;
    if (r.st==="pending"&&r.to===me.id) return (
      <div style={{display:"flex",gap:5}}>
        <button onClick={()=>{Fr.accept(r.id);rerender();}} style={sBtn("#22C55E")}>✓</button>
        <button onClick={()=>{Fr.reject(r.id);rerender();}} style={sBtn("#EF4444")}>✕</button>
      </div>
    );
    if (r.st==="accepted") return <button onClick={()=>onChat(user)} style={sBtn()}>Chat</button>;
    return null;
  };

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", background:"#000", fontFamily:"Sora,sans-serif" }}>
      {/* Header */}
      <div style={{ background:"#000", borderBottom:"1px solid #111", backgroundImage:"linear-gradient(180deg,rgba(124,58,237,.1) 0%,transparent 100%)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 18px 11px" }}>
          <div style={{ fontSize:26, fontWeight:900, letterSpacing:"-1px", background:"linear-gradient(135deg,#7C3AED,#A78BFA)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>VibeZ</div>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            {inc.length > 0 && <div style={{ background:"#EF4444", borderRadius:"50%", width:19, height:19, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"#fff", fontWeight:700 }}>{inc.length}</div>}
            <div onClick={()=>setShowProf(true)} style={{ cursor:"pointer" }}><Av user={me} size={36} showOnline/></div>
          </div>
        </div>
        <div style={{ padding:"0 15px 11px", position:"relative" }}>
          <span style={{ position:"absolute", left:26, top:"46%", transform:"translateY(-50%)", color:"#444", fontSize:13 }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search people..."
            style={{...inp, paddingLeft:34, borderRadius:20, fontSize:13, marginBottom:0}}/>
        </div>
        <div style={{ display:"flex" }}>
          {[["people","People"],["friends",`Friends${friends.length?` (${friends.length})`:""}`],["requests",`Requests${inc.length?` · ${inc.length}`:""}`]].map(([id,l])=>(
            <button key={id} onClick={()=>setTab(id)} style={{ flex:1, padding:"9px 4px 10px", border:"none", background:"transparent", cursor:"pointer", color:tab===id?"#A78BFA":"#444", fontWeight:tab===id?700:400, fontSize:12, borderBottom:tab===id?"2px solid #7C3AED":"2px solid transparent", fontFamily:"Sora,sans-serif", transition:"all .2s" }}>{l}</button>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ flex:1, overflowY:"auto" }}>
        {tab==="people" && (others.length===0
          ? <Empty icon="👥" text={search?"No users found.":"No other users yet!"}/>
          : others.map(u=><Row key={u.id} user={u} onClick={Fr.rel(me.id,u.id)?.st==="accepted"?()=>onChat(u):undefined} right={<FrBtn user={u}/>}/>)
        )}
        {tab==="friends" && (friends.length===0
          ? <Empty icon="🤝" text="No friends yet. Send some requests!"/>
          : friends.map(u=><Row key={u.id} user={u} onClick={()=>onChat(u)} right={<button onClick={()=>onChat(u)} style={sBtn()}>Chat</button>}/>)
        )}
        {tab==="requests" && (<>
          {inc.length>0 && (<>
            <Sect label="INCOMING"/>
            {inc.map(r=>{
              const f=DB.users.find(u=>u.id===r.from);
              return f&&<div key={r.id} style={{display:"flex",alignItems:"center",gap:13,padding:"11px 18px",borderBottom:"1px solid #080808"}}>
                <Av user={f} size={46}/>
                <div style={{flex:1}}><div style={{color:"#fff",fontWeight:600,fontSize:14}}>{f.name}</div><div style={{color:"#555",fontSize:12}}>{f.email}</div></div>
                <div style={{display:"flex",gap:7}}>
                  <button onClick={()=>{Fr.accept(r.id);rerender();}} style={sBtn("#22C55E")}>Accept</button>
                  <button onClick={()=>{Fr.reject(r.id);rerender();}} style={{...sBtn("#111"),border:"1px solid #333",color:"#EF4444"}}>Decline</button>
                </div>
              </div>;
            })}
          </>)}
          {snt.length>0 && (<>
            <Sect label="SENT"/>
            {snt.map(r=>{
              const t=DB.users.find(u=>u.id===r.to);
              return t&&<div key={r.id} style={{display:"flex",alignItems:"center",gap:13,padding:"11px 18px",borderBottom:"1px solid #080808"}}>
                <Av user={t} size={46}/>
                <div style={{flex:1}}><div style={{color:"#fff",fontWeight:600,fontSize:14}}>{t.name}</div><div style={{color:"#7C3AED",fontSize:12}}>Pending...</div></div>
              </div>;
            })}
          </>)}
          {inc.length===0&&snt.length===0&&<Empty icon="📨" text="No pending requests."/>}
        </>)}
      </div>

      {/* Footer */}
      <div style={{ padding:"11px 18px", borderTop:"1px solid #111", display:"flex", alignItems:"center", justifyContent:"space-between", background:"#050505" }}>
        <div>
          <div style={{ color:"#fff", fontSize:14, fontWeight:600 }}>{me.name}</div>
          <div style={{ color:"#22C55E", fontSize:11, marginTop:1 }}>● Online</div>
        </div>
        <button onClick={onLogout} style={{ background:"#111", border:"1px solid #1f1f1f", color:"#6B7280", padding:"7px 14px", borderRadius:9, cursor:"pointer", fontSize:13, fontFamily:"Sora,sans-serif" }}>Sign Out</button>
      </div>

      {showProf && <ProfileModal user={me} onClose={()=>setShowProf(false)} onSave={u=>setMe(u)}/>}
    </div>
  );
}

const Empty = ({icon,text}) => <div style={{textAlign:"center",padding:"70px 20px",color:"#333"}}><div style={{fontSize:44,marginBottom:12}}>{icon}</div><div style={{fontSize:14}}>{text}</div></div>;
const Sect = ({label}) => <div style={{padding:"13px 18px 5px",color:"#6B7280",fontSize:11,fontWeight:600,letterSpacing:1}}>{label}</div>;

// ─── Chat Screen ──────────────────────────────────────────
function ChatScreen({ me, other: initOther, onBack }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showVanish, setShowVanish] = useState(false);
  const [other, setOther] = useState(initOther);
  const inputRef = useRef();
  const bottomRef = useRef();

  const load = useCallback(() => {
    const fresh = DB.users.find(u => u.id === other.id);
    if (fresh) setOther(fresh);
    setMsgs(Msg.get(me.id, other.id));
  }, [me.id, other.id]);

  useEffect(() => {
    load(); Auth.ping(me.id);
    const iv = setInterval(() => { load(); Auth.ping(me.id); }, 3000);
    return () => clearInterval(iv);
  }, [load, me.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  const send = () => {
    const t = text.trim(); if (!t) return;
    Msg.send(me.id, other.id, t);
    setText(""); setShowEmoji(false);
    inputRef.current?.blur();
    load();
  };

  const priv = Auth.priv(other.id);
  const on = priv.online && Auth.isOnline(other.id);

  const grouped = [];
  let ld = null;
  msgs.forEach(m => {
    const d = df(m.at); if (d!==ld) { grouped.push({d:true,l:d,k:"d"+d}); ld=d; }
    grouped.push({m,k:m.id});
  });
  const freshMe = DB.users.find(u=>u.id===me.id)||me;

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", background:"#000", fontFamily:"Sora,sans-serif" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:11, padding:"10px 14px", background:"#050505", borderBottom:"1px solid #111", backgroundImage:"linear-gradient(180deg,rgba(124,58,237,.07) 0%,transparent 100%)", flexShrink:0 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:"#7C3AED", fontSize:22, cursor:"pointer", padding:"3px 8px 3px 0", display:"flex", alignItems:"center" }}>←</button>
        <Av user={other} size={41} showOnline/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ color:"#fff", fontWeight:700, fontSize:15, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{other.name}</div>
          <div style={{ fontSize:11, color:on?"#22C55E":"#555", marginTop:1 }}>{on?"● Online now":priv.seen?`Last seen ${Auth.lastSeen(other.id)}`:""}</div>
        </div>
        <button onClick={()=>setShowVanish(true)} style={{ background:"#111", border:"1px solid #1a1a1a", borderRadius:"50%", width:37, height:37, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, cursor:"pointer" }}>👻</button>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"10px 13px", display:"flex", flexDirection:"column" }}>
        {msgs.length===0 && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"#2a2a2a" }}>
            <div style={{ fontSize:50, marginBottom:12 }}>💬</div>
            <div style={{ fontSize:15, fontWeight:600, color:"#333" }}>Start chatting</div>
            <div style={{ fontSize:13, color:"#2a2a2a", marginTop:5 }}>Say hi to {other.name}!</div>
          </div>
        )}
        {grouped.map(item => {
          if (item.d) return <div key={item.k} style={{textAlign:"center",margin:"9px 0"}}><span style={{color:"#444",fontSize:11,background:"#0a0a0a",padding:"3px 11px",borderRadius:9}}>{item.l}</span></div>;
          const {m} = item;
          const mine = m.from === me.id;
          const u = mine ? freshMe : other;
          return (
            <div key={item.k} style={{ display:"flex", flexDirection:mine?"row-reverse":"row", alignItems:"flex-end", gap:7, marginBottom:5 }}>
              {!mine && <Av user={u} size={29}/>}
              <div style={{ maxWidth:"74%" }}>
                {!mine && <div style={{ color:"#A78BFA", fontSize:11, marginBottom:3, marginLeft:2 }}>{u.name}</div>}
                <div style={{ background:mine?"linear-gradient(135deg,#7C3AED,#6D28D9)":"#1F1F1F", color:"#fff", padding:"10px 14px", borderRadius:mine?"18px 18px 4px 18px":"18px 18px 18px 4px", fontSize:14, lineHeight:1.55, wordBreak:"break-word", boxShadow:mine?"0 2px 16px rgba(124,58,237,.3)":"none" }}>{m.text}</div>
                <div style={{ color:"#2a2a2a", fontSize:10, marginTop:3, textAlign:mine?"right":"left" }}>{tf(m.at)}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>

      {/* Emoji picker */}
      {showEmoji && (
        <div style={{ background:"#0a0a0a", borderTop:"1px solid #1a1a1a", padding:"10px 13px", display:"flex", flexWrap:"wrap", gap:5, maxHeight:150, overflowY:"auto", flexShrink:0 }}>
          {EMOJIS.map(e=>(
            <button key={e} onClick={()=>{setText(t=>t+e);inputRef.current?.focus();}}
              style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", padding:"3px 4px", borderRadius:6 }}
              onMouseEnter={e=>e.currentTarget.style.background="#1a1a1a"}
              onMouseLeave={e=>e.currentTarget.style.background="none"}
            >{e}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display:"flex", alignItems:"flex-end", gap:8, padding:"9px 13px 11px", background:"#050505", borderTop:"1px solid #111", flexShrink:0 }}>
        <button onClick={()=>setShowEmoji(e=>!e)} style={{ background:showEmoji?"#7C3AED":"#111", border:"1px solid #1a1a1a", borderRadius:"50%", width:40, height:40, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, cursor:"pointer", flexShrink:0, transition:"background .2s" }}>😊</button>
        <textarea
          ref={inputRef} value={text} onChange={e=>setText(e.target.value)} placeholder="Message..." rows={1}
          onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
          style={{ flex:1, background:"#111", border:"1.5px solid #1a1a1a", borderRadius:22, padding:"10px 15px", color:"#fff", fontSize:14, resize:"none", outline:"none", fontFamily:"Sora,sans-serif", lineHeight:1.5, maxHeight:108, overflowY:"auto", transition:"border-color .2s" }}
          onFocus={e=>e.target.style.borderColor="#7C3AED"}
          onBlur={e=>e.target.style.borderColor="#1a1a1a"}
          onInput={e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,108)+"px";}}
        />
        <button onClick={send} disabled={!text.trim()} style={{ background:text.trim()?"linear-gradient(135deg,#7C3AED,#6D28D9)":"#111", border:"1px solid "+(text.trim()?"transparent":"#1a1a1a"), borderRadius:"50%", width:42, height:42, display:"flex", alignItems:"center", justifyContent:"center", cursor:text.trim()?"pointer":"not-allowed", flexShrink:0, transition:"all .2s", boxShadow:text.trim()?"0 2px 16px rgba(124,58,237,.5)":"none" }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {/* Vanish modal */}
      {showVanish && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.9)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999, padding:"0 20px" }}>
          <div style={{ background:"#0a0a0a", border:"1px solid #1f1f1f", borderRadius:20, padding:"28px 22px", maxWidth:305, width:"100%", textAlign:"center" }}>
            <div style={{ fontSize:46, marginBottom:12 }}>👻</div>
            <div style={{ color:"#fff", fontWeight:700, fontSize:17, marginBottom:8 }}>Vanish this chat?</div>
            <div style={{ color:"#555", fontSize:13, marginBottom:24, lineHeight:1.6 }}>All messages with <span style={{color:"#A78BFA"}}>{other.name}</span> will be permanently deleted for both of you.</div>
            <div style={{ display:"flex", gap:9 }}>
              <button onClick={()=>setShowVanish(false)} style={{ flex:1, padding:12, borderRadius:11, border:"1px solid #2a2a2a", background:"transparent", color:"#aaa", cursor:"pointer", fontFamily:"Sora,sans-serif" }}>Cancel</button>
              <button onClick={()=>{Msg.vanish(me.id,other.id);setShowVanish(false);load();}} style={{ flex:1, padding:12, borderRadius:11, border:"none", background:"#EF4444", color:"#fff", cursor:"pointer", fontFamily:"Sora,sans-serif", fontWeight:700 }}>Vanish 🔥</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [chat, setChat] = useState(null);

  if (!user) return <AuthScreen onLogin={u => { setUser(u); setChat(null); }}/>;
  if (chat) return <ChatScreen me={user} other={chat} onBack={() => setChat(null)}/>;
  return <UsersListScreen me={user} onChat={setChat} onLogout={() => { setUser(null); setChat(null); }}/>;
}
