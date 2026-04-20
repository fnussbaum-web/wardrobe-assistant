import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getHistory, getItems, getStats } from '../lib/supabase'

export default function JournalPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('history')
  const [history, setHistory] = useState([])
  const [items, setItems] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [user])

  async function load() {
    if (!user) return
    const [h, i, s] = await Promise.all([getHistory(user.id, 60), getItems(user.id), getStats(user.id)])
    setHistory(h); setItems(i); setStats(s)
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '14px 16px 0', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[['history', 'Historique'], ['stats', 'Statistiques']].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} style={{ padding: '8px 18px', borderRadius: 20, border: 'none', background: tab === v ? 'var(--accent)' : 'var(--bg3)', color: tab === v ? '#0C0C0F' : 'var(--text3)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><div className="spinner" style={{ width: 28, height: 28 }} /></div>
        ) : tab === 'history' ? (
          history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📖</div>
              <div style={{ fontFamily: 'Fraunces', fontSize: 18 }}>Aucun historique</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Valide une tenue depuis "Aujourd'hui"</div>
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
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{entry.outfit_name || 'Tenue libre'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                            {new Date(entry.worn_at).toLocaleDateString('fr-CH', { weekday: 'short', day: 'numeric', month: 'short' })}
                            {entry.occasion && ' · ' + entry.occasion}
                            {entry.weather_temp && ' · ' + entry.weather_temp + '°C'}
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
          )
        ) : stats ? (() => {
          const available = stats.items.filter(i => i.status === 'available')
          const pressing = stats.items.filter(i => i.status === 'pressing')
          const neverWorn = available.filter(i => i.times_worn === 0)
          const byCat = available.reduce((acc, item) => { acc[item.category] = (acc[item.category] || 0) + 1; return acc }, {})
          const sorted = [...available].sort((a, b) => b.times_worn - a.times_worn)
          const mostWorn = sorted.slice(0, 5)
          const leastWorn = sorted.filter(i => i.times_worn > 0).slice(-5).reverse()
          const thisMonth = stats.history.filter(e => { const d = new Date(e.worn_at); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() })

          return (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                {[['👔', available.length, 'Disponibles'], ['🧺', pressing.length, 'Au pressing'], ['📅', thisMonth.length, 'Ce mois']].map(([icon, value, label]) => (
                  <div key={label} className="card" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
                    <div style={{ fontFamily: 'Fraunces', fontSize: 28, fontWeight: 300 }}>{value}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>

              {neverWorn.length > 0 && (
                <div style={{ background: 'rgba(252,211,77,0.08)', border: '1px solid rgba(252,211,77,0.2)', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--yellow)', marginBottom: 6 }}>💤 {neverWorn.length} pièce{neverWorn.length > 1 ? 's' : ''} jamais portée{neverWorn.length > 1 ? 's' : ''}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {neverWorn.slice(0, 8).map(item => (<span key={item.id} style={{ fontSize: 11, background: 'rgba(252,211,77,0.1)', color: 'var(--yellow)', borderRadius: 6, padding: '2px 8px' }}>{item.name}</span>))}
                    {neverWorn.length > 8 && <span style={{ fontSize: 11, color: 'var(--text3)' }}>+{neverWorn.length - 8} autres</span>}
                  </div>
                </div>
              )}

              <div className="card" style={{ padding: '16px', marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Répartition par catégorie</div>
                {Object.entries(byCat).map(([cat, count]) => {
                  const pct = Math.round((count / available.length) * 100)
                  return (
                    <div key={cat} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13 }}>{cat}</span>
                        <span style={{ fontSize: 13, color: 'var(--text3)' }}>{count} pièces ({pct}%)</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: pct + '%', height: '100%', background: 'var(--accent)', borderRadius: 3 }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {mostWorn.length > 0 && (
                <div className="card" style={{ padding: '16px', marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>🏆 Les plus portés</div>
                  {mostWorn.map((item, i) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: i < mostWorn.length - 1 ? 10 : 0, marginBottom: i < mostWorn.length - 1 ? 10 : 0, borderBottom: i < mostWorn.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ fontSize: 16, width: 24, textAlign: 'center', color: 'var(--text3)' }}>#{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{item.category}</div>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{item.times_worn}x</div>
                    </div>
                  ))}
                </div>
              )}

              {leastWorn.length > 0 && (
                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>💤 Peu portés</div>
                  {leastWorn.map((item, i) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: i < leastWorn.length - 1 ? 10 : 0, marginBottom: i < leastWorn.length - 1 ? 10 : 0, borderBottom: i < leastWorn.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{item.category}</div>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text3)' }}>{item.times_worn}x</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })() : null}
      </div>
    </div>
  )
}
