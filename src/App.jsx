import { useState, useEffect, useCallback, createContext, useContext } from "react";

const ThemeCtx = createContext(null);

// ─── Config ───────────────────────────────────────────────────────
const STORAGE_KEY = "dog-registry-v2";
const ADMIN_PW_KEY = "dog-registry-admin-pw";
const DEFAULT_ADMIN_PW = "admin123";
const ADMIN_PHONE = "5492346306562";

// ─── Sample Data ──────────────────────────────────────────────────
const SAMPLE_DOGS = [
  {
    id: "s01", name: "Rocky", breed: "Labrador", color: "Dorado", size: "Grande", sex: "Macho",
    ownerName: "Martín López", ownerPhone: "+5492346301111", neighborhood: "Centro",
    notes: "Collar azul con chapita. Muy amigable.", photo: null, type: "owned",
    lostSince: new Date(Date.now() - 3 * 3600000).toISOString(),
    lastSeenLocation: "Plaza San Martín, Centro", sightings: [
      { id: "si1", text: "Lo vi corriendo por la plaza", location: "Plaza San Martín", date: new Date(Date.now() - 2 * 3600000).toISOString() },
      { id: "si2", text: "Estaba echado en la vereda de la panadería", location: "Av. Mitre 450", date: new Date(Date.now() - 1 * 3600000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: "s02", name: "Luna", breed: "Caniche", color: "Blanco", size: "Pequeño", sex: "Hembra",
    ownerName: "Carolina Ruiz", ownerPhone: "+5492346302222", neighborhood: "Barrio Norte",
    notes: "Moñito rosa y chip. Muy miedosa.", photo: null, type: "owned",
    lostSince: new Date(Date.now() - 18 * 3600000).toISOString(),
    lastSeenLocation: "Esquina de Belgrano y Sarmiento", sightings: [],
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: "s03", name: "Toto", breed: "Mestizo", color: "Marrón y negro", size: "Mediano", sex: "Macho",
    ownerName: "Pablo García", ownerPhone: "+5492346303333", neighborhood: "Las Quintas",
    notes: "Mancha blanca en el pecho. Le falta media oreja izquierda.", photo: null, type: "owned",
    lostSince: null, lastSeenLocation: null, sightings: [],
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: "s04", name: "Mora", breed: "Pastor Alemán", color: "Negro y fuego", size: "Grande", sex: "Hembra",
    ownerName: "Lucía Fernández", ownerPhone: "+5492346304444", neighborhood: "Villa del Parque",
    notes: "Muy obediente. Responde a silbidos. Chip y collar rojo.", photo: null, type: "owned",
    lostSince: null, lastSeenLocation: null, sightings: [],
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: "s05", name: "Manchas", breed: "Mestizo", color: "Blanco con manchas negras", size: "Mediano", sex: "Macho",
    ownerName: "—", ownerPhone: "", neighborhood: "Estación",
    notes: "Se lo ve siempre por la estación. Parece manso, se deja acariciar. Necesita hogar.",
    photo: null, type: "stray", lostSince: null, lastSeenLocation: "Estación de tren", sightings: [],
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

// ─── Utilities ────────────────────────────────────────────────────
const fileToBase64 = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
function elapsedStr(iso) {
  if (!iso) return "";
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000), h = Math.floor(m / 60), dy = Math.floor(h / 24);
  if (dy > 0) return `${dy}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}
function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

// ─── Theme ────────────────────────────────────────────────────────
const themes = {
  light: {
    bg: "#faf7f2", card: "#ffffff", accent: "#d35400", accentLt: "#fef0e5", accentDk: "#b84700",
    txt: "#2c2417", muted: "#8a7d6e", border: "#e6ddd2", borderLt: "#f0ebe3",
    ok: "#1a8c5b", okLt: "#e6f5ed", danger: "#c0392b", dangerLt: "#fbeae8",
    blue: "#2e86ab", blueLt: "#e8f4f8", blueDk: "#1b6d8a",
    purple: "#7c3aed", purpleLt: "#f3f0ff",
    navy: "#2d6a4f", navyLt: "#ecf5f0",
    shadow: "0 1px 3px rgba(44,36,23,0.05),0 4px 12px rgba(44,36,23,0.04)",
    shadowLg: "0 4px 12px rgba(44,36,23,0.08),0 12px 32px rgba(44,36,23,0.05)",
    headerBg: "linear-gradient(135deg,#1b4332,#2d6a4f)",
    inputBg: "#ffffff", inputBorder: "#e6ddd2",
  },
  dark: {
    bg: "#1a1814", card: "#262220", accent: "#e8873a", accentLt: "#302218", accentDk: "#f5a352",
    txt: "#ede8e0", muted: "#968e83", border: "#3a3430", borderLt: "#2e2a26",
    ok: "#4ade80", okLt: "#1a2e1e", danger: "#f87171", dangerLt: "#2e1a1a",
    blue: "#5cc8e8", blueLt: "#1a2830", blueDk: "#7dd8f0",
    purple: "#c4b5fd", purpleLt: "#24202e",
    navy: "#e8873a", navyLt: "#302218",
    shadow: "0 1px 3px rgba(0,0,0,0.25),0 4px 12px rgba(0,0,0,0.2)",
    shadowLg: "0 4px 12px rgba(0,0,0,0.35),0 12px 32px rgba(0,0,0,0.25)",
    headerBg: "linear-gradient(135deg,#c26a1a,#9a5210)",
    inputBg: "#262220", inputBorder: "#3a3430",
  },
};
const FONT = "'Nunito','Segoe UI',sans-serif";
const R = "14px", RS = "10px";

function getCSS(t) {
  return `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:${FONT};background:${t.bg};color:${t.txt};-webkit-font-smoothing:antialiased;transition:background .3s,color .3s}
input,select,textarea{font-family:${FONT};font-size:14px;border:1.5px solid ${t.inputBorder};border-radius:${RS};padding:10px 14px;background:${t.inputBg};color:${t.txt};transition:border-color .2s,box-shadow .2s,background .3s,color .3s;outline:none;width:100%}
input:focus,select:focus,textarea:focus{border-color:${t.blue};box-shadow:0 0 0 3px ${t.blueLt}}
textarea{resize:vertical;min-height:60px}
::placeholder{color:${t.muted};opacity:.7}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes lostPulse{0%,100%{box-shadow:0 0 0 0 rgba(192,57,43,.3)}50%{box-shadow:0 0 0 6px rgba(192,57,43,0)}}
.anim{animation:fadeIn .35s ease-out both}
.d1{animation-delay:.05s}.d2{animation-delay:.1s}.d3{animation-delay:.15s}.d4{animation-delay:.2s}
`;
}

function useT() { return useContext(ThemeCtx); }

// ─── Icons ────────────────────────────────────────────────────────
const I = {
  Paw: (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="8" cy="6" rx="2.5" ry="3"/><ellipse cx="16" cy="6" rx="2.5" ry="3"/><ellipse cx="5" cy="13" rx="2" ry="2.5"/><ellipse cx="19" cy="13" rx="2" ry="2.5"/><path d="M12 22c-3 0-5-2.5-5-5 0-2 1.5-4 5-4s5 2 5 4c0 2.5-2 5-5 5z"/></svg>,
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  Plus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
  Cam: (s=28) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>,
  Dog: (s=48) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5M14 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.344-2.5"/><path d="M8 14v.5M16 14v.5"/><path d="M11.25 16.25h1.5L12 17l-.75-.75z"/><path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444a11.702 11.702 0 0 0-.493-3.309"/></svg>,
  Back: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>,
  Phone: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Loc: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Sparkle: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>,
  Lock: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Unlock: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>,
  Shield: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Alert: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Share: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  Eye: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Heart: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Chart: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  MapPin: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Sun: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Moon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Home: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Instagram: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
};

// ─── Reusable ─────────────────────────────────────────────────────
function Btn({ children, onClick, v = "primary", sz = "md", disabled, style, icon }) {
  const T = useT();
  const vs = { primary: { bg: T.accent, c: "#fff", b: "none", h: T.accentDk }, secondary: { bg: "transparent", c: T.txt, b: `1.5px solid ${T.border}`, h: T.borderLt }, danger: { bg: "transparent", c: T.danger, b: `1.5px solid ${T.dangerLt}`, h: T.dangerLt }, ghost: { bg: "transparent", c: T.muted, b: "none", h: T.borderLt }, success: { bg: T.ok, c: "#fff", b: "none", h: "#24704a" } };
  const szs = { sm: { p: "6px 12px", f: "13px" }, md: { p: "10px 20px", f: "14px" }, lg: { p: "14px 28px", f: "15px" } };
  const vv = vs[v], ss = szs[sz];
  return <button onClick={onClick} disabled={disabled} style={{ padding: ss.p, fontSize: ss.f, background: disabled ? T.border : vv.bg, color: disabled ? T.muted : vv.c, border: vv.b, borderRadius: RS, fontFamily: FONT, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "6px", transition: "all .2s", ...style }} onMouseEnter={e => { if (!disabled) e.target.style.background = vv.h; }} onMouseLeave={e => { if (!disabled) e.target.style.background = disabled ? T.border : vv.bg; }}>{icon}{children}</button>;
}

function Card({ children, style, className }) {
  const T = useT();
  return <div className={className} style={{ background: T.card, borderRadius: R, border: `1px solid ${T.borderLt}`, boxShadow: T.shadow, ...style }}>{children}</div>;
}

function PhotoUp({ value, onChange, size = 120 }) {
  const T = useT();
  const hf = async (e) => { const f = e.target.files[0]; if (f) onChange(await fileToBase64(f)); };
  return <label style={{ width: size, height: size, borderRadius: R, border: `2px dashed ${value ? "transparent" : T.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", background: value ? "transparent" : T.accentLt, color: T.accent, flexShrink: 0 }}>
    {value ? <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <>{I.Cam()}<span style={{ fontSize: 11, fontWeight: 600, marginTop: 4 }}>Subir foto *</span></>}
    <input type="file" accept="image/*" onChange={hf} style={{ display: "none" }} />
  </label>;
}

function Badge({ children, bg, color }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: bg, color, letterSpacing: ".3px" }}>{children}</span>;
}

function TabBar({ tabs, active, onChange }) {
  const T = useT();
  const tabColors = { all: T.navy, lost: T.danger, stray: T.purple, stats: T.blue, shelter: "#e8873a" };
  return <div style={{ display: "flex", gap: 6, marginBottom: 16 }} className="anim">
    {tabs.map(t => {
      const isActive = active === t.id;
      const col = tabColors[t.id] || T.navy;
      return <button key={t.id} onClick={() => onChange(t.id)} style={{
        flex: 1, padding: "10px 6px", border: isActive ? "none" : `2px solid ${T.border}`,
        borderRadius: 12, fontFamily: FONT, fontSize: 12, fontWeight: 800,
        background: isActive ? col : T.card,
        color: isActive ? "#fff" : T.muted,
        cursor: "pointer", transition: "all .25s",
        boxShadow: isActive ? `0 4px 12px ${col}40` : "none",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
        transform: isActive ? "scale(1.03)" : "scale(1)",
      }}>
        {t.icon}{t.label}
        {t.count != null && <span style={{
          background: isActive ? "rgba(255,255,255,.25)" : T.borderLt,
          color: isActive ? "#fff" : T.muted,
          padding: "1px 6px", borderRadius: 10, fontSize: 10, fontWeight: 800,
        }}>{t.count}</span>}
      </button>;
    })}
  </div>;
}

function StatCard({ icon, label, value, bg, color, delay = 0 }) {
  const T = useT();
  return <div className={`anim d${delay}`} style={{ flex: 1, background: bg, borderRadius: RS, padding: "14px 8px", textAlign: "center" }}>
    <div style={{ marginBottom: 4, color }}>{icon}</div>
    <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 10, fontWeight: 600, color: T.muted, marginTop: 4 }}>{label}</div>
  </div>;
}

// ─── DogCard ──────────────────────────────────────────────────────
function DogCard({ dog, onClick, delay = 0 }) {
  const T = useT();
  const [el, setEl] = useState(() => elapsedStr(dog.lostSince));
  useEffect(() => { if (!dog.lostSince) return; setEl(elapsedStr(dog.lostSince)); const iv = setInterval(() => setEl(elapsedStr(dog.lostSince)), 30000); return () => clearInterval(iv); }, [dog.lostSince]);
  const lost = !!dog.lostSince, stray = dog.type === "stray";
  return (
    <Card className={`anim d${delay}`} style={{ cursor: "pointer", overflow: "hidden", transition: "transform .2s,box-shadow .2s", border: lost ? `2px solid ${T.danger}` : stray ? `2px solid ${T.purple}` : undefined, animation: lost ? "lostPulse 2s ease-in-out infinite" : undefined }}>
      {lost && <div style={{ background: T.danger, color: "#fff", padding: "6px 14px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between" }}><span style={{ display: "flex", alignItems: "center", gap: 5 }}>{I.Alert()} PERDIDO</span><span>⏱ hace {el}</span></div>}
      {stray && <div style={{ background: T.purple, color: "#fff", padding: "6px 14px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>{I.Heart()} EN BUSCA DE HOGAR</div>}
      <div onClick={() => onClick(dog)} onMouseEnter={e => { e.currentTarget.parentElement.style.transform = "translateY(-2px)"; e.currentTarget.parentElement.style.boxShadow = T.shadowLg; }} onMouseLeave={e => { e.currentTarget.parentElement.style.transform = "translateY(0)"; e.currentTarget.parentElement.style.boxShadow = T.shadow; }}>
        <div style={{ display: "flex", gap: 14, padding: 14 }}>
          {dog.photo ? <img src={dog.photo} alt={dog.name} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10, flexShrink: 0, ...(lost ? { filter: "saturate(.6)", border: `2px solid ${T.danger}` } : {}) }} /> : <div style={{ width: 72, height: 72, borderRadius: 10, flexShrink: 0, background: lost ? T.dangerLt : stray ? T.purpleLt : T.accentLt, display: "flex", alignItems: "center", justifyContent: "center", color: lost ? T.danger : stray ? T.purple : T.accent }}>{I.Dog()}</div>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2, color: lost ? T.danger : T.txt }}>{dog.name}</div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 6 }}>{[dog.breed, dog.color, dog.size].filter(Boolean).join(" · ")}</div>
            <div style={{ display: "flex", gap: 10, fontSize: 12, color: T.muted, flexWrap: "wrap" }}>
              {!stray && <span style={{ fontWeight: 600, color: T.txt }}>{dog.ownerName}</span>}
              {dog.neighborhood && <span style={{ display: "flex", alignItems: "center", gap: 3 }}>{I.Loc()} {dog.neighborhood}</span>}
              {dog.sightings?.length > 0 && <span style={{ display: "flex", alignItems: "center", gap: 3 }}>{I.Eye()} {dog.sightings.length}</span>}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── DetailView ───────────────────────────────────────────────────
function DetailView({ dog, isAdmin, onDelete, onMarkLost, onMarkFound, onAddSighting }) {
  const T = useT();
  const [el, setEl] = useState(() => elapsedStr(dog.lostSince));
  const [sightText, setSightText] = useState("");
  const [sightLoc, setSightLoc] = useState("");
  const [showSightForm, setShowSightForm] = useState(false);
  useEffect(() => { if (!dog.lostSince) return; setEl(elapsedStr(dog.lostSince)); const iv = setInterval(() => setEl(elapsedStr(dog.lostSince)), 30000); return () => clearInterval(iv); }, [dog.lostSince]);
  const lost = !!dog.lostSince, stray = dog.type === "stray";

  const shareMsg = lost
    ? `🚨 *PERRO PERDIDO* 🚨\n\n🐕 *${dog.name}*\n📋 ${[dog.breed, dog.color, dog.size].filter(Boolean).join(" · ")}\n📍 Última ubicación: ${dog.lastSeenLocation || dog.neighborhood || "No especificada"}\n${dog.notes ? `📝 ${dog.notes}\n` : ""}\n👤 Dueño: ${dog.ownerName}\n📱 Contacto: ${dog.ownerPhone}\n⏱ Perdido hace ${el}\n\n¡Si lo ves, avisá! 🙏`
    : stray ? `🐕 *PERRO EN BUSCA DE HOGAR* 🏠\n\n🐾 *${dog.name}*\n📋 ${[dog.breed, dog.color, dog.size].filter(Boolean).join(" · ")}\n📍 Zona: ${dog.neighborhood || "No especificada"}\n${dog.notes ? `📝 ${dog.notes}\n` : ""}\n¿Podés darle un hogar? 🙏` : null;

  const handleAddSighting = () => { if (!sightText) return; onAddSighting(dog.id, { id: genId(), text: sightText, location: sightLoc, date: new Date().toISOString() }); setSightText(""); setSightLoc(""); setShowSightForm(false); };

  return (
    <div className="anim">
      <Card style={{ overflow: "hidden", border: lost ? `2px solid ${T.danger}` : stray ? `2px solid ${T.purple}` : undefined }}>
        {lost && <div style={{ background: T.danger, color: "#fff", padding: "10px 16px", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between" }}><span style={{ display: "flex", alignItems: "center", gap: 6 }}>{I.Alert()} PERDIDO</span><span style={{ fontWeight: 600, fontSize: 14 }}>⏱ hace {el}</span></div>}
        {stray && <div style={{ background: T.purple, color: "#fff", padding: "10px 16px", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>{I.Heart()} EN BUSCA DE HOGAR</div>}
        {dog.photo && <img src={dog.photo} alt={dog.name} style={{ width: "100%", height: 220, objectFit: "cover", ...(lost ? { filter: "saturate(.5)" } : {}) }} />}

        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Playfair Display',serif", color: lost ? T.danger : T.txt }}>{dog.name}</h2>
              <p style={{ fontSize: 14, color: T.muted, marginTop: 2 }}>{[dog.breed, dog.color, dog.size, dog.sex].filter(Boolean).join(" · ")}</p>
            </div>
            {isAdmin && <Btn v="danger" sz="sm" onClick={() => onDelete(dog.id)} icon={I.Trash()}>Eliminar</Btn>}
          </div>

          {lost && dog.lastSeenLocation && <div style={{ background: T.dangerLt, borderRadius: RS, padding: 12, marginBottom: 12, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.danger, fontWeight: 600 }}>{I.MapPin()} Última ubicación: {dog.lastSeenLocation}</div>}

          {!stray && (
            <div style={{ background: T.accentLt, borderRadius: RS, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".5px" }}>Dueño/a</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{dog.ownerName}</div>
              {dog.ownerPhone && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: T.muted }}>{I.Phone()} {dog.ownerPhone}</div>}
              {dog.neighborhood && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: T.muted, marginTop: 4 }}>{I.Loc()} {dog.neighborhood}</div>}
              {dog.ownerPhone && <a href={`https://wa.me/${dog.ownerPhone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10, padding: "8px 14px", background: "#25D366", color: "#fff", borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: "none", fontFamily: FONT }}>💬 Contactar por WhatsApp</a>}
            </div>
          )}
          {stray && dog.neighborhood && <div style={{ background: T.purpleLt, borderRadius: RS, padding: 14, marginBottom: 12 }}><div style={{ fontSize: 12, fontWeight: 700, color: T.purple, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".5px" }}>Zona donde se lo ve</div><div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600 }}>{I.Loc()} {dog.neighborhood}</div></div>}

          {dog.notes && <div style={{ fontSize: 14, color: T.muted, lineHeight: 1.5, padding: "4px 0", marginBottom: 12 }}><strong style={{ color: T.txt }}>Notas:</strong> {dog.notes}</div>}

          {/* Sightings */}
          {(dog.sightings?.length > 0 || lost) && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".5px" }}>Avistamientos ({dog.sightings?.length || 0})</span>
                {lost && !showSightForm && <button onClick={() => setShowSightForm(true)} style={{ background: T.blue, color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 20, boxShadow: `0 2px 8px ${T.blue}40`, transition: "all .2s" }}>{I.Eye()} Reportar avistamiento</button>}
              </div>
              {showSightForm && (
                <div className="anim" style={{ background: T.blueLt, borderRadius: RS, padding: 12, marginBottom: 10 }}>
                  <input placeholder="¿Qué viste?" value={sightText} onChange={e => setSightText(e.target.value)} style={{ marginBottom: 8 }} />
                  <input placeholder="📍 Ubicación" value={sightLoc} onChange={e => setSightLoc(e.target.value)} style={{ marginBottom: 8 }} />
                  <div style={{ display: "flex", gap: 8 }}><Btn sz="sm" onClick={handleAddSighting} disabled={!sightText} icon={I.Eye()}>Reportar</Btn><Btn v="ghost" sz="sm" onClick={() => setShowSightForm(false)}>Cancelar</Btn></div>
                </div>
              )}
              {dog.sightings?.length > 0 && <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[...dog.sightings].reverse().map(s => <div key={s.id} style={{ background: T.bg, borderRadius: 8, padding: "10px 12px", borderLeft: `3px solid ${T.blue}` }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{s.text}</div>
                  <div style={{ display: "flex", gap: 10, fontSize: 11, color: T.muted }}>{s.location && <span style={{ display: "flex", alignItems: "center", gap: 3 }}>{I.Loc()} {s.location}</span>}<span style={{ display: "flex", alignItems: "center", gap: 3 }}>{I.Clock()} {fmtDate(s.date)}</span></div>
                </div>)}
              </div>}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {lost && <>
              <a href={`https://wa.me/${dog.ownerPhone?.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${dog.ownerName}! Vi a ${dog.name} que está reportado como perdido. ¿Sigue perdido?`)}`} target="_blank" rel="noopener noreferrer"
                onClick={() => { setTimeout(() => { window.open(`https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(`🐾 Aviso: alguien vio a "${dog.name}" (${dog.breed || ""}, ${dog.neighborhood || ""}). Dueño: ${dog.ownerName} - ${dog.ownerPhone}`)}`, "_blank"); }, 600); }}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "16px 20px", background: "linear-gradient(135deg,#2d8a56,#1fa855)", color: "#fff", borderRadius: RS, fontWeight: 800, fontSize: 16, textDecoration: "none", fontFamily: FONT, boxShadow: "0 4px 14px rgba(45,138,86,.35)", letterSpacing: ".3px" }}>🎉 ¡Lo encontré!</a>
              <p style={{ fontSize: 11, color: T.muted, textAlign: "center" }}>Se avisará al dueño y al administrador por WhatsApp</p>
              {isAdmin && <Btn v="secondary" sz="sm" onClick={() => onMarkFound(dog.id)} icon={I.Check()} style={{ justifyContent: "center" }}>Marcar como encontrado (admin)</Btn>}
            </>}
            {!lost && !stray && <>
              <button onClick={() => { const loc = prompt("¿Dónde lo vieron por última vez?"); if (loc !== null) onMarkLost(dog.id, loc); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 20px", background: T.dangerLt, color: T.danger, border: `1.5px solid ${T.danger}`, borderRadius: RS, fontWeight: 700, fontSize: 14, fontFamily: FONT, cursor: "pointer" }}>{I.Alert()} Reportar como perdido</button>
              <a href={`https://wa.me/${dog.ownerPhone?.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 20px", background: "#25D366", color: "#fff", borderRadius: RS, fontWeight: 700, fontSize: 14, textDecoration: "none", fontFamily: FONT }}>💬 Contactar por WhatsApp</a>
            </>}
            {stray && <a href={`https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(`Hola, me interesa adoptar a ${dog.name}. ¿Pueden darme más información?`)}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 20px", background: "linear-gradient(135deg,#7c3aed,#9b59b6)", color: "#fff", borderRadius: RS, fontWeight: 800, fontSize: 15, textDecoration: "none", fontFamily: FONT, boxShadow: "0 4px 14px rgba(124,58,237,.3)" }}>{I.Heart()} Quiero adoptarlo</a>}
            {shareMsg && <a href={`https://wa.me/?text=${encodeURIComponent(shareMsg)}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 20px", background: T.bg, color: T.txt, border: `1.5px solid ${T.border}`, borderRadius: RS, fontWeight: 700, fontSize: 13, textDecoration: "none", fontFamily: FONT }}>{I.Share()} Compartir en grupos de WhatsApp</a>}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ═══ MAIN APP ═════════════════════════════════════════════════════
export default function App() {
  const [dark, setDark] = useState(false);
  const T = dark ? themes.dark : themes.light;
  const [dogs, setDogs] = useState([]);
  const [view, setView] = useState("list");
  const [tab, setTab] = useState("all");
  const [selectedDog, setSelectedDog] = useState(null);
  const [searchPhoto, setSearchPhoto] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminInput, setAdminInput] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminPw, setAdminPw] = useState(DEFAULT_ADMIN_PW);
  const [showChangePw, setShowChangePw] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [form, setForm] = useState({ name: "", breed: "", color: "", size: "", sex: "", ownerName: "", ownerPhone: "", neighborhood: "", notes: "", photo: null, type: "owned" });

  useEffect(() => {
    (async () => {
      try { await window.storage.delete(STORAGE_KEY); } catch(e) {}
      setDogs(SAMPLE_DOGS);
      try { await window.storage.set(STORAGE_KEY, JSON.stringify(SAMPLE_DOGS)); } catch(e) {}
      try { const pw = await window.storage.get(ADMIN_PW_KEY); if (pw?.value) setAdminPw(pw.value); } catch(e) {}
      setLoading(false);
    })();
  }, []);

  const save = useCallback(async (d) => { setDogs(d); try { await window.storage.set(STORAGE_KEY, JSON.stringify(d)); } catch(e) {} }, []);
  const adminLogin = () => { if (adminInput === adminPw) { setIsAdmin(true); setShowAdminModal(false); setAdminInput(""); setAdminError(""); } else setAdminError("Contraseña incorrecta"); };
  const adminLogout = () => { setIsAdmin(false); setShowChangePw(false); setNewPw(""); };
  const changePw = async () => { if (newPw.length < 4) return setAdminError("Mínimo 4 caracteres"); setAdminPw(newPw); try { await window.storage.set(ADMIN_PW_KEY, newPw); } catch(e) {} setNewPw(""); setShowChangePw(false); };

  const handleRegister = async () => {
    if (!form.name || !form.photo) return;
    if (form.type === "owned" && (!form.ownerName || !form.ownerPhone)) return;
    await save([{ ...form, id: genId(), createdAt: new Date().toISOString(), lostSince: null, lastSeenLocation: null, sightings: [] }, ...dogs]);
    setForm({ name: "", breed: "", color: "", size: "", sex: "", ownerName: "", ownerPhone: "", neighborhood: "", notes: "", photo: null, type: "owned" });
    setView("list");
  };
  const handleDelete = async (id) => { if (!confirm("¿Seguro?")) return; await save(dogs.filter(d => d.id !== id)); setView("list"); setSelectedDog(null); };
  const handleMarkLost = async (id, loc) => { const u = dogs.map(d => d.id === id ? { ...d, lostSince: new Date().toISOString(), lastSeenLocation: loc || "" } : d); await save(u); setSelectedDog(u.find(d => d.id === id)); };
  const handleMarkFound = async (id) => { const u = dogs.map(d => d.id === id ? { ...d, lostSince: null, lastSeenLocation: null } : d); await save(u); setSelectedDog(u.find(d => d.id === id)); };
  const handleAddSighting = async (id, s) => { const u = dogs.map(d => d.id === id ? { ...d, sightings: [...(d.sightings || []), s] } : d); await save(u); setSelectedDog(u.find(d => d.id === id)); };

  const handleAISearch = async () => {
    if (!searchPhoto || dogs.length === 0) return;
    setSearching(true); setView("results");
    try {
      const descs = dogs.map((d, i) => `[${i}] ${d.name}|${d.breed || "?"}|${d.color || "?"}|${d.size || "?"}|${d.sex || "?"}`).join("\n");
      const content = [{ type: "text", text: `Experto en perros. Compará la primera foto con los registrados.\n\nBase:\n${descs}\n\nJSON solo: [{"index":0,"confidence":"alta","reason":"..."},...] sin backticks.` }, { type: "image", source: { type: "base64", media_type: searchPhoto.split(";")[0].split(":")[1], data: searchPhoto.split(",")[1] } }];
      dogs.forEach((d, i) => { if (d.photo) { content.push({ type: "text", text: `[${i}] ${d.name}:` }, { type: "image", source: { type: "base64", media_type: d.photo.split(";")[0].split(":")[1], data: d.photo.split(",")[1] } }); } });
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content }] }) });
      const data = await res.json();
      let results = []; try { results = JSON.parse((data.content?.map(c => c.text || "").join("") || "[]").replace(/```json|```/g, "").trim()); } catch {}
      setSearchResults(results.filter(r => r.index >= 0 && r.index < dogs.length).map(r => ({ ...dogs[r.index], confidence: r.confidence, reason: r.reason })));
    } catch { setSearchResults([]); }
    setSearching(false);
  };

  const lostDogs = dogs.filter(d => d.lostSince), strayDogs = dogs.filter(d => d.type === "stray"), ownedDogs = dogs.filter(d => d.type !== "stray");
  const totalSightings = dogs.reduce((n, d) => n + (d.sightings?.length || 0), 0);
  const recovered = dogs.filter(d => !d.lostSince && d.sightings?.length > 0).length;

  const filtered = dogs.filter(d => {
    if (tab === "lost") return !!d.lostSince;
    if (tab === "stray") return d.type === "stray";
    if (tab === "stats") return false;
    return true;
  }).filter(d => { if (!searchFilter) return true; const q = searchFilter.toLowerCase(); return d.name?.toLowerCase().includes(q) || d.breed?.toLowerCase().includes(q) || d.ownerName?.toLowerCase().includes(q) || d.neighborhood?.toLowerCase().includes(q); })
    .sort((a, b) => { if (a.lostSince && !b.lostSince) return -1; if (!a.lostSince && b.lostSince) return 1; if (a.type === "stray" && b.type !== "stray") return -1; return 0; });

  if (loading) return <ThemeCtx.Provider value={T}><div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: FONT, background: T.bg }}><div style={{ textAlign: "center", color: T.muted }}><div style={{ animation: "pulse 1.5s infinite", marginBottom: 8 }}>{I.Paw()}</div>Cargando...</div></div></ThemeCtx.Provider>;

  return (
    <ThemeCtx.Provider value={T}>
    <div style={{ minHeight: "100vh", fontFamily: FONT, background: T.bg, transition: "background .3s" }}>
      <style>{getCSS(T)}</style>

      {/* Header */}
      <div style={{ background: T.headerBg, color: "#fff", padding: "20px 20px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />
        {view !== "list" && <button onClick={() => { setView("list"); setSelectedDog(null); setSearchResults([]); }} style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 8, color: "#fff", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontFamily: FONT, fontWeight: 600, marginBottom: 12 }}>{I.Back()} Volver</button>}
        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: view === "list" ? 26 : 20, fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
              {view === "list" && <><span style={{ display: "inline-flex" }}>{I.Paw(24)}</span> Registro de Perros</>}{view === "register" && (form.type === "stray" ? "Reportar sin dueño" : "Registrar Perro")}{view === "detail" && selectedDog?.name}{view === "search" && "Buscar por Foto"}{view === "results" && "Resultados"}
            </h1>
            {view === "list" && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", fontSize: 13, opacity: .85, fontWeight: 500, alignItems: "center" }}>
              <span>{dogs.length} registrados</span>
              {lostDogs.length > 0 && <Badge bg="rgba(255,255,255,.2)" color="#fff">🚨 {lostDogs.length} perdido{lostDogs.length > 1 ? "s" : ""}</Badge>}
              {strayDogs.length > 0 && <Badge bg="rgba(255,255,255,.15)" color="#fff">🏠 {strayDogs.length} sin hogar</Badge>}
            </div>}
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button onClick={() => setDark(!dark)} style={{ background: "rgba(255,255,255,.12)", border: "none", borderRadius: 8, color: "#fff", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontFamily: FONT, fontWeight: 600, transition: "background .2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.25)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.12)"}
            >{dark ? I.Sun() : I.Moon()}</button>
            <button onClick={() => { if (isAdmin) adminLogout(); else { setShowAdminModal(true); setAdminInput(""); setAdminError(""); } }} style={{ background: isAdmin ? "rgba(255,255,255,.25)" : "rgba(255,255,255,.12)", border: "none", borderRadius: 8, color: "#fff", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontFamily: FONT, fontWeight: 600 }}>
              {isAdmin ? I.Unlock() : I.Lock()} {isAdmin ? "Admin ✓" : "Admin"}
            </button>
          </div>
        </div>
      </div>

      {/* Admin Modal */}
      {showAdminModal && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }} onClick={() => setShowAdminModal(false)}>
        <Card style={{ padding: 24, width: "100%", maxWidth: 340 }} className="anim"><div onClick={e => e.stopPropagation()}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, margin: "0 auto 12px", background: T.accentLt, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent }}>{I.Shield()}</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Acceso Admin</h3>
          </div>
          <input type="password" placeholder="Contraseña" value={adminInput} onChange={e => { setAdminInput(e.target.value); setAdminError(""); }} onKeyDown={e => e.key === "Enter" && adminLogin()} style={{ marginBottom: adminError ? 8 : 16 }} autoFocus />
          {adminError && <p style={{ color: T.danger, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>{adminError}</p>}
          <div style={{ display: "flex", gap: 10 }}><Btn v="secondary" onClick={() => setShowAdminModal(false)} style={{ flex: 1, justifyContent: "center" }}>Cancelar</Btn><Btn onClick={adminLogin} disabled={!adminInput} style={{ flex: 1, justifyContent: "center" }}>Ingresar</Btn></div>
        </div></Card>
      </div>}

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 16px 100px" }}>

        {view === "list" && <>
          <TabBar active={tab} onChange={setTab} tabs={[
            { id: "all", label: "Todos", icon: I.Paw(14) },
            { id: "lost", label: "Perdidos", icon: I.Alert() },
            { id: "stray", label: "Adopción", icon: I.Heart() },
            { id: "shelter", label: "Refugio", icon: I.Home() },
            { id: "stats", label: "Stats", icon: I.Chart() },
          ]} />

          {tab !== "stats" && tab !== "shelter" && <>
            <div style={{ marginBottom: 16 }} className="anim"><div style={{ position: "relative" }}><span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.muted }}>{I.Search()}</span><input type="text" placeholder="Buscar..." value={searchFilter} onChange={e => setSearchFilter(e.target.value)} style={{ paddingLeft: 38 }} /></div></div>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }} className="anim d1">
              <Btn onClick={() => { setForm({ ...form, type: "owned" }); setView("register"); }} icon={I.Plus()} style={{ flex: 1 }}>Registrar</Btn>
              <Btn onClick={() => { setSearchPhoto(null); setView("search"); }} v="secondary" icon={I.Sparkle()} style={{ flex: 1, borderColor: T.navy, color: T.navy }}>Buscar IA</Btn>
            </div>
            {tab === "stray" && <div className="anim d1" style={{ marginBottom: 12 }}><Btn v="secondary" onClick={() => { setForm({ ...form, type: "stray", ownerName: "—", ownerPhone: "" }); setView("register"); }} icon={I.Heart()} style={{ width: "100%", justifyContent: "center", border: `1.5px solid ${T.purple}`, color: T.purple }}>Reportar perro sin dueño</Btn></div>}
            {isAdmin && <div className="anim d2" style={{ background: T.okLt, borderRadius: RS, padding: 12, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: T.ok }}>{I.Shield()} Admin activo</span>
              {!showChangePw ? <button onClick={() => setShowChangePw(true)} style={{ background: "none", border: "none", color: T.ok, fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "underline", fontFamily: FONT }}>Cambiar clave</button>
                : <div style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="password" placeholder="Nueva" value={newPw} onChange={e => setNewPw(e.target.value)} onKeyDown={e => e.key === "Enter" && changePw()} style={{ width: 100, padding: "5px 10px", fontSize: 12 }} /><Btn sz="sm" onClick={changePw} style={{ padding: "5px 10px", fontSize: 12 }}>OK</Btn></div>}
            </div>}
            {filtered.length === 0 ? <div className="anim d2" style={{ textAlign: "center", padding: "48px 20px", color: T.muted }}><div style={{ marginBottom: 12, opacity: .4 }}>{I.Dog()}</div><p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{searchFilter ? "Sin resultados" : tab === "lost" ? "No hay perdidos" : tab === "stray" ? "No hay perros sin hogar" : "No hay registrados"}</p></div>
              : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{filtered.map((d, i) => <DogCard key={d.id} dog={d} delay={(i % 4) + 1} onClick={d => { setSelectedDog(d); setView("detail"); }} />)}</div>}
          </>}

          {/* ═══ SHELTER TAB ═══ */}
          {tab === "shelter" && <div className="anim">
            {/* Hero card */}
            <Card style={{ overflow: "hidden", marginBottom: 16, border: `2px solid ${T.accent}` }}>
              <div style={{ background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`, padding: "28px 20px", textAlign: "center", color: "#fff" }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>🏠</div>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Refugio CASA</h2>
                <p style={{ fontSize: 14, opacity: .9, fontWeight: 500 }}>Rescatamos, cuidamos y buscamos hogares</p>
              </div>
              <div style={{ padding: 20 }}>
                <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.6, marginBottom: 16 }}>
                  El refugio <strong style={{ color: T.txt }}>CASA</strong> trabaja para rescatar, rehabilitar y encontrar familias para perros en situación de calle o abandono. Si encontraste un perro, querés adoptar, o simplemente querés ayudar, ¡contactanos!
                </p>

                {/* Social links */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <a href="https://www.instagram.com/casa_refugio/" target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)", color: "#fff", borderRadius: RS, fontWeight: 700, fontSize: 14, textDecoration: "none", fontFamily: FONT, transition: "transform .15s" }}>
                    {I.Instagram()} Seguinos en Instagram
                  </a>

                  <a href={`https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent("Hola! Quiero saber más sobre el refugio CASA y cómo puedo ayudar 🐾")}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#25D366", color: "#fff", borderRadius: RS, fontWeight: 700, fontSize: 14, textDecoration: "none", fontFamily: FONT }}>
                    💬 Escribinos por WhatsApp
                  </a>
                </div>
              </div>
            </Card>

            {/* How to help */}
            <Card style={{ padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, marginBottom: 12, textTransform: "uppercase", letterSpacing: ".5px" }}>¿Cómo podés ayudar?</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { emoji: "🐕", title: "Adoptá", desc: "Dale un hogar a un perro que lo necesita" },
                  { emoji: "📢", title: "Difundí", desc: "Compartí en tus redes para que llegue a más personas" },
                  { emoji: "🍖", title: "Doná", desc: "Alimento, mantas, medicamentos o lo que puedas" },
                  { emoji: "🤝", title: "Sé voluntario/a", desc: "Sumate a pasear, bañar o transportar perritos" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 12px", background: T.bg, borderRadius: 10 }}>
                    <span style={{ fontSize: 24, flexShrink: 0 }}>{item.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 1 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: T.muted }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick link to adoption tab */}
            <Card style={{ padding: 16, cursor: "pointer", transition: "transform .2s" }} onClick={() => setTab("stray")}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: T.purpleLt, display: "flex", alignItems: "center", justifyContent: "center", color: T.purple, flexShrink: 0 }}>{I.Heart()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Ver perros en adopción</div>
                  <div style={{ fontSize: 12, color: T.muted }}>{strayDogs.length} perro{strayDogs.length !== 1 ? "s" : ""} buscando hogar</div>
                </div>
                <span style={{ color: T.muted, fontSize: 18 }}>→</span>
              </div>
            </Card>
          </div>}

          {tab === "stats" && <div className="anim">
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <StatCard icon={I.Paw(24)} label="Registrados" value={ownedDogs.length} bg={T.navyLt} color={T.navy} delay={1} />
              <StatCard icon={I.Alert()} label="Perdidos" value={lostDogs.length} bg={T.dangerLt} color={T.danger} delay={2} />
              <StatCard icon={I.Check()} label="Recuperados" value={recovered} bg={T.okLt} color={T.ok} delay={3} />
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <StatCard icon={I.Heart()} label="Sin hogar" value={strayDogs.length} bg={T.purpleLt} color={T.purple} delay={1} />
              <StatCard icon={I.Eye()} label="Avistamientos" value={totalSightings} bg={T.blueLt} color={T.blue} delay={2} />
              <StatCard icon={I.Loc()} label="Barrios" value={[...new Set(dogs.map(d => d.neighborhood).filter(Boolean))].length} bg={T.navyLt} color={T.navy} delay={3} />
            </div>
            {lostDogs.length > 0 && <>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 10 }}>Perdidos actualmente</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {lostDogs.map(d => <div key={d.id} onClick={() => { setSelectedDog(d); setView("detail"); }} style={{ display: "flex", alignItems: "center", gap: 10, background: T.dangerLt, borderRadius: RS, padding: 10, cursor: "pointer", borderLeft: `3px solid ${T.danger}` }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.danger }}>{d.name}</div>
                  <div style={{ fontSize: 12, color: T.muted, flex: 1 }}>{d.breed} · {d.neighborhood}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.danger }}>⏱ {elapsedStr(d.lostSince)}</div>
                </div>)}
              </div>
            </>}
          </div>}
        </>}

        {view === "register" && <div className="anim"><Card style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}><PhotoUp value={form.photo} onChange={p => setForm({ ...form, photo: p })} size={140} /></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {form.type === "stray" && <div style={{ display: "flex", justifyContent: "center" }}><Badge bg={T.purpleLt} color={T.purple}>🏠 Sin dueño / Callejero</Badge></div>}
            <div><label style={{ fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: ".5px" }}>Datos del perro</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input placeholder="Nombre o apodo *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <div style={{ display: "flex", gap: 10 }}><input placeholder="Raza" value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })} /><input placeholder="Color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} /></div>
                <div style={{ display: "flex", gap: 10 }}><select value={form.size} onChange={e => setForm({ ...form, size: e.target.value })}><option value="">Tamaño</option><option value="Pequeño">Pequeño</option><option value="Mediano">Mediano</option><option value="Grande">Grande</option></select><select value={form.sex} onChange={e => setForm({ ...form, sex: e.target.value })}><option value="">Sexo</option><option value="Macho">Macho</option><option value="Hembra">Hembra</option></select></div>
                <input placeholder="Barrio / Zona" value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} />
              </div></div>
            {form.type === "owned" && <div style={{ borderTop: `1px solid ${T.borderLt}`, paddingTop: 14 }}><label style={{ fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: ".5px" }}>Datos del dueño</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}><input placeholder="Nombre del dueño *" value={form.ownerName} onChange={e => setForm({ ...form, ownerName: e.target.value })} /><input placeholder="WhatsApp *" value={form.ownerPhone} onChange={e => setForm({ ...form, ownerPhone: e.target.value })} /></div></div>}
            <textarea placeholder={form.type === "stray" ? "Notas (dónde se lo ve, comportamiento...)" : "Notas (señas particulares, collar, chip...)"} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            <Btn onClick={handleRegister} disabled={!form.name || !form.photo || (form.type === "owned" && (!form.ownerName || !form.ownerPhone))} sz="lg" style={{ width: "100%", justifyContent: "center", marginTop: 4 }} icon={form.type === "stray" ? I.Heart() : I.Paw()}>{form.type === "stray" ? "Reportar perro" : "Registrar Perro"}</Btn>
          </div>
        </Card></div>}

        {view === "detail" && selectedDog && <DetailView dog={selectedDog} isAdmin={isAdmin} onDelete={handleDelete} onMarkLost={handleMarkLost} onMarkFound={handleMarkFound} onAddSighting={handleAddSighting} />}

        {view === "search" && <div className="anim"><Card style={{ padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
          <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Subí la foto del perro</h3>
          <p style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>La IA comparará con todos los registrados.</p>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}><PhotoUp value={searchPhoto} onChange={setSearchPhoto} size={180} /></div>
          <Btn onClick={handleAISearch} disabled={!searchPhoto || dogs.length === 0} sz="lg" style={{ width: "100%", justifyContent: "center" }} icon={I.Sparkle()}>Buscar con IA</Btn>
        </Card></div>}

        {view === "results" && <div className="anim">
          {searching ? <Card style={{ padding: 40, textAlign: "center" }}><div style={{ fontSize: 36, marginBottom: 12, animation: "pulse 1.5s infinite" }}>🔍</div><p style={{ fontWeight: 700 }}>Analizando...</p></Card>
            : <>
              {searchPhoto && <div style={{ marginBottom: 16, textAlign: "center" }}><img src={searchPhoto} alt="" style={{ width: 100, height: 100, objectFit: "cover", borderRadius: R, boxShadow: T.shadowLg }} /></div>}
              {searchResults.length === 0 ? <Card style={{ padding: 32, textAlign: "center" }}><div style={{ fontSize: 36, marginBottom: 8 }}>😕</div><p style={{ fontWeight: 700 }}>Sin coincidencias</p></Card>
                : <>{searchResults.map((d, i) => <Card key={d.id} style={{ overflow: "hidden", marginBottom: 10 }}><div style={{ padding: "6px 14px", background: d.confidence === "alta" ? T.okLt : T.accentLt, color: d.confidence === "alta" ? T.ok : T.accent, fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Similitud: {d.confidence}</div>
                  <div style={{ cursor: "pointer", padding: 14 }} onClick={() => { setSelectedDog(d); setView("detail"); }}><div style={{ fontWeight: 700, fontSize: 16 }}>{d.name}</div><div style={{ fontSize: 13, color: T.muted }}>{d.reason}</div><div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>Dueño: {d.ownerName}</div></div></Card>)}</>}
              <div style={{ marginTop: 20, textAlign: "center" }}><Btn v="secondary" onClick={() => { setSearchPhoto(null); setView("search"); }}>Buscar otro</Btn></div>
            </>}
        </div>}
      </div>

      <a href={`https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent("Hola, necesito ayuda con el registro de perros")}`} target="_blank" rel="noopener noreferrer" style={{ position: "fixed", bottom: 24, right: 24, background: "#25D366", color: "#fff", borderRadius: 50, padding: "12px 18px", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 14px rgba(37,211,102,.4)", textDecoration: "none", fontFamily: FONT, fontWeight: 700, fontSize: 14, zIndex: 900 }}>💬 ¿Necesitás ayuda?</a>
    </div>
    </ThemeCtx.Provider>
  );
}
