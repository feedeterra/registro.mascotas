import { createContext, useContext, useEffect } from 'react'

// ─── Theme tokens ────────────────────────────────────────────────
export const theme = {
  bg: "#FBF7F2", card: "#ffffff", accent: "#C0542D", accentLt: "#FAE8DC", accentDk: "#A3421F",
  txt: "#2C2417", muted: "#9A8F82", border: "#E8DFD4", borderLt: "#F2EDE6",
  // sage — replaces saturated green for verified/adopted states
  ok: "#7D8C6B", okLt: "#EEF1E9", okDk: "#5C6A4E",
  sage: "#7D8C6B", sageLt: "#EEF1E9", sageMd: "#A8B89A", sagePale: "#D6DDC9",
  danger: "#c0392b", dangerLt: "#fbeae8",
  urgent: "#D4652E", urgentLt: "#FEF0E5",
  blue: "#2e86ab", blueLt: "#e8f4f8", blueDk: "#1b6d8a",
  purple: "#7c3aed", purpleLt: "#f3f0ff",
  navy: "#7D8C6B", navyLt: "#EEF1E9",
  sponsor: "#c9a84c", sponsorLt: "#fdf8ec", sponsorBorder: "#e8d48b",
  shadow: "0 4px 16px rgba(44,36,23,0.06), 0 2px 4px rgba(44,36,23,0.04)",
  shadowLg: "0 8px 32px rgba(44,36,23,0.08), 0 4px 8px rgba(44,36,23,0.04)",
  headerBg: "#ffffff",
  inputBg: "#ffffff", inputBorder: "#E8DFD4",
  dark: false,
}

export const FONT = "'Outfit','Poppins','Segoe UI',sans-serif"
export const R = "20px"
export const RS = "14px"

export function getCSS(t) {
  return `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:${FONT};background:${t.bg};color:${t.txt};-webkit-font-smoothing:antialiased}
button{font-family:${FONT}}
a{font-family:${FONT};color:inherit;text-decoration:none}
input,select,textarea{font-family:${FONT};font-size:14px;border:1.5px solid ${t.inputBorder};border-radius:12px;padding:12px 16px;background:${t.inputBg};color:${t.txt};transition:border-color .2s,box-shadow .2s;outline:none;width:100%}
input:focus,select:focus,textarea:focus{border-color:${t.accent};box-shadow:0 0 0 3px ${t.accentLt}}
textarea{resize:vertical;min-height:60px}
::placeholder{color:${t.muted};opacity:.6}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes lostPulse{0%,100%{box-shadow:0 0 0 0 rgba(192,57,43,.3)}50%{box-shadow:0 0 0 6px rgba(192,57,43,0)}}
.anim{animation:fadeIn .35s ease-out both}
.d1{animation-delay:.05s}.d2{animation-delay:.1s}.d3{animation-delay:.15s}.d4{animation-delay:.2s}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes heartPop{0%{transform:scale(1)}50%{transform:scale(1.35)}100%{transform:scale(1)}}
@keyframes fabPulse{0%,100%{box-shadow:0 4px 14px ${t.accent}50}50%{box-shadow:0 4px 24px ${t.accent}90}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes pageEnter{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
html{scroll-behavior:smooth}
.skeleton{background:linear-gradient(90deg,${t.borderLt} 25%,${t.bg} 50%,${t.borderLt} 75%);background-size:200% 100%;animation:shimmer 1.5s infinite}
.tap{transition:transform .2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow .2s cubic-bezier(0.4, 0, 0.2, 1)}
.tap:active{transform:scale(0.97)}
.btn-press{transition:transform .15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow .15s cubic-bezier(0.4, 0, 0.2, 1), background-color .15s}
.btn-press:active{transform:scale(0.96)}
.heart-pop{animation:heartPop .4s cubic-bezier(0.175, 0.885, 0.32, 1.275)}
.fab-pulse{animation:fabPulse 2s ease-in-out infinite}
.page-enter{animation:pageEnter .4s cubic-bezier(0.2, 0.8, 0.2, 1) both}
.flex-center{display:flex;align-items:center;justify-content:center}
.flex-gap{display:flex;align-items:center;gap:6px}
body{-webkit-tap-highlight-color:transparent}
`
}

// ─── Theme context ───────────────────────────────────────────────
export const ThemeCtx = createContext(null)

export function useT() {
  return useContext(ThemeCtx)
}

export function ThemeProvider({ children }) {
  useEffect(() => {
    try { localStorage.removeItem('registro-mascotas-dark') } catch {}
    const style = document.getElementById('theme-css') || (() => {
      const s = document.createElement('style')
      s.id = 'theme-css'
      document.head.appendChild(s)
      return s
    })()
    style.textContent = getCSS(theme)
  }, [])

  return (
    <ThemeCtx.Provider value={theme}>
      {children}
    </ThemeCtx.Provider>
  )
}
