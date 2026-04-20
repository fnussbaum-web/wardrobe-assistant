import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { signOut } from '../lib/supabase'
import { useState } from 'react'

const NAV = [
  { to: '/today', label: "Aujourd'hui", icon: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'var(--text3)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )},
  { to: '/wardrobe', label: 'Garde-robe', icon: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'var(--text3)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/>
    </svg>
  )},
  { to: '/outfits', label: 'Tenues', icon: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'var(--text3)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c-1.5 0-3 .5-4 1.5L3 8l3 2 1-1v9a1 1 0 001 1h8a1 1 0 001-1V9l1 1 3-2-5-3.5C15 3.5 13.5 3 12 3z"/>
    </svg>
  )},
  { to: '/journal', label: 'Journal', icon: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'var(--text3)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
      <line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/>
    </svg>
  )},
  { to: '/more', label: 'Plus', icon: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'var(--text3)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="1.5" fill={active ? 'var(--accent)' : 'var(--text3)'}/>
      <circle cx="12" cy="12" r="1.5" fill={active ? 'var(--accent)' : 'var(--text3)'}/>
      <circle cx="12" cy="19" r="1.5" fill={active ? 'var(--accent)' : 'var(--text3)'}/>
    </svg>
  )},
]

const MORE_ITEMS = [
  { to: '/wishlist', label: 'Wishlist', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  )},
  { to: '/colors', label: 'Référentiel couleurs', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="22"/>
      <line x1="2" y1="12" x2="8" y2="12"/><line x1="16" y1="12" x2="22" y2="12"/>
    </svg>
  )},
]

export default function Layout({ children }) {
  const { profile } = useAuth()
  const [showMore, setShowMore] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <header style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 100, flexShrink: 0 }}>
        <div>
          <div style={{ fontFamily: 'Fraunces', fontSize: 20, fontWeight: 300, letterSpacing: '-0.3px' }}>Ma Garde-robe</div>
          {profile?.city && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>📍 {profile.city}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
            {profile?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <button onClick={() => signOut()} className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}>Déco</button>
        </div>
      </header>

      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>{children}</main>

      {/* More menu */}
      {showMore && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150 }} onClick={() => setShowMore(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            position: 'absolute', bottom: 80, right: 16,
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 16, overflow: 'hidden', minWidth: 200,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            {MORE_ITEMS.map(({ to, label, icon }) => (
              <NavLink key={to} to={to} onClick={() => setShowMore(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', color: 'var(--text)', borderBottom: '1px solid var(--border)', textDecoration: 'none' }}>
                <span style={{ color: 'var(--text2)' }}>{icon}</span>
                <span style={{ fontSize: 14 }}>{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}

      <nav style={{ display: 'flex', borderTop: '1px solid var(--border)', background: 'var(--bg)', paddingBottom: 'env(safe-area-inset-bottom)', flexShrink: 0, position: 'relative', zIndex: 100 }}>
        {NAV.map(({ to, icon, label }) => {
          if (to === '/more') return (
            <button key="more" onClick={() => setShowMore(v => !v)} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 4px 8px' }}>
                {icon(showMore)}
                <span style={{ fontSize: 9, marginTop: 4, fontWeight: 500, letterSpacing: '0.03em', color: showMore ? 'var(--accent)' : 'var(--text3)' }}>Plus</span>
                {showMore && <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', marginTop: 3 }} />}
              </div>
            </button>
          )
          return (
            <NavLink key={to} to={to} style={{ flex: 1 }}>
              {({ isActive }) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 4px 8px', transition: 'color 0.15s' }}>
                  {icon(isActive)}
                  <span style={{ fontSize: 9, marginTop: 4, fontWeight: 500, letterSpacing: '0.03em', color: isActive ? 'var(--accent)' : 'var(--text3)' }}>{label}</span>
                  {isActive && <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', marginTop: 3 }} />}
                </div>
              )}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
