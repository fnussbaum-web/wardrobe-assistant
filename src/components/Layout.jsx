import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { signOut } from '../lib/supabase'

const NAV = [
  { to: '/today',    icon: '✨', label: "Aujourd'hui" },
  { to: '/wardrobe', icon: '👔', label: 'Garde-robe' },
  { to: '/outfits',  icon: '🎨', label: 'Tenues' },
  { to: '/history',  icon: '📅', label: 'Historique' },
  { to: '/stats',    icon: '📊', label: 'Stats' },
  { to: '/wishlist', icon: '🛍️', label: 'Wishlist' },
]

export default function Layout({ children }) {
  const { profile } = useAuth()
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
      <nav style={{ display: 'flex', borderTop: '1px solid var(--border)', background: 'var(--bg)', paddingBottom: 'env(safe-area-inset-bottom)', flexShrink: 0 }}>
        {NAV.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} style={{ flex: 1 }}>
            {({ isActive }) => (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 4px 8px', color: isActive ? 'var(--accent)' : 'var(--text3)', transition: 'color 0.15s' }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
                <span style={{ fontSize: 9, marginTop: 3, fontWeight: 500, letterSpacing: '0.03em' }}>{label}</span>
                {isActive && <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', marginTop: 3 }} />}
              </div>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
