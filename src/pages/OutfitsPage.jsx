import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getOutfits, getItems, deleteOutfit, toggleFavoriteOutfit } from '../lib/supabase'
import { supabase } from '../lib/supabase'

const CAT_ICONS = { Hauts: '👕', Bas: '👖', Vestes: '🧥', Chaussures: '👟', Ceintures: '👜', Accessoires: '🕶️', Sport: '🏃' }
const OCCASIONS = ['Casual', 'Bureau', 'Sport', 'Soiree', 'Weekend', 'Voyage']

export default function OutfitsPage() {
  const { user } = useAuth()
  const [outfits, setOutfits] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [editingOutfit, setEditingOutfit] = useState(null)

  useEffect(() => { load() }, [user])

  async function load() {
    if (!user) return
    const [o, i] = await Promise.all([getOutfits(user.id), getItems(user.id)])
    setOutfits(o); setItems(i)
    setLoading(false)
  }

  function getItemById(id) { return items.find(i => i.id === id) }

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

  async function updateOccasions(outfitId, occasions) {
    const { data, error } = await supabase.from('outfits')
      .update({ occasions, updated_at: new Date().toISOString() })
      .eq('id', outfitId).select().single()
    if (error) throw error
    setOutfits(prev => prev.map(o => o.id === data.id ? data : o))
    return data
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ fontFamily: 'Fraunces', fontSize: 20, fontWeight: 300 }}>
          Mes tenues {outfits.length > 0 && <span style={{ fontSize: 14, color: 'var(--text3)' }}>({outfits.length})</span>}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
          Compose tes tenues depuis l'onglet "Aujourd'hui"
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div className="spinner" style={{ width: 28, height: 28 }} />
          </div>
        ) : outfits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎨</div>
            <div style={{ fontFamily: 'Fraunces', fontSize: 18, marginBottom: 6 }}>Aucune tenue sauvegardée</div>
            <div style={{ fontSize: 13 }}>Compose une tenue depuis "Aujourd'hui"</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {outfits.map(outfit => {
              const outfitItems = (outfit.item_ids || []).map(getItemById).filter(Boolean)
              const isSelected = selected === outfit.id
              const occasions = outfit.occasions?.length ? outfit.occasions : (outfit.occasion ? [outfit.occasion] : [])
              return (
                <div key={outfit.id} onClick={() => setSelected(isSelected ? null : outfit.id)}
                  className="card fade-in" style={{
                    padding: '14px 16px', cursor: 'pointer',
                    border: '1px solid ' + (isSelected ? 'var(--accent-border)' : 'var(--border)'),
                    background: isSelected ? 'var(--accent-dim)' : 'var(--bg2)',
                    transition: 'all 0.15s'
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'Fraunces', fontSize: 16, fontWeight: 300, marginBottom: 4 }}>{outfit.name}</div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {occasions.map(occ => (
                          <span key={occ} style={{ fontSize: 10, background: 'var(--bg3)', color: 'var(--text3)', borderRadius: 6, padding: '2px 7px' }}>{occ}</span>
                        ))}
                        <span style={{ fontSize: 10, color: 'var(--text3)', padding: '2px 4px' }}>· Portée {outfit.times_worn}x</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => toggleFav(outfit)} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', opacity: outfit.is_favorite ? 1 : 0.3, padding: '4px' }}>⭐</button>
                      <button onClick={() => setEditingOutfit(outfit)} style={{ background: 'none', border: 'none', fontSize: 14, cursor: 'pointer', color: 'var(--text3)', padding: '4px' }}>✏️</button>
                      <button onClick={() => remove(outfit.id)} style={{ background: 'none', border: 'none', fontSize: 14, cursor: 'pointer', color: 'var(--text3)', padding: '4px' }}>🗑️</button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    {outfitItems.slice(0, 5).map(item => (
                      <div key={item.id} style={{ width: 64, height: 84, borderRadius: 10, overflow: 'hidden', background: 'var(--bg3)', flexShrink: 0 }}>
                        {item.image_url
                          ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 22 }}>{CAT_ICONS[item.category] || '👔'}</div>
                        }
                      </div>
                    ))}
                  </div>

                  {isSelected && outfit.reasoning && (
                    <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text2)', fontStyle: 'italic', lineHeight: 1.5, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                      "{outfit.reasoning}"
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {editingOutfit && (
        <EditOutfitModal
          outfit={editingOutfit}
          items={items}
          onClose={() => setEditingOutfit(null)}
          onSave={async (occasions) => {
            await updateOccasions(editingOutfit.id, occasions)
            setEditingOutfit(null)
          }}
        />
      )}
    </div>
  )
}

function EditOutfitModal({ outfit, items, onClose, onSave }) {
  const occasions = outfit.occasions?.length ? outfit.occasions : (outfit.occasion ? [outfit.occasion] : [])
  const [selected, setSelected] = useState(occasions)
  const [name, setName] = useState(outfit.name)
  const [saving, setSaving] = useState(false)
  const CAT_ICONS = { Hauts: '👕', Bas: '👖', Vestes: '🧥', Chaussures: '👟', Ceintures: '👜', Accessoires: '🕶️', Sport: '🏃' }

  function toggle(occ) {
    setSelected(prev => prev.includes(occ) ? prev.filter(o => o !== occ) : [...prev, occ])
  }

  async function save() {
    setSaving(true)
    await onSave(selected, name)
    setSaving(false)
  }

  const outfitItems = (outfit.item_ids || []).map(id => items.find(i => i.id === id)).filter(Boolean)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg2)', borderRadius: '20px 20px 0 0', border: '1px solid var(--border)', width: '100%', maxHeight: '85dvh', overflowY: 'auto', padding: '20px' }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border2)', margin: '0 auto 20px' }} />

        <div style={{ fontFamily: 'Fraunces', fontSize: 18, fontWeight: 300, marginBottom: 16 }}>Modifier la tenue</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {outfitItems.slice(0, 5).map(item => (
            <div key={item.id} style={{ width: 56, height: 74, borderRadius: 10, overflow: 'hidden', background: 'var(--bg3)', flexShrink: 0 }}>
              {item.image_url
                ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 18 }}>{CAT_ICONS[item.category] || '👔'}</div>
              }
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>Nom de la tenue</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nom de la tenue" />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>Occasions (plusieurs possibles)</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {OCCASIONS.map(occ => (
              <button key={occ} onClick={() => toggle(occ)} style={{
                padding: '8px 16px', borderRadius: 20, border: '1px solid',
                borderColor: selected.includes(occ) ? 'var(--accent)' : 'var(--border2)',
                background: selected.includes(occ) ? 'var(--accent-dim)' : 'transparent',
                color: selected.includes(occ) ? 'var(--accent)' : 'var(--text3)',
                fontSize: 13, cursor: 'pointer', transition: 'all 0.15s'
              }}>
                {selected.includes(occ) ? '✓ ' : ''}{occ}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} className="btn btn-ghost" style={{ flex: 1, padding: '12px' }}>Annuler</button>
          <button onClick={save} disabled={saving} className="btn btn-primary" style={{ flex: 2, padding: '12px' }}>
            {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  )
}
