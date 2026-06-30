import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../../../api/axios'
import { useDialog } from '../../../components/dialogContext'
import usePageTitle from '../../../hooks/usePageTitle'

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const SupervisorStudents = () => {
  usePageTitle('My Students')
  const navigate = useNavigate()
  const { showAlert } = useDialog()
  const [students, setStudents] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const fetchStudents = useCallback(async (isBackgroundRefresh = false) => {
    try {
      const res = await API.get('/supervisor/my-students')
      setStudents(res.data.students || [])
      setFiltered(res.data.students || [])
    } catch (err) {
      if (!isBackgroundRefresh) {
        await showAlert('Failed to load students.', { title: 'Error', variant: 'danger' })
      }
    } finally {
      if (!isBackgroundRefresh) setLoading(false)
    }
  }, [showAlert])

  useEffect(() => {
    fetchStudents()
    const interval = setInterval(() => fetchStudents(true), 30000)
    return () => clearInterval(interval)
  }, [fetchStudents])

  useEffect(() => {
    let result = [...students]

    // 1. Filter by attention status
    if (filter === 'attention') {
      result = result.filter(s => (s.logStats?.pendingMyReview || 0) > 0)
    } else if (filter === 'no_attention') {
      result = result.filter(s => (s.logStats?.pendingMyReview || 0) === 0)
    }

    // 2. Filter by search query
    const q = search.toLowerCase().trim()
    if (q) {
      result = result.filter(s =>
        `${s.userId?.firstName} ${s.userId?.lastName}`.toLowerCase().includes(q) ||
        (s.matricNumber || '').toLowerCase().includes(q) ||
        (s.department || '').toLowerCase().includes(q) ||
        (s.placement?.companyName || '').toLowerCase().includes(q)
      )
    }

    setFiltered(result)
  }, [search, filter, students])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput.trim())
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearch('')
  }

  const getProgressBadge = (logStats) => {
    if (!logStats || logStats.total === 0) return { label: 'No logs', cls: 'badge-trial' }
    if (logStats.pendingMyReview > 0) return { label: `${logStats.pendingMyReview} awaiting review`, cls: 'badge-pending' }
    return { label: `${logStats.schoolApproved} signed off`, cls: 'badge-approved' }
  }

  if (loading) return <div className="dash-loading"><div className="dash-spinner" /></div>

  return (
    <div>
      <div className="dash-page-header">
        <div className="dash-page-title">My Students</div>
        <div className="dash-page-sub">Students assigned to you for SIWES supervision</div>
      </div>

      <div className="dash-table-wrap">
        <div className="dash-table-header">
          <div className="dash-table-title">
            Assigned Students
            <span className="badge badge-trial" style={{ marginLeft: '10px' }}>{students.length}</span>
          </div>
          <div className="dash-table-actions">
            <form onSubmit={handleSearch} className="dash-search-form">
              <div className="dash-search-wrap">
                <span className="dash-search-icon"><SearchIcon /></span>
                <input
                  type="text"
                  className="dash-search-input"
                  placeholder="Search name, matric, company…"
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
              <option value="all">All Students</option>
              <option value="attention">Needs Attention</option>
              <option value="no_attention">No Attention Required</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
            </div>
            <p>
              {search || filter !== 'all'
                ? 'No students match your criteria.'
                : 'No students have been assigned to you yet.'}
            </p>
          </div>
        ) : (
          <>
            <div className="dt-scroll">
              <table className="dt-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Matric No.</th>
                    <th>Department</th>
                    <th>Company</th>
                    <th>Logbook</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const badge = getProgressBadge(s.logStats)
                    return (
                      <tr key={s._id}>
                        <td>
                          <div className="dt-cell-primary">
                            {s.userId?.firstName} {s.userId?.lastName}
                          </div>
                          <div className="dt-cell-sub">{s.userId?.email}</div>
                        </td>
                        <td><span className="td-muted">{s.matricNumber || '—'}</span></td>
                        <td><span className="td-muted">{s.department || '—'}</span></td>
                        <td><span className="td-muted">{s.placement?.companyName || '—'}</span></td>
                        <td><span className={`badge ${badge.cls}`}>{badge.label}</span></td>
                        <td>
                          <button
                            className="dash-action-btn view"
                            onClick={() => navigate(`/supervisor/students/${s.userId?._id}`)}
                          >
                            View Logbook
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="dt-cards">
              {filtered.map(s => {
                const badge = getProgressBadge(s.logStats)
                return (
                  <div key={s._id} className="dt-card">
                    <div className="dt-card-top">
                      <div>
                        <div className="dt-card-name">{s.userId?.firstName} {s.userId?.lastName}</div>
                        <div className="dt-card-sub">{s.matricNumber || '—'} · {s.department || '—'}</div>
                      </div>
                      <span className={`badge ${badge.cls}`}>{badge.label}</span>
                    </div>
                    <div className="dt-card-meta">
                      <span>{s.placement?.companyName || 'No placement set'}</span>
                      <span>{s.userId?.email}</span>
                    </div>
                    <div className="dt-card-actions">
                      <button
                        className="dash-action-btn view"
                        onClick={() => navigate(`/supervisor/students/${s.userId?._id}`)}
                      >
                        View Logbook
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default SupervisorStudents
