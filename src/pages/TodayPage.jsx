import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { getItems, logOutfit } from "../lib/supabase";
import { generateOutfits, getWeather } from "../lib/ai";

const OCCASIONS = ["Casual", "Bureau", "Sport", "Soiree", "Weekend", "Voyage"];

export default function TodayPage() {
  const { user, profile, updateProfile } = useAuth();
  const [items, setItems] = useState([]);
  const [weather, setWeather] = useState(null);
  const [occasion, setOccasion] = useState("Casual");
  const [outfits, setOutfits] = useState([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const [logged, setLogged] = useState(false);
  const [city, setCity] = useState(profile?.city || "");
  const [editCity, setEditCity] = useState(false);

  useEffect(() => { loadData(); }, [user]);
  useEffect(() => {
    if (profile?.city) { setCity(profile.city); fetchWeather(profile.city); }
  }, [profile]);

  async function loadData() {
    if (!user) return;
    const data = await getItems(user.id);
    setItems(data);
  }

  async function fetchWeather(c) {
    const w = await getWeather(c);
    setWeather(w);
  }

  async function saveCity() {
    await updateProfile({ city });
    fetchWeather(city);
    setEditCity(false);
  }

  async function generate() {
    setLoading(true);
    setLogged(false);
    const result = await generateOutfits(items, { weather, occasion });
    const enriched = result.map(o => ({
      ...o,
      items: (o.item_ids || []).map(id => items.find(i => i.id === id)).filter(Boolean)
    }));
    setOutfits(enriched);
    setSelected(0);
    setLoading(false);
  }

  async function wearToday() {
    const outfit = outfits[selected];
    if (!outfit) return;
    await logOutfit(user.id, {
      outfit_id: outfit.id || null,
      outfit_name: outfit.name,
      item_ids: outfit.items.map(i => i.id),
      occasion,
      weather_temp: weather?.temp,
      weather_condition: weather?.condition,
      worn_at: new Date().toISOString().split("T")[0],
    });
    setLogged(true);
  }

  const currentOutfit = outfits[selected];

  return (
    <div style={{ padding: "20px", maxWidth: 600, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "Fraunces", fontSize: 22, fontWeight: 300 }}>
          {new Date().toLocaleDateString("fr-CH", { weekday: "long", day: "numeric", month: "long" })}
        </div>
        <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 2 }}>
          Que vas-tu porter aujourd'hui ?
        </div>
      </div>

      <div className="card" style={{ padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 28 }}>{weather ? "🌤️" : "📍"}</div>
        <div style={{ flex: 1 }}>
          {weather ? (
            <div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>
                {weather.temp}°C — {weather.condition}
              </div>
              <div style={{ fontSize: 12, color: "var(--text3)" }}>
                Ressenti {weather.feels_like}°C · {city}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 14, color: "var(--text2)" }}>
              {city ? "Chargement meteo..." : "Ajoute ta ville pour la meteo"}
            </div>
          )}
        </div>
        {editCity ? (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              style={{ width: 110, padding: "6px 10px", fontSize: 13 }}
              placeholder="Lausanne"
              onKeyDown={e => e.key === "Enter" && saveCity()}
            />
            <button onClick={saveCity} className="btn btn-primary" style={{ padding: "6px 12px", fontSize: 12 }}>OK</button>
          </div>
        ) : (
          <button onClick={() => setEditCity(true)} className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }}>
            {city ? "Modifier" : "+ Ville"}
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {OCCASIONS.map(o => (
          <button key={o} onClick={() => setOccasion(o)} style={{
            padding: "7px 14px", borderRadius: 20, border: "1px solid",
            borderColor: occasion === o ? "var(--accent)" : "var(--border2)",
            background: occasion === o ? "var(--accent-dim)" : "transparent",
            color: occasion === o ? "var(--accent)" : "var(--text3)",
            fontSize: 13, fontWeight: 500, cursor: "pointer"
          }}>{o}</button>
        ))}
      </div>

      <button
        onClick={generate}
        disabled={loading || items.filter(i => i.status === "available").length < 2}
        className="btn btn-primary"
        style={{ width: "100%", padding: "14px", marginBottom: 24, fontSize: 14 }}
      >
        {loading ? "Generation..." : "✨ Suggere-moi une tenue"}
      </button>

      {outfits.length > 0 && (
        <div className="fade-in">
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {outfits.map((o, i) => (
              <button key={i} onClick={() => setSelected(i)} style={{
                flex: 1, padding: "8px 4px", borderRadius: 10, border: "1px solid",
                borderColor: selected === i ? "var(--accent)" : "var(--border2)",
                background: selected === i ? "var(--accent-dim)" : "transparent",
                color: selected === i ? "var(--accent)" : "var(--text3)",
                fontSize: 11, fontWeight: 600, cursor: "pointer", textAlign: "center"
              }}>
                {o.vibe || ("Tenue " + (i + 1))}
              </button>
            ))}
          </div>

          {currentOutfit && (
            <div>
              <div className="card" style={{ padding: "16px 18px", marginBottom: 14 }}>
                <div style={{ fontFamily: "Fraunces", fontSize: 18, fontWeight: 300, marginBottom: 4 }}>
                  {currentOutfit.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 10 }}>
                  {currentOutfit.occasion}
                </div>
                {currentOutfit.reasoning && (
                  <div style={{ fontSize: 13, color: "var(--text2)", fontStyle: "italic", lineHeight: 1.5 }}>
                    {currentOutfit.reasoning}
                  </div>
                )}
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(" + Math.min(currentOutfit.items.length, 3) + ", 1fr)",
                gap: 10, marginBottom: 16
              }}>
                {currentOutfit.items.map(item => (
                  <div key={item.id} className="card" style={{ overflow: "hidden" }}>
                    {item.image_url && (
                      <div style={{ aspectRatio: "3/4" }}>
                        <img src={item.image_url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    )}
                    <div style={{ padding: "8px 10px" }}>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{item.name}</div>
                      <div style={{ fontSize: 10, color: "var(--text3)" }}>{item.category}</div>
                    </div>
                  </div>
                ))}
              </div>

              {logged ? (
                <div style={{
                  textAlign: "center", padding: "14px",
                  background: "rgba(110,231,183,0.08)",
                  border: "1px solid rgba(110,231,183,0.2)",
                  borderRadius: 12, color: "var(--green)", fontSize: 14, fontWeight: 500
                }}>
                  Tenue enregistree dans ton historique
                </div>
              ) : (
                <button onClick={wearToday} className="btn btn-ghost" style={{ width: "100%", padding: "12px" }}>
                  Je porte cette tenue aujourd'hui
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {items.filter(i => i.status === "available").length < 2 && (
        <div style={{ textAlign: "center", color: "var(--text3)", fontSize: 13, marginTop: 20 }}>
          Ajoute au moins 2 vetements disponibles pour generer des suggestions
        </div>
      )}
    </div>
  );
}
