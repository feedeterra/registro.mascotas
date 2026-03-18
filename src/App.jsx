/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Dog, User, Sighting } from "./types";
import { 
  LS_DARK, LS_KEY, LS_USER, LS_ANNOUNCEMENT, 
  ADMIN_PHONE, DONATION_LINK, ANNOUNCEMENT, DEFAULT_ADMIN_PW, SAMPLE_DOGS 
} from "./constants";
import { 
  lsLoad, lsSave, genId, fuzzyMatch, isValidWhatsApp, formatWhatsApp,
  elapsedStr, 
} from "./utils";
import { 
  ThemeCtx, themes, useT, Icons, Btn, Card, PhotoUp, Badge, StatCard 
} from "./components/UI";
import { DogCard } from "./components/DogCard";
import { DetailView } from "./components/DetailView";
import { AdoptionCarousel } from "./components/AdoptionCarousel";

const SCRIPT_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
const IMGBB_KEY = import.meta.env.VITE_IMGBB_API_KEY;

export const uploadImage = async (base64Image: string): Promise<string | null> => {
  if (!IMGBB_KEY) {
    console.warn("No ImgBB API Key found. Falling back to base64 (not recommended for Sheets).");
    return base64Image;
  }
  try {
    const base64Data = base64Image.split(',')[1] || base64Image;
    const formData = new FormData();
    formData.append("image", base64Data);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.success) {
      return data.data.url;
    }
    return null;
  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  }
};

export const fetchDogs = async (): Promise<Dog[]> => {
  if (!SCRIPT_URL) {
    console.warn("No Google Apps Script URL found. Falling back to localStorage.");
    const saved = localStorage.getItem("dogs_data");
    return saved ? JSON.parse(saved) : [];
  }
  try {
    const res = await fetch(SCRIPT_URL);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching dogs from Sheets:", error);
    return [];
  }
};

export const syncDog = async (action: "save" | "delete", dog: Partial<Dog>): Promise<boolean> => {
  if (!SCRIPT_URL) {
    const saved = localStorage.getItem("dogs_data");
    let dogs: Dog[] = saved ? JSON.parse(saved) : [];
    
    if (action === "delete") {
      dogs = dogs.filter(d => d.id !== dog.id);
    } else {
      const existingIndex = dogs.findIndex(d => d.id === dog.id);
      if (existingIndex > -1) {
        dogs[existingIndex] = { ...dogs[existingIndex], ...dog } as Dog;
      } else {
        dogs.push(dog as Dog);
      }
    }
    localStorage.setItem("dogs_data", JSON.stringify(dogs));
    return true;
  }
  
  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ action, data: dog }),
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      }
    });
    const result = await res.json();
    return result.success === true;
  } catch (error) {
    console.error(`Error syncing dog (${action}) to Sheets:`, error);
    return false;
  }
};

export default function App() {
  const [dark, setDark] = useState(() => lsLoad(LS_DARK, false));
  const T = dark ? themes.dark : themes.light;
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [view, setView] = useState("list");
  const [tab, setTab] = useState("all");
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const [searchResults, setSearchResults] = useState<Dog[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminInput, setAdminInput] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminPw, setAdminPw] = useState(DEFAULT_ADMIN_PW);
  const [showChangePw, setShowChangePw] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [form, setForm] = useState<Partial<Dog & { reportLost?: boolean }>>({ 
    name: "", breed: "", color: "", size: "", sex: "", neutered: "", 
    ownerName: "", ownerPhone: "", neighborhood: "", notes: "", 
    photo: null, type: "owned", hasCollar: "", collarColor: "", adoptionStatus: "" 
  });
  const [showMenu, setShowMenu] = useState(false);
  const [consent, setConsent] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [regStep, setRegStep] = useState(1);
  const [toast, setToast] = useState("");
  const [pickSearch, setPickSearch] = useState("");
  const [reportingDogId, setReportingDogId] = useState<string | null>(null);
  const [reportLoc, setReportLoc] = useState("");
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [announcementText, setAnnouncementText] = useState(() => lsLoad(LS_ANNOUNCEMENT, ANNOUNCEMENT));
  const [editingAnnouncement, setEditingAnnouncement] = useState(false);
  const [announcementDraft, setAnnouncementDraft] = useState("");
  const [userId] = useState<User>(() => {
    const saved = lsLoad<User | null>(LS_USER, null);
    if (saved?.id) return saved;
    const newUser = { id: genId(), ownerName: "", ownerPhone: "" };
    lsSave(LS_USER, newUser);
    return newUser;
  });

  const [searchFilters, setSearchFilters] = useState({ size: "", color: "", breed: "", sex: "", neighborhood: "", hasCollar: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearchFilter(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    fetchDogs().then(data => {
      setDogs(data && data.length > 0 ? data : SAMPLE_DOGS);
      setLoading(false);
    });
  }, []);

  useEffect(() => { lsSave(LS_DARK, dark); }, [dark]);

  const navigate = useCallback((newView: string, data?: Dog) => {
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

  const adminLogin = () => { 
    if (adminInput === adminPw) { 
      setIsAdmin(true); 
      setShowAdminModal(false); 
      setAdminInput(""); 
      setAdminError(""); 
      setShowMenu(true); 
    } else setAdminError("Contraseña incorrecta"); 
  };
  const adminLogout = () => { setIsAdmin(false); setShowChangePw(false); setNewPw(""); };
  const changePw = async () => { if (newPw.length < 4) return setAdminError("Mínimo 4 caracteres"); setAdminPw(newPw); setNewPw(""); setShowChangePw(false); };

  const handleRegister = async () => {
    if (!form.name || !form.breed || !form.color || !form.neighborhood) return;
    if (form.type === "owned") {
      if (!form.ownerName || !form.ownerPhone) return;
      if (!isValidWhatsApp(form.ownerPhone)) { setPhoneError("Número inválido. Ej: 2346306562"); return; }
    }
    setPhoneError("");
    setLoading(true);
    const savedForm = { ...form } as Dog;
    if (savedForm.ownerPhone) savedForm.ownerPhone = formatWhatsApp(savedForm.ownerPhone);
    savedForm.userId = userId.id;
    
    if (savedForm.photo && savedForm.photo.startsWith("data:image")) {
      const url = await uploadImage(savedForm.photo);
      if (url) savedForm.photo = url;
    }

    if (savedForm.type === "owned" && savedForm.ownerName && savedForm.ownerPhone) {
      const updatedUser = { ...userId, ownerName: savedForm.ownerName, ownerPhone: savedForm.ownerPhone };
      lsSave(LS_USER, updatedUser);
    }

    if (editingId) {
      const updatedDog = { ...dogs.find(d => d.id === editingId), ...savedForm } as Dog;
      await syncDog("save", updatedDog);
      setDogs(dogs.map(d => d.id === editingId ? updatedDog : d));
      setEditingId(null);
      setToast("✅ Mascota actualizada");
    } else {
      const newDog: Dog = {
        ...savedForm,
        id: genId(),
        createdAt: new Date().toISOString(),
        lostSince: form.reportLost ? new Date().toISOString() : null,
        lastSeenLocation: form.lastSeenLocation || null,
        sightings: [],
      };
      await syncDog("save", newDog);
      setDogs([newDog, ...dogs]);
      setToast(form.reportLost ? "🚨 Mascota reportada como perdida" : savedForm.type === "stray" ? "💜 Mascota publicada para adopción" : "✅ Mascota registrada con éxito");
    }
    setForm({ name: "", breed: "", color: "", size: "", sex: "", neutered: "", ownerName: "", ownerPhone: "", neighborhood: "", notes: "", photo: null, type: "owned", hasCollar: "", collarColor: "", adoptionStatus: "" });
    setRegStep(1);
    setView("list");
    setLoading(false);
    setTimeout(() => setToast(""), 3000);
  };

  const handleDelete = async (id: string) => { 
    if (!confirm("¿Seguro?")) return; 
    setLoading(true);
    await syncDog("delete", { id });
    setDogs(dogs.filter(d => d.id !== id)); 
    setView("list"); 
    setSelectedDog(null); 
    setLoading(false);
  };
  
  const handleMarkLost = async (id: string, loc: string) => { 
    setLoading(true);
    const target = dogs.find(d => d.id === id);
    if (target) {
      const updated = { ...target, lostSince: new Date().toISOString(), lastSeenLocation: loc || "" };
      await syncDog("save", updated);
      const u = dogs.map(d => d.id === id ? updated : d); 
      setDogs(u); 
      setSelectedDog(updated); 
    }
    setLoading(false);
  };
  
  const handleMarkFound = async (id: string) => { 
    setLoading(true);
    const target = dogs.find(d => d.id === id);
    if (target) {
      const updated = { ...target, lostSince: null, lastSeenLocation: null };
      await syncDog("save", updated);
      const u = dogs.map(d => d.id === id ? updated : d); 
      setDogs(u); 
      setSelectedDog(updated); 
    }
    setLoading(false);
  };
  
  const handleAddSighting = async (id: string, s: Sighting) => { 
    setLoading(true);
    const target = dogs.find(d => d.id === id);
    if (target) {
      const updated = { ...target, sightings: [...(target.sightings || []), s] };
      await syncDog("save", updated);
      const u = dogs.map(d => d.id === id ? updated : d); 
      setDogs(u); 
      setSelectedDog(updated); 
    }
    setLoading(false);
  };

  const openRegister = (type: "owned" | "stray" | "lost" = "owned") => {
    setEditingId(null);
    const savedUser = lsLoad<Partial<User>>(LS_USER, {});
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

  const handleEdit = (dog: Dog) => {
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
    }).sort((a, b) => ((b._score || 0) / (b._checks || 1)) - ((a._score || 0) / (a._checks || 1)));
    
    setSearchResults(results.map(d => ({ 
      ...d, 
      confidence: d._score === d._checks ? "alta" : (d._score || 0) >= (d._checks || 0) / 2 ? "media" : "baja", 
      reason: [
        d._score === d._checks && "Coincide todo", 
        d.size?.toLowerCase() === searchFilters.size?.toLowerCase() && "Mismo tamaño", 
        fuzzyMatch(searchFilters.color, d.color) && "Color similar", 
        fuzzyMatch(searchFilters.breed, d.breed) && "Misma raza", 
        d.hasCollar === searchFilters.hasCollar && (searchFilters.hasCollar === "Sí" ? "Con collar" : "Sin collar")
      ].filter(Boolean).join(", ") 
    } as Dog)));
    navigate("results");
  };

  const myDogs = dogs.filter(d => d.userId === userId.id);
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
  }).filter(d => { 
    if (!searchFilter) return true; 
    return fuzzyMatch(searchFilter, d.name) || fuzzyMatch(searchFilter, d.breed) || fuzzyMatch(searchFilter, d.ownerName) || fuzzyMatch(searchFilter, d.neighborhood); 
  }).sort((a, b) => { 
    if (a.lostSince && !b.lostSince) return -1; 
    if (!a.lostSince && b.lostSince) return 1; 
    if (a.type === "stray" && b.type === "stray") { 
      if (a.adoptionStatus === "urgent" && b.adoptionStatus !== "urgent") return -1; 
      if (a.adoptionStatus !== "urgent" && b.adoptionStatus === "urgent") return 1; 
    } 
    if (a.type === "stray" && b.type !== "stray") return -1; 
    return 0; 
  }), [dogs, tab, searchFilter, userId.id]);

  return (
    <ThemeCtx.Provider value={T}>
      <div style={{ minHeight: "100vh", background: T.bg, transition: "background .3s" }}>
        {showAnnouncement && announcementText && (
          <div style={{ background: "#e87d28", color: "#fff", padding: "8px 40px 8px 16px", fontSize: 12, fontWeight: 800, lineHeight: 1.4, position: "sticky", top: 0, zIndex: 810, textAlign: "center" }}>
            {announcementText}
            <button onClick={() => setShowAnnouncement(false)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,.2)", border: "none", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 12, fontWeight: 700 }}>✕</button>
          </div>
        )}

        <div style={{ background: T.headerBg, color: "#fff", padding: "12px 16px", position: "sticky", top: 0, zIndex: 800, boxShadow: "0 2px 8px rgba(0,0,0,.15)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              {view !== "list" ? (
                <button onClick={goHome} style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 8, color: "#fff", padding: "6px 8px", cursor: "pointer", display: "flex", alignItems: "center", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{Icons.Back()}</button>
              ) : (
                <span style={{ display: "inline-flex", flexShrink: 0 }}>{Icons.Paw(20)}</span>
              )}
              <h1 style={{ fontSize: 18, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.5px" }}>
                {view === "list" && "Mascotas"}{view === "register" && (form.reportLost ? `Reportar (${regStep}/3)` : editingId ? `Editar (${regStep}/3)` : `Registrar (${regStep}/3)`)}{view === "detail" && selectedDog?.name}{view === "search" && "¿Encontraste uno?"}{view === "results" && "Resultados"}{view === "pickLost" && "Reportar perdido"}
              </h1>
            </div>
            {view === "list" && (
              <button onClick={() => setTab(tab === "mypets" ? "all" : "mypets")} style={{ background: tab === "mypets" ? "rgba(255,255,255,.25)" : "rgba(255,255,255,.1)", border: "none", borderRadius: 20, color: "#fff", padding: "5px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, flexShrink: 0, transition: "all .2s" }}>
                🐾 {myDogs.length > 0 ? `Mis mascotas (${myDogs.length})` : "Mis mascotas"}
              </button>
            )}
          </div>
        </div>

        {showMenu && (
          <div style={{ position: "fixed", inset: 0, zIndex: 799 }} onClick={() => setShowMenu(false)}>
            <div onClick={e => e.stopPropagation()} style={{ position: "absolute", bottom: 70, right: 12, width: 260, background: T.card, borderRadius: "14px", boxShadow: T.shadowLg, padding: "12px", display: "flex", flexDirection: "column", gap: 4 }}>
              {[ { id: "mypets", label: "🐾 Mis mascotas" }, { id: "shelter", label: "🏠 Refugio CASA" }, { id: "stats", label: "📊 Estadísticas" } ].map(t => (
                <button key={t.id} onClick={() => { setTab(t.id); setView("list"); setShowMenu(false); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "none", borderRadius: "10px", background: tab === t.id ? T.accentLt : "transparent", color: tab === t.id ? T.accent : T.txt, fontSize: 14, fontWeight: tab === t.id ? 700 : 500, cursor: "pointer", width: "100%", textAlign: "left" }}>{t.label}</button>
              ))}
              <div style={{ height: 1, background: T.border, margin: "4px 0" }} />
              <button onClick={() => { setDark(!dark); setShowMenu(false); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "none", borderRadius: "10px", background: "transparent", color: T.txt, fontSize: 14, fontWeight: 500, cursor: "pointer", width: "100%" }}>{dark ? "☀️ Modo claro" : "🌙 Modo oscuro"}</button>
              <button onClick={() => { if (isAdmin) { adminLogout(); } else { setShowAdminModal(true); setAdminInput(""); setAdminError(""); } setShowMenu(false); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "none", borderRadius: "10px", background: isAdmin ? T.okLt : "transparent", color: isAdmin ? T.ok : T.txt, fontSize: 14, fontWeight: isAdmin ? 700 : 500, cursor: "pointer", width: "100%" }}>{isAdmin ? "🔓 Admin ✓" : "🔒 Admin"}</button>
              {isAdmin && (
                <div style={{ padding: "4px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                  {!showChangePw ? (
                    <button onClick={() => setShowChangePw(true)} style={{ padding: "6px 0", background: "none", border: "none", color: T.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>Cambiar contraseña</button>
                  ) : (
                    <div style={{ display: "flex", gap: 6 }}><input type="password" placeholder="Nueva" value={newPw} onChange={e => setNewPw(e.target.value)} onKeyDown={e => e.key === "Enter" && changePw()} style={{ flex: 1, padding: "5px 8px", fontSize: 12 }} /><Btn sz="sm" onClick={changePw}>OK</Btn></div>
                  )}
                  <button onClick={() => { setEditingAnnouncement(!editingAnnouncement); setAnnouncementDraft(announcementText || ""); }} style={{ padding: "6px 0", background: "none", border: "none", color: T.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>📢 Editar anuncio</button>
                  {editingAnnouncement && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <input placeholder="Texto del anuncio" value={announcementDraft} onChange={e => setAnnouncementDraft(e.target.value)} style={{ padding: "6px 8px", fontSize: 12 }} />
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { setAnnouncementText(announcementDraft); lsSave(LS_ANNOUNCEMENT, announcementDraft); setShowAnnouncement(!!announcementDraft); setEditingAnnouncement(false); setToast("📢 Anuncio actualizado"); setTimeout(() => setToast(""), 3000); }} style={{ flex: 1, padding: "6px", background: T.accent, color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>Guardar</button>
                        {announcementText && <button onClick={() => { setAnnouncementText(""); lsSave(LS_ANNOUNCEMENT, ""); setShowAnnouncement(false); setEditingAnnouncement(false); setToast("📢 Anuncio eliminado"); setTimeout(() => setToast(""), 3000); }} style={{ padding: "6px 10px", background: T.dangerLt, color: T.danger, border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>Quitar</button>}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div style={{ height: 1, background: T.border, margin: "4px 0" }} />
              <button onClick={() => { setShowPrivacy(true); setShowMenu(false); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "none", borderRadius: "10px", background: "transparent", color: T.muted, fontSize: 13, fontWeight: 500, cursor: "pointer", width: "100%" }}>📄 Privacidad</button>
            </div>
          </div>
        )}

        {showAdminModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }} onClick={() => setShowAdminModal(false)}>
            <Card style={{ padding: 24, width: "100%", maxWidth: 340 }} className="anim" onClick={() => {}}>
              <div onClick={e => e.stopPropagation()}>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, margin: "0 auto 12px", background: T.accentLt, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent }}>{Icons.Shield()}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Acceso Admin</h3>
                </div>
                <input type="password" placeholder="Contraseña" value={adminInput} onChange={e => { setAdminInput(e.target.value); setAdminError(""); }} onKeyDown={e => e.key === "Enter" && adminLogin()} style={{ marginBottom: adminError ? 8 : 16 }} autoFocus />
                {adminError && <p style={{ color: T.danger, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>{adminError}</p>}
                <div style={{ display: "flex", gap: 10 }}><Btn v="secondary" onClick={() => setShowAdminModal(false)} style={{ flex: 1 }}>Cancelar</Btn><Btn onClick={adminLogin} disabled={!adminInput} style={{ flex: 1 }}>Ingresar</Btn></div>
              </div>
            </Card>
          </div>
        )}

        {showPrivacy && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }} onClick={() => setShowPrivacy(false)}>
            <Card style={{ padding: 24, width: "100%", maxWidth: 400, maxHeight: "80vh", overflowY: "auto" }} className="anim" onClick={() => {}}>
              <div onClick={e => e.stopPropagation()}>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>Política de Privacidad</h3>
                <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, display: "flex", flexDirection: "column", gap: 10 }}>
                  <p><strong style={{ color: T.txt }}>Datos que recopilamos:</strong> nombre del dueño, número de WhatsApp, barrio, y datos descriptivos de la mascota.</p>
                  <p><strong style={{ color: T.txt }}>Finalidad:</strong> facilitar el reencuentro de mascotas perdidas y promover la adopción responsable.</p>
                  <p><strong style={{ color: T.txt }}>Visibilidad:</strong> los datos de contacto serán visibles públicamente.</p>
                  <p><strong style={{ color: T.txt }}>Tus derechos:</strong> podés solicitar la modificación o eliminación de tus datos en cualquier momento.</p>
                </div>
                <Btn onClick={() => setShowPrivacy(false)} style={{ width: "100%", marginTop: 16 }}>Cerrar</Btn>
              </div>
            </Card>
          </div>
        )}

        <div style={{ maxWidth: 480, margin: "0 auto", padding: "12px 14px 80px" }}>
          {view === "list" && (
            <>
              {tab !== "stats" && tab !== "shelter" && (
                <>
                  <div style={{ marginBottom: 12 }} className="anim">
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.muted }}>{Icons.Search()}</span>
                      <input type="text" placeholder="Buscar..." value={searchInput} onChange={e => setSearchInput(e.target.value)} style={{ paddingLeft: 38, paddingRight: searchInput ? 36 : 14 }} />
                      {searchInput && <button onClick={() => { setSearchInput(""); setSearchFilter(""); }} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: T.border, border: "none", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.muted, fontSize: 12, fontWeight: 700 }}>✕</button>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 12 }} className="anim d1">
                    {tab === "stray" ? (
                      <><Btn onClick={() => openRegister("stray")} v="secondary" style={{ flex: 1, borderColor: T.purple, color: T.purple, whiteSpace: "nowrap", padding: "10px 8px" }}>💜 Publicar</Btn><a href={`https://wa.me/${ADMIN_PHONE}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 8px", background: "#25D366", color: "#fff", borderRadius: "10px", fontWeight: 600, fontSize: 14, textDecoration: "none", whiteSpace: "nowrap" }}>💬 Consultar</a></>
                    ) : tab === "lost" ? (
                      <><Btn onClick={() => { setPickSearch(""); navigate("pickLost"); }} style={{ flex: 1, background: T.danger, color: "#fff", border: "none", whiteSpace: "nowrap", padding: "10px 8px" }}>🚨 Reportar</Btn><Btn onClick={() => { setSearchFilters({ size: "", color: "", breed: "", sex: "", neighborhood: "", hasCollar: "" }); navigate("search"); }} v="secondary" style={{ flex: 1, borderColor: T.navy, color: T.navy, whiteSpace: "nowrap", padding: "10px 8px" }}>🔍 Encontré</Btn></>
                    ) : (
                      <><Btn onClick={() => openRegister("owned")} icon={Icons.Plus()} style={{ flex: 1, whiteSpace: "nowrap", padding: "10px 8px" }}>Registrar</Btn><Btn onClick={() => { setSearchFilters({ size: "", color: "", breed: "", sex: "", neighborhood: "", hasCollar: "" }); navigate("search"); }} v="secondary" style={{ flex: 1, borderColor: T.navy, color: T.navy, whiteSpace: "nowrap", padding: "10px 8px" }}>🔍 Encontré</Btn></>
                    )}
                  </div>

                  {tab === "stray" && (
                    <AdoptionCarousel dogs={dogs} onSelect={(d) => navigate("detail", d)} />
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {filtered.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "48px 20px", color: T.muted }}>{Icons.Dog()}<p>No hay resultados</p></div>
                    ) : (
                      filtered.map((d, i) => (
                        <div key={d.id}>
                          <DogCard dog={d} delay={(i % 4) + 1} onClick={dog => navigate("detail", dog)} />
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              {tab === "shelter" && (
                <div className="anim">
                  <Card style={{ overflow: "hidden", marginBottom: 16, border: `2px solid ${T.accent}` }}>
                    <div style={{ background: `linear-gradient(135deg, ${T.accent}, ${T.accentDk})`, padding: "28px 20px", textAlign: "center", color: "#fff" }}>
                      <div style={{ fontSize: 48, marginBottom: 8 }}>🏠</div>
                      <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-1px" }}>Refugio CASA</h2>
                    </div>
                    <div style={{ padding: 20 }}>
                      <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.6, marginBottom: 16 }}>Rescatamos, cuidamos y buscamos hogares.</p>
                      <Btn onClick={() => window.open(`https://wa.me/${ADMIN_PHONE}`)} style={{ width: "100%" }}>💬 Contactar</Btn>
                    </div>
                  </Card>
                </div>
              )}

              {tab === "stats" && (
                <div className="anim">
                  <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                    <StatCard icon={Icons.Paw(24)} label="Registrados" value={ownedDogs.length} bg={T.navyLt} color={T.navy} delay={1} />
                    <StatCard icon={Icons.Alert()} label="Perdidos" value={lostDogs.length} bg={T.dangerLt} color={T.danger} delay={2} />
                    <StatCard icon={Icons.Check()} label="Recuperados" value={recovered} bg={T.okLt} color={T.ok} delay={3} />
                  </div>
                </div>
              )}
            </>
          )}

          {view === "register" && (
            <div className="anim">
              <Card style={{ padding: 20 }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
                  {[1, 2, 3].map(s => <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= regStep ? T.accent : T.borderLt }} />)}
                </div>
                {regStep === 1 && (
                  <div className="anim">
                    <div style={{ textAlign: "center", marginBottom: 24 }}>
                      <div style={{ fontSize: 48, marginBottom: 8 }}>📸</div>
                      <h3 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px 0" }}>{form.reportLost ? "¿Qué mascota se perdió?" : "¿Cómo se llama?"}</h3>
                      <p style={{ fontSize: 15, color: T.muted, margin: 0 }}>Subí una foto y poné su nombre</p>
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}><PhotoUp value={form.photo || null} onChange={p => setForm({ ...form, photo: p })} size={160} /></div>
                    <input placeholder="Nombre o apodo *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ marginBottom: 16 }} />
                    <Btn onClick={() => setRegStep(2)} disabled={!form.name} style={{ width: "100%", marginBottom: 16 }}>Siguiente →</Btn>
                    {!form.name && (
                      <p style={{ textAlign: "center", fontSize: 13, color: T.accent, margin: "0 0 8px 0" }}>
                        El nombre es obligatorio para continuar
                      </p>
                    )}
                    <p style={{ textAlign: "center", fontSize: 13, color: T.muted, margin: 0 }}>
                      La foto es opcional pero ayuda a identificarla
                    </p>
                  </div>
                )}
                {regStep === 2 && (
                  <div className="anim">
                    <div style={{ textAlign: "center", marginBottom: 24 }}>
                      <div style={{ fontSize: 48, marginBottom: 8 }}>🐕</div>
                      <h3 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px 0" }}>Características</h3>
                      <p style={{ fontSize: 15, color: T.muted, margin: 0 }}>Estos datos ayudan a identificarlo</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "flex", gap: 12 }}><input placeholder="Raza *" value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })} /><input placeholder="Color *" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} /></div>
                      <select value={form.size} onChange={e => setForm({ ...form, size: e.target.value })}><option value="">Tamaño</option><option value="Pequeño">Pequeño</option><option value="Mediano">Mediano</option><option value="Grande">Grande</option></select>
                      <input placeholder="Barrio / Zona *" value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} />
                      {form.reportLost && <input placeholder="📍 ¿Dónde se perdió?" value={form.lastSeenLocation || ""} onChange={e => setForm({ ...form, lastSeenLocation: e.target.value })} />}
                      <textarea placeholder="Notas (señas particulares, chip...)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} />
                    </div>
                    <div style={{ display: "flex", gap: 12, marginTop: 24, marginBottom: 16 }}>
                      <Btn v="secondary" onClick={() => setRegStep(1)} style={{ flex: 1 }}>← Atrás</Btn>
                      <Btn onClick={() => setRegStep(3)} disabled={!form.breed || !form.color || !form.neighborhood} style={{ flex: 2 }}>Siguiente →</Btn>
                    </div>
                    {(!form.breed || !form.color || !form.neighborhood) && (
                      <p style={{ textAlign: "center", fontSize: 13, color: T.accent, margin: 0 }}>
                        Completá raza, color y barrio para continuar
                      </p>
                    )}
                  </div>
                )}
                {regStep === 3 && (
                  <div className="anim">
                    <div style={{ textAlign: "center", marginBottom: 24 }}>
                      <div style={{ fontSize: 48, marginBottom: 8 }}>🤝</div>
                      <h3 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px 0" }}>Último paso</h3>
                      <p style={{ fontSize: 15, color: T.muted, margin: 0 }}>Información de contacto y términos</p>
                    </div>
                    {form.type === "owned" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                        <input placeholder="Nombre dueño *" value={form.ownerName} onChange={e => setForm({ ...form, ownerName: e.target.value })} />
                        <input placeholder="WhatsApp *" value={form.ownerPhone} onChange={e => setForm({ ...form, ownerPhone: e.target.value })} />
                      </div>
                    )}
                    <label style={{ display: "flex", gap: 10, fontSize: 13, color: T.muted, alignItems: "flex-start", lineHeight: 1.5, padding: 12, backgroundColor: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
                      <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ marginTop: 2, width: "auto" }} /> 
                      <span>Acepto los términos. Autorizo que mi WhatsApp sea público para ser contactado si mi mascota se pierde o es encontrada, eximiendo a la plataforma de otros usos o responsabilidades.</span>
                    </label>
                    <div style={{ display: "flex", gap: 12, marginTop: 24, marginBottom: 16 }}>
                      <Btn v="secondary" onClick={() => setRegStep(2)} style={{ flex: 1 }}>← Atrás</Btn>
                      <Btn onClick={handleRegister} disabled={!consent} style={{ flex: 2 }}>{editingId ? "Guardar" : "Registrar"}</Btn>
                    </div>
                    {!consent && (
                      <p style={{ textAlign: "center", fontSize: 13, color: T.accent, margin: 0 }}>
                        Debes aceptar los términos para finalizar
                      </p>
                    )}
                  </div>
                )}
              </Card>
            </div>
          )}

          {view === "detail" && selectedDog && (
            <DetailView dog={selectedDog} isAdmin={isAdmin} isOwner={selectedDog.userId === userId.id} onDelete={handleDelete} onEdit={handleEdit} onMarkLost={handleMarkLost} onMarkFound={handleMarkFound} onAddSighting={handleAddSighting} />
          )}

          {view === "pickLost" && (
            <div className="anim">
              <Card style={{ padding: 20, marginBottom: 12 }}><h3 style={{ fontWeight: 700 }}>¿Cuál se perdió?</h3></Card>
              <input type="text" placeholder="Buscar..." value={pickSearch} onChange={e => setPickSearch(e.target.value)} style={{ marginBottom: 12 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {dogs.filter(d => !d.lostSince && (!pickSearch || fuzzyMatch(pickSearch, d.name))).map(d => (
                  <div key={d.id}>
                    <Card style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div><div style={{ fontWeight: 700 }}>{d.name}</div><div style={{ fontSize: 12, color: T.muted }}>{d.breed}</div></div>
                      <Btn v="danger" sz="sm" onClick={() => { const loc = prompt("¿Dónde?"); if (loc) { handleMarkLost(d.id, loc); goHome(); } }}>Reportar</Btn>
                    </Card>
                  </div>
                ))}
              </div>
              <Btn onClick={() => openRegister("lost")} style={{ width: "100%", marginTop: 16 }} v="danger">🚨 No está en la lista</Btn>
            </div>
          )}

          {view === "search" && (
            <div className="anim">
              <Card style={{ padding: 20 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 16 }}>¿Encontraste un perro?</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <select value={searchFilters.size} onChange={e => setSearchFilters({ ...searchFilters, size: e.target.value })}><option value="">Tamaño</option><option value="Pequeño">Pequeño</option><option value="Mediano">Mediano</option><option value="Grande">Grande</option></select>
                  <input placeholder="Color" value={searchFilters.color} onChange={e => setSearchFilters({ ...searchFilters, color: e.target.value })} />
                  <Btn onClick={handleFilterSearch}>Buscar coincidencias</Btn>
                </div>
              </Card>
            </div>
          )}

          {view === "results" && (
            <div className="anim">
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {searchResults.map(d => (
                  <div key={d.id}>
                    <DogCard dog={d} onClick={dog => navigate("detail", dog)} />
                  </div>
                ))}
              </div>
              <Btn onClick={() => navigate("search")} style={{ width: "100%", marginTop: 16 }} v="secondary">Nueva búsqueda</Btn>
            </div>
          )}
        </div>

        {toast && <div style={{ position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)", background: T.txt, color: T.bg, padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700, zIndex: 1100 }}>{toast}</div>}

        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 800, background: T.card, borderTop: `1px solid ${T.border}`, padding: "6px 0", display: "flex", justifyContent: "space-around", boxShadow: "0 -2px 10px rgba(0,0,0,.06)" }}>
          <button onClick={() => { setTab("all"); goHome(); }} style={{ flex: 1, color: tab === "all" ? T.accent : T.muted, background: "none", border: "none", fontSize: 10 }}>🏠<br/>Inicio</button>
          <button onClick={() => { setTab("lost"); goHome(); }} style={{ flex: 1, color: tab === "lost" ? T.accent : T.muted, background: "none", border: "none", fontSize: 10 }}>🚨<br/>Perdidos</button>
          <button onClick={() => openRegister()} style={{ width: 50, height: 50, borderRadius: "50%", background: T.accent, color: "#fff", border: "none", fontSize: 24, marginTop: -20 }}>+</button>
          <button onClick={() => { setTab("stray"); goHome(); }} style={{ flex: 1, color: tab === "stray" ? T.accent : T.muted, background: "none", border: "none", fontSize: 10 }}>💜<br/>Adopción</button>
          <button onClick={() => setShowMenu(!showMenu)} style={{ flex: 1, color: showMenu ? T.accent : T.muted, background: "none", border: "none", fontSize: 10 }}>☰<br/>Más</button>
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}
