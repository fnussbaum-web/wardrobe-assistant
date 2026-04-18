import { useState } from 'react'
import { signIn, signUp } from '../lib/supabase'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', fullName: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit() {
    setError(''); setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await signIn(form.email, form.password)
        if (error) throw error
      } else {
        if (!form.fullName.trim()) throw new Error('Prenom requis')
        const { error } = await signUp(form.email, form.password, form.fullName)
        if (error) throw error
        setSuccess('Verifie ta boite mail pour confirmer ton compte !')
      }
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>👔</div>
        <div style={{ fontFamily: 'Fraunces', fontSize: 28, fontWeight: 300, letterSpacing: '-0.5px' }}>Ma Garde-robe</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 6 }}>Ton assistant styliste personnel</div>
      </div>
      <div className="card" style={{ width: '100%', maxWidth: 380, padding: '28px 24px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['login', 'signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }} style={{ flex: 1, padding: '9px', borderRadius: 10, border: 'none', background: mode === m ? 'var(--accent)' : 'var(--bg3)', color: mode === m ? '#0C0C0F' : 'var(--text3)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
              {m === 'login' ? 'Connexion' : 'Inscription'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'signup' && <input placeholder="Prenom" value={form.fullName} onChange={e => set('fullName', e.target.value)} />}
          <input type="email" placeholder="Email" value={form.email} onChange={e => set('email', e.target.value)} />
          <input type="password" placeholder="Mot de passe" value={form.password} onChange={e => set('password', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>
        {error && <div style={{ marginTop: 12, fontSize: 13, color: 'var(--red)', background: 'rgba(248,113,113,0.08)', borderRadius: 8, padding: '8px 12px' }}>{error}</div>}
        {success && <div style={{ marginTop: 12, fontSize: 13, color: 'var(--green)', background: 'rgba(110,231,183,0.08)', borderRadius: 8, padding: '8px 12px' }}>{success}</div>}
        <button onClick={handleSubmit} disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: 20, padding: '13px' }}>
          {loading ? <span className="spinner" /> : mode === 'login' ? 'Se connecter' : 'Creer mon compte'}
        </button>
      </div>
    </div>
  )
}
