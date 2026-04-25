import { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } from "react";

const ThemeCtx = createContext(null);

// ─── Config ───────────────────────────────────────────────────────
const DEFAULT_ADMIN_PW = "admin123";
const ADMIN_PHONE = "5492346306562";
const DONATION_LINK = "https://cafecito.app/refugiocasa"; // Cambiar por el link real de Cafecito/MercadoPago
const ANNOUNCEMENT = "🐾 ¡Bienvenidos al Registro de Mascotas de Capilla del Señor! Registrá a tu mascota para que siempre esté identificada."; // Default
const LS_ANNOUNCEMENT = "registro-mascotas-announcement";

// ─── Sample Data for Preview ──────────────────────────────────────
// Generate colored SVG placeholder with initial
const dogPlaceholder = (name, color) => {
  const initial = (name || "?")[0].toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="${color}"/><text x="200" y="220" font-family="Poppins,sans-serif" font-size="160" font-weight="800" fill="white" text-anchor="middle" opacity="0.9">${initial}</text><text x="200" y="340" font-family="Poppins,sans-serif" font-size="40" fill="white" text-anchor="middle" opacity="0.5">🐾</text></svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
};

const SAMPLE_DOGS = [
  { id: "s01", name: "Rocky", breed: "Labrador", color: "Dorado", size: "Grande", sex: "Macho", neutered: "Sí", ownerName: "Martín López", ownerPhone: "+5492346301111", neighborhood: "Centro", notes: "Muy amigable, le encanta jugar con la pelota. Tiene chip implantado.", photo: dogPlaceholder("Rocky", "#c8a250"), type: "owned", hasCollar: "Sí", collarColor: "Azul", lostSince: new Date(Date.now() - 3 * 3600000).toISOString(), lastSeenLocation: "Plaza San Martín, Centro", sightings: [{ id: "si1", text: "Lo vi corriendo por la plaza", location: "Plaza San Martín", date: new Date(Date.now() - 2 * 3600000).toISOString() }, { id: "si2", text: "Echado en la vereda de la panadería", location: "Av. Mitre 450", date: new Date(Date.now() - 1 * 3600000).toISOString() }], createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: "s02", name: "Luna", breed: "Caniche", color: "Blanco", size: "Pequeño", sex: "Hembra", neutered: "Sí", ownerName: "Carolina Ruiz", ownerPhone: "+5492346302222", neighborhood: "Barrio Norte", notes: "Moñito rosa. Tiene chip implantado. Muy miedosa con los ruidos fuertes.", photo: dogPlaceholder("Luna", "#b8a9c9"), type: "owned", hasCollar: "Sí", collarColor: "Rosa", lostSince: new Date(Date.now() - 18 * 3600000).toISOString(), lastSeenLocation: "Belgrano y Sarmiento", sightings: [], createdAt: new Date(Date.now() - 60 * 86400000).toISOString() },
  { id: "s03", name: "Toto", breed: "Mestizo", color: "Marrón y negro", size: "Mediano", sex: "Macho", neutered: "Sí", ownerName: "Pablo García", ownerPhone: "+5492346303333", neighborhood: "Las Quintas", notes: "Mancha blanca en el pecho. Muy cariñoso, duerme adentro.", photo: dogPlaceholder("Toto", "#8B6914"), type: "owned", hasCollar: "No", collarColor: "", lostSince: null, lastSeenLocation: null, sightings: [], createdAt: new Date(Date.now() - 15 * 86400000).toISOString() },
  { id: "s04", name: "Mora", breed: "Pastor Alemán", color: "Negro y fuego", size: "Grande", sex: "Hembra", neutered: "Sí", ownerName: "Lucía Fernández", ownerPhone: "+5492346304444", neighborhood: "Villa del Parque", notes: "Responde a silbidos. Tiene chip. Perra guardiana pero muy dócil con la familia.", photo: dogPlaceholder("Mora", "#4a3728"), type: "owned", hasCollar: "Sí", collarColor: "Rojo", lostSince: null, lastSeenLocation: null, sightings: [], createdAt: new Date(Date.now() - 45 * 86400000).toISOString() },
  { id: "s05", name: "Manchas", breed: "Mestizo", color: "Blanco con manchas negras", size: "Mediano", sex: "Macho", neutered: "Sí", ownerName: "—", ownerPhone: "", neighborhood: "Estación", notes: "Se lo ve por la estación todos los días. Manso, se deja acariciar. Come lo que le den.", photo: dogPlaceholder("Manchas", "#607D8B"), type: "stray", adoptionStatus: "transit", lostSince: null, lastSeenLocation: "Estación de tren", sightings: [], createdAt: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: "s06", name: "Canela", breed: "Mestiza", color: "Marrón claro", size: "Pequeño", sex: "Hembra", neutered: "No", ownerName: "—", ownerPhone: "", neighborhood: "Ruta 8", notes: "Encontrada atropellada en Ruta 8, se recuperó completamente. Necesita hogar urgente. Vacunada y desparasitada.", photo: dogPlaceholder("Canela", "#d4845a"), type: "stray", adoptionStatus: "urgent", lostSince: null, lastSeenLocation: null, sightings: [], createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: "s07", name: "Negro", breed: "Labrador mix", color: "Negro", size: "Grande", sex: "Macho", neutered: "Sí", ownerName: "—", ownerPhone: "", neighborhood: "Centro", notes: "Muy tranquilo, ideal para familia con chicos. Vacunado, castrado y con todas las vacunas al día.", photo: dogPlaceholder("Negro", "#2c2c2c"), type: "stray", adoptionStatus: "shelter", lostSince: null, lastSeenLocation: null, sightings: [], createdAt: new Date(Date.now() - 20 * 86400000).toISOString() },
  { id: "s08", name: "Princesa", breed: "Cocker Spaniel", color: "Dorado", size: "Mediano", sex: "Hembra", neutered: "Sí", ownerName: "—", ownerPhone: "", neighborhood: "Centro", notes: "Rescatada de situación de abandono. Cariñosa y juguetona. Ideal para departamento.", photo: dogPlaceholder("Princesa", "#c8a250"), type: "stray", adoptionStatus: "shelter", lostSince: null, lastSeenLocation: null, sightings: [], createdAt: new Date(Date.now() - 14 * 86400000).toISOString() },
  { id: "s09", name: "Pirata", breed: "Mestizo", color: "Blanco y marrón", size: "Mediano", sex: "Macho", neutered: "No", ownerName: "—", ownerPhone: "", neighborhood: "Centro", notes: "Un ojo celeste, otro marrón. Súper sociable con otros perros. Le encanta correr.", photo: dogPlaceholder("Pirata", "#8D6E63"), type: "stray", adoptionStatus: "shelter", lostSince: null, lastSeenLocation: null, sightings: [], createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: "s10", name: "Coco", breed: "Salchicha mix", color: "Negro y fuego", size: "Pequeño", sex: "Macho", neutered: "Sí", ownerName: "—", ownerPhone: "", neighborhood: "Ruta 8", notes: "Encontrado en la ruta. Ya vacunado y desparasitado. Urgente, necesita espacio. Muy activo y juguetón.", photo: dogPlaceholder("Coco", "#5D4037"), type: "stray", adoptionStatus: "urgent", lostSince: null, lastSeenLocation: null, sightings: [], createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
];

// ─── Utilities ────────────────────────────────────────────────────
// Image compression via canvas (max ~150KB)
function compressImage(file, maxW = 800, quality = 0.7) {
  return new Promise((res) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > maxW) { h = (h * maxW) / w; w = maxW; }
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        res(c.toDataURL("image/jpeg", quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

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

// Fuzzy search (Levenshtein distance)
function levenshtein(a, b) {
  if (!a || !b) return 99;
  a = a.toLowerCase(); b = b.toLowerCase();
  if (a.includes(b) || b.includes(a)) return 0;
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => { const r = new Array(n + 1); r[0] = i; return r; });
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + (a[i-1] !== b[j-1] ? 1 : 0));
  return dp[m][n];
}
function fuzzyMatch(query, text, threshold = 2) {
  if (!query || !text) return false;
  if (text.toLowerCase().includes(query.toLowerCase())) return true;
  const words = text.toLowerCase().split(/\s+/);
  return words.some(w => levenshtein(query.toLowerCase(), w) <= threshold);
}

// WhatsApp number validation & cleanup (Argentina)
function cleanWhatsApp(num) {
  let clean = num.replace(/[^0-9]/g, "");
  // Si empieza con 0, sacarlo (ej: 02346 → 2346)
  if (clean.startsWith("0")) clean = clean.slice(1);
  // Si empieza con 15, sacarlo (formato viejo local)
  if (clean.startsWith("15") && clean.length <= 10) clean = clean.slice(2);
  // Si ya tiene código de país 54, dejarlo
  if (clean.startsWith("54")) {
    // Asegurar que tenga el 9 después del 54 (formato mobile)
    if (!clean.startsWith("549")) clean = "549" + clean.slice(2);
    return clean.length >= 12 ? clean : null;
  }
  // Si tiene 10 dígitos (cód área + número), agregar 549
  if (clean.length === 10) return "549" + clean;
  // Si tiene 8 dígitos (solo número sin cód área), no alcanza
  if (clean.length < 10) return null;
  return clean;
}
function isValidWhatsApp(num) { return cleanWhatsApp(num) !== null; }
function formatWhatsApp(num) {
  const clean = cleanWhatsApp(num);
  if (!clean) return num;
  return "+" + clean;
}

// localStorage persistence
const LS_KEY = "registro-mascotas-dogs";
const LS_DARK = "registro-mascotas-dark";
const LS_USER = "registro-mascotas-user";
function lsLoad(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } }
function lsSave(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { console.warn("localStorage full:", e); } }

// ─── Flyer Generator (canvas, no dependencies) ───────────────────
// Helper: draw rounded rect with fallback
function drawRoundRect(ctx, x, y, w, h, r) { if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); } else { ctx.fillRect(x, y, w, h); } }
// Helper: auto-shrink text to fit width
function fitText(ctx, text, maxW, startSize, minSize = 20) { let s = startSize; ctx.font = `900 ${s}px Arial, sans-serif`; while (ctx.measureText(text).width > maxW && s > minSize) { s -= 2; ctx.font = `900 ${s}px Arial, sans-serif`; } return s; }

function generateFlyer(dog, type = "lost", previewContainer = null) {
  return new Promise((resolve) => {
    const W = 1080, H = 1920;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");
    if (!ctx) return resolve();
    const isLost = type === "lost";
    const RED = "#D42B2B", PURPLE = "#7c3aed", BLACK = "#1a1a1a", WHITE = "#FFFFFF";
    const accent = isLost ? RED : PURPLE;

    ctx.fillStyle = WHITE; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = accent; ctx.fillRect(0, 0, W, 240);
    ctx.fillStyle = WHITE; ctx.font = "900 86px Arial, sans-serif"; ctx.textAlign = "center";
    ctx.fillText(isLost ? "MASCOTA PERDIDA" : "EN ADOPCIÓN", W / 2, 110);
    ctx.font = "bold 34px Arial, sans-serif";
    ctx.fillText(isLost ? "AYUDANOS A ENCONTRARLA" : "NECESITA UN HOGAR", W / 2, 190);

    const drawContent = () => {
      const nameText = (dog.name || "SIN NOMBRE").toUpperCase();
      fitText(ctx, nameText, W - 80, 100);
      ctx.fillStyle = BLACK; ctx.textAlign = "center"; ctx.fillText(nameText, W / 2, 990);

      const gridTop = 1030, cellW = 470, cellH = 100, gap = 20, padL = 60;
      const items = [];
      if (dog.breed) items.push(["RAZA", dog.breed.toUpperCase()]);
      if (dog.color) items.push(["COLOR", dog.color.toUpperCase()]);
      if (dog.size) items.push(["TAMAÑO", dog.size.toUpperCase()]);
      if (isLost) {
        // Lost: Raza, Color, Tamaño, Collar, Sexo, Zona
        if (dog.hasCollar) items.push(["COLLAR", dog.hasCollar === "Sí" ? (dog.collarColor?.toUpperCase() || "SÍ") : "NO TIENE"]);
        if (dog.sex) items.push(["SEXO", dog.sex.toUpperCase()]);
        const zone = dog.lastSeenLocation || dog.neighborhood || "";
        if (zone && items.length < 6) items.push(["ZONA", zone.toUpperCase()]);
      } else {
        // Adoption: Raza, Color, Tamaño, Sexo, Estado, Castrado
        if (dog.sex) items.push(["SEXO", dog.sex.toUpperCase()]);
        const st = dog.adoptionStatus === "shelter" ? "EN REFUGIO" : dog.adoptionStatus === "transit" ? "EN TRÁNSITO" : dog.adoptionStatus === "urgent" ? "URGENTE" : "EN ADOPCIÓN";
        items.push(["ESTADO", st]);
        if (dog.neutered) items.push(["CASTRADO/A", dog.neutered.toUpperCase()]);
      }
      // Fill remaining to 6
      while (items.length < 6) {
        if (!items.some(i => i[0] === "CASTRADO/A") && dog.neutered) { items.push(["CASTRADO/A", dog.neutered.toUpperCase()]); continue; }
        if (!items.some(i => i[0] === "SEXO") && dog.sex) { items.push(["SEXO", dog.sex.toUpperCase()]); continue; }
        break;
      }
      items.slice(0, 6).forEach((item, i) => {
        const col = i % 2, row = Math.floor(i / 2);
        const x = padL + col * (cellW + gap), y = gridTop + row * (cellH + gap);
        ctx.fillStyle = "#f5f5f5"; drawRoundRect(ctx, x, y, cellW, cellH, 14);
        ctx.fillStyle = "#999"; ctx.font = "bold 22px Arial, sans-serif"; ctx.textAlign = "left";
        ctx.fillText(item[0], x + 20, y + 36);
        ctx.fillStyle = BLACK; fitText(ctx, item[1], cellW - 40, 36, 16);
        ctx.textAlign = "left"; ctx.fillText(item[1], x + 20, y + 78);
      });

      const rowsUsed = Math.ceil(items.slice(0, 6).length / 2);
      let nextY = gridTop + rowsUsed * (cellH + gap) + 10;
      const contactY = H - 320;

      if (isLost) {
        const locText = dog.lastSeenLocation || dog.neighborhood || "";
        let dateText = "";
        if (dog.lostSince) { try { const d = new Date(dog.lostSince); dateText = ` EL ${d.toLocaleDateString("es-AR")} A LAS ${d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`; } catch {} }
        if (locText || dateText) {
          ctx.fillStyle = accent;
          const fullLoc = "📍 VISTO EN " + locText.toUpperCase() + dateText;
          fitText(ctx, fullLoc, W - 80, 34, 20); ctx.textAlign = "center"; ctx.fillText(fullLoc, W / 2, nextY + 40); nextY += 80;
        }
      }

      if (dog.notes) {
        const notesW = W - padL * 2, maxNotesH = contactY - nextY - 20;
        if (maxNotesH > 80) {
          ctx.font = "28px Arial, sans-serif";
          const words = dog.notes.split(" "); let line = ""; const lines = [];
          for (const w of words) { const test = line ? line + " " + w : w; if (ctx.measureText(test).width > notesW - 48 && line) { lines.push(line); line = w; } else line = test; }
          if (line) lines.push(line);
          const maxLines = Math.max(1, Math.floor((maxNotesH - 48) / 36));
          const display = lines.slice(0, maxLines);
          if (lines.length > maxLines && display.length > 0) display[display.length - 1] = display[display.length - 1].replace(/\s+\S*$/, "...");
          const boxH = Math.max(80, display.length * 36 + 38);
          ctx.fillStyle = isLost ? "#fee2e2" : "#f3e8ff"; drawRoundRect(ctx, padL, nextY, notesW, boxH, 14);
          ctx.fillStyle = BLACK; ctx.textAlign = "left"; ctx.font = "28px Arial, sans-serif";
          display.forEach((l, i) => ctx.fillText(l, padL + 24, nextY + 52 + i * 36));
        }
      }

      ctx.fillStyle = accent; ctx.fillRect(0, contactY, W, 60);
      ctx.fillStyle = WHITE; ctx.font = "bold 30px Arial, sans-serif"; ctx.textAlign = "center";
      ctx.fillText(isLost ? "SI LO VES, AVISÁ" : "CONTACTO PARA ADOPCIÓN", W / 2, contactY + 42);
      ctx.fillStyle = BLACK; ctx.fillRect(0, contactY + 60, W, 170);
      ctx.fillStyle = WHITE;
      fitText(ctx, dog.ownerPhone || "SIN TELÉFONO", W - 80, 100, 40);
      ctx.textAlign = "center"; ctx.fillText(dog.ownerPhone || "SIN TELÉFONO", W / 2, contactY + 165);
      if (dog.ownerName && dog.ownerName !== "—") { ctx.font = "bold 30px Arial, sans-serif"; ctx.fillStyle = "#aaa"; ctx.fillText("Dueño/a: " + dog.ownerName, W / 2, contactY + 210); }
      ctx.fillStyle = accent; ctx.fillRect(0, H - 80, W, 80);
      ctx.fillStyle = WHITE; ctx.font = "bold 26px Arial, sans-serif";
      ctx.fillText("REGISTRO DE MASCOTAS — CAPILLA DEL SEÑOR", W / 2, H - 30);

      if (previewContainer) {
        previewContainer.innerHTML = ""; c.style.width = "100%"; c.style.borderRadius = "12px";
        previewContainer.appendChild(c); resolve(c);
      } else {
        c.toBlob(async (blob) => {
          if (!blob) return resolve();
          const filename = `${isLost ? "perdido" : "adopcion"}-${(dog.name || "mascota").toLowerCase().replace(/\s+/g, "-")}.jpg`;
          if (navigator.canShare) { try { const file = new File([blob], filename, { type: "image/jpeg" }); if (navigator.canShare({ files: [file] })) { await navigator.share({ title: isLost ? "Mascota Perdida" : "En Adopción", text: `${dog.name || "Mascota"} - ${isLost ? "¡Ayudanos a encontrarla!" : "¡Busca hogar!"}`, files: [file] }); return resolve(); } } catch {} }
          const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); resolve();
        }, "image/jpeg", 0.95);
      }
    };

    const photoTop = 240, photoH = 660;
    if (dog.photo) {
      const img = new Image();
      if (dog.photo.startsWith("http")) img.crossOrigin = "anonymous";
      img.onload = () => { const r = img.width / img.height; let dw = W, dh = W / r; if (dh < photoH) { dh = photoH; dw = photoH * r; } ctx.save(); ctx.rect(0, photoTop, W, photoH); ctx.clip(); ctx.drawImage(img, (W - dw) / 2, photoTop + (photoH - dh) / 2, dw, dh); ctx.restore(); drawContent(); };
      img.onerror = () => { drawNoPhoto(); drawContent(); };
      img.src = dog.photo;
    } else { drawNoPhoto(); drawContent(); }

    function drawNoPhoto() { ctx.fillStyle = "#f0f0f0"; ctx.fillRect(0, photoTop, W, photoH); ctx.fillStyle = "#ccc"; ctx.font = "160px Arial"; ctx.textAlign = "center"; ctx.fillText("🐾", W / 2, photoTop + photoH / 2 + 50); }
  });
}


// ─── Theme ────────────────────────────────────────────────────────
const themes = {
  light: {
    bg: "#faf7f2", card: "#ffffff", accent: "#d35400", accentLt: "#fef0e5", accentDk: "#b84700",
    txt: "#2c2417", muted: "#8a7d6e", border: "#e6ddd2", borderLt: "#f0ebe3",
    ok: "#1a8c5b", okLt: "#e6f5ed", danger: "#c0392b", dangerLt: "#fbeae8",
    urgent: "#e67e22", urgentLt: "#fef3e2",
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
    urgent: "#f59e0b", urgentLt: "#2e2410",
    blue: "#5cc8e8", blueLt: "#1a2830", blueDk: "#7dd8f0",
    purple: "#c4b5fd", purpleLt: "#24202e",
    navy: "#e8873a", navyLt: "#302218",
    shadow: "0 1px 3px rgba(0,0,0,0.25),0 4px 12px rgba(0,0,0,0.2)",
    shadowLg: "0 4px 12px rgba(0,0,0,0.35),0 12px 32px rgba(0,0,0,0.25)",
    headerBg: "linear-gradient(135deg,#c26a1a,#9a5210)",
    inputBg: "#262220", inputBorder: "#3a3430",
  },
};
const FONT = "'Poppins','Segoe UI',sans-serif";
const R = "14px", RS = "10px";

function getCSS(t) {
  return `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:${FONT};background:${t.bg};color:${t.txt};-webkit-font-smoothing:antialiased;transition:background .3s,color .3s}
button{font-family:${FONT}}
a{font-family:${FONT}}
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
  Shield: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Alert: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Share: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  Eye: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Heart: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  MapPin: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Instagram: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

// ─── Reusable ─────────────────────────────────────────────────────
function Btn({ children, onClick, v = "primary", sz = "md", disabled, style, icon }) {
  const T = useT();
  const vs = { primary: { bg: T.accent, c: "#fff", b: "none", h: T.accentDk }, secondary: { bg: "transparent", c: T.txt, b: `1.5px solid ${T.border}`, h: T.borderLt }, danger: { bg: "transparent", c: T.danger, b: `1.5px solid ${T.dangerLt}`, h: T.dangerLt }, ghost: { bg: "transparent", c: T.muted, b: "none", h: T.borderLt }, success: { bg: T.ok, c: "#fff", b: "none", h: "#24704a" } };
  const szs = { sm: { p: "6px 12px", f: "13px" }, md: { p: "10px 20px", f: "14px" }, lg: { p: "14px 28px", f: "15px" } };
  const vv = vs[v], ss = szs[sz];
  return <button onClick={onClick} disabled={disabled} style={{ padding: ss.p, fontSize: ss.f, background: disabled ? T.border : vv.bg, color: disabled ? T.muted : vv.c, border: vv.b, borderRadius: RS, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "6px", transition: "all .2s", ...style }} onMouseEnter={e => { if (!disabled) e.target.style.background = vv.h; }} onMouseLeave={e => { if (!disabled) e.target.style.background = disabled ? T.border : vv.bg; }}>{icon}{children}</button>;
}

function Card({ children, style, className }) {
  const T = useT();
  return <div className={className} style={{ background: T.card, borderRadius: R, border: `1px solid ${T.borderLt}`, boxShadow: T.shadow, ...style }}>{children}</div>;
}

function PhotoUp({ value, onChange, size = 120 }) {
  const T = useT();
  const [loading, setLoading] = useState(false);
  const hf = async (e) => { const f = e.target.files[0]; if (f) { setLoading(true); onChange(await compressImage(f)); setLoading(false); } };
  return <label style={{ width: size, height: size, borderRadius: R, border: `2px dashed ${value ? "transparent" : T.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", background: value ? "transparent" : T.accentLt, color: T.accent, flexShrink: 0, position: "relative" }}>
    {loading ? <div style={{ animation: "pulse 1s infinite", fontSize: 14, fontWeight: 600 }}>Procesando...</div> : value ? <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <>{I.Cam()}<span style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>Subir foto</span></>}
    <input type="file" accept="image/*" onChange={hf} style={{ display: "none" }} />
  </label>;
}

function Badge({ children, bg, color }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: bg, color, letterSpacing: ".3px" }}>{children}</span>;
}

function StatCard({ icon, label, value, bg, color, delay = 0 }) {
  const T = useT();
  return <div className={`anim d${delay}`} style={{ flex: 1, background: bg, borderRadius: RS, padding: "14px 8px", textAlign: "center" }}>
    <div style={{ marginBottom: 4, color }}>{icon}</div>
    <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 12, fontWeight: 600, color: T.muted, marginTop: 4 }}>{label}</div>
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
      {lost && <div style={{ background: T.danger, color: "#fff", padding: "6px 14px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between" }}><span>🚨 PERDIDO</span><span>⏱ hace {el}</span></div>}
      {stray && <div style={{ background: dog.adoptionStatus === "urgent" ? T.urgent : T.purple, color: "#fff", padding: "6px 14px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>{dog.adoptionStatus === "urgent" ? "🚨 URGENTE" : "💜 EN ADOPCIÓN"}</span>
        <span style={{ fontSize: 12, opacity: .9 }}>{dog.adoptionStatus === "transit" ? "🏠 En tránsito" : dog.adoptionStatus === "shelter" ? "🏥 En refugio" : dog.adoptionStatus === "urgent" ? "Necesita hogar ya" : ""}</span>
      </div>}
      {dog.adoptionStatus === "shelter" && <div style={{ background: "linear-gradient(135deg, #f5e6c8, #e8d5a8)", padding: "4px 14px", fontSize: 12, fontWeight: 700, color: "#8a6d3b", display: "flex", alignItems: "center", gap: 5 }}>✅ Verificado — Refugio CASA</div>}
      <div onClick={() => onClick(dog)} onMouseEnter={e => { e.currentTarget.parentElement.style.transform = "translateY(-2px)"; e.currentTarget.parentElement.style.boxShadow = T.shadowLg; }} onMouseLeave={e => { e.currentTarget.parentElement.style.transform = "translateY(0)"; e.currentTarget.parentElement.style.boxShadow = T.shadow; }}>
        <div style={{ display: "flex", gap: 14, padding: 14 }}>
          {dog.photo ? <img src={dog.photo} alt={dog.name} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10, flexShrink: 0, ...(lost ? { filter: "saturate(.6)", border: `2px solid ${T.danger}` } : {}) }} /> : <div style={{ width: 72, height: 72, borderRadius: 10, flexShrink: 0, background: lost ? T.dangerLt : stray ? T.purpleLt : T.accentLt, display: "flex", alignItems: "center", justifyContent: "center", color: lost ? T.danger : stray ? T.purple : T.accent }}>{I.Dog()}</div>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: lost ? T.danger : T.txt }}>{dog.name}</span>
              {!stray && <span style={{ fontSize: 12, color: lost ? T.muted : T.txt, fontWeight: lost ? 400 : 700 }}>de {dog.ownerName}</span>}
            </div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 6 }}>{[dog.breed, dog.color, dog.size, dog.neutered === "Sí" ? "Castrado/a" : dog.neutered === "No" ? "Sin castrar" : null].filter(Boolean).join(" · ")}</div>
            <div style={{ display: "flex", gap: 10, fontSize: 12, color: T.muted, flexWrap: "wrap" }}>
              {dog.neighborhood && <span style={{ display: "flex", alignItems: "center", gap: 3, ...(lost ? { color: T.accent, fontWeight: 700 } : {}) }}>{I.Loc()} {dog.neighborhood}</span>}
              {dog.hasCollar === "Sí" && <span style={lost ? { color: T.ok, fontWeight: 700 } : {}}>Collar: {dog.collarColor || "sí"}</span>}
              {dog.hasCollar === "No" && <span style={{ color: T.danger, fontWeight: lost ? 700 : 400 }}>Collar: no tiene</span>}
              {lost && dog.sightings?.length > 0 && <span>Lo vieron hace: {elapsedStr(dog.sightings[dog.sightings.length - 1]?.date)}</span>}
              {stray && dog.createdAt && <span style={{ color: T.purple }}>En adopción hace {elapsedStr(dog.createdAt)}</span>}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── DetailView ───────────────────────────────────────────────────
function DetailView({ dog, isAdmin, isOwner, onDelete, onEdit, onMarkLost, onMarkFound, onAddSighting, confirmDelete, onCancelDelete }) {
  const T = useT();
  const [el, setEl] = useState(() => elapsedStr(dog.lostSince));
  const [sightText, setSightText] = useState("");
  const [sightLoc, setSightLoc] = useState("");
  const [showSightForm, setShowSightForm] = useState(false);
  const [showFlyer, setShowFlyer] = useState(false);
  const [flyerLoading, setFlyerLoading] = useState(false);
  const flyerRef = useRef(null);
  const [showReportLost, setShowReportLost] = useState(false);
  const [detailReportLoc, setDetailReportLoc] = useState("");
  useEffect(() => {
    if (showFlyer && flyerRef.current) {
      setFlyerLoading(true);
      generateFlyer(dog, lost ? "lost" : "adopt", flyerRef.current).then(() => setFlyerLoading(false));
    }
  }, [showFlyer]);
  useEffect(() => { if (!dog.lostSince) return; setEl(elapsedStr(dog.lostSince)); const iv = setInterval(() => setEl(elapsedStr(dog.lostSince)), 30000); return () => clearInterval(iv); }, [dog.lostSince]);
  const lost = !!dog.lostSince, stray = dog.type === "stray";

  const shareMsg = lost
    ? `🚨 *PERRO PERDIDO* 🚨\n\n🐕 *${dog.name}*\n📋 ${[dog.breed, dog.color, dog.size].filter(Boolean).join(" · ")}\n📍 Última ubicación: ${dog.lastSeenLocation || dog.neighborhood || "No especificada"}\n${dog.notes ? `📝 ${dog.notes}\n` : ""}\n👤 Dueño: ${dog.ownerName}\n📱 Contacto: ${dog.ownerPhone}\n⏱ Perdido hace ${el}\n\n¡Si lo ves, avisá! 🙏`
    : stray ? `🐕 *PERRO EN BUSCA DE HOGAR* 🏠\n\n🐾 *${dog.name}*\n📋 ${[dog.breed, dog.color, dog.size].filter(Boolean).join(" · ")}\n📍 Zona: ${dog.neighborhood || "No especificada"}\n${dog.notes ? `📝 ${dog.notes}\n` : ""}\n¿Podés darle un hogar? 🙏` : null;

  const handleAddSighting = () => { if (!sightText) return; onAddSighting(dog.id, { id: genId(), text: sightText, location: sightLoc, date: new Date().toISOString() }); setSightText(""); setSightLoc(""); setShowSightForm(false); };

  return (
    <div className="anim">
      <Card style={{ overflow: "hidden", border: lost ? `2px solid ${T.danger}` : stray ? `2px solid ${T.purple}` : undefined }}>
        {lost && <div style={{ background: T.danger, color: "#fff", padding: "10px 16px", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between" }}><span>🚨 PERDIDO</span><span style={{ fontWeight: 600, fontSize: 14 }}>⏱ hace {el}</span></div>}
        {stray && <div style={{ background: dog.adoptionStatus === "urgent" ? T.urgent : T.purple, color: "#fff", padding: "10px 16px", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>{dog.adoptionStatus === "urgent" ? "🚨 URGENTE — NECESITA HOGAR" : "💜 EN ADOPCIÓN"}</span>
          <span style={{ fontSize: 12, opacity: .9 }}>{dog.adoptionStatus === "transit" ? "🏠 En tránsito" : dog.adoptionStatus === "shelter" ? "🏥 En refugio" : ""}</span>
        </div>}
        {dog.adoptionStatus === "shelter" && <div style={{ background: "linear-gradient(135deg, #f5e6c8, #e8d5a8)", padding: "8px 16px", fontSize: 13, fontWeight: 700, color: "#8a6d3b", display: "flex", alignItems: "center", gap: 6 }}>✅ Verificado — Refugio CASA</div>}
        {dog.photo && <img src={dog.photo} alt={dog.name} style={{ width: "100%", height: 220, objectFit: "cover", ...(lost ? { filter: "saturate(.5)" } : {}) }} />}

        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Poppins',sans-serif", color: lost ? T.danger : T.txt }}>{dog.name}</h2>
              <p style={{ fontSize: 14, color: T.muted, marginTop: 2 }}>{[dog.breed, dog.color, dog.size, dog.sex, dog.neutered === "Sí" ? "Castrado/a" : dog.neutered === "No" ? "Sin castrar" : null].filter(Boolean).join(" · ")}</p>
            </div>
            {(isAdmin || isOwner) && <div style={{ display: "flex", gap: 8 }}>
              {isOwner && !confirmDelete && <Btn v="secondary" sz="sm" onClick={() => onEdit(dog)}>✏️ Editar</Btn>}
              {confirmDelete ? <>
                <Btn v="secondary" sz="sm" onClick={onCancelDelete}>Cancelar</Btn>
                <Btn v="danger" sz="sm" onClick={() => onDelete(dog.id)} icon={I.Trash()}>Sí, eliminar</Btn>
              </> : <Btn v="danger" sz="sm" onClick={() => onDelete(dog.id)} icon={I.Trash()}>Eliminar</Btn>}
            </div>}
          </div>

          {lost && dog.lastSeenLocation && <div style={{ background: T.dangerLt, borderRadius: RS, padding: 12, marginBottom: 12, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.danger, fontWeight: 600 }}>{I.MapPin()} Última ubicación: {dog.lastSeenLocation}</div>}

          {!stray && (
            <div style={{ background: T.accentLt, borderRadius: RS, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".5px" }}>Dueño/a</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{dog.ownerName}</div>
              {dog.ownerPhone && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: T.muted }}>{I.Phone()} {dog.ownerPhone}</div>}
              {dog.neighborhood && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: T.muted, marginTop: 4 }}>{I.Loc()} {dog.neighborhood}</div>}
              {dog.ownerPhone && <a href={`https://wa.me/${dog.ownerPhone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10, padding: "8px 14px", background: "#25D366", color: "#fff", borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>💬 Contactar por WhatsApp</a>}
            </div>
          )}
          {stray && <div style={{ background: T.purpleLt, borderRadius: RS, padding: 14, marginBottom: 12 }}><div style={{ fontSize: 12, fontWeight: 700, color: T.purple, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".5px" }}>{dog.adoptionStatus === "shelter" ? "Ubicación" : dog.adoptionStatus === "transit" ? "En tránsito en" : "Zona"}</div><div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600 }}>{I.Loc()} {dog.adoptionStatus === "shelter" ? "Refugio CASA" : dog.neighborhood || "No especificada"}</div></div>}

          {!stray && dog.hasCollar && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: RS, marginBottom: 12, background: dog.hasCollar === "Sí" ? T.blueLt : T.dangerLt, border: `1px solid ${dog.hasCollar === "Sí" ? T.blue : T.danger}22` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: dog.hasCollar === "Sí" ? T.blue : T.danger }}>
                {dog.hasCollar === "Sí" ? `Collar: ${dog.collarColor || "sí"}` : "Collar: no tiene"}
              </div>
            </div>
          )}

          {dog.notes && <div style={{ fontSize: 14, color: T.muted, lineHeight: 1.5, padding: "4px 0", marginBottom: 12 }}><strong style={{ color: T.txt }}>{stray ? "🐾 Conóceme:" : lost ? "🔍 Señas particulares:" : `🐾 Sobre ${dog.name}:`}</strong> {dog.notes}</div>}

          {/* Sightings */}
          {(dog.sightings?.length > 0 || lost) && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".5px" }}>Avistamientos ({dog.sightings?.length || 0})</span>
                {lost && !showSightForm && <button onClick={() => setShowSightForm(true)} style={{ background: T.blue, color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 20, boxShadow: `0 2px 8px ${T.blue}40`, transition: "all .2s" }}>{I.Eye()} Reportar avistamiento</button>}
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
                  <div style={{ display: "flex", gap: 10, fontSize: 12, color: T.muted }}>{s.location && <span style={{ display: "flex", alignItems: "center", gap: 3 }}>{I.Loc()} {s.location}</span>}<span style={{ display: "flex", alignItems: "center", gap: 3 }}>{I.Clock()} {fmtDate(s.date)}</span></div>
                </div>)}
              </div>}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {lost && <>
              <a href={`https://wa.me/${dog.ownerPhone?.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${dog.ownerName}! Vi a ${dog.name} que está reportado como perdido. ¿Sigue perdido?`)}`} target="_blank" rel="noopener noreferrer"
                onClick={() => { setTimeout(() => { window.open(`https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(`🐾 Aviso: alguien vio a "${dog.name}" (${dog.breed || ""}, ${dog.neighborhood || ""}). Dueño: ${dog.ownerName} - ${dog.ownerPhone}`)}`, "_blank"); }, 600); }}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "16px 20px", background: "linear-gradient(135deg,#2d8a56,#1fa855)", color: "#fff", borderRadius: RS, fontWeight: 800, fontSize: 16, textDecoration: "none", boxShadow: "0 4px 14px rgba(45,138,86,.35)", letterSpacing: ".3px" }}>🎉 ¡Lo encontré!</a>
              <p style={{ fontSize: 12, color: T.muted, textAlign: "center" }}>Se avisará al dueño y al administrador por WhatsApp</p>
              {(isAdmin || isOwner) && <Btn v="secondary" sz="sm" onClick={() => onMarkFound(dog.id)} icon={I.Check()} style={{ justifyContent: "center" }}>Marcar como encontrado</Btn>}
            </>}
            {!lost && !stray && <>
              {!showReportLost ? (
                <button onClick={() => { setShowReportLost(true); setDetailReportLoc(""); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 20px", background: T.danger, color: "#fff", border: "none", borderRadius: RS, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>{I.Alert()} Reportar como perdido</button>
              ) : (
                <div className="anim" style={{ display: "flex", flexDirection: "column", gap: 10, background: T.dangerLt, padding: 16, borderRadius: RS, border: `1.5px solid ${T.danger}` }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.danger, textAlign: "center" }}>📍 ¿Dónde lo vieron por última vez?</div>
                  <input placeholder="Ej: Plaza San Martín, calle Mitre..." value={detailReportLoc} onChange={e => setDetailReportLoc(e.target.value)} style={{ borderColor: T.danger, fontSize: 14, padding: "12px 14px" }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setShowReportLost(false)} style={{ flex: 1, padding: "12px", background: T.card, color: T.muted, border: `1px solid ${T.border}`, borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancelar</button>
                    <button disabled={!detailReportLoc.trim()} onClick={() => { onMarkLost(dog.id, detailReportLoc); setShowReportLost(false); }} style={{ flex: 2, padding: "12px", background: !detailReportLoc.trim() ? T.border : T.danger, color: !detailReportLoc.trim() ? T.muted : "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: detailReportLoc.trim() ? "pointer" : "not-allowed" }}>🚨 Confirmar reporte</button>
                  </div>
                </div>
              )}
            </>}
            {stray && <a href={`https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(`Hola, me interesa adoptar a ${dog.name}. ¿Pueden darme más información?`)}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 20px", background: "linear-gradient(135deg,#7c3aed,#9b59b6)", color: "#fff", borderRadius: RS, fontWeight: 800, fontSize: 15, textDecoration: "none", boxShadow: "0 4px 14px rgba(124,58,237,.3)" }}>{I.Heart()} Quiero adoptarlo</a>}
            {stray && dog.adoptionStatus === "shelter" && DONATION_LINK && <a href={DONATION_LINK} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 20px", background: "linear-gradient(135deg, #f5e6c8, #e8d5a8)", color: "#8a6d3b", borderRadius: RS, fontWeight: 700, fontSize: 14, textDecoration: "none", border: "1px solid #e8d5a8" }}>🍽️ Dale de comer a un perrito del refugio</a>}
            {shareMsg && <a href={`https://wa.me/?text=${encodeURIComponent(shareMsg)}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 20px", background: T.bg, color: T.txt, border: `1.5px solid ${T.border}`, borderRadius: RS, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>{I.Share()} Compartir en grupos de WhatsApp</a>}
            {(lost || stray) && <>
              <button onClick={() => setShowFlyer(!showFlyer)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 20px", background: "transparent", color: T.accent, border: `1.5px solid ${T.accent}`, borderRadius: RS, fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all .2s" }}>
                {showFlyer ? "✕ Cerrar flyer" : "📋 Generar flyer para compartir"}
              </button>
              {showFlyer && <div className="anim">
                {flyerLoading && <div style={{ textAlign: "center", padding: 20, color: T.muted }}><div style={{ animation: "pulse 1.5s infinite", fontSize: 24, marginBottom: 8 }}>🖼️</div>Generando flyer...</div>}
                <div ref={flyerRef} style={{ borderRadius: 12, overflow: "hidden" }} />
                <button onClick={() => generateFlyer(dog, lost ? "lost" : "adopt")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "12px 20px", marginTop: 8, background: T.accent, color: "#fff", border: "none", borderRadius: RS, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  📥 Descargar / Compartir
                </button>
              </div>}
            </>}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ═══ MAIN APP ═════════════════════════════════════════════════════
export default function App() {
  const [dark, setDark] = useState(() => lsLoad(LS_DARK, false));
  const T = dark ? themes.dark : themes.light;
  const [dogs, setDogs] = useState([]);
  const [view, setView] = useState("list");
  const [tab, setTab] = useState("all");
  const [selectedDog, setSelectedDog] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [listFilter, setListFilter] = useState({ size: "", sex: "", neighborhood: "", collar: "" });

  // Debounce: wait 300ms after typing to filter (protects CPU from fuzzy search on every keystroke)
  useEffect(() => {
    const t = setTimeout(() => setSearchFilter(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminInput, setAdminInput] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminPw, setAdminPw] = useState(DEFAULT_ADMIN_PW);
  const [showChangePw, setShowChangePw] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [form, setForm] = useState({ name: "", breed: "", color: "", size: "", sex: "", neutered: "", ownerName: "", ownerPhone: "", neighborhood: "", notes: "", photo: null, type: "owned", hasCollar: "", collarColor: "", adoptionStatus: "" });
  const [showMenu, setShowMenu] = useState(false);
  const [consent, setConsent] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [regStep, setRegStep] = useState(1);
  const [toast, setToast] = useState("");
  const [pickSearch, setPickSearch] = useState("");
  const [reportingDogId, setReportingDogId] = useState(null);
  const [reportLoc, setReportLoc] = useState("");
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [announcementText, setAnnouncementText] = useState(() => lsLoad(LS_ANNOUNCEMENT, ANNOUNCEMENT));
  const [editingAnnouncement, setEditingAnnouncement] = useState(false);
  const [announcementDraft, setAnnouncementDraft] = useState("");
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [showWelcome, setShowWelcome] = useState(() => !lsLoad("registro-mascotas-welcomed", false));
  const [userId, setUserId] = useState(() => {
    const saved = lsLoad(LS_USER, null);
    if (saved?.id) return saved;
    const newUser = { id: genId(), ownerName: "", ownerPhone: "" };
    lsSave(LS_USER, newUser);
    return newUser;
  });

  // Update userId to WhatsApp-based when phone is available
  const updateUserIdWithPhone = (phone, name) => {
    const cleanPhone = formatWhatsApp(phone);
    if (!cleanPhone) return;
    const phoneId = "wa_" + cleanPhone.replace(/\D/g, "");
    // Migrate existing dogs to new phoneId
    if (userId.id !== phoneId) {
      setDogs(prev => prev.map(d => d.userId === userId.id ? { ...d, userId: phoneId } : d));
    }
    const updated = { id: phoneId, ownerName: name || userId.ownerName, ownerPhone: cleanPhone };
    setUserId(updated);
    lsSave(LS_USER, updated);
  };

  // Load from localStorage, fallback to sample data. Merge any missing samples.
  useEffect(() => {
    const saved = lsLoad(LS_KEY, null);
    if (saved && saved.length > 0) {
      const existingIds = new Set(saved.map(d => d.id));
      const missing = SAMPLE_DOGS.filter(s => !existingIds.has(s.id));
      setDogs(missing.length > 0 ? [...saved, ...missing] : saved);
    } else {
      setDogs(SAMPLE_DOGS);
    }
    setLoading(false);
  }, []);

  // Persist dogs to localStorage on every change
  useEffect(() => { if (dogs.length > 0) lsSave(LS_KEY, dogs); }, [dogs]);

  // Persist dark mode preference
  useEffect(() => { lsSave(LS_DARK, dark); }, [dark]);

  // Browser back button support (pushState)
  const navigate = useCallback((newView, data) => {
    if (newView !== "list") window.history.pushState({ view: newView }, "");
    if (newView === "detail" && data) setSelectedDog(data);
    setView(newView);
  }, []);

  const goHome = useCallback(() => { setView("list"); setSelectedDog(null); setSearchResults([]); setShowMenu(false); }, []);

  useEffect(() => {
    const onPop = () => goHome();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [goHome]);

  const adminLogin = () => { if (adminInput === adminPw) { setIsAdmin(true); setShowAdminModal(false); setAdminInput(""); setAdminError(""); setShowMenu(true); } else setAdminError("Contraseña incorrecta"); };
  const adminLogout = () => { setIsAdmin(false); setShowChangePw(false); setNewPw(""); };
  const changePw = async () => { if (newPw.length < 4) return setAdminError("Mínimo 4 caracteres"); setAdminPw(newPw); setNewPw(""); setShowChangePw(false); };

  const handleRegister = async () => {
    if (!form.name || !form.photo) return;
    if (form.type === "owned") {
      if (!form.ownerName || !form.ownerPhone) return;
      if (!isValidWhatsApp(form.ownerPhone)) { setPhoneError("Número inválido. Poné solo código de área + número."); return; }
    }
    setPhoneError("");
    const savedForm = { ...form };
    if (savedForm.ownerPhone) savedForm.ownerPhone = formatWhatsApp(savedForm.ownerPhone);
    // Update userId to WhatsApp-based if we have a phone
    if (savedForm.type === "owned" && savedForm.ownerName && savedForm.ownerPhone) {
      updateUserIdWithPhone(savedForm.ownerPhone, savedForm.ownerName);
      const phoneId = "wa_" + savedForm.ownerPhone.replace(/\D/g, "");
      savedForm.userId = phoneId;
    } else {
      savedForm.userId = userId.id;
    }
    if (editingId) {
      // Edit mode: update existing dog
      setDogs(dogs.map(d => d.id === editingId ? { ...d, ...savedForm, reportLost: undefined } : d));
      setEditingId(null);
      setToast("✅ ¡Listo! Los cambios se guardaron");
    } else {
      // New registration
      setDogs([{ ...savedForm, id: genId(), createdAt: new Date().toISOString(), lostSince: savedForm.reportLost ? new Date().toISOString() : null, lastSeenLocation: savedForm.lastSeenLocation || null, sightings: [], reportLost: undefined }, ...dogs]);
      setToast(savedForm.reportLost ? "🚨 ¡Reportada como perdida! Ya aparece en la lista" : savedForm.type === "stray" ? "💜 ¡Listo! Publicada para adopción" : "✅ ¡Listo! Tu mascota fue registrada");
    }
    setForm({ name: "", breed: "", color: "", size: "", sex: "", neutered: "", ownerName: "", ownerPhone: "", neighborhood: "", notes: "", photo: null, type: "owned", hasCollar: "", collarColor: "", adoptionStatus: "" });
    setRegStep(1);
    setView("list");
    setTimeout(() => setToast(""), 5000);
  };
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const handleDelete = async (id) => {
    if (confirmDeleteId !== id) { setConfirmDeleteId(id); return; }
    setDogs(dogs.filter(d => d.id !== id)); setView("list"); setSelectedDog(null); setConfirmDeleteId(null);
    setToast("🗑️ Mascota eliminada"); setTimeout(() => setToast(""), 5000);
  };
  const handleMarkLost = async (id, loc) => { const u = dogs.map(d => d.id === id ? { ...d, lostSince: new Date().toISOString(), lastSeenLocation: loc || "" } : d); setDogs(u); setSelectedDog(u.find(d => d.id === id)); };
  const handleMarkFound = async (id) => { const u = dogs.map(d => d.id === id ? { ...d, lostSince: null, lastSeenLocation: null } : d); setDogs(u); setSelectedDog(u.find(d => d.id === id)); };
  const handleAddSighting = async (id, s) => { const u = dogs.map(d => d.id === id ? { ...d, sightings: [...(d.sightings || []), s] } : d); setDogs(u); setSelectedDog(u.find(d => d.id === id)); };

  // Open register with auto-fill from saved user
  const savedUser = lsLoad(LS_USER, {});
  const [editingId, setEditingId] = useState(null);
  const openRegister = (type = "owned") => {
    setEditingId(null);
    setForm({
      name: "", breed: "", color: "", size: "", sex: "", neutered: "",
      ownerName: type === "owned" || type === "lost" ? (savedUser.ownerName || "") : "—",
      ownerPhone: type === "owned" || type === "lost" ? (savedUser.ownerPhone || "") : "",
      neighborhood: "", notes: "", photo: null, type: type === "lost" ? "owned" : type,
      hasCollar: "", collarColor: "", adoptionStatus: "",
      reportLost: type === "lost", lastSeenLocation: "",
    });
    setConsent(false); setRegStep(1); setPhoneError(""); navigate("register");
  };

  const handleEdit = (dog) => {
    setEditingId(dog.id);
    setForm({
      name: dog.name || "", breed: dog.breed || "", color: dog.color || "",
      size: dog.size || "", sex: dog.sex || "", neutered: dog.neutered || "",
      ownerName: dog.ownerName || "", ownerPhone: dog.ownerPhone || "",
      neighborhood: dog.neighborhood || "", notes: dog.notes || "",
      photo: dog.photo || null, type: dog.type || "owned",
      hasCollar: dog.hasCollar || "", collarColor: dog.collarColor || "",
      adoptionStatus: dog.adoptionStatus || "",
      reportLost: false, lastSeenLocation: dog.lastSeenLocation || "",
    });
    setConsent(true); setRegStep(1); setPhoneError(""); navigate("register");
  };

  const myDogs = dogs.filter(d => d.userId === userId.id);

  // ─── Filter Search ───
  const [searchFilters, setSearchFilters] = useState({ size: "", color: "", breed: "", sex: "", neighborhood: "", hasCollar: "" });

  const handleFilterSearch = () => {
    const results = dogs.filter(d => {
      if (d.type === "deleted") return false;
      let score = 0, checks = 0;
      if (searchFilters.size) { checks++; if (d.size?.toLowerCase() === searchFilters.size.toLowerCase()) score++; }
      if (searchFilters.color) { checks++; if (fuzzyMatch(searchFilters.color, d.color)) score++; }
      if (searchFilters.breed) { checks++; if (fuzzyMatch(searchFilters.breed, d.breed)) score++; }
      if (searchFilters.sex) { checks++; if (d.sex?.toLowerCase() === searchFilters.sex.toLowerCase()) score++; }
      if (searchFilters.neighborhood) { checks++; if (fuzzyMatch(searchFilters.neighborhood, d.neighborhood)) score++; }
      if (searchFilters.hasCollar) { checks++; if (d.hasCollar === searchFilters.hasCollar) score++; }
      if (checks === 0) return false;
      d._score = score; d._checks = checks;
      return score > 0;
    }).sort((a, b) => (b._score / b._checks) - (a._score / a._checks));
    setSearchResults(results.map(d => ({ ...d, confidence: d._score === d._checks ? "alta" : d._score >= d._checks / 2 ? "media" : "baja", reason: [d._score === d._checks && "Coincide todo", d.size?.toLowerCase() === searchFilters.size?.toLowerCase() && "Mismo tamaño", fuzzyMatch(searchFilters.color, d.color) && "Color similar", fuzzyMatch(searchFilters.breed, d.breed) && "Misma raza", d.hasCollar === searchFilters.hasCollar && (searchFilters.hasCollar === "Sí" ? "Con collar" : "Sin collar")].filter(Boolean).join(", ") })));
    navigate("results");
  };

  const lostDogs = useMemo(() => dogs.filter(d => d.lostSince), [dogs]);
  const strayDogs = useMemo(() => dogs.filter(d => d.type === "stray"), [dogs]);
  const ownedDogs = useMemo(() => dogs.filter(d => d.type !== "stray"), [dogs]);
  const totalSightings = useMemo(() => dogs.reduce((n, d) => n + (d.sightings?.length || 0), 0), [dogs]);
  const recovered = useMemo(() => dogs.filter(d => !d.lostSince && d.sightings?.length > 0).length, [dogs]);

  const filtered = useMemo(() => dogs.filter(d => {
    if (tab === "lost") return !!d.lostSince;
    if (tab === "stray") return d.type === "stray";
    if (tab === "stats") return false;
    if (tab === "mypets") return d.userId === userId.id;
    return true;
  }).filter(d => { if (!searchFilter) return true; return fuzzyMatch(searchFilter, d.name) || fuzzyMatch(searchFilter, d.breed) || fuzzyMatch(searchFilter, d.ownerName) || fuzzyMatch(searchFilter, d.neighborhood); })
    .sort((a, b) => { if (a.lostSince && !b.lostSince) return -1; if (!a.lostSince && b.lostSince) return 1; if (a.type === "stray" && b.type === "stray") { if (a.adoptionStatus === "urgent" && b.adoptionStatus !== "urgent") return -1; if (a.adoptionStatus !== "urgent" && b.adoptionStatus === "urgent") return 1; } if (a.type === "stray" && b.type !== "stray") return -1; return 0; }),
  [dogs, tab, searchFilter, userId.id]);

  if (loading) return <ThemeCtx.Provider value={T}><div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: T.bg }}><div style={{ textAlign: "center", color: T.muted }}><div style={{ animation: "pulse 1.5s infinite", marginBottom: 8 }}>{I.Paw()}</div>Cargando...</div></div></ThemeCtx.Provider>;

  if (showWelcome) return <ThemeCtx.Provider value={T}><div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
    <style>{getCSS(T)}</style>
    <Card style={{ padding: 32, maxWidth: 380, textAlign: "center", width: "100%" }} className="anim">
      <div style={{ fontSize: 64, marginBottom: 16 }}>🐾</div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: T.txt }}>Registro de Mascotas</h1>
      <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.6, marginBottom: 8 }}>Capilla del Señor</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "left", margin: "20px 0", padding: 16, background: T.bg, borderRadius: RS }}>
        {[
          { emoji: "📋", text: "Registrá a tu mascota para que esté identificada" },
          { emoji: "🚨", text: "Reportá si tu mascota se pierde o si encontrás una" },
          { emoji: "💜", text: "Adoptá un perrito que busca hogar" },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{item.emoji}</span>
            <span style={{ fontSize: 14, color: T.txt, fontWeight: 500 }}>{item.text}</span>
          </div>
        ))}
      </div>
      <button onClick={() => { setShowWelcome(false); lsSave("registro-mascotas-welcomed", true); }} style={{ width: "100%", padding: "16px", background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`, color: "#fff", border: "none", borderRadius: RS, fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: `0 4px 14px ${T.accent}50` }}>Empezar →</button>
    </Card>
  </div></ThemeCtx.Provider>;

  return (
    <ThemeCtx.Provider value={T}>
    <div style={{ minHeight: "100vh", background: T.bg, transition: "background .3s" }}>
      <style>{getCSS(T)}</style>

      {/* Announcement Banner */}
      {showAnnouncement && announcementText && (
        <div style={{ background: "#e87d28", color: "#fff", padding: "8px 40px 8px 16px", fontSize: 12, fontWeight: 800, lineHeight: 1.4, position: "sticky", top: 0, zIndex: 810, textAlign: "center", marginBottom: 0 }}>
          {announcementText}
          <button onClick={() => setShowAnnouncement(false)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,.2)", border: "none", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 12, fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* Header — sticky & compact */}
      <div style={{ background: T.headerBg, color: "#fff", padding: "12px 16px", position: "sticky", top: 0, zIndex: 800, boxShadow: "0 2px 8px rgba(0,0,0,.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            {view !== "list" && (
              <button onClick={goHome} style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 8, color: "#fff", padding: "6px 8px", cursor: "pointer", display: "flex", alignItems: "center", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{I.Back()}</button>
            )}
            <h1 style={{ fontSize: 17, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {view === "list" && "Registro de Mascotas"}{view === "register" && (form.reportLost ? `Reportar (${regStep}/3)` : editingId ? `Editar (${regStep}/3)` : `Registrar (${regStep}/3)`)}{view === "detail" && selectedDog?.name}{view === "search" && "¿Encontraste uno?"}{view === "results" && "Resultados"}{view === "pickLost" && "Reportar perdido"}
            </h1>
          </div>
          {view === "list" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button onClick={() => { setDark(!dark); lsSave(LS_DARK, !dark); }} style={{ background: "rgba(255,255,255,.1)", border: "none", borderRadius: "50%", color: "#fff", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{dark ? "☀️" : "🌙"}</button>
              <button onClick={() => { setTab(tab === "mypets" ? "all" : "mypets"); setSearchInput(""); setSearchFilter(""); }} style={{
                background: tab === "mypets" ? "rgba(255,255,255,.25)" : "rgba(255,255,255,.1)",
                border: "none", borderRadius: 20, color: "#fff", padding: "5px 12px",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                fontSize: 12, fontWeight: 700, flexShrink: 0, transition: "all .2s",
              }}>
                🐾 {myDogs.length > 0 ? `Mis mascotas (${myDogs.length})` : "Mis mascotas"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Side Menu Overlay (from bottom nav "more") */}
      {showMenu && (
        <div style={{ position: "fixed", inset: 0, zIndex: 799 }} onClick={() => setShowMenu(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            position: "absolute", bottom: 70, right: 12, width: 280, maxHeight: "70vh", overflowY: "auto",
            background: T.card, borderRadius: R, boxShadow: T.shadowLg, padding: "12px",
            display: "flex", flexDirection: "column", gap: 4,
          }}>
            {[
              { id: "mypets", label: "🐾 Mis mascotas" },
              { id: "shelter", label: "🏠 Refugio CASA" },
              ...(isAdmin ? [{ id: "stats", label: "📊 Estadísticas" }] : []),
            ].map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setView("list"); setShowMenu(false); }} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "none", borderRadius: RS,
                background: tab === t.id ? T.accentLt : "transparent", color: tab === t.id ? T.accent : T.txt,
                fontSize: 14, fontWeight: tab === t.id ? 700 : 500, cursor: "pointer", width: "100%", textAlign: "left",
              }}>{t.label}</button>
            ))}
            <div style={{ height: 1, background: T.border, margin: "4px 0" }} />
            <button onClick={() => { if (isAdmin) { adminLogout(); } else { setShowAdminModal(true); setAdminInput(""); setAdminError(""); } setShowMenu(false); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "none", borderRadius: RS, background: isAdmin ? T.okLt : "transparent", color: isAdmin ? T.ok : T.txt, fontSize: 14, fontWeight: isAdmin ? 700 : 500, cursor: "pointer", width: "100%" }}>
              {isAdmin ? "🔓 Admin ✓" : "🔒 Admin"}
            </button>
            {isAdmin && !showChangePw && <button onClick={() => setShowChangePw(true)} style={{ padding: "6px 12px", background: "none", border: "none", color: T.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>Cambiar contraseña</button>}
            {isAdmin && showChangePw && <div style={{ display: "flex", gap: 6, padding: "4px 12px" }}><input type="password" placeholder="Nueva" value={newPw} onChange={e => setNewPw(e.target.value)} onKeyDown={e => e.key === "Enter" && changePw()} style={{ flex: 1, padding: "5px 8px", fontSize: 12 }} /><Btn sz="sm" onClick={changePw} style={{ padding: "5px 8px", fontSize: 12 }}>OK</Btn></div>}
            {isAdmin && <button onClick={(e) => { e.stopPropagation(); setDogs(SAMPLE_DOGS); lsSave(LS_KEY, SAMPLE_DOGS); setShowMenu(false); setToast("🔄 Datos reseteados a ejemplos"); setTimeout(() => setToast(""), 5000); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "none", borderRadius: RS, background: T.dangerLt, color: T.danger, fontSize: 13, fontWeight: 600, cursor: "pointer", width: "100%" }}>🔄 Resetear datos de ejemplo</button>}
            {isAdmin && <button onClick={() => { setEditingAnnouncement(!editingAnnouncement); setAnnouncementDraft(announcementText || ""); }} style={{ padding: "6px 12px", background: "none", border: "none", color: T.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>📢 Editar anuncio</button>}
            {isAdmin && editingAnnouncement && <div style={{ padding: "4px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
              <input placeholder="Texto del anuncio (vacío para ocultar)" value={announcementDraft} onChange={e => setAnnouncementDraft(e.target.value)} style={{ padding: "6px 8px", fontSize: 12 }} />
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => { setAnnouncementText(announcementDraft); lsSave(LS_ANNOUNCEMENT, announcementDraft); setShowAnnouncement(!!announcementDraft); setEditingAnnouncement(false); setToast("📢 Anuncio actualizado"); setTimeout(() => setToast(""), 5000); }} style={{ flex: 1, padding: "6px", background: T.accent, color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Guardar</button>
                {announcementText && <button onClick={() => { setAnnouncementText(""); lsSave(LS_ANNOUNCEMENT, ""); setShowAnnouncement(false); setEditingAnnouncement(false); setToast("📢 Anuncio eliminado"); setTimeout(() => setToast(""), 5000); }} style={{ padding: "6px 10px", background: T.dangerLt, color: T.danger, border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Quitar</button>}
              </div>
            </div>}
            <div style={{ height: 1, background: T.border, margin: "4px 0" }} />
            <button onClick={() => { setShowPrivacy(true); setShowMenu(false); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "none", borderRadius: RS, background: "transparent", color: T.muted, fontSize: 13, fontWeight: 500, cursor: "pointer", width: "100%" }}>📄 Privacidad</button>
          </div>
        </div>
      )}

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

      {/* Privacy Policy Modal */}
      {showPrivacy && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }} onClick={() => setShowPrivacy(false)}>
        <Card style={{ padding: 24, width: "100%", maxWidth: 400, maxHeight: "80vh", overflowY: "auto" }} className="anim"><div onClick={e => e.stopPropagation()}>
          <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>Política de Privacidad</h3>
          <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, display: "flex", flexDirection: "column", gap: 10 }}>
            <p><strong style={{ color: T.txt }}>Datos que recopilamos:</strong> nombre del dueño, número de WhatsApp, barrio, y datos descriptivos de la mascota (nombre, raza, color, foto).</p>
            <p><strong style={{ color: T.txt }}>Finalidad:</strong> los datos se utilizan exclusivamente para facilitar el reencuentro de mascotas perdidas con sus dueños y promover la adopción responsable.</p>
            <p><strong style={{ color: T.txt }}>Visibilidad:</strong> los datos de contacto (nombre y WhatsApp) serán visibles públicamente para cualquier persona que acceda a la plataforma.</p>
            <p><strong style={{ color: T.txt }}>Almacenamiento:</strong> los datos se almacenan en servidores seguros y no se comparten con terceros para fines comerciales ni publicitarios.</p>
            <p><strong style={{ color: T.txt }}>Tus derechos:</strong> podés solicitar la modificación o eliminación de tus datos en cualquier momento contactándonos por WhatsApp.</p>
            <p><strong style={{ color: T.txt }}>Base legal:</strong> Ley 25.326 de Protección de Datos Personales de la República Argentina.</p>
          </div>
          <Btn onClick={() => setShowPrivacy(false)} style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>Cerrar</Btn>
        </div></Card>
      </div>}

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "12px 14px 80px" }}>

        {view === "list" && <>
          {tab !== "stats" && tab !== "shelter" && <>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }} className="anim d1">
              {tab === "stray" ? (
                <><Btn onClick={() => openRegister("stray")} v="secondary" style={{ flex: 1, borderColor: T.purple, color: T.purple }}>💜 Dar en adopción</Btn>
                <a href={`https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent("Hola, quiero consultar sobre adopción")}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 20px", background: "#25D366", color: "#fff", borderRadius: RS, fontWeight: 600, fontSize: 14, textDecoration: "none" }}>💬 Consultar</a></>
              ) : tab === "mypets" ? (
                <Btn onClick={() => openRegister("owned")} icon={I.Plus()} style={{ flex: 1 }}>Registrar mascota</Btn>
              ) : tab === "lost" ? (
                <><Btn onClick={() => { setPickSearch(""); navigate("pickLost"); }} style={{ flex: 1, background: T.danger, color: "#fff", border: "none" }}>🚨 Reportar perdido</Btn>
                <Btn onClick={() => { setSearchFilters({ size: "", color: "", breed: "", sex: "", neighborhood: "", hasCollar: "" }); setSearchInput(""); setSearchFilter(""); navigate("search"); }} v="secondary" style={{ flex: 1, borderColor: T.navy, color: T.navy }}>🔍 Encontré un perdido</Btn></>
              ) : (
                <><Btn onClick={() => openRegister("owned")} icon={I.Plus()} style={{ flex: 1 }}>Registrar mascota</Btn>
                <Btn onClick={() => { setSearchFilters({ size: "", color: "", breed: "", sex: "", neighborhood: "", hasCollar: "" }); setSearchInput(""); setSearchFilter(""); navigate("search"); }} v="secondary" style={{ flex: 1, borderColor: T.navy, color: T.navy }}>🔍 Buscar mascota</Btn></>
              )}
            </div>

            {/* ═══ REFUGIO CASA — Carrusel Tinder (solo en Adopción) ═══ */}
            {tab === "stray" && (() => {
              const featured = dogs.filter(d => d.type === "stray" && (d.adoptionStatus === "urgent" || d.adoptionStatus === "shelter")).sort((a, b) => a.adoptionStatus === "urgent" ? -1 : 1);
              if (featured.length === 0) return null;
              const curr = featured[carouselIdx % featured.length];
              return (
                <div className="anim d1" style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: T.txt }}>🏠 Refugio CASA</span>
                    <span style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>{carouselIdx % featured.length + 1} de {featured.length}</span>
                  </div>
                  {DONATION_LINK && <a href={DONATION_LINK} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12, padding: "10px 16px", background: "linear-gradient(135deg, #f5e6c8, #e8d5a8)", color: "#8a6d3b", borderRadius: RS, fontWeight: 700, fontSize: 13, textDecoration: "none", border: "1px solid #e8d5a8" }}>🍽️ Dale de comer a un perrito del refugio</a>}

                  <Card style={{ overflow: "hidden", borderRadius: 20, border: `2px solid ${curr.adoptionStatus === "urgent" ? T.urgent : T.purple}`, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
                    <div style={{ position: "relative" }}>
                      {curr.photo ? <img src={curr.photo} alt={curr.name} style={{ width: "100%", height: 300, objectFit: "cover", display: "block" }} />
                        : <div style={{ width: "100%", height: 300, background: T.purpleLt, display: "flex", alignItems: "center", justifyContent: "center", color: T.purple }}>{I.Dog(80)}</div>}

                      <div style={{ position: "absolute", top: 14, left: 14, display: "flex", gap: 8 }}>
                        <span style={{ background: curr.adoptionStatus === "urgent" ? T.urgent : T.purple, color: "#fff", padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
                          {curr.adoptionStatus === "urgent" ? "🚨 URGENTE" : "🏥 REFUGIO"}
                        </span>
                        {curr.adoptionStatus === "shelter" && <span style={{ background: "linear-gradient(135deg, #f5e6c8, #e8d5a8)", color: "#8a6d3b", padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>✅ Verificado</span>}
                      </div>

                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 100%)", padding: "60px 20px 16px", color: "#fff" }}>
                        <h3 style={{ fontSize: 30, fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>{curr.name}</h3>
                        <p style={{ fontSize: 14, opacity: .95, margin: "4px 0 0", fontWeight: 500 }}>{[curr.breed, curr.sex, curr.size].filter(Boolean).join(" · ")}</p>
                        {curr.neighborhood && <p style={{ fontSize: 13, opacity: .8, margin: "2px 0 0" }}>📍 {curr.neighborhood}</p>}
                      </div>
                    </div>

                    <div style={{ padding: 14, display: "flex", gap: 12, background: T.bg }}>
                      <button onClick={() => setCarouselIdx(carouselIdx + 1)} style={{ flex: 1, padding: 14, borderRadius: 14, border: `2px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        ✕ Pasar
                      </button>
                      <button onClick={() => navigate("detail", curr)} style={{ flex: 1, padding: 14, borderRadius: 14, border: "none", background: "linear-gradient(135deg, #7c3aed, #9b59b6)", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 6px 16px rgba(124,58,237,0.3)" }}>
                        {I.Heart()} Me interesa
                      </button>
                    </div>
                  </Card>

                </div>
              );
            })()}

            {filtered.length === 0 ? (
              tab === "mypets" ? (
                <div className="anim d2" style={{ padding: "20px 0" }}>
                  <Card style={{ padding: 24, textAlign: "center" }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🐾</div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Mis mascotas</h3>
                    <p style={{ fontSize: 14, color: T.muted, marginBottom: 16, lineHeight: 1.5 }}>
                      Ingresá tu número de WhatsApp para ver tus mascotas o vincular este dispositivo.
                    </p>
                    {(() => {
                      const [recPhone, setRecPhone] = [form.ownerPhone || "", v => setForm({ ...form, ownerPhone: v })];
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.accent }}>📱 Tu número de WhatsApp</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                            <span style={{ background: T.borderLt, border: `1.5px solid ${T.inputBorder}`, borderRight: "none", borderRadius: `${RS} 0 0 ${RS}`, padding: "10px 12px", fontSize: 14, fontWeight: 700, color: T.muted, flexShrink: 0 }}>+54 9</span>
                            <input type="tel" inputMode="numeric" placeholder="2346306562" value={recPhone} onChange={e => setRecPhone(e.target.value.replace(/[^0-9]/g, ""))} maxLength={10} style={{ fontSize: 15, padding: "12px 14px", borderRadius: `0 ${RS} ${RS} 0` }} />
                          </div>
                          <p style={{ fontSize: 12, color: T.accent, fontWeight: 600 }}>⚠️ Poné solo los 10 números, sin 0, sin 15, sin +54</p>
                          <p style={{ fontSize: 12, color: T.muted }}>Ejemplo: si tu número es 02346-15-306562, poné <strong style={{ color: T.txt }}>2346306562</strong></p>
                          <button onClick={() => {
                            if (!isValidWhatsApp(recPhone)) { setToast("⚠️ Número inválido. Poné solo los 10 números sin 0 ni 15."); setTimeout(() => setToast(""), 5000); return; }
                            const cleanPhone = formatWhatsApp(recPhone);
                            const phoneId = "wa_" + cleanPhone.replace(/\D/g, "");
                            const found = dogs.filter(d => d.userId === phoneId);
                            if (found.length > 0) {
                              updateUserIdWithPhone(recPhone, found[0].ownerName || "");
                              setToast(`🎉 ¡Encontramos ${found.length} mascota${found.length > 1 ? "s" : ""}!`);
                            } else {
                              updateUserIdWithPhone(recPhone, "");
                              setToast("📱 WhatsApp vinculado. Registrá tu primera mascota.");
                            }
                            setForm({ ...form, ownerPhone: "" });
                            setTimeout(() => setToast(""), 5000);
                          }} style={{ padding: "14px", background: T.accent, color: "#fff", border: "none", borderRadius: RS, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Buscar mis mascotas</button>
                        </div>
                      );
                    })()}
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.borderLt}` }}>
                      <button onClick={() => openRegister("owned")} style={{ width: "100%", padding: "12px", background: T.accentLt, color: T.accent, border: "none", borderRadius: RS, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>+ Registrar mi primera mascota</button>
                    </div>
                  </Card>
                </div>
              ) : (
                <div className="anim d2" style={{ textAlign: "center", padding: "48px 20px", color: T.muted }}><div style={{ marginBottom: 12, opacity: .4 }}>{I.Dog()}</div><p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{searchFilter ? "Sin resultados" : tab === "lost" ? "No hay perdidos" : tab === "stray" ? "No hay perros sin hogar" : "No hay registrados"}</p></div>
              )
            )
              : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{filtered.map((d, i) => <DogCard key={d.id} dog={d} delay={(i % 4) + 1} onClick={d => { navigate("detail", d); }} />)}</div>}
          </>}

          {/* ═══ SHELTER TAB ═══ */}
          {tab === "shelter" && <div className="anim">
            {/* Hero card */}
            <Card style={{ overflow: "hidden", marginBottom: 16, border: `2px solid ${T.accent}` }}>
              <div style={{ background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`, padding: "28px 20px", textAlign: "center", color: "#fff" }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>🏠</div>
                <h2 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Refugio CASA</h2>
                <p style={{ fontSize: 14, opacity: .9, fontWeight: 500 }}>Rescatamos, cuidamos y buscamos hogares</p>
              </div>
              <div style={{ padding: 20 }}>
                <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.6, marginBottom: 16 }}>
                  El refugio <strong style={{ color: T.txt }}>CASA</strong> trabaja para rescatar, rehabilitar y encontrar familias para perros en situación de calle o abandono. Si encontraste un perro, querés adoptar, o simplemente querés ayudar, ¡contactanos!
                </p>

                {/* Social links */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <a href="https://www.instagram.com/casa_refugio/" target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)", color: "#fff", borderRadius: RS, fontWeight: 700, fontSize: 14, textDecoration: "none", transition: "transform .15s" }}>
                    {I.Instagram()} Seguinos en Instagram
                  </a>

                  <a href={`https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent("Hola! Quiero saber más sobre el refugio CASA y cómo puedo ayudar 🐾")}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#25D366", color: "#fff", borderRadius: RS, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
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
                {lostDogs.map(d => <div key={d.id} onClick={() => { navigate("detail", d); }} style={{ display: "flex", alignItems: "center", gap: 10, background: T.dangerLt, borderRadius: RS, padding: 10, cursor: "pointer", borderLeft: `3px solid ${T.danger}` }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.danger }}>{d.name}</div>
                  <div style={{ fontSize: 12, color: T.muted, flex: 1 }}>{d.breed} · {d.neighborhood}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.danger }}>⏱ {elapsedStr(d.lostSince)}</div>
                </div>)}
              </div>
            </>}
          </div>}
        </>}

        {view === "register" && <div className="anim"><Card style={{ padding: 20 }}>
          {/* Progress bar */}
          <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
            {[1,2,3].map(s => <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= regStep ? T.accent : T.borderLt, transition: "background .3s" }} />)}
          </div>

          {/* Step 1: Photo + Name */}
          {regStep === 1 && <div className="anim">
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>{form.reportLost ? "🚨" : "📸"}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{form.reportLost ? "¿Qué mascota se perdió?" : "¿Cómo se llama?"}</h3>
              <p style={{ fontSize: 13, color: T.muted }}>{form.reportLost ? "Subí una foto para que la identifiquen" : "Subí una foto y poné su nombre"}</p>
            </div>
            {form.reportLost && <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Badge bg={T.dangerLt} color={T.danger}>🚨 Reporte de perdido</Badge></div>}
            {form.type === "stray" && <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Badge bg={T.purpleLt} color={T.purple}>🏠 Sin dueño / Callejero</Badge></div>}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><PhotoUp value={form.photo} onChange={p => setForm({ ...form, photo: p })} size={160} /></div>
            <input placeholder="Nombre o apodo *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ marginBottom: 12 }} />
            <Btn onClick={() => setRegStep(2)} disabled={!form.name} sz="lg" style={{ width: "100%", justifyContent: "center" }}>Siguiente →</Btn>
            {!form.photo && <p style={{ fontSize: 12, color: T.muted, textAlign: "center", marginTop: 6 }}>La foto es opcional pero ayuda a identificarla</p>}
          </div>}

          {/* Step 2: Characteristics */}
          {regStep === 2 && <div className="anim">
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>🐕</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Características</h3>
              <p style={{ fontSize: 13, color: T.muted }}>Estos datos ayudan a identificarlo</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 10 }}><input placeholder="Raza" value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })} /><input placeholder="Color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} /></div>
              <div style={{ display: "flex", gap: 10 }}>
                <select value={form.size} onChange={e => setForm({ ...form, size: e.target.value })}><option value="">Tamaño</option><option value="Pequeño">Pequeño</option><option value="Mediano">Mediano</option><option value="Grande">Grande</option></select>
                <select value={form.sex} onChange={e => setForm({ ...form, sex: e.target.value })}><option value="">Sexo</option><option value="Macho">Macho</option><option value="Hembra">Hembra</option></select>
              </div>
              <select value={form.neutered} onChange={e => setForm({ ...form, neutered: e.target.value })}><option value="">¿Está castrado/a?</option><option value="Sí">Sí, castrado/a</option><option value="No">No</option><option value="No sé">No sé</option></select>
              <input placeholder="Barrio / Zona" value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} />
              {form.reportLost && (
                <input placeholder="📍 ¿Dónde se perdió? (calle, plaza, zona)" value={form.lastSeenLocation} onChange={e => setForm({ ...form, lastSeenLocation: e.target.value })} style={{ borderColor: T.danger }} />
              )}
              {form.type === "owned" && <div style={{ display: "flex", gap: 10 }}>
                <select value={form.hasCollar} onChange={e => setForm({ ...form, hasCollar: e.target.value, collarColor: e.target.value === "No" ? "" : form.collarColor })}><option value="">¿Tiene collar?</option><option value="Sí">Sí</option><option value="No">No</option></select>
                {form.hasCollar === "Sí" && <input placeholder="Color del collar" value={form.collarColor} onChange={e => setForm({ ...form, collarColor: e.target.value })} />}
              </div>}
              {form.type === "stray" && (
                <select value={form.adoptionStatus} onChange={e => setForm({ ...form, adoptionStatus: e.target.value })} style={form.adoptionStatus === "urgent" ? { borderColor: T.urgent, color: T.urgent } : {}}>
                  <option value="">¿Dónde está actualmente?</option>
                  <option value="transit">🏠 En tránsito (casa temporal)</option>
                  <option value="shelter">🏥 En refugio</option>
                  <option value="urgent">🚨 Urgente — necesita hogar ya</option>
                </select>
              )}
              <textarea placeholder={form.reportLost ? "Señas particulares (manchas, cicatrices, comportamiento...)" : form.type === "stray" ? "Contanos sobre este perrito (dónde se lo ve, cómo es...)" : "Contanos sobre tu mascota (señas, personalidad, chip...)"} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <Btn v="secondary" onClick={() => setRegStep(1)} style={{ flex: 1, justifyContent: "center" }}>← Atrás</Btn>
              <Btn onClick={() => setRegStep(3)} sz="lg" style={{ flex: 2, justifyContent: "center" }}>{form.type === "stray" ? "Reportar →" : "Siguiente →"}</Btn>
            </div>
            {!form.breed && !form.color && !form.size && <p style={{ fontSize: 13, color: T.danger, textAlign: "center", marginTop: 8, fontWeight: 600 }}>⚠️ Completá al menos raza, color o tamaño</p>}
          </div>}

          {/* Step 3: Contact + Consent (owned) / Confirm (stray) */}
          {regStep === 3 && <div className="anim">
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>{form.type === "stray" ? "✅" : "📱"}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{form.type === "stray" ? "Confirmar reporte" : "Datos de contacto"}</h3>
              <p style={{ fontSize: 13, color: T.muted }}>{form.type === "stray" ? "Revisá que todo esté bien" : "Para que te contacten si lo ven"}</p>
            </div>

            {/* Preview card */}
            <div style={{ display: "flex", gap: 12, padding: 12, background: T.borderLt, borderRadius: RS, marginBottom: 14 }}>
              {form.photo && <img src={form.photo} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 10 }} />}
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{form.name}</div>
                <div style={{ fontSize: 12, color: T.muted }}>{[form.breed, form.color, form.size].filter(Boolean).join(" · ") || "Sin detalles"}</div>
              </div>
            </div>

            {form.type === "owned" && <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
              <input placeholder="Nombre del dueño *" value={form.ownerName} onChange={e => setForm({ ...form, ownerName: e.target.value })} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.muted, marginBottom: 4 }}>📱 WhatsApp *</div>
                <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                  <span style={{ background: T.borderLt, border: `1.5px solid ${phoneError ? T.danger : T.inputBorder}`, borderRight: "none", borderRadius: `${RS} 0 0 ${RS}`, padding: "10px 12px", fontSize: 14, fontWeight: 700, color: T.muted, flexShrink: 0 }}>+54 9</span>
                  <input type="tel" inputMode="numeric" placeholder="2346306562" value={form.ownerPhone} onChange={e => { setForm({ ...form, ownerPhone: e.target.value.replace(/[^0-9]/g, "") }); setPhoneError(""); }} maxLength={10} style={{ borderRadius: `0 ${RS} ${RS} 0`, ...(phoneError ? { borderColor: T.danger } : {}) }} />
                </div>
                <p style={{ fontSize: 12, color: T.accent, fontWeight: 600, marginTop: 6 }}>⚠️ Poné solo los 10 números, sin 0, sin 15, sin +54</p>
                <p style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Ejemplo: si tu número es 02346-15-306562, poné <strong style={{ color: T.txt }}>2346306562</strong></p>
                {form.ownerPhone && isValidWhatsApp(form.ownerPhone) && (
                  <p style={{ fontSize: 12, color: T.ok, fontWeight: 600, marginTop: 4 }}>✅ Se guardará como {formatWhatsApp(form.ownerPhone)}</p>
                )}
                {phoneError && <p style={{ color: T.danger, fontSize: 12, fontWeight: 600, marginTop: 4 }}>{phoneError}</p>}
              </div>
            </div>}

            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", padding: "10px 0" }}>
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ width: "auto", marginTop: 2, flexShrink: 0, accentColor: T.accent }} />
              <span style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>
                Acepto que mis datos se muestren públicamente para facilitar el reencuentro con mascotas. <button onClick={(e) => { e.preventDefault(); setShowPrivacy(true); }} style={{ background: "none", border: "none", color: T.accent, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}>Ver privacidad</button>
              </span>
            </label>

            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <Btn v="secondary" onClick={() => setRegStep(2)} style={{ flex: 1, justifyContent: "center" }}>← Atrás</Btn>
              <Btn onClick={handleRegister} disabled={!consent || (form.type === "owned" && (!form.ownerName || !form.ownerPhone))} sz="lg" style={{ flex: 2, justifyContent: "center" }} icon={form.reportLost ? I.Alert() : form.type === "stray" ? I.Heart() : I.Paw()}>{editingId ? "✅ Guardar cambios" : form.reportLost ? "🚨 Reportar perdido" : form.type === "stray" ? "Reportar" : "Registrar"}</Btn>
            </div>
          </div>}
        </Card></div>}

        {view === "detail" && selectedDog && <DetailView dog={selectedDog} isAdmin={isAdmin} isOwner={selectedDog.userId === userId.id} onDelete={handleDelete} onEdit={handleEdit} onMarkLost={handleMarkLost} onMarkFound={handleMarkFound} onAddSighting={handleAddSighting} confirmDelete={confirmDeleteId === selectedDog?.id} onCancelDelete={() => setConfirmDeleteId(null)} />}

        {view === "reportLost" && <div className="anim">
          {(() => {
            const myNotLost = myDogs.filter(d => !d.lostSince);
            return myNotLost.length > 0 ? (
              <Card style={{ padding: 20 }}>
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>🚨</div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>¿Cuál se perdió?</h3>
                  <p style={{ fontSize: 13, color: T.muted }}>Seleccioná tu mascota para reportarla</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {myNotLost.map(d => (
                    <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: T.bg, borderRadius: RS, border: `1.5px solid ${T.border}` }}>
                      {d.photo ? <img src={d.photo} alt={d.name} style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 10, flexShrink: 0 }} /> : <div style={{ width: 48, height: 48, borderRadius: 10, flexShrink: 0, background: T.accentLt, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent }}>{I.Dog(32)}</div>}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{d.name}</div>
                        <div style={{ fontSize: 12, color: T.muted }}>{[d.breed, d.color].filter(Boolean).join(" · ")}</div>
                      </div>
                      <Btn v="danger" sz="sm" onClick={() => { setReportingDogId(d.id); setReportLoc(""); navigate("pickLost"); }}>Se perdió</Btn>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: `1px solid ${T.borderLt}`, paddingTop: 14 }}>
                  <Btn v="secondary" onClick={() => openRegister("lost")} style={{ width: "100%", justifyContent: "center" }}>No está en la lista — cargar nueva</Btn>
                </div>
              </Card>
            ) : (
              <Card style={{ padding: 20, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 6 }}>🚨</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Reportar mascota perdida</h3>
                <p style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>No tenés mascotas registradas. Vamos a cargar los datos.</p>
                <Btn onClick={() => openRegister("lost")} sz="lg" style={{ width: "100%", justifyContent: "center" }}>🚨 Cargar y reportar</Btn>
              </Card>
            );
          })()}
        </div>}

        {/* ═══ PICK LOST — select which pet is lost ═══ */}
        {view === "pickLost" && <div className="anim">
          <Card style={{ padding: 20, textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>🚨</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>¿Cuál se perdió?</h3>
            <p style={{ fontSize: 13, color: T.muted }}>Buscá en la lista general o cargá una nueva</p>
          </Card>

          <div style={{ position: "relative", marginBottom: 12 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.muted }}>{I.Search()}</span>
            <input type="text" placeholder="Buscar por nombre, raza, dueño..." value={pickSearch} onChange={e => setPickSearch(e.target.value)} style={{ paddingLeft: 38 }} />
          </div>

          {(() => {
            const available = dogs.filter(d => !d.lostSince);
            const mine = available.filter(d => d.userId === userId.id);
            const others = available.filter(d => d.userId !== userId.id);
            const sorted = [...mine, ...others];
            const results = sorted.filter(d => !pickSearch || fuzzyMatch(pickSearch, d.name) || fuzzyMatch(pickSearch, d.breed) || fuzzyMatch(pickSearch, d.ownerName));
            return results.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {results.map(d => (
                  <Card key={d.id} style={{ overflow: "hidden", border: reportingDogId === d.id ? `2px solid ${T.danger}` : d.userId === userId.id ? `1.5px solid ${T.accent}` : undefined }}>
                    <div style={{ display: "flex", gap: 14, padding: 14, alignItems: "center" }}>
                      {d.photo ? <img src={d.photo} alt={d.name} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 10, flexShrink: 0 }} /> : <div style={{ width: 56, height: 56, borderRadius: 10, flexShrink: 0, background: T.dangerLt, display: "flex", alignItems: "center", justifyContent: "center", color: T.danger }}>{I.Dog(36)}</div>}
                      <div style={{ flex: 1, cursor: "pointer" }} onClick={() => navigate("detail", d)}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{d.name} {d.userId === userId.id && <span style={{ fontSize: 12, color: T.accent }}>(tuya)</span>}</div>
                        <div style={{ fontSize: 13, color: T.muted }}>{[d.breed, d.color, d.size].filter(Boolean).join(" · ")}</div>
                        {d.ownerName && d.ownerName !== "—" && <div style={{ fontSize: 12, color: T.muted }}>de {d.ownerName}</div>}
                      </div>
                      {reportingDogId !== d.id && <button onClick={() => { setReportingDogId(d.id); setReportLoc(""); }} style={{ background: T.danger, color: "#fff", border: "none", fontWeight: 700, fontSize: 13, padding: "12px 16px", borderRadius: 10, cursor: "pointer", flexShrink: 0 }}>🚨 Reportar</button>}
                    </div>
                    {reportingDogId === d.id && (
                      <div className="anim" style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ background: T.dangerLt, padding: "10px 14px", borderRadius: 10, fontSize: 14, color: T.danger, fontWeight: 700, textAlign: "center" }}>📍 ¿Dónde lo vieron por última vez?</div>
                        <input placeholder="Ej: Plaza San Martín, calle Mitre y Belgrano..." value={reportLoc} onChange={e => setReportLoc(e.target.value)} style={{ borderColor: T.danger, fontSize: 14, padding: "12px 14px" }} />
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => setReportingDogId(null)} style={{ flex: 1, padding: "12px", background: T.borderLt, color: T.muted, border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancelar</button>
                          <button disabled={!reportLoc.trim()} onClick={() => { handleMarkLost(d.id, reportLoc); setTab("lost"); setView("list"); setPickSearch(""); setReportingDogId(null); setReportLoc(""); setToast("🚨 ¡Reportado! Ya aparece en la lista de perdidos"); setTimeout(() => setToast(""), 5000); }} style={{ flex: 2, padding: "12px", background: !reportLoc.trim() ? T.border : T.danger, color: !reportLoc.trim() ? T.muted : "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: reportLoc.trim() ? "pointer" : "not-allowed" }}>🚨 Confirmar reporte</button>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card style={{ padding: 20, textAlign: "center", marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: T.muted }}>{pickSearch ? "Sin resultados para \"" + pickSearch + "\"" : "No hay mascotas registradas todavía"}</p>
              </Card>
            );
          })()}

          <div style={{ borderTop: `1px solid ${T.borderLt}`, paddingTop: 16 }}>
            <button onClick={() => { setPickSearch(""); openRegister("lost"); }} style={{ width: "100%", padding: "14px 20px", background: T.danger, color: "#fff", border: "none", borderRadius: RS, fontWeight: 800, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>🚨 No está en la lista — cargar nueva</button>
          </div>
        </div>}

        {view === "search" && <div className="anim"><Card style={{ padding: 20 }}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>¿Encontraste un perro?</h3>
            <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>Buscá por nombre o describilo con los filtros.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.muted }}>{I.Search()}</span>
              <input type="text" placeholder="Buscar por nombre, raza, dueño..." value={searchInput} onChange={e => setSearchInput(e.target.value)} style={{ paddingLeft: 38, paddingRight: searchInput ? 36 : 14 }} />
              {searchInput && <button onClick={() => { setSearchInput(""); setSearchFilter(""); }} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: T.border, border: "none", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.muted, fontSize: 12, fontWeight: 700 }}>✕</button>}
            </div>
            {searchFilter && (() => {
              const textResults = dogs.filter(d => fuzzyMatch(searchFilter, d.name) || fuzzyMatch(searchFilter, d.breed) || fuzzyMatch(searchFilter, d.ownerName) || fuzzyMatch(searchFilter, d.neighborhood));
              return textResults.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, background: T.bg, borderRadius: RS, padding: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.ok }}>✅ {textResults.length} resultado{textResults.length > 1 ? "s" : ""}</div>
                  {textResults.slice(0, 5).map(d => (
                    <div key={d.id} style={{ display: "flex", gap: 12, alignItems: "center", cursor: "pointer", padding: "8px", borderRadius: 8, background: T.card }} onClick={() => navigate("detail", d)}>
                      {d.photo ? <img src={d.photo} alt={d.name} style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} /> : <div style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0, background: T.accentLt, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent }}>{I.Dog(28)}</div>}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{d.name} {d.lostSince && <span style={{ color: T.danger, fontSize: 12 }}>🚨 PERDIDO</span>}</div>
                        <div style={{ fontSize: 12, color: T.muted }}>{[d.breed, d.color, d.size].filter(Boolean).join(" · ")}</div>
                      </div>
                    </div>
                  ))}
                  {textResults.length > 5 && <div style={{ fontSize: 12, color: T.muted, textAlign: "center" }}>y {textResults.length - 5} más...</div>}
                </div>
              ) : <div style={{ fontSize: 13, color: T.muted, textAlign: "center", padding: 8 }}>Sin resultados para "{searchFilter}"</div>;
            })()}
            <div style={{ height: 1, background: T.border, margin: "4px 0" }} />
            <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".5px" }}>O describilo con filtros</div>
            <div style={{ display: "flex", gap: 10 }}>
              <select value={searchFilters.size} onChange={e => setSearchFilters({ ...searchFilters, size: e.target.value })}>
                <option value="">📏 Tamaño</option>
                <option value="Pequeño">Pequeño</option>
                <option value="Mediano">Mediano</option>
                <option value="Grande">Grande</option>
              </select>
              <select value={searchFilters.sex} onChange={e => setSearchFilters({ ...searchFilters, sex: e.target.value })}>
                <option value="">⚥ Sexo</option>
                <option value="Macho">Macho</option>
                <option value="Hembra">Hembra</option>
              </select>
            </div>
            <input placeholder="🎨 Color (ej: marrón, blanco, negro)" value={searchFilters.color} onChange={e => setSearchFilters({ ...searchFilters, color: e.target.value })} />
            <input placeholder="🐕 Raza (ej: labrador, caniche, mestizo)" value={searchFilters.breed} onChange={e => setSearchFilters({ ...searchFilters, breed: e.target.value })} />
            <input placeholder="📍 Barrio donde lo encontraste" value={searchFilters.neighborhood} onChange={e => setSearchFilters({ ...searchFilters, neighborhood: e.target.value })} />
            <select value={searchFilters.hasCollar} onChange={e => setSearchFilters({ ...searchFilters, hasCollar: e.target.value })}>
              <option value="">🔖 ¿Tiene collar?</option>
              <option value="Sí">Sí, tiene collar</option>
              <option value="No">No tiene collar</option>
            </select>
            <Btn onClick={handleFilterSearch} disabled={!searchFilters.size && !searchFilters.color && !searchFilters.breed && !searchFilters.sex && !searchFilters.neighborhood && !searchFilters.hasCollar} sz="lg" style={{ width: "100%", justifyContent: "center", marginTop: 4 }} icon={I.Search()}>Buscar por filtros</Btn>
          </div>
        </Card></div>}

        {view === "results" && <div className="anim">
          {searchResults.length === 0 ? (
            <Card style={{ padding: 32, textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>😕</div>
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Sin coincidencias</p>
              <p style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>No encontramos perros que coincidan con esa descripción.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Btn v="secondary" onClick={() => navigate("search")}>Intentar de nuevo</Btn>
                <Btn onClick={() => openRegister("lost")} v="secondary" style={{ borderColor: T.danger, color: T.danger }}>🚨 No es ninguno — registrar como perdido</Btn>
              </div>
            </Card>
          ) : (
            <>
              <div style={{ background: T.okLt, color: T.ok, padding: 12, borderRadius: RS, marginBottom: 12, fontSize: 14, fontWeight: 600, textAlign: "center" }}>
                ✅ {searchResults.length} posible{searchResults.length > 1 ? "s" : ""} coincidencia{searchResults.length > 1 ? "s" : ""}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {searchResults.map(d => (
                  <Card key={d.id} style={{ overflow: "hidden" }}>
                    <div style={{ padding: "6px 14px", background: d.confidence === "alta" ? T.okLt : d.confidence === "media" ? T.accentLt : T.borderLt, color: d.confidence === "alta" ? T.ok : d.confidence === "media" ? T.accent : T.muted, fontSize: 12, fontWeight: 700, textTransform: "uppercase", display: "flex", justifyContent: "space-between" }}>
                      <span>Coincidencia {d.confidence}</span>
                      <span>{d.reason}</span>
                    </div>
                    <div style={{ display: "flex", gap: 14, padding: 14 }}>
                      <div style={{ cursor: "pointer", display: "flex", gap: 14, flex: 1 }} onClick={() => { navigate("detail", d); }}>
                        {d.photo ? <img src={d.photo} alt={d.name} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 10, flexShrink: 0 }} /> : <div style={{ width: 60, height: 60, borderRadius: 10, flexShrink: 0, background: T.accentLt, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent }}>{I.Dog(36)}</div>}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 16 }}>{d.name}</div>
                          <div style={{ fontSize: 13, color: T.muted }}>{[d.breed, d.color, d.size].filter(Boolean).join(" · ")}</div>
                          {d.ownerName && d.ownerName !== "—" && <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>Dueño: {d.ownerName}</div>}
                          {d.neighborhood && <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>📍 {d.neighborhood}</div>}
                        </div>
                      </div>
                      {!d.lostSince && <button onClick={(e) => { e.stopPropagation(); setReportingDogId(d.id); setReportLoc(""); navigate("pickLost"); }} style={{ background: T.danger, color: "#fff", border: "none", borderRadius: RS, fontWeight: 700, fontSize: 12, cursor: "pointer", padding: "10px 12px", flexShrink: 0, alignSelf: "center" }}>🚨 Reportar</button>}
                    </div>
                  </Card>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
                <Btn v="secondary" onClick={() => navigate("search")} style={{ width: "100%", justifyContent: "center" }}>Nueva búsqueda</Btn>
                <Btn onClick={() => openRegister("lost")} v="secondary" style={{ width: "100%", justifyContent: "center", borderColor: T.danger, color: T.danger }}>🚨 No es ninguno — registrar como perdido</Btn>
              </div>
            </>
          )}
        </div>}
      </div>

      {/* Toast notification */}
      {toast && <div style={{ position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)", background: T.txt, color: T.bg, padding: "16px 28px", borderRadius: 14, fontSize: 15, fontWeight: 700, zIndex: 1100, boxShadow: T.shadowLg, animation: "fadeIn .3s ease-out", maxWidth: "90%", textAlign: "center", lineHeight: 1.4 }}>{toast}</div>}

      {/* Floating Help Bubble */}
      <a href={`https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent("Hola, necesito ayuda con la app de Registro de Mascotas 🐾")}`} target="_blank" rel="noopener noreferrer" style={{ position: "fixed", bottom: 80, right: 16, zIndex: 790, width: 48, height: 48, borderRadius: "50%", background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(37,211,102,.4)", textDecoration: "none", fontSize: 22, transition: "transform .2s" }}>💬</a>

      {/* Bottom Navigation Bar */}
      {(() => {
        const navBtn = (id, emoji, label, onClick, isActive) => (
          <button key={id} onClick={onClick} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "none", border: "none", padding: "6px 0", cursor: "pointer", color: isActive ? T.accent : T.muted, fontSize: 12, fontWeight: 600, transition: "color .2s" }}>
            <span style={{ fontSize: 20 }}>{emoji}</span>{label}
          </button>
        );
        return <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 800, background: T.card, borderTop: `1px solid ${T.border}`, padding: "6px 0 env(safe-area-inset-bottom, 6px)", display: "flex", alignItems: "center", justifyContent: "space-around", boxShadow: "0 -2px 10px rgba(0,0,0,.06)" }}>
          {navBtn("all", "🐾", "Inicio", () => { setTab("all"); setView("list"); setShowMenu(false); }, tab === "all" && view === "list")}
          {navBtn("lost", "🚨", "Perdidos", () => { setTab("lost"); setView("list"); setShowMenu(false); }, tab === "lost" && view === "list")}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <button onClick={() => openRegister(tab === "stray" ? "stray" : "owned")} style={{ width: 50, height: 50, borderRadius: "50%", border: "none", background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`, color: "#fff", fontSize: 26, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 14px ${T.accent}50`, marginTop: -18 }}>+</button>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.accent, marginTop: 2 }}>{tab === "stray" ? "Reportar" : "Registrar"}</span>
          </div>
          {navBtn("stray", "💜", "Adopción", () => { setTab("stray"); setView("list"); setShowMenu(false); setCarouselIdx(0); }, tab === "stray" && view === "list")}
          {navBtn("more", "☰", "Más", () => setShowMenu(!showMenu), showMenu || ["shelter","stats","mypets"].includes(tab))}
        </div>;
      })()}
    </div>
    </ThemeCtx.Provider>
  );
}
