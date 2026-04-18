import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getOutfits, getItems, saveOutfit, deleteOutfit, toggleFavoriteOutfit } from '../lib/supabase'
import { generateOutfits } from '../lib/ai'

const OCCASIONS = ['Casual', 'Bureau', 'Sport', 'Soiree', 'Weekend', 'Voyage']

export default function OutfitsPage() {
  const { user } = useAuth()
  const [outfits, setOutfits] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [occasion, setOccasion] = useState('Casual')
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('saved')

  useEffect(() => { load() }, [user])

  async function load() {
    if (!user) return
    const [o, i] = await Promise.all([getOutfits(user.id), getItems(user.id)])
    setOutfits(o); setItems(i)
    setLoading(false)
  }

  function getItemById(id) { return items.find(i => i.id === id) }

  async function generate() {
    setGenerating(true)
    const result = await generateOutfits(items, { occasion })
    const saved = []
    for (const o of result) {
      const s = await saveOutfit(user.id, { name: o.name, occasion: o.occasion, vibe: o.vibe, reasoning: o.reasoning, item_ids: o.item_ids || [] })
      saved.push(s)
    }
    setOutfits(prev => [...saved, ...prev])
    setTab('saved'); setSelected(saved[0]?.id)
    setGenerating(false)
  }

  async function remove(id) {
    if (!confirm('Supprimer cette tenue ?')) return
    await deleteOutfit(id)
    setOutfits(prev => prev.filter(o => o.id !== id))
    if (selected === id) setSelected(null)
  }

  async function toggleFav(outfit) {
    const updated = await toggleFavoriteOutfit(outfit.id, !outfit.is_favorite)
    setOutfits(prev => prev.map(o => o.id === updated.id ? updated : o))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '14px 16px 0', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[['saved', 'Mes tenues'], ['generate', 'Generer']].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} style={{ padding: '8px 18px', borderRadius: 20, border: 'none', background: tab === v ? 'var(--accent)' : 'var(--bg3)', color: tab === v ? '#0C0C0F' : 'var(--text3)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
              {l} {v === 'saved' ? `(${outfits.length})` : ''}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {tab === 'generate' ? (
          <div>
            <div style={{ fontFamily: 'Fraunces', fontSize: 18, fontWeight: 300, marginBottom: 12 }}>Generer de nouvelles tenues</div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>Occasion</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {OCCASIONS.map(o => (
                  <button key={o} onClick={() => setOccasion(o)} style={{ padding: '7px 14px', borderRadius: 20, border: '1px solid', borderColor: occasion === o ? 'var(--accent)' : 'var(--border2)', background: occasion === o ? 'var(--accent-dim)' : 'transparent', color: occasion === o ? 'var(--accent)' : 'var(--text3)', fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}>{o}</button>
                ))}
              </div>
            </div>
            <button onClick={generate} disabled={generating} className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: 14 }}>
              {generating ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Generation...</> : '✨ Generer 3 tenues'}
            </button>
            <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', marginTop: 8 }}>Les tenues seront sauvegardees automatiquement</div>
          </div>
        ) : loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><div className="spinner" style={{ width: 28, height: 28 }} /></div>
        ) : outfits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎨</div>
            <div style={{ fontFamily: 'Fraunces', fontSize: 18, marginBottom: 6 }}>Aucune tenue sauvegardee</div>
            <button onClick={() => setTab('generate')} className="btn btn-primary" style={{ marginTop: 8 }}>✨ Generer mes premieres tenues</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {outfits.map(outfit => {
              const outfitItems = (outfit.item_ids || []).map(getItemById).filter(Boolean)
              const isSelected = selected === outfit.id
              return (
                <div key={outfit.id} onClick={() => setSelected(isSelected ? null : outfit.id)} className="card fade-in" style={{ padding: '14px 16px', cursor: 'pointer', border: `1px solid ${isSelected ? 'var(--accent-border)' : 'var(--border)'}`, background: isSelected ? 'var(--accent-dim)' : 'var(--bg2)', transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontFamily: 'Fraunces', fontSize: 16, fontWeight: 300 }}>{outfit.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{outfit.occasion} · {outfit.vibe} · Porte {outfit.times_worn}x</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => toggleFav(outfit)} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', opacity: outfit.is_favorite ? 1 : 0.3 }}>⭐</button>
                      <button onClick={() => remove(outfit.id)} style={{ background: 'none', border: 'none', fontSize: 14, cursor: 'pointer', color: 'var(--text3)' }}>🗑️</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {outfitItems.slice(0, 5).map(item => (
                      <div key={item.id} style={{ width: 48, height: 64, borderRadius: 8, overflow: 'hidden', background: 'var(--bg3)', flexShrink: 0 }}>
                        {item.image_url ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 18 }}>👔</div>}
                      </div>
                    ))}
                  </div>
                  {isSelected && outfit.reasoning && (
                    <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text2)', fontStyle: 'italic', lineHeight: 1.5, borderTop: '1px solid var(--border)', paddingTop: 10 }}>"{outfit.reasoning}"</div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
