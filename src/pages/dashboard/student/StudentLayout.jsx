import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../../store/authStore'
import API from '../../../api/axios'
import '../superadmin/Dashboard.css'
import NotificationBell from '../../../components/NotificationBell'

const navItems = [
  {
    label: 'Overview',
    to: '/student/dashboard',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  },
  {
    label: 'My Placement',
    to: '/student/placement',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
  },
  {
    label: 'My Logbook',
    to: '/student/logbook',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  },
  {
    label: 'Settings',
    to: '/student/settings',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  },
]

// Pages a student MUST be able to reach even before placement setup is done.
// Everything else gets redirected to /student/placement until it's complete.
const ALWAYS_ALLOWED_PATHS = ['/student/placement', '/student/settings']

const StudentLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, clearAuth } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [checkingPlacement, setCheckingPlacement] = useState(true)
  const [placementComplete, setPlacementComplete] = useState(true) // optimistic default to avoid flicker

  useEffect(() => {
    const checkPlacement = async () => {
      try {
        const res = await API.get('/placement/my-placement')
        setPlacementComplete(!!res.data.isPlacementComplete)
      } catch (err) {
        // If the check fails for any reason, don't lock the student out —
        // fail open rather than blocking the whole dashboard on a network blip
        setPlacementComplete(true)
      } finally {
        setCheckingPlacement(false)
      }
    }
    checkPlacement()
  }, [])

  useEffect(() => {
    if (checkingPlacement) return
    if (!placementComplete && !ALWAYS_ALLOWED_PATHS.includes(location.pathname)) {
      navigate('/student/placement', { replace: true })
    }
  }, [checkingPlacement, placementComplete, location.pathname, navigate])

  const handleLogout = async () => {
    try { await API.post('/auth/logout') } catch {}
    clearAuth()
    navigate('/')
  }

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'ST'

  if (checkingPlacement) {
    return <div className="dash-loading"><div className="dash-spinner" /></div>
  }

  return (
    <div className="dash-layout">
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`dash-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="dash-sidebar-logo" onClick={() => navigate('/')}>
          SIWES<span>log</span>
        </div>
        <div className="dash-sidebar-section">
          <div className="dash-sidebar-section-label">Main Menu</div>
          {navItems.map(item => {
            const isLocked = !placementComplete && !ALWAYS_ALLOWED_PATHS.includes(item.to)
            return (
              <NavLink
                key={item.to}
                to={isLocked ? '/student/placement' : item.to}
                end={item.to === '/student/dashboard'}
                className={({ isActive }) => `dash-nav-link ${isActive ? 'active' : ''} ${isLocked ? 'disabled' : ''}`}
                onClick={() => setSidebarOpen(false)}
                title={isLocked ? 'Complete your placement profile first' : undefined}
              >
                {item.icon}
                {item.label}
                {isLocked && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '13px', height: '13px', marginLeft: 'auto', opacity: 0.5 }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                )}
              </NavLink>
            )
          })}
        </div>
        <div className="dash-sidebar-bottom">
          <button className="dash-logout-btn" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>
      </aside>

      <div className="dash-main">
        <header className="dash-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="dash-menu-toggle" onClick={() => setSidebarOpen(o => !o)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div className="dash-topbar-title">{user?.schoolId?.name || 'My Dashboard'}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <NotificationBell basePath="/student" />
              
            <div className="dash-topbar-user">
              <div>
                <div className="dash-user-name">{user?.firstName} {user?.lastName}</div>
                <div className="dash-user-role">Student</div>
              </div>
              <button className="dash-user-avatar-btn" onClick={() => navigate('/student/settings')} title="Go to Settings">
                {user?.profilePhoto ? (
                  <img src={user.profilePhoto} alt="Profile" className="dash-user-avatar-img" />
                ) : (
                  <div className="dash-user-avatar">{initials}</div>
                )}
              </button>
            </div>
          </div>
        </header>
        <div className="dash-body">
          {!placementComplete && (
            <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '10px', padding: '14px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span style={{ fontSize: '13.5px', color: '#92400E', fontWeight: 500 }}>
                Complete your company placement profile to unlock your logbook and dashboard.
              </span>
            </div>
          )}
          <Outlet context={{ placementComplete, setPlacementComplete }} />
        </div>
      </div>
    </div>
  )
}

export default StudentLayout
