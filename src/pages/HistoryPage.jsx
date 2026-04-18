import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getHistory, getItems } from '../lib/supabase'

export default function HistoryPage() {
  const { user } = useAuth()
  const [history, setHistory] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [user])

  async function load() {
    if (!user) return
    const [h, i] = await Promise.all([getHistory(user.id, 60), getItems(user.id)])
    setHistory(h); setItems(i)
    setLoading(false)
  }

  function getItem(id) { return items.find(i => i.id === id) }

  const grouped = history.reduce((acc, entry) => {
    const date = new Date(entry.worn_at)
    const key = date.toLocaleDateString('fr-CH', { month: 'long', year: 'numeric' })
    if (!acc[key]) acc[key] = []
    acc[key].push(entry)
    return acc
  }, {})

  return (
    <div style={{ padding: '16px', maxWidth: 600, margin: '0 auto' }}>
      <div style={{ fontFamily: 'Fraunces', fontSize: 22, fontWeight: 300, marginBottom: 16 }}>Historique des tenues</div>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><div className="spinner" style={{ width: 28, height: 28 }} /></div>
      ) : history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
          <div style={{ fontFamily: 'Fraunces', fontSize: 18 }}>Aucun historique</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Valide une tenue depuis "Aujourd'hui" pour la voir ici</div>
        </div>
      ) : (
        Object.entries(grouped).map(([month, entries]) => (
          <div key={month} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>{month}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {entries.map(entry => {
                const entryItems = (entry.item_ids || []).map(getItem).filter(Boolean)
                return (
                  <div key={entry.id} className="card fade-in" style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{entry.outfit_name || 'Tenue libre'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                          {new Date(entry.worn_at).toLocaleDateString('fr-CH', { weekday: 'short', day: 'numeric', month: 'short' })}
                          {entry.occasion && ` · ${entry.occasion}`}
                          {entry.weather_temp && ` · ${entry.weather_temp}°C`}
                        </div>
                      </div>
                    </div>
                    {entryItems.length > 0 && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        {entryItems.slice(0, 5).map(item => (
                          <div key={item.id} style={{ width: 44, height: 58, borderRadius: 8, overflow: 'hidden', background: 'var(--bg3)', flexShrink: 0 }}>
                            {item.image_url ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 16 }}>👔</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
