import { useEffect, useState, useCallback } from 'react'
import API from '../../../api/axios'
import { useDialog } from '../../../components/dialogContext'

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const AdminSupervisors = () => {
  const [supervisors, setSupervisors] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const { showAlert } = useDialog()

  const fetchSupervisors = useCallback(async () => {
    setLoading(true)
    try {
      const endpoint = filter === 'pending'
        ? '/users/pending-supervisors'
        : '/users?role=school_supervisor'
      const res = await API.get(endpoint)
      let data = filter === 'pending' ? res.data.supervisors : res.data.users
      if (search) {
        const q = search.toLowerCase()
        data = data.filter(u =>
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
        )
      }
      setSupervisors(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filter, search])

  useEffect(() => {
    const loadSupervisors = async () => {
      await fetchSupervisors()
    }
    loadSupervisors()
  }, [fetchSupervisors])

  const handleApprove = async (id, action) => {
    setActionLoading(id)
    try {
      await API.patch(`/users/${id}/approve`, { action })
      setSupervisors(prev => prev.filter(s => s._id !== id))
    } catch (err) {
      await showAlert(err.response?.data?.message || 'Action failed', {
        title: 'Unable to review supervisor',
        variant: 'danger'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleStatus = async (id) => {
    setActionLoading(id)
    try {
      const res = await API.patch(`/users/${id}/toggle-status`)
      setSupervisors(prev => prev.map(s =>
        s._id === id ? { ...s, isActive: res.data.isActive } : s
      ))
    } catch (err) {
      await showAlert(err.response?.data?.message || 'Action failed', {
        title: 'Unable to update supervisor',
        variant: 'danger'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const statusBadge = (sup) => {
    if (sup.approvalStatus === 'pending') return <span className="badge badge-pending">Pending</span>
    if (sup.approvalStatus === 'rejected') return <span className="badge badge-suspended">Rejected</span>
    if (!sup.isActive) return <span className="badge badge-suspended">Inactive</span>
    return <span className="badge badge-approved">Active</span>
  }

  const avatarInitials = (sup) =>
    `${sup.firstName?.[0] || ''}${sup.lastName?.[0] || ''}`.toUpperCase() || '?'

  const userAvatar = (sup, small = false) => (
    sup.profilePhoto ? (
      <img
        src={sup.profilePhoto}
        alt={`${sup.firstName || 'Supervisor'} ${sup.lastName || ''}`.trim()}
        className={`dt-user-avatar ${small ? 'sm' : ''}`}
      />
    ) : (
      <div className={`dt-user-avatar ${small ? 'sm' : ''}`}>{avatarInitials(sup)}</div>
    )
  )

  return (
    <div>
      <div className="dash-page-header">
        <div className="dash-page-title">School Supervisors</div>
        <div className="dash-page-sub">Manage supervisor accounts and approvals</div>
      </div>

      <div className="dash-table-wrap">
        <div className="dash-table-header">
          <div className="dash-table-title">All Supervisors</div>
          <div className="dash-table-actions">
            <form onSubmit={e => { e.preventDefault(); setSearch(searchInput.trim()) }} className="dash-search-form">
              <div className="dash-search-wrap">
                <span className="dash-search-icon"><SearchIcon /></span>
                <input
                  className="dash-search-input"
                  placeholder="Search by name or email..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                />
                {search && (
                  <button type="button" className="dash-search-clear" onClick={() => { setSearchInput(''); setSearch('') }}>×</button>
                )}
              </div>
              <button type="submit" className="dash-action-btn view">Search</button>
            </form>
            <select className="dash-filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">All Supervisors</option>
              <option value="pending">Pending Only</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="dash-loading"><div className="dash-spinner" /></div>
        ) : supervisors.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            </div>
            <p>{search ? `No supervisors found matching "${search}"` : filter === 'pending' ? 'No pending supervisor approvals' : 'No supervisors registered yet'}</p>
          </div>
        ) : (
          <>
            <div className="dt-scroll">
              <table className="dt-table">
                <thead>
                  <tr>
                    <th>Supervisor</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {supervisors.map(sup => (
                    <tr key={sup._id}>
                      <td>
                        <div className="dt-user-cell">
                          {userAvatar(sup)}
                          <div>
                            <div className="dt-cell-primary">{sup.firstName} {sup.lastName}</div>
                            <div className="dt-cell-sub">{sup.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="td-muted">{sup.phone || '—'}</span></td>
                      <td>{statusBadge(sup)}</td>
                      <td><span className="td-muted">{new Date(sup.createdAt).toLocaleDateString('en-GB')}</span></td>
                      <td>
                        <div className="dt-actions">
                          {sup.approvalStatus === 'pending' && (
                            <>
                              <button
                                className="dash-action-btn approve"
                                onClick={() => handleApprove(sup._id, 'approve')}
                                disabled={actionLoading === sup._id}
                              >
                                {actionLoading === sup._id ? '...' : 'Approve'}
                              </button>
                              <button
                                className="dash-action-btn suspend"
                                onClick={() => handleApprove(sup._id, 'reject')}
                                disabled={actionLoading === sup._id}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {sup.approvalStatus === 'approved' && (
                            <button
                              className={`dash-action-btn ${sup.isActive ? 'suspend' : 'approve'}`}
                              onClick={() => handleToggleStatus(sup._id)}
                              disabled={actionLoading === sup._id}
                            >
                              {actionLoading === sup._id ? '...' : sup.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="dt-cards">
              {supervisors.map(sup => (
                <div key={sup._id} className="dt-card">
                  <div className="dt-card-top">
                    <div className="dt-card-user-row">
                      {userAvatar(sup, true)}
                      <div>
                        <div className="dt-card-name">{sup.firstName} {sup.lastName}</div>
                        <div className="dt-card-sub">{sup.email}</div>
                      </div>
                    </div>
                    {statusBadge(sup)}
                  </div>
                  <div className="dt-card-meta">
                    <span>{sup.phone || 'No phone'}</span>
                    <span>Joined {new Date(sup.createdAt).toLocaleDateString('en-GB')}</span>
                  </div>
                  <div className="dt-card-actions">
                    {sup.approvalStatus === 'pending' && (
                      <>
                        <button
                          className="dash-action-btn approve"
                          onClick={() => handleApprove(sup._id, 'approve')}
                          disabled={actionLoading === sup._id}
                        >
                          {actionLoading === sup._id ? '...' : 'Approve'}
                        </button>
                        <button
                          className="dash-action-btn suspend"
                          onClick={() => handleApprove(sup._id, 'reject')}
                          disabled={actionLoading === sup._id}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {sup.approvalStatus === 'approved' && (
                      <button
                        className={`dash-action-btn ${sup.isActive ? 'suspend' : 'approve'}`}
                        onClick={() => handleToggleStatus(sup._id)}
                        disabled={actionLoading === sup._id}
                      >
                        {actionLoading === sup._id ? '...' : sup.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AdminSupervisors
