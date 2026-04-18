import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getWishlist, addWishlistItem, updateWishlistItem, deleteWishlistItem } from '../lib/supabase'

const CATEGORIES = ['Hauts', 'Bas', 'Vestes', 'Chaussures', 'Ceintures', 'Accessoires']
const PRIORITIES = ['low', 'medium', 'high']
const PRIORITY_LABELS = { low: 'Basse', medium: 'Moyenne', high: 'Haute' }
const EMPTY_FORM = { name: '', category: 'Hauts', description: '', estimated_price: '', shop_url: '', priority: 'medium', notes: '' }

export default function WishlistPage() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => { load() }, [user])

  async function load() {
    if (!user) return
    const data = await getWishlist(user.id)
    setItems(data)
    setLoading(false)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function submit() {
    if (!form.name.trim()) return
    setSaving(true)
    const saved = await addWishlistItem(user.id, { ...form, estimated_price: form.estimated_price ? parseFloat(form.estimated_price) : null })
    setItems(prev => [saved, ...prev])
    setForm(EMPTY_FORM); setShowAdd(false)
    setSaving(false)
  }

  async function markPurchased(item) {
    const updated = await updateWishlistItem(item.id, { purchased: !item.purchased, purchased_at: !item.purchased ? new Date().toISOString().split('T')[0] : null })
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
  }

  async function remove(id) {
    if (!confirm('Supprimer ?')) return
    await deleteWishlistItem(id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const filtered = items.filter(i => { if (filter === 'pending') return !i.purchased; if (filter === 'purchased') return i.purchased; return true })
  const totalPending = items.filter(i => !i.purchased && i.estimated_price).reduce((s, i) => s + i.estimated_price, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: 'Fraunces', fontSize: 20, fontWeight: 300 }}>Wishlist</div>
            {totalPending > 0 && <div style={{ fontSize: 12, color: 'var(--text3)' }}>Budget estime: {totalPending.toFixed(0)} CHF</div>}
          </div>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary" style={{ padding: '8px 16px' }}>+ Ajouter</button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['all', 'Tout'], ['pending', 'A acheter'], ['purchased', 'Achete']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid', borderColor: filter === v ? 'var(--accent)' : 'var(--border2)', background: filter === v ? 'var(--accent-dim)' : 'transparent', color: filter === v ? 'var(--accent)' : 'var(--text3)', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><div className="spinner" style={{ width: 28, height: 28 }} /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🛍️</div>
            <div style={{ fontFamily: 'Fraunces', fontSize: 18 }}>{filter === 'all' ? 'Wishlist vide' : 'Aucun article'}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(item => (
              <div key={item.id} className="card fade-in" style={{ padding: '14px 16px', opacity: item.purchased ? 0.6 : 1, borderColor: item.priority === 'high' ? 'rgba(248,113,113,0.3)' : 'var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, textDecoration: item.purchased ? 'line-through' : 'none', color: item.purchased ? 'var(--text3)' : 'var(--text)' }}>{item.name}</div>
                      <span className="tag" style={{ fontSize: 10, padding: '1px 6px', background: item.priority === 'high' ? 'rgba(248,113,113,0.12)' : item.priority === 'medium' ? 'rgba(246,173,85,0.12)' : 'rgba(110,231,183,0.12)', color: item.priority === 'high' ? 'var(--red)' : item.priority === 'medium' ? '#F6AD55' : 'var(--green)' }}>{PRIORITY_LABELS[item.priority]}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>{item.category}{item.estimated_price && ` · ~${item.estimated_price} CHF`}</div>
                    {item.description && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{item.description}</div>}
                    {item.shop_url && <a href={item.shop_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--accent)', display: 'block', marginTop: 4 }}>Voir en boutique</a>}
                    {item.purchased && item.purchased_at && <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 4 }}>Achete le {new Date(item.purchased_at).toLocaleDateString('fr-CH')}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginLeft: 10 }}>
                    <button onClick={() => markPurchased(item)} style={{ background: item.purchased ? 'rgba(110,231,183,0.1)' : 'var(--bg3)', border: `1px solid ${item.purchased ? 'rgba(110,231,183,0.3)' : 'var(--border2)'}`, borderRadius: 8, padding: '6px 10px', color: item.purchased ? 'var(--green)' : 'var(--text3)', fontSize: 13, cursor: 'pointer' }}>{item.purchased ? '✓' : '○'}</button>
                    <button onClick={() => remove(item.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 14 }}>🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowAdd(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg2)', borderRadius: '20px 20px 0 0', border: '1px solid var(--border)', width: '100%', maxHeight: '85dvh', overflowY: 'auto', padding: '20px' }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border2)', margin: '0 auto 20px' }} />
            <div style={{ fontFamily: 'Fraunces', fontSize: 18, fontWeight: 300, marginBottom: 16 }}>Ajouter a la wishlist</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input placeholder="Nom de l article *" value={form.name} onChange={e => set('name', e.target.value)} />
              <select value={form.category} onChange={e => set('category', e.target.value)}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
              <input placeholder="Description" value={form.description} onChange={e => set('description', e.target.value)} />
              <input type="number" placeholder="Prix estime (CHF)" value={form.estimated_price} onChange={e => set('estimated_price', e.target.value)} />
              <input placeholder="Lien boutique (optionnel)" value={form.shop_url} onChange={e => set('shop_url', e.target.value)} />
              <div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>Priorite</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {PRIORITIES.map(p => (<button key={p} onClick={() => set('priority', p)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid', borderColor: form.priority === p ? 'var(--accent)' : 'var(--border2)', background: form.priority === p ? 'var(--accent-dim)' : 'transparent', color: form.priority === p ? 'var(--accent)' : 'var(--text3)', fontSize: 12, cursor: 'pointer' }}>{PRIORITY_LABELS[p]}</button>))}
                </div>
              </div>
              <textarea placeholder="Notes" value={form.notes} rows={2} onChange={e => set('notes', e.target.value)} style={{ resize: 'none' }} />
              <button onClick={submit} disabled={saving || !form.name.trim()} className="btn btn-primary" style={{ padding: '13px', fontSize: 14, marginTop: 4 }}>
                {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : '+ Ajouter a ma wishlist'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
