import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import useAuthStore from '../../../store/authStore'
import API from '../../../api/axios'
import './Dashboard.css'

const navItems = [
  {
    label: 'Overview',
    to: '/super-admin/dashboard',
    icon: <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  },
  {
    label: 'Schools',
    to: '/super-admin/schools',
    icon: <svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
  },
  {
    label: 'Users',
    to: '/super-admin/users',
    icon: <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  },
  {
    label: 'Settings',
    to: '/super-admin/settings',
    icon: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  },
]

const SuperAdminLayout = () => {
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await API.post('/auth/logout')
    } catch {}
    clearAuth()
    navigate('/')
  }

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'SA'

  return (
    <div className="dash-layout">

      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`dash-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="dash-sidebar-logo" onClick={() => navigate('/')}>
          SIWES<span>log</span>
        </div>

        <div className="dash-sidebar-section">
          <div className="dash-sidebar-section-label">Main Menu</div>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/super-admin/dashboard'}
              className={({ isActive }) => `dash-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="dash-sidebar-bottom">
          <button className="dash-logout-btn" onClick={handleLogout}>
            <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="dash-main">
        {/* Topbar */}
        <header className="dash-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="dash-menu-toggle" onClick={() => setSidebarOpen(o => !o)}>
              <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div className="dash-topbar-title">Super Admin</div>
          </div>
          <div className="dash-topbar-user">
            <div>
              <div className="dash-user-name">{user?.firstName} {user?.lastName}</div>
              <div className="dash-user-role">Super Admin</div>
            </div>
            <button
              className="dash-user-avatar-btn"
              onClick={() => navigate('/super-admin/settings')}
              title="Go to Settings"
              aria-label="Open settings"
            >
              {user?.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt="Profile"
                  className="dash-user-avatar-img"
                />
              ) : (
                <div className="dash-user-avatar">{initials}</div>
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="dash-body">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default SuperAdminLayout

