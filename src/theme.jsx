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
export const R = "24px"
export const RM = "16px"
export const RS = "12px"

export function getCSS(t) {
  return `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:${FONT};background:${t.bg};color:${t.txt};-webkit-font-smoothing:antialiased}
button{font-family:${FONT}}
a{font-family:${FONT};color:inherit;text-decoration:none}
input,select,textarea{font-family:${FONT};font-size:14px;border:1.5px solid ${t.inputBorder};border-radius:${RM};padding:12px 16px;background:${t.inputBg};color:${t.txt};transition:border-color .2s,box-shadow .2s;outline:none;width:100%}
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
html{scroll-behavior:auto} /* Instant scroll on route change */
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
.shadow-apple{box-shadow: 0 8px 24px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.02)}

/* Refugio detalle: bloque desktop (titulo lateral) oculto en mobile */
.shelter-detail-hero-titles--desk{display:none}

/* Perfil: favoritos — 2 cols en mobile; en desktop cards chicas en grilla */
.profile-favorites-grid{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:12px;
}
.profile-favorites-grid>a{width:100%;min-width:0}

/* Adoptar: carrusel destacado — mobile apilado; desktop foto | info */
.adopt-featured-carousel{display:flex;flex-direction:column;min-height:0}
.adopt-featured-carousel__media{
  position:relative;flex-shrink:0;border-bottom:1.5px solid ${t.borderLt};
}
.adopt-featured-carousel__body{
  flex:1;min-width:0;display:flex;flex-direction:column;background:${t.card};
}
.adopt-featured-carousel__img-wrap{
  position:relative;width:100%;aspect-ratio:4/3;max-height:300px;background:${t.borderLt};
  display:flex;align-items:center;justify-content:center;overflow:hidden;
}
.adopt-featured-carousel__img{
  width:100%;height:100%;object-fit:contain;display:block;
}

/* Pet detail hero (mobile: stacked; desktop rules below) */
.pet-detail-hero{display:flex;flex-direction:column}
.pet-detail-media{position:relative;width:100%;aspect-ratio:1;overflow:hidden;background:${t.bg}}
.pet-detail-media img{display:block;width:100%;height:100%;object-fit:cover}
.pet-detail-body{padding:20px;min-width:0}
.pet-detail-actions{padding:20px;border-top:1.5px solid ${t.borderLt};background:${t.card}}

/* ─── App shell: desktop responsiveness (mobile untouched) ─── */
.app-main{flex:1;max-width:480px;width:100%;margin:0 auto;padding:0 14px 80px}
@media (min-width: 900px){
  .app-main{max-width:1100px;padding:0 24px 80px}
}

/* ─── Desktop-only responsive grids for card lists ─── */
@media (min-width: 900px){
  .desktop-cards-grid{
    display:grid !important;
    grid-template-columns:repeat(auto-fit,minmax(260px,1fr)) !important;
    gap:14px !important;
    align-items:stretch;
  }
  .desktop-cards-grid--tight{
    grid-template-columns:repeat(auto-fit,minmax(240px,1fr)) !important;
    gap:12px !important;
  }
  .desktop-cards-grid--fixed{
    grid-template-columns:repeat(auto-fit,minmax(240px,320px)) !important;
    justify-content:center;
    align-items:stretch;
  }

  /* Adopt desktop: carrusel ancho foto | texto */
  .adopt-hero{
    max-width: 920px;
    margin-left: auto;
    margin-right: auto;
  }
  .adopt-featured-carousel{
    flex-direction:row;
    align-items:stretch;
  }
  .adopt-featured-carousel__media{
    flex:0 0 clamp(260px, 38%, 400px);
    border-bottom:none;
    border-right:1.5px solid ${t.borderLt};
    display:flex;
    flex-direction:column;
    min-height:0;
  }
  .adopt-featured-carousel__img-wrap{
    flex:1;
    aspect-ratio:auto;
    max-height:none;
    min-height:300px;
  }
  .adopt-featured-carousel__img-wrap .adopt-featured-carousel__img{
    position:absolute;
    inset:0;
    width:100%;
    height:100%;
    object-fit:cover;
  }

  /* Adopt desktop: shelter picker as grid instead of horizontal scroll */
  .adopt-shelter-picker{
    display:grid !important;
    grid-template-columns:repeat(auto-fit,minmax(220px,1fr)) !important;
    gap:12px !important;
    margin:0 !important;
    padding:0 !important;
    overflow:visible !important;
  }

  .adopt-shelter-btn{
    padding: 10px 12px !important;
    font-size: 12px !important;
  }
  .adopt-shelter-btn__name{font-size:12px !important;margin-bottom:2px}
  .adopt-shelter-btn__meta{font-size:10px !important}

  /* Home desktop: urgent carousel a bit larger */
  .home-urgent-carousel .petcard-compact{
    width: 234px !important;
  }

  /* Home desktop: make story cards same height */
  .home-story-card{
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .home-story-card__body{
    flex: 1;
    display: flex;
  }

  /* Shelter desktop: larger 'Finales felices' cards */
  .shelter-success-card{
    width: 150px !important;
  }
  .shelter-success-card img{
    width: 150px !important;
    height: 150px !important;
  }

  /* Pet detail desktop: foto + datos en dos columnas (ancho en .pet-detail-main-card) */
  .pet-detail-main-card{
    max-width: 920px;
    margin-left: auto;
    margin-right: auto;
  }
  .pet-detail-hero{
    flex-direction: row;
    align-items: stretch;
  }
  .pet-detail-hero .pet-detail-media{
    flex: 0 0 clamp(300px, 34vw, 400px);
    width: clamp(300px, 34vw, 400px);
    max-width: none;
    margin: 0;
    aspect-ratio: auto;
    min-height: 360px;
    height: 100%;
    border-radius: ${R} 0 0 0;
  }
  .pet-detail-hero .pet-detail-body{
    flex: 1;
    padding: 28px 32px;
    border-radius: 0 ${R} 0 0;
    background: linear-gradient(165deg, ${t.card} 0%, ${t.bg} 120%);
  }
  .pet-detail-actions{
    padding: 24px 32px;
    border-radius: 0 0 ${R} ${R};
    background: linear-gradient(180deg, ${t.bg} 0%, ${t.card} 55%);
  }

  /* Refugio publico: foto izquierda, ficha derecha (mobile sin cambios) */
  .shelter-detail-hero-wrap{
    display:flex;
    flex-direction:row;
    align-items:stretch;
    margin-top:12px;
    margin-bottom:16px;
    border-radius:20px;
    overflow:hidden;
    box-shadow:${t.shadow};
  }
  .shelter-detail-hero-media{
    flex:0 0 clamp(280px,30vw,380px) !important;
    width:auto !important;
    min-width:0;
    margin-top:0 !important;
    border-radius:0 !important;
  }
  .shelter-detail-hero-titles--mob{display:none !important;}
  .shelter-detail-hero-share--mob{display:none !important;}
  .shelter-detail-hero-titles--desk{display:block !important;}
  .shelter-detail-hero-card{
    flex:1 1 0 !important;
    min-width:0 !important;
    margin-top:0 !important;
    margin-bottom:0 !important;
    border-radius:0 20px 20px 0 !important;
    display:flex !important;
    flex-direction:column !important;
  }
  .shelter-detail-hero-wrap .shelter-detail-hero-img{
    position:absolute;
    inset:0;
    width:100% !important;
    height:100% !important;
    min-height:0;
    object-fit:cover;
    border-radius:0 !important;
  }
  .shelter-detail-hero-wrap .shelter-detail-hero-placeholder{
    position:absolute;
    inset:0;
    width:100% !important;
    height:100% !important;
    min-height:0;
  }
  .shelter-detail-hero-wrap .shelter-detail-hero-media{
    position:relative;
    min-height:280px;
    align-self:stretch;
  }

  /* Perfil: favoritos mas chicos en desktop */
  .profile-favorites-grid{
    grid-template-columns:repeat(auto-fill,minmax(148px,172px)) !important;
    justify-content:start;
    gap:14px !important;
  }
  .profile-favorites-grid>a{
    max-width:172px;
  }
}
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
