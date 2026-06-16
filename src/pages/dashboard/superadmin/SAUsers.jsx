import { useEffect, useState, useCallback } from 'react'
import API from '../../../api/axios'
import { useDialog } from '../../../components/dialogContext'

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const SAUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const { showAlert } = useDialog()

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (roleFilter) params.append('role', roleFilter)
      if (search) params.append('search', search)
      const res = await API.get(`/super-admin/users?${params.toString()}`)
      setUsers(res.data.users)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [roleFilter, search])

  useEffect(() => {
    const loadUsers = async () => {
      await fetchUsers()
    }
    loadUsers()
  }, [fetchUsers])

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput.trim()) }
  const handleClearSearch = () => { setSearchInput(''); setSearch('') }

  const handleToggleStatus = async (userId) => {
    setActionLoading(userId)
    try {
      const res = await API.patch(`/super-admin/users/${userId}/toggle-status`)
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: res.data.isActive } : u))
    } catch (err) {
      await showAlert(err.response?.data?.message || 'Action failed', {
        title: 'Unable to update user',
        variant: 'danger'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const roleBadge = (role) => {
    const map = {
      student: <span className="badge badge-trial">Student</span>,
      school_supervisor: <span className="badge badge-active">Supervisor</span>,
      it_admin: <span className="badge" style={{ background: '#F3E8FF', color: '#6B21A8' }}>IT Admin</span>,
      super_admin: <span className="badge" style={{ background: '#FEF3C7', color: '#92400E' }}>Super Admin</span>,
      industry_supervisor: <span className="badge" style={{ background: '#E0F2FE', color: '#0369A1' }}>Industry Sup.</span>,
    }
    return map[role] || <span className="badge">{role}</span>
  }

  const avatarInitials = (u) =>
    `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`.toUpperCase() || '?'

  const userAvatar = (u, small = false) => (
    u.profilePhoto ? (
      <img
        src={u.profilePhoto}
        alt={`${u.firstName || 'User'} ${u.lastName || ''}`.trim()}
        className={`dt-user-avatar ${small ? 'sm' : ''}`}
      />
    ) : (
      <div className={`dt-user-avatar ${small ? 'sm' : ''}`}>{avatarInitials(u)}</div>
    )
  )

  return (
    <div>
      <div className="dash-page-header">
        <div className="dash-page-title">Users</div>
        <div className="dash-page-sub">All users across every school on SIWESlog</div>
      </div>

      <div className="dash-table-wrap">
        {/* ── Toolbar ── */}
        <div className="dash-table-header">
          <div className="dash-table-title">All Users</div>
          <div className="dash-table-actions">
            <form onSubmit={handleSearch} className="dash-search-form">
              <div className="dash-search-wrap">
                <span className="dash-search-icon"><SearchIcon /></span>
                <input
                  type="text"
                  className="dash-search-input"
                  placeholder="Search name or email…"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                />
                {search && (
                  <button type="button" className="dash-search-clear" onClick={handleClearSearch}>×</button>
                )}
              </div>
              <button type="submit" className="dash-action-btn view">Search</button>
            </form>
            <select className="dash-filter-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="">All Roles</option>
              <option value="student">Students</option>
              <option value="school_supervisor">School Supervisors</option>
              <option value="it_admin">IT Admins</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="dash-loading"><div className="dash-spinner" /></div>
        ) : users.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon">
              <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            </div>
            <p>{search ? `No users found matching "${search}"` : 'No users found'}</p>
          </div>
        ) : (
          <>
            {/* ── Desktop Table ── */}
            <div className="dt-scroll">
              <table className="dt-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>School</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id}>
                      <td>
                        <div className="dt-user-cell">
                          {userAvatar(user)}
                          <div>
                            <div className="dt-cell-primary">{user.firstName} {user.lastName}</div>
                            <div className="dt-cell-sub">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{roleBadge(user.role)}</td>
                      <td><span className="td-muted">{user.schoolId?.name || '—'}</span></td>
                      <td>
                        <span className={`badge ${user.isActive ? 'badge-approved' : 'badge-suspended'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td><span className="td-muted">{new Date(user.createdAt).toLocaleDateString('en-GB')}</span></td>
                      <td>
                        {user.role === 'it_admin' ? (
                          <button
                            className={`dash-action-btn ${user.isActive ? 'suspend' : 'approve'}`}
                            onClick={() => handleToggleStatus(user._id)}
                            disabled={actionLoading === user._id}
                          >
                            {actionLoading === user._id ? '…' : user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        ) : (
                          <span className="td-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile Card List ── */}
            <div className="dt-cards">
              {users.map(user => (
                <div key={user._id} className="dt-card">
                  <div className="dt-card-top">
                    <div className="dt-card-user-row">
                      {userAvatar(user, true)}
                      <div>
                        <div className="dt-card-name">{user.firstName} {user.lastName}</div>
                        <div className="dt-card-sub">{user.email}</div>
                      </div>
                    </div>
                    <div className="dt-card-badges">
                      {roleBadge(user.role)}
                      <span className={`badge ${user.isActive ? 'badge-approved' : 'badge-suspended'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="dt-card-meta">
                    <span>{user.schoolId?.name || 'No school'}</span>
                    <span>Joined {new Date(user.createdAt).toLocaleDateString('en-GB')}</span>
                  </div>
                  {user.role === 'it_admin' && (
                    <div className="dt-card-actions">
                      <button
                        className={`dash-action-btn ${user.isActive ? 'suspend' : 'approve'}`}
                        onClick={() => handleToggleStatus(user._id)}
                        disabled={actionLoading === user._id}
                      >
                        {actionLoading === user._id ? '…' : user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default SAUsers
