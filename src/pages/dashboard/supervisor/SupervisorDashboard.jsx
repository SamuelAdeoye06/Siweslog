import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../../../api/axios'
import useAuthStore from '../../../store/authStore'
import { useDialog } from '../../../components/dialogContext'

const SupervisorDashboard = () => {
  const navigate = useNavigate()
  const { user, updateUser } = useAuthStore()
  const { showAlert } = useDialog()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async (isBackgroundRefresh = false) => {
      try {
        const [studentsRes, profileRes] = await Promise.all([
          API.get('/supervisor/my-students'),
          API.get('/settings/me')
        ])
        updateUser(profileRes.data.user)
        setStudents(studentsRes.data.students || [])
      } catch (err) {
        console.error(err)
        if (!isBackgroundRefresh) {
          await showAlert('Failed to load dashboard data.', { title: 'Error', variant: 'danger' })
        }
      } finally {
        if (!isBackgroundRefresh) setLoading(false)
      }
    }

    fetchData()
    // Quietly refresh — e.g. a newly assigned student or a freshly
    // industry-approved week should appear without a manual reload.
    const interval = setInterval(() => fetchData(true), 30000)
    return () => clearInterval(interval)
  }, [updateUser, showAlert])

  if (loading) return <div className="dash-loading"><div className="dash-spinner" /></div>

  const totalStudents = students.length
  const pendingReview = students.reduce((acc, s) => acc + (s.logStats?.pendingMyReview || 0), 0)
  const totalSignedOff = students.reduce((acc, s) => acc + (s.logStats?.schoolApproved || 0), 0)
  const totalLogs = students.reduce((acc, s) => acc + (s.logStats?.total || 0), 0)

  const studentsWithPending = students.filter(s => s.logStats?.pendingMyReview > 0)

  return (
    <div>
      <div className="dash-page-header">
        <div className="dash-page-title">Overview</div>
        <div className="dash-page-sub">
          {user?.schoolId?.name || 'Your school'} — supervisor dashboard
        </div>
      </div>

      <div className="dash-stats-grid">
        {[
          { label: 'Assigned Students', value: totalStudents, badge: 'total', badgeText: 'Total' },
          { label: 'Pending My Review', value: pendingReview, badge: pendingReview > 0 ? 'pending' : 'approved', badgeText: pendingReview > 0 ? 'Needs attention' : 'All clear' },
          { label: 'Logs Signed Off', value: totalSignedOff, badge: 'approved', badgeText: 'School approved' },
          { label: 'Total Log Entries', value: totalLogs, badge: 'total', badgeText: 'Across all students' },
        ].map((s, i) => (
          <div key={i} className="dash-stat-card">
            <div className="dash-stat-label">{s.label}</div>
            <div className="dash-stat-value">{s.value}</div>
            <span className={`dash-stat-badge ${s.badge}`}>{s.badgeText}</span>
          </div>
        ))}
      </div>

      <div className="dash-table-wrap">
        <div className="dash-table-header">
          <div className="dash-table-title">
            Logs Awaiting Your Review
            {studentsWithPending.length > 0 && (
              <span className="badge badge-pending" style={{ marginLeft: '10px' }}>
                {pendingReview}
              </span>
            )}
          </div>
          <button className="dash-action-btn view" onClick={() => navigate('/supervisor/students')}>
            View All Students
          </button>
        </div>

        {studentsWithPending.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <p>No logs awaiting your review</p>
          </div>
        ) : (
          <>
            <div className="dt-scroll">
              <table className="dt-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Department</th>
                    <th>Company</th>
                    <th>Pending Review</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsWithPending.map(s => (
                    <tr key={s._id}>
                      <td>
                        <div className="dt-cell-primary">
                          {s.userId?.firstName} {s.userId?.lastName}
                        </div>
                        <div className="dt-cell-sub">{s.matricNumber}</div>
                      </td>
                      <td><span className="td-muted">{s.department || '—'}</span></td>
                      <td><span className="td-muted">{s.placement?.companyName || '—'}</span></td>
                      <td>
                        <span className="badge badge-pending">
                          {s.logStats.pendingMyReview} {s.logStats.pendingMyReview === 1 ? 'log' : 'logs'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="dash-action-btn view"
                          onClick={() => navigate(`/supervisor/students/${s.userId?._id}`)}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="dt-cards">
              {studentsWithPending.map(s => (
                <div key={s._id} className="dt-card">
                  <div className="dt-card-top">
                    <div>
                      <div className="dt-card-name">{s.userId?.firstName} {s.userId?.lastName}</div>
                      <div className="dt-card-sub">{s.matricNumber} · {s.department || '—'}</div>
                    </div>
                    <span className="badge badge-pending">
                      {s.logStats.pendingMyReview} pending
                    </span>
                  </div>
                  <div className="dt-card-meta">
                    <span>{s.placement?.companyName || 'No placement'}</span>
                  </div>
                  <div className="dt-card-actions">
                    <button
                      className="dash-action-btn view"
                      onClick={() => navigate(`/supervisor/students/${s.userId?._id}`)}
                    >
                      Review Logbook
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

export default SupervisorDashboard
