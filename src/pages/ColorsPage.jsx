import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getColorCombinations, saveColorCombination } from '../lib/supabase'

const COLORS = ['Noir', 'Blanc', 'Gris', 'Beige', 'Navy', 'Bleu', 'Rouge', 'Vert', 'Marron', 'Jaune', 'Orange', 'Rose', 'Violet', 'Kaki']

const COLOR_SWATCHES = {
  'Noir': '#1a1a1a', 'Blanc': '#f5f5f5', 'Gris': '#888',
  'Beige': '#C9B99A', 'Navy': '#1B2A4A', 'Bleu': '#4A90D9',
  'Rouge': '#D94A4A', 'Vert': '#4A9D6F', 'Marron': '#8B5E3C',
  'Jaune': '#F5C842', 'Orange': '#F5894A', 'Rose': '#F5A0C0',
  'Violet': '#9B7FD4', 'Kaki': '#7D8C5A'
}

export default function ColorsPage() {
  const { user } = useAuth()
  const [combinations, setCombinations] = useState({})
  const [selectedColor, setSelectedColor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [user])

  async function load() {
    if (!user) return
    const data = await getColorCombinations(user.id)
    const map = {}
    data.forEach(d => { map[d.color] = d.compatible_colors || [] })
    setCombinations(map)
    setLoading(false)
  }

  function isCompatible(color) {
    return (combinations[selectedColor] || []).includes(color)
  }

  async function toggleCompatible(color) {
    if (!selectedColor || color === selectedColor) return
    const current = combinations[selectedColor] || []
    const updated = current.includes(color)
      ? current.filter(c => c !== color)
      : [...current, color]
    const newCombinations = { ...combinations, [selectedColor]: updated }
    setCombinations(newCombinations)
    setSaving(true)
    await saveColorCombination(user.id, selectedColor, updated)
    setSaving(false)
  }

  const selectedCompatibles = combinations[selectedColor] || []

  return (
    <div style={{ padding: '16px', maxWidth: 600, margin: '0 auto' }}>
      <div style={{ fontFamily: 'Fraunces', fontSize: 22, fontWeight: 300, marginBottom: 4 }}>
        Référentiel couleurs
      </div>
      <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 24 }}>
        Choisis une couleur puis coche celles qui vont avec
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ width: 28, height: 28 }} />
        </div>
      ) : (
        <div>
          {/* Couleur sélectionnée */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              1. Sélectionne une couleur
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {COLORS.map(color => (
                <button key={color} onClick={() => setSelectedColor(color)} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px', borderRadius: 20, border: '2px solid',
                  borderColor: selectedColor === color ? 'var(--accent)' : 'var(--border2)',
                  background: selectedColor === color ? 'var(--accent-dim)' : 'var(--bg2)',
                  color: selectedColor === color ? 'var(--accent)' : 'var(--text2)',
                  fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: COLOR_SWATCHES[color], border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }} />
                  {color}
                  {(combinations[color] || []).length > 0 && (
                    <span style={{ fontSize: 10, color: 'var(--accent)', background: 'var(--accent-dim)', borderRadius: 10, padding: '1px 6px' }}>
                      {(combinations[color] || []).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Couleurs compatibles */}
          {selectedColor && (
            <div className="fade-in">
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                2. Coche les couleurs qui vont avec <span style={{ color: 'var(--accent)' }}>{selectedColor}</span>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
                {COLORS.filter(c => c !== selectedColor).map(color => (
                  <button key={color} onClick={() => toggleCompatible(color)} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 14px', borderRadius: 20, border: '2px solid',
                    borderColor: isCompatible(color) ? 'var(--green)' : 'var(--border2)',
                    background: isCompatible(color) ? 'rgba(110,231,183,0.1)' : 'var(--bg2)',
                    color: isCompatible(color) ? 'var(--green)' : 'var(--text2)',
                    fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: COLOR_SWATCHES[color], border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }} />
                    {color}
                    {isCompatible(color) && <span style={{ fontSize: 12 }}>✓</span>}
                  </button>
                ))}
              </div>

              {/* Résumé */}
              <div className="card" style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: COLOR_SWATCHES[selectedColor], border: '1px solid rgba(255,255,255,0.1)' }} />
                    {selectedColor}
                  </span>
                  {' '}va avec :
                </div>
                {selectedCompatibles.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--text3)' }}>Aucune couleur sélectionnée</div>
                ) : (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selectedCompatibles.map(c => (
                      <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, background: 'var(--bg3)', borderRadius: 10, padding: '3px 10px', color: 'var(--text2)' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLOR_SWATCHES[c] }} />
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {saving && (
                <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)', marginTop: 10 }}>
                  Sauvegarde...
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
