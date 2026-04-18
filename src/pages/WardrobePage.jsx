import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getItems, addItem, updateItem, deleteItem } from '../lib/supabase'
import { analyzeClothing, resizeImage, blobToBase64 } from '../lib/ai'

const CATEGORIES = ['Tous', 'Hauts', 'Bas', 'Vestes', 'Chaussures', 'Ceintures', 'Accessoires']
const STATUSES = ['available', 'pressing', 'retired']
const STATUS_LABELS = { available: 'Disponible', pressing: 'Au pressing', retired: 'Retire' }
const STATUS_ICONS = { available: '✅', pressing: '🧺', retired: '📦' }
const CAT_ICONS = { Hauts: '👕', Bas: '👖', Vestes: '🧥', Chaussures: '👟', Ceintures: '👜', Accessoires: '🕶️' }

export default function WardrobePage() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [filterCat, setFilterCat] = useState('Tous')
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => { load() }, [user])

  async function load() {
    if (!user) return
    setLoading(true)
    const data = await getItems(user.id)
    setItems(data)
    setLoading(false)
  }

  const processFiles = useCallback(async (files) => {
    setAnalyzing(true)
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      setStatusMsg('Analyse de ' + file.name + '...')
      try {
        const blob = await resizeImage(file)
        const b64 = await blobToBase64(blob)
        const resizedFile = new File([blob], file.name, { type: 'image/jpeg' })
        const info = await analyzeClothing(b64)
        const saved = await addItem(user.id, {
          name: info.name || 'Vetement',
          category: info.category || 'Hauts',
          subcategory: info.subcategory,
          colors: info.colors || [],
          style: info.style,
          season: info.season || [],
          description: info.description,
          tags: info.tags || [],
          brand: info.brand,
          status: 'available',
        }, resizedFile)
        setItems(prev => [saved, ...prev])
      } catch (e) { console.error(e) }
    }
    setStatusMsg('')
    setAnalyzing(false)
  }, [user])

  async function changeStatus(item, status) {
    const updated = await updateItem(item.id, { status })
    setItems(prev => prev.map(i => i.id === item.id ? updated : i))
    if (selectedItem?.id === item.id) setSelectedItem(updated)
  }

  async function removeItem(item) {
    if (!confirm('Supprimer "' + item.name + '" ?')) return
    await deleteItem(item)
    setItems(prev => prev.filter(i => i.id !== item.id))
    setSelectedItem(null)
  }

  const filtered = items.filter(item => {
    if (filterCat !== 'Tous' && item.category !== filterCat) return false
    if (filterStatus !== 'all' && item.status !== filterStatus) return false
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 16px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
          <label style={{ display: 'inline-flex', alignItems: 'center', padding: '10px 16px', borderRadius: 24, background: 'var(--accent)', color: '#0C0C0F', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            + Photo
            <input type="file" multiple accept="image/*,.heic,.heif" style={{ display: 'none' }} onChange={e => processFiles(e.target.files)} />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8 }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)} style={{ padding: '6px 12px', borderRadius: 20, border: '1px solid', borderColor: filterCat === cat ? 'var(--accent)' : 'var(--border2)', background: filterCat === cat ? 'var(--accent-dim)' : 'transparent', color: filterCat === cat ? 'var(--accent)' : 'var(--text3)', fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
              {cat !== 'Tous' ? CAT_ICONS[cat] + ' ' : ''}{cat}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, paddingBottom: 10 }}>
          {[['all', 'Tous'], ['available', 'Disponibles'], ['pressing', 'Au pressing']].map(([v, l]) => (
            <button key={v} onClick={() => setFilterStatus(v)} style={{ padding: '5px 11px', borderRadius: 20, border: '1px solid', borderColor: filterStatus === v ? 'var(--accent)' : 'var(--border2)', background: filterStatus === v ? 'var(--accent-dim)' : 'transparent', color: filterStatus === v ? 'var(--accent)' : 'var(--text3)', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>{l}</button>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)', alignSelf: 'center' }}>{filtered.length} pieces</div>
        </div>
      </div>
      {analyzing && (
        <div style={{ padding: '8px 16px', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.2s infinite' }} />
          {statusMsg}
        </div>
      )}
      <div onDragOver={(e) => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={(e) => { e.preventDefault(); setDragOver(false); processFiles(e.dataTransfer.files) }} style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 16px', position: 'relative' }}>
        {dragOver && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(201,185,154,0.08)', border: '2px dashed var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--accent)', pointerEvents: 'none' }}>
            Depose tes photos ici
          </div>
        )}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><div className="spinner" style={{ width: 28, height: 28 }} /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👔</div>
            <div style={{ fontFamily: 'Fraunces', fontSize: 18, marginBottom: 6 }}>{items.length === 0 ? 'Garde-robe vide' : 'Aucun resultat'}</div>
            <div style={{ fontSize: 13 }}>{items.length === 0 ? 'Appuie sur "+ Photo" pour commencer' : 'Modifie tes filtres'}</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            {filtered.map(item => (
              <div key={item.id} onClick={() => setSelectedItem(item)} style={{ background: 'var(--bg2)', border: '1px solid ' + (item.status === 'pressing' ? 'rgba(252,211,77,0.3)' : 'var(--border)'), borderRadius: 'var(--radius)', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.15s', opacity: item.status === 'retired' ? 0.5 : 1 }}>
                <div style={{ aspectRatio: '3/4', position: 'relative', background: 'var(--bg3)' }}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 36 }}>{CAT_ICONS[item.category] || '👔'}</div>
                  )}
                  {item.status !== 'available' && (
                    <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.7)', borderRadius: 6, padding: '2px 6px', fontSize: 11 }}>{STATUS_ICONS[item.status]}</div>
                  )}
                </div>
                <div style={{ padding: '8px 10px 10px' }}>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 3, lineHeight: 1.3 }}>{item.name}</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {item.colors?.slice(0, 1).map(c => (<span key={c} style={{ fontSize: 10, color: 'var(--text3)', background: 'var(--bg3)', borderRadius: 4, padding: '1px 5px' }}>{c}</span>))}
                    {item.style && <span className={'tag style-' + item.style} style={{ fontSize: 10, padding: '1px 5px' }}>{item.style}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedItem && (
        <ItemModal item={selectedItem} onClose={() => setSelectedItem(null)} onStatusChange={changeStatus} onDelete={removeItem}
          onUpdate={async (updates) => {
            const updated = await updateItem(selectedItem.id, updates)
            setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
            setSelectedItem(updated)
          }}
        />
      )}
    </div>
  )
}

function ItemModal({ item, onClose, onStatusChange, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: item.name, brand: item.brand || '', notes: item.notes || '', category: item.category || 'Hauts', style: item.style || 'casual' })

  async function save() {
    await onUpdate(form)
    setEditing(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg2)', borderRadius: '20px 20px 0 0', border: '1px solid var(--border)', width: '100%', maxHeight: '85dvh', overflowY: 'auto', padding: '20px' }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border2)', margin: '0 auto 16px' }} />
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          {item.image_url && <img src={item.image_url} alt={item.name} style={{ width: 100, height: 130, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />}
          <div style={{ flex: 1 }}>
            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
<select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
  {['Hauts','Bas','Vestes','Chaussures','Ceintures','Accessoires'].map(c => <option key={c} value={c}>{c}</option>)}
</select>
<select value={form.style} onChange={e => setForm(f => ({ ...f, style: e.target.value }))}>
  {['casual','smart-casual','formel','sport','streetwear'].map(s => <option key={s} value={s}>{s}</option>)}
</select>
<input value={form.brand} placeholder="Marque" onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
                <textarea value={form.notes} placeholder="Notes" rows={2} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'none' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={save} className="btn btn-primary" style={{ flex: 1, padding: '8px' }}>Sauver</button>
                  <button onClick={() => setEditing(false)} className="btn btn-ghost" style={{ flex: 1, padding: '8px' }}>Annuler</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontFamily: 'Fraunces', fontSize: 18, fontWeight: 300, marginBottom: 4 }}>{item.name}</div>
                {item.brand && <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>{item.brand}</div>}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  <span className={'tag status-' + item.status}>{STATUS_ICONS[item.status]} {STATUS_LABELS[item.status]}</span>
                  {item.style && <span className={'tag style-' + item.style}>{item.style}</span>}
                </div>
                {item.colors?.length > 0 && <div style={{ fontSize: 12, color: 'var(--text2)' }}>🎨 {item.colors.join(', ')}</div>}
                {item.season?.length > 0 && <div style={{ fontSize: 12, color: 'var(--text2)' }}>🌡️ {item.season.join(', ')}</div>}
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Porte {item.times_worn} fois</div>
                {item.notes && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4, fontStyle: 'italic' }}>{item.notes}</div>}
                <button onClick={() => setEditing(true)} className="btn btn-ghost" style={{ marginTop: 8, padding: '5px 12px', fontSize: 12 }}>Modifier</button>
              </>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {STATUSES.map(s => (
            <button key={s} onClick={() => onStatusChange(item, s)} className={'btn ' + (item.status === s ? 'btn-primary' : 'btn-ghost')} style={{ flex: 1, padding: '8px 4px', fontSize: 11 }}>
              {STATUS_ICONS[s]} {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <button onClick={() => onDelete(item)} className="btn btn-danger" style={{ width: '100%', padding: '10px' }}>🗑️ Supprimer ce vetement</button>
      </div>
    </div>
  )
}
