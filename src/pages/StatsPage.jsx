import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getStats } from '../lib/supabase'

export default function StatsPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [user])

  async function load() {
    if (!user) return
    const data = await getStats(user.id)
    setStats(data)
    setLoading(false)
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><div className="spinner" style={{ width: 28, height: 28 }} /></div>
  if (!stats) return null

  const { items, history } = stats
  const available = items.filter(i => i.status === 'available')
  const pressing = items.filter(i => i.status === 'pressing')
  const neverWorn = available.filter(i => i.times_worn === 0)
  const byCat = available.reduce((acc, item) => { acc[item.category] = (acc[item.category] || 0) + 1; return acc }, {})
  const sorted = [...available].sort((a, b) => b.times_worn - a.times_worn)
  const mostWorn = sorted.slice(0, 5)
  const leastWorn = sorted.filter(i => i.times_worn > 0).slice(-5).reverse()
  const thisMonth = history.filter(e => { const d = new Date(e.worn_at); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() })

  const StatCard = ({ icon, value, label }) => (
    <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
      <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontFamily: 'Fraunces', fontSize: 28, fontWeight: 300 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{label}</div>
    </div>
  )

  return (
    <div style={{ padding: '16px', maxWidth: 600, margin: '0 auto' }}>
      <div style={{ fontFamily: 'Fraunces', fontSize: 22, fontWeight: 300, marginBottom: 16 }}>Statistiques</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        <StatCard icon="👔" value={available.length} label="Disponibles" />
        <StatCard icon="🧺" value={pressing.length} label="Au pressing" />
        <StatCard icon="📅" value={thisMonth.length} label="Tenues ce mois" />
      </div>
      {neverWorn.length > 0 && (
        <div style={{ background: 'rgba(252,211,77,0.08)', border: '1px solid rgba(252,211,77,0.2)', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--yellow)', marginBottom: 6 }}>💤 {neverWorn.length} piece{neverWorn.length > 1 ? 's' : ''} jamais portee{neverWorn.length > 1 ? 's' : ''}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {neverWorn.slice(0, 8).map(item => (<span key={item.id} style={{ fontSize: 11, background: 'rgba(252,211,77,0.1)', color: 'var(--yellow)', borderRadius: 6, padding: '2px 8px' }}>{item.name}</span>))}
            {neverWorn.length > 8 && <span style={{ fontSize: 11, color: 'var(--text3)' }}>+{neverWorn.length - 8} autres</span>}
          </div>
        </div>
      )}
      <div className="card" style={{ padding: '16px', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Repartition par categorie</div>
        {Object.entries(byCat).map(([cat, count]) => {
          const pct = Math.round((count / available.length) * 100)
          return (
            <div key={cat} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13 }}>{cat}</span>
                <span style={{ fontSize: 13, color: 'var(--text3)' }}>{count} pieces ({pct}%)</span>
              </div>
              <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: 3 }} />
              </div>
            </div>
          )
        })}
      </div>
      {mostWorn.length > 0 && (
        <div className="card" style={{ padding: '16px', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>🏆 Les plus portes</div>
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
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>💤 Peu portes</div>
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
}
