import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { getItems, getOutfits, logOutfit, saveOutfit } from "../lib/supabase";
import { getWeather, getColorCombinations } from "../lib/supabase";

const OCCASIONS = ["Casual", "Bureau", "Sport", "Soiree", "Weekend", "Voyage"];
const CATEGORIES_ORDER = ["Hauts", "Bas", "Chaussures", "Vestes", "Ceintures", "Accessoires", "Sport"];
const CAT_ICONS = { Hauts: "👕", Bas: "👖", Vestes: "🧥", Chaussures: "👟", Ceintures: "👜", Accessoires: "🕶️", Sport: "🏃" };

const CURRENT_SEASON = () => {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return "printemps";
  if (m >= 5 && m <= 7) return "ete";
  if (m >= 8 && m <= 10) return "automne";
  return "hiver";
};

const STYLE_COMPAT = {
  "casual": ["casual", "sport", "streetwear"],
  "smart-casual": ["casual", "smart-casual", "formel"],
  "formel": ["smart-casual", "formel"],
  "sport": ["sport", "casual"],
  "streetwear": ["streetwear", "casual"],
};

function isColorCompatible(colors1, colors2, combinations) {
  if (!colors1?.length || !colors2?.length) return true;
  const neutrals = ["Noir", "Blanc", "Gris", "Beige", "Navy"];
  if (colors1.some(c => neutrals.includes(c)) || colors2.some(c => neutrals.includes(c))) return true;
  for (const c1 of colors1) {
    const compat = combinations[c1] || [];
    if (colors2.some(c2 => compat.includes(c2))) return true;
  }
  return false;
}

function isStyleCompatible(style1, style2) {
  if (!style1 || !style2) return true;
  return (STYLE_COMPAT[style1] || []).includes(style2);
}

function isSeasonOk(item) {
  if (!item.season?.length) return true;
  return item.season.includes(CURRENT_SEASON());
}

export default function TodayPage() {
  const { user, profile, updateProfile } = useAuth();
  const [items, setItems] = useState([]);
  const [outfits, setOutfits] = useState([]);
  const [colorCombinations, setColorCombinations] = useState({});
  const [weather, setWeather] = useState(null);
  const [occasion, setOccasion] = useState("Casual");
  const [mode, setMode] = useState("saved"); // saved | compose
  const [city, setCity] = useState(profile?.city || "");
  const [editCity, setEditCity] = useState(false);
  const [loading, setLoading] = useState(true);

  // Compose mode state
  const [selectedPieces, setSelectedPieces] = useState({});
  const [startCategory, setStartCategory] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(null);

  // Saved mode state
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [logged, setLogged] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { load(); }, [user]);
  useEffect(() => { if (profile?.city) { setCity(profile.city); fetchWeather(profile.city); } }, [profile]);

  async function load() {
    if (!user) return;
    const [i, o, c] = await Promise.all([getItems(user.id), getOutfits(user.id), getColorCombinations(user.id)]);
    setItems(i);
    setOutfits(o);
    const map = {};
    c.forEach(d => { map[d.color] = d.compatible_colors || []; });
    setColorCombinations(map);
    if (o.length === 0) setMode("compose");
    setLoading(false);
  }

  async function fetchWeather(c) {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
    if (!apiKey || !c) return;
    try {
      const res = await fetch("https://api.openweathermap.org/data/2.5/weather?q=" + encodeURIComponent(c) + "&appid=" + apiKey + "&units=metric&lang=fr");
      const data = await res.json();
      if (data.cod === 200) setWeather({ temp: Math.round(data.main.temp), feels_like: Math.round(data.main.feels_like), condition: data.weather[0].description });
    } catch {}
  }

  async function saveCity() {
    await updateProfile({ city });
    fetchWeather(city);
    setEditCity(false);
  }

  // Available items (not pressing, correct season)
  const available = items.filter(i => i.status === "available" && isSeasonOk(i));

  // Filtered outfits for saved mode
  const filteredOutfits = outfits.filter(outfit => {
    const outfitItems = (outfit.item_ids || []).map(id => items.find(i => i.id === id)).filter(Boolean);
    return outfitItems.every(i => i.status === "available");
  });

  // Compatible items for compose mode
  function getCompatibleItems(category) {
    const alreadySelected = Object.values(selectedPieces);
    return available.filter(item => {
      if (item.category !== category) return false;
      if (selectedPieces[category]?.id === item.id) return true;
      for (const piece of alreadySelected) {
        if (!isColorCompatible(item.colors, piece.colors, colorCombinations)) return false;
        if (!isStyleCompatible(item.style, piece.style)) return false;
      }
      return true;
    });
  }

  function selectPiece(category, item) {
    setSelectedPieces(prev => ({ ...prev, [category]: item }));
    // Move to next category
    const remaining = CATEGORIES_ORDER.filter(c => c !== startCategory && !selectedPieces[c] && c !== category);
    if (remaining.length > 0) setCurrentCategory(remaining[0]);
    else setCurrentCategory(null);
  }

  function removePiece(category) {
    setSelectedPieces(prev => { const n = { ...prev }; delete n[category]; return n; });
  }

  async function wearToday(outfitData) {
    const itemIds = outfitData.item_ids || Object.values(selectedPieces).map(i => i.id);
    await logOutfit(user.id, {
      outfit_id: outfitData.id || null,
      outfit_name: outfitData.name || "Tenue composée",
      item_ids: itemIds,
      occasion,
      weather_temp: weather?.temp,
      weather_condition: weather?.condition,
      worn_at: new Date().toISOString().split("T")[0],
    });
    setLogged(true);
  }

  async function saveAsOutfit() {
    const itemIds = Object.values(selectedPieces).map(i => i.id);
    const name = occasion + " — " + new Date().toLocaleDateString("fr-CH", { day: "numeric", month: "short" });
    await saveOutfit(user.id, { name, occasion, item_ids: itemIds, vibe: occasion });
    setSaved(true);
    load();
  }

  function resetCompose() {
    setSelectedPieces({});
    setStartCategory(null);
    setCurrentCategory(null);
    setLogged(false);
    setSaved(false);
  }

  const composePieces = Object.entries(selectedPieces);
  const hasEnoughPieces = composePieces.length >= 2;

  return (
    <div style={{ padding: "16px", maxWidth: 600, margin: "0 auto" }}>
      {/* Date */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: "Fraunces", fontSize: 22, fontWeight: 300 }}>
          {new Date().toLocaleDateString("fr-CH", { weekday: "long", day: "numeric", month: "long" })}
        </div>
        <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 2 }}>Que vas-tu porter aujourd'hui ?</div>
      </div>

      {/* Weather */}
      <div className="card" style={{ padding: "12px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 24 }}>{weather ? "🌤️" : "📍"}</div>
        <div style={{ flex: 1 }}>
          {weather ? (
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{weather.temp}°C — {weather.condition}</div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>Ressenti {weather.feels_like}°C · {city}</div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "var(--text2)" }}>{city ? "Chargement météo..." : "Ajoute ta ville pour la météo"}</div>
          )}
        </div>
        {editCity ? (
          <div style={{ display: "flex", gap: 6 }}>
            <input value={city} onChange={e => setCity(e.target.value)} style={{ width: 100, padding: "5px 8px", fontSize: 12 }} placeholder="Lausanne" onKeyDown={e => e.key === "Enter" && saveCity()} />
            <button onClick={saveCity} className="btn btn-primary" style={{ padding: "5px 10px", fontSize: 11 }}>OK</button>
          </div>
        ) : (
          <button onClick={() => setEditCity(true)} className="btn btn-ghost" style={{ padding: "5px 10px", fontSize: 11 }}>{city ? "✏️" : "+ Ville"}</button>
        )}
      </div>

      {/* Occasion */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {OCCASIONS.map(o => (
          <button key={o} onClick={() => setOccasion(o)} style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid", borderColor: occasion === o ? "var(--accent)" : "var(--border2)", background: occasion === o ? "var(--accent-dim)" : "transparent", color: occasion === o ? "var(--accent)" : "var(--text3)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>{o}</button>
        ))}
      </div>

      {/* Mode tabs */}
      {outfits.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[["saved", "Tenues sauvegardées"], ["compose", "Composer"]].map(([v, l]) => (
            <button key={v} onClick={() => { setMode(v); resetCompose(); setSelectedOutfit(null); setLogged(false); }} style={{ flex: 1, padding: "9px", borderRadius: 10, border: "none", background: mode === v ? "var(--accent)" : "var(--bg3)", color: mode === v ? "#0C0C0F" : "var(--text3)", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>{l}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}><div className="spinner" style={{ width: 28, height: 28 }} /></div>
      ) : mode === "saved" ? (
        // ── SAVED MODE ──
        <div>
          {filteredOutfits.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text3)" }}>
              <div style={{ fontSize: 13, marginBottom: 12 }}>Aucune tenue sauvegardée disponible</div>
              <button onClick={() => setMode("compose")} className="btn btn-primary">Composer une tenue</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredOutfits.map(outfit => {
                const outfitItems = (outfit.item_ids || []).map(id => items.find(i => i.id === id)).filter(Boolean);
                const isSelected = selectedOutfit?.id === outfit.id;
                return (
                  <div key={outfit.id} onClick={() => { setSelectedOutfit(isSelected ? null : outfit); setLogged(false); setSaved(false); }} className="card" style={{ padding: "14px", cursor: "pointer", border: "1px solid " + (isSelected ? "var(--accent-border)" : "var(--border)"), background: isSelected ? "var(--accent-dim)" : "var(--bg2)", transition: "all 0.15s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontFamily: "Fraunces", fontSize: 15, fontWeight: 300 }}>{outfit.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text3)" }}>{outfit.occasion} · Porté {outfit.times_worn}x</div>
                      </div>
                      {outfit.is_favorite && <span style={{ fontSize: 16 }}>⭐</span>}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {outfitItems.slice(0, 5).map(item => (
                        <div key={item.id} style={{ width: 44, height: 58, borderRadius: 8, overflow: "hidden", background: "var(--bg3)", flexShrink: 0 }}>
                          {item.image_url ? <img src={item.image_url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 16 }}>👔</div>}
                        </div>
                      ))}
                    </div>
                    {isSelected && (
                      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                        {logged ? (
                          <div style={{ flex: 1, textAlign: "center", padding: "10px", background: "rgba(110,231,183,0.08)", border: "1px solid rgba(110,231,183,0.2)", borderRadius: 10, color: "var(--green)", fontSize: 13 }}>✓ Enregistré !</div>
                        ) : (
                          <button onClick={e => { e.stopPropagation(); wearToday(outfit); }} className="btn btn-primary" style={{ flex: 1, padding: "10px" }}>Je porte ça aujourd'hui</button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        // ── COMPOSE MODE ──
        <div>
          {!startCategory ? (
            // Choisir par quelle pièce commencer
            <div>
              <div style={{ fontFamily: "Fraunces", fontSize: 16, fontWeight: 300, marginBottom: 12 }}>Par quelle pièce tu commences ?</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {CATEGORIES_ORDER.map(cat => {
                  const count = available.filter(i => i.category === cat).length;
                  if (count === 0) return null;
                  return (
                    <button key={cat} onClick={() => { setStartCategory(cat); setCurrentCategory(cat); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 12, border: "1px solid var(--border2)", background: "var(--bg2)", color: "var(--text)", fontSize: 13, cursor: "pointer", transition: "all 0.15s" }}>
                      <span style={{ fontSize: 20 }}>{CAT_ICONS[cat]}</span>
                      <div>
                        <div style={{ fontWeight: 500 }}>{cat}</div>
                        <div style={{ fontSize: 11, color: "var(--text3)" }}>{count} pièce{count > 1 ? "s" : ""}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              {/* Pièces sélectionnées */}
              {composePieces.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Ma tenue</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {composePieces.map(([cat, item]) => (
                      <div key={cat} style={{ position: "relative" }}>
                        <div style={{ width: 64, height: 84, borderRadius: 10, overflow: "hidden", background: "var(--bg3)", border: "2px solid var(--accent)" }}>
                          {item.image_url ? <img src={item.image_url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 24 }}>{CAT_ICONS[cat]}</div>}
                        </div>
                        <button onClick={() => { removePiece(cat); setCurrentCategory(cat); }} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "var(--red)", border: "none", color: "#fff", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                        <div style={{ fontSize: 9, color: "var(--text3)", textAlign: "center", marginTop: 3 }}>{cat}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Catégorie en cours */}
              {currentCategory && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 8 }}>
                    {CAT_ICONS[currentCategory]} Choisis un(e) <strong>{currentCategory}</strong>
                    <span style={{ fontSize: 11, color: "var(--text3)", marginLeft: 6 }}>({getCompatibleItems(currentCategory).length} compatible{getCompatibleItems(currentCategory).length > 1 ? "s" : ""})</span>
                  </div>
                  {getCompatibleItems(currentCategory).length === 0 ? (
                    <div style={{ fontSize: 13, color: "var(--text3)", padding: "12px", background: "var(--bg3)", borderRadius: 10 }}>Aucune pièce compatible disponible</div>
                  ) : (
                    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
                      {getCompatibleItems(currentCategory).map(item => (
                        <div key={item.id} onClick={() => selectPiece(currentCategory, item)} style={{ flexShrink: 0, cursor: "pointer" }}>
                          <div style={{ width: 80, height: 104, borderRadius: 10, overflow: "hidden", background: "var(--bg3)", border: "2px solid " + (selectedPieces[currentCategory]?.id === item.id ? "var(--accent)" : "var(--border)"), transition: "all 0.15s" }}>
                            {item.image_url ? <img src={item.image_url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 28 }}>{CAT_ICONS[item.category]}</div>}
                          </div>
                          <div style={{ fontSize: 10, color: "var(--text2)", textAlign: "center", marginTop: 4, maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Ajouter une autre catégorie */}
              {composePieces.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 8 }}>Ajouter une autre pièce :</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {CATEGORIES_ORDER.filter(cat => !selectedPieces[cat] && available.filter(i => i.category === cat).length > 0).map(cat => (
                      <button key={cat} onClick={() => setCurrentCategory(cat)} style={{ padding: "5px 10px", borderRadius: 20, border: "1px solid " + (currentCategory === cat ? "var(--accent)" : "var(--border2)"), background: currentCategory === cat ? "var(--accent-dim)" : "transparent", color: currentCategory === cat ? "var(--accent)" : "var(--text3)", fontSize: 11, cursor: "pointer" }}>
                        {CAT_ICONS[cat]} {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {hasEnoughPieces && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                  {logged ? (
                    <div style={{ textAlign: "center", padding: "12px", background: "rgba(110,231,183,0.08)", border: "1px solid rgba(110,231,183,0.2)", borderRadius: 10, color: "var(--green)", fontSize: 13 }}>✓ Enregistré dans l'historique !</div>
                  ) : (
                    <button onClick={() => wearToday({})} className="btn btn-primary" style={{ padding: "13px", fontSize: 14 }}>Je porte cette tenue aujourd'hui</button>
                  )}
                  {saved ? (
                    <div style={{ textAlign: "center", padding: "10px", background: "rgba(201,185,154,0.08)", border: "1px solid var(--accent-border)", borderRadius: 10, color: "var(--accent)", fontSize: 13 }}>✓ Tenue sauvegardée !</div>
                  ) : (
                    <button onClick={saveAsOutfit} className="btn btn-ghost" style={{ padding: "11px" }}>💾 Sauvegarder comme tenue</button>
                  )}
                  <button onClick={resetCompose} className="btn btn-ghost" style={{ padding: "10px", fontSize: 12, color: "var(--text3)" }}>↺ Recommencer</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
