import { createContext, useContext, useState, useEffect, useCallback } from 'react'

// ─── Theme tokens ────────────────────────────────────────────────
export const themes = {
  light: {
    bg: "#faf7f2", card: "#ffffff", accent: "#d35400", accentLt: "#fef0e5", accentDk: "#b84700",
    txt: "#2c2417", muted: "#8a7d6e", border: "#e6ddd2", borderLt: "#f0ebe3",
    ok: "#1a8c5b", okLt: "#e6f5ed", danger: "#c0392b", dangerLt: "#fbeae8",
    urgent: "#e67e22", urgentLt: "#fef3e2",
    blue: "#2e86ab", blueLt: "#e8f4f8", blueDk: "#1b6d8a",
    purple: "#7c3aed", purpleLt: "#f3f0ff",
    navy: "#2d6a4f", navyLt: "#ecf5f0",
    sponsor: "#c9a84c", sponsorLt: "#fdf8ec", sponsorBorder: "#e8d48b",
    shadow: "0 1px 3px rgba(44,36,23,0.05),0 4px 12px rgba(44,36,23,0.04)",
    shadowLg: "0 4px 12px rgba(44,36,23,0.08),0 12px 32px rgba(44,36,23,0.05)",
    headerBg: "linear-gradient(135deg,#1b4332,#2d6a4f)",
    inputBg: "#ffffff", inputBorder: "#e6ddd2",
  },
  dark: {
    bg: "#1a1814", card: "#262220", accent: "#e8873a", accentLt: "#302218", accentDk: "#f5a352",
    txt: "#ede8e0", muted: "#968e83", border: "#3a3430", borderLt: "#2e2a26",
    ok: "#4ade80", okLt: "#1a2e1e", danger: "#f87171", dangerLt: "#2e1a1a",
    urgent: "#f59e0b", urgentLt: "#2e2410",
    blue: "#5cc8e8", blueLt: "#1a2830", blueDk: "#7dd8f0",
    purple: "#c4b5fd", purpleLt: "#24202e",
    navy: "#e8873a", navyLt: "#302218",
    sponsor: "#d4b85c", sponsorLt: "#2a2418", sponsorBorder: "#5a4d2e",
    shadow: "0 1px 3px rgba(0,0,0,0.25),0 4px 12px rgba(0,0,0,0.2)",
    shadowLg: "0 4px 12px rgba(0,0,0,0.35),0 12px 32px rgba(0,0,0,0.25)",
    headerBg: "linear-gradient(135deg,#c26a1a,#9a5210)",
    inputBg: "#262220", inputBorder: "#3a3430",
  },
}

export const FONT = "'Poppins','Segoe UI',sans-serif"
export const R = "14px"
export const RS = "10px"

export function getCSS(t) {
  return `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:${FONT};background:${t.bg};color:${t.txt};-webkit-font-smoothing:antialiased;transition:background .3s,color .3s}
button{font-family:${FONT}}
a{font-family:${FONT};color:inherit;text-decoration:none}
input,select,textarea{font-family:${FONT};font-size:14px;border:1.5px solid ${t.inputBorder};border-radius:${RS};padding:10px 14px;background:${t.inputBg};color:${t.txt};transition:border-color .2s,box-shadow .2s,background .3s,color .3s;outline:none;width:100%}
input:focus,select:focus,textarea:focus{border-color:${t.blue};box-shadow:0 0 0 3px ${t.blueLt}}
textarea{resize:vertical;min-height:60px}
::placeholder{color:${t.muted};opacity:.7}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes lostPulse{0%,100%{box-shadow:0 0 0 0 rgba(192,57,43,.3)}50%{box-shadow:0 0 0 6px rgba(192,57,43,0)}}
.anim{animation:fadeIn .35s ease-out both}
.d1{animation-delay:.05s}.d2{animation-delay:.1s}.d3{animation-delay:.15s}.d4{animation-delay:.2s}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes heartPop{0%{transform:scale(1)}50%{transform:scale(1.35)}100%{transform:scale(1)}}
@keyframes fabPulse{0%,100%{box-shadow:0 4px 14px ${t.purple}50}50%{box-shadow:0 4px 24px ${t.purple}90}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes pageEnter{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
html{scroll-behavior:smooth}
.skeleton{background:linear-gradient(90deg,${t.borderLt} 25%,${t.bg} 50%,${t.borderLt} 75%);background-size:200% 100%;animation:shimmer 1.5s infinite}
.tap{transition:transform .15s ease}
.tap:active{transform:scale(0.97)}
.btn-press{transition:transform .1s ease}
.btn-press:active{transform:scale(0.95)}
.heart-pop{animation:heartPop .3s ease}
.fab-pulse{animation:fabPulse 2s ease-in-out 3}
.page-enter{animation:pageEnter .3s ease-out both}
body{-webkit-tap-highlight-color:transparent}
`
}

// ─── Theme context ───────────────────────────────────────────────
const LS_DARK = "registro-mascotas-dark"
export const ThemeCtx = createContext(null)

export function useT() {
  return useContext(ThemeCtx)
}

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_DARK)) ?? false } catch { return false }
  })

  const theme = dark ? themes.dark : themes.light

  const toggleDark = useCallback(() => {
    setDark(prev => {
      const next = !prev
      localStorage.setItem(LS_DARK, JSON.stringify(next))
      return next
    })
  }, [])

  useEffect(() => {
    const style = document.getElementById('theme-css') || (() => {
      const s = document.createElement('style')
      s.id = 'theme-css'
      document.head.appendChild(s)
      return s
    })()
    style.textContent = getCSS(theme)
  }, [theme])

  return (
    <ThemeCtx.Provider value={{ ...theme, dark, toggleDark }}>
      {children}
    </ThemeCtx.Provider>
  )
}
