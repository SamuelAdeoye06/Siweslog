import { useEffect, useState, useCallback } from 'react'
import API from '../../../api/axios'
import { useDialog } from '../../../components/dialogContext'

// ── Inline SVG Icons ──
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const SASchools = () => {
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const { showAlert, showConfirm } = useDialog()

  const fetchSchools = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter) params.append('status', filter)
      if (search) params.append('search', search)
      const res = await API.get(`/super-admin/schools?${params.toString()}`)
      setSchools(res.data.schools)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filter, search])

  useEffect(() => {
    const loadSchools = async () => {
      await fetchSchools()
    }
    loadSchools()
  }, [fetchSchools])

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput.trim()) }
  const handleClearSearch = () => { setSearchInput(''); setSearch('') }

  const handleAction = async (id, action) => {
    setActionLoading(id)
    try {
      await API.patch(`/super-admin/schools/${id}/approve`, {
        action,
        subscriptionPlan: action === 'approve' ? 'trial' : undefined
      })
      fetchSchools()
    } catch (err) {
      await showAlert(err.response?.data?.message || 'Action failed', {
        title: 'Action Failed',
        variant: 'danger'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id, name) => {
    const confirmed = await showConfirm(
      `Permanently delete "${name}"? This removes all students, supervisors and data. This cannot be undone.`,
      {
        title: 'Delete School',
        confirmText: 'Delete School',
        variant: 'danger'
      }
    )
    if (!confirmed) return
    setActionLoading(id)
    try {
      await API.delete(`/super-admin/schools/${id}`)
      setSchools(prev => prev.filter(s => s._id !== id))
    } catch (err) {
      await showAlert(err.response?.data?.message || 'Delete failed', {
        title: 'Delete Failed',
        variant: 'danger'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const statusBadge = (status) => {
    const map = {
      pending_approval: <span className="badge badge-pending">Pending</span>,
      approved: <span className="badge badge-approved">Approved</span>,
      suspended: <span className="badge badge-suspended">Suspended</span>,
    }
    return map[status] || <span className="badge">{status}</span>
  }

  const planBadge = (plan) => {
    const map = {
      trial: <span className="badge badge-trial">Trial</span>,
      basic: <span className="badge badge-active">Basic</span>,
      pro: <span className="badge badge-active">Pro</span>,
      enterprise: <span className="badge badge-active">Enterprise</span>,
    }
    return map[plan] || <span className="badge">{plan}</span>
  }

  return (
    <div>
      <div className="dash-page-header">
        <div className="dash-page-title">Schools</div>
        <div className="dash-page-sub">Manage all registered institutions on SIWESlog</div>
      </div>

      <div className="dash-table-wrap">
        {/* ── Toolbar ── */}
        <div className="dash-table-header">
          <div className="dash-table-title">All Schools</div>
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
            <select className="dash-filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="pending_approval">Pending</option>
              <option value="approved">Approved</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="dash-loading"><div className="dash-spinner" /></div>
        ) : schools.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon">
              <svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            </div>
            <p>{search ? `No schools found matching "${search}"` : 'No schools found'}</p>
          </div>
        ) : (
          <>
            {/* ── Desktop Table ── */}
            <div className="dt-scroll">
              <table className="dt-table">
                <thead>
                  <tr>
                    <th>School</th>
                    <th>Contact Email</th>
                    <th>Status</th>
                    <th>Plan</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schools.map(school => (
                    <tr key={school._id}>
                      <td>
                        <div className="dt-cell-primary">{school.name}</div>
                        {school.address && <div className="dt-cell-sub">{school.address}</div>}
                        <div className="dt-cell-sub">{school.slug}</div>
                      </td>
                      <td><span className="td-muted">{school.contactEmail}</span></td>
                      <td>{statusBadge(school.approvalStatus)}</td>
                      <td>{planBadge(school.subscriptionPlan)}</td>
                      <td><span className="td-muted">{new Date(school.createdAt).toLocaleDateString('en-GB')}</span></td>
                      <td>
                        <div className="dt-actions">
                          {school.approvalStatus !== 'approved' && (
                            <button
                              className="dash-action-btn approve"
                              onClick={() => handleAction(school._id, 'approve')}
                              disabled={actionLoading === school._id}
                            >
                              {actionLoading === school._id ? '…' : 'Approve'}
                            </button>
                          )}
                          {school.approvalStatus === 'approved' && (
                            <button
                              className="dash-action-btn suspend"
                              onClick={() => handleAction(school._id, 'suspend')}
                              disabled={actionLoading === school._id}
                            >
                              {actionLoading === school._id ? '…' : 'Suspend'}
                            </button>
                          )}
                          <button
                            className="dash-action-btn danger icon-btn"
                            onClick={() => handleDelete(school._id, school.name)}
                            disabled={actionLoading === school._id}
                            title="Delete school"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile Card List ── */}
            <div className="dt-cards">
              {schools.map(school => (
                <div key={school._id} className="dt-card">
                  <div className="dt-card-top">
                    <div>
                      <div className="dt-card-name">{school.name}</div>
                      <div className="dt-card-sub">{school.contactEmail}</div>
                    </div>
                    <div className="dt-card-badges">
                      {statusBadge(school.approvalStatus)}
                      {planBadge(school.subscriptionPlan)}
                    </div>
                  </div>
                  <div className="dt-card-meta">
                    <span>{school.slug}</span>
                    <span>Registered {new Date(school.createdAt).toLocaleDateString('en-GB')}</span>
                  </div>
                  <div className="dt-card-actions">
                    {school.approvalStatus !== 'approved' && (
                      <button
                        className="dash-action-btn approve"
                        onClick={() => handleAction(school._id, 'approve')}
                        disabled={actionLoading === school._id}
                      >
                        {actionLoading === school._id ? '…' : 'Approve'}
                      </button>
                    )}
                    {school.approvalStatus === 'approved' && (
                      <button
                        className="dash-action-btn suspend"
                        onClick={() => handleAction(school._id, 'suspend')}
                        disabled={actionLoading === school._id}
                      >
                        {actionLoading === school._id ? '…' : 'Suspend'}
                      </button>
                    )}
                    <button
                      className="dash-action-btn danger"
                      onClick={() => handleDelete(school._id, school.name)}
                      disabled={actionLoading === school._id}
                    >
                      <TrashIcon /> Delete
                    </button>
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

export default SASchools
