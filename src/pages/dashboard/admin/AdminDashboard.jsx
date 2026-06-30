import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../../../api/axios'
import useAuthStore from '../../../store/authStore'
import { useDialog } from '../../../components/dialogContext'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const { user, updateUser } = useAuthStore()
  const { showAlert } = useDialog()
  const [stats, setStats] = useState(null)
  const [schoolData, setSchoolData] = useState(user?.schoolId || null)
  const [pendingSupervisors, setPendingSupervisors] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    const fetchData = async (isBackgroundRefresh = false) => {
      try {
        const [studentsRes, supervisorsRes, pendingRes, profileRes] = await Promise.all([
          API.get('/users?role=student'),
          API.get('/users?role=school_supervisor'),
          API.get('/users/pending-supervisors'),
          API.get('/settings/me')
        ])
        const freshUser = profileRes.data.user
        setSchoolData(freshUser?.schoolId || null)
        updateUser(freshUser)

        const studentsWithoutSupervisor = studentsRes.data.users.filter(
          s => !s.schoolSupervisor
        ).length

        setStats({
          totalStudents: studentsRes.data.count,
          totalSupervisors: supervisorsRes.data.users.filter(s => s.approvalStatus === 'approved').length,
          pendingSupervisors: pendingRes.data.count,
          studentsWithoutSupervisor,
        })
        setPendingSupervisors(pendingRes.data.supervisors)
      } catch (err) {
        console.error(err)
      } finally {
        if (!isBackgroundRefresh) setLoading(false)
      }
    }

    fetchData()
    // Quietly refresh in the background so numbers stay current without
    // requiring a manual reload — e.g. a student registering elsewhere.
    const interval = setInterval(() => fetchData(true), 30000)
    return () => clearInterval(interval)
  }, [updateUser])

  const handleApprove = async (id, action) => {
    setActionLoading(id)
    try {
      await API.patch(`/users/${id}/approve`, { action })
      setPendingSupervisors(prev => prev.filter(s => s._id !== id))
      setStats(prev => ({ ...prev, pendingSupervisors: prev.pendingSupervisors - 1 }))
    } catch (err) {
      await showAlert(err.response?.data?.message || 'Action failed', {
        title: 'Unable to complete action',
        variant: 'danger'
      })
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) return <div className="dash-loading"><div className="dash-spinner" /></div>

  const registrationCode = schoolData?.registrationCode || user?.schoolId?.registrationCode || '—'

  return (
    <div>
      <div className="dash-page-header">
        <div className="dash-page-title">Overview</div>
        <div className="dash-page-sub">
          {user?.schoolId?.name || 'Your school'} — SIWES management dashboard
        </div>
      </div>

      {/* Stats */}
      <div className="dash-stats-grid">
        {[
          { label: 'Total Students', value: stats?.totalStudents ?? 0, badge: 'total', badgeText: 'Registered' },
          {
            label: 'Needs Supervisor',
            value: stats?.studentsWithoutSupervisor ?? 0,
            badge: stats?.studentsWithoutSupervisor > 0 ? 'pending' : 'active',
            badgeText: 'Unassigned students',
            onClick: () => navigate('/admin/students?filter=unassigned')
          },
          { label: 'Active Supervisors', value: stats?.totalSupervisors ?? 0, badge: 'active', badgeText: 'Approved' },
          { label: 'Pending Approvals', value: stats?.pendingSupervisors ?? 0, badge: 'pending', badgeText: 'Needs review' },
          {
            label: 'Registration Code',
            value: <span className="dash-code-value">{registrationCode}</span>,
            badge: 'total',
            badgeText: 'Share with students'
          },
        ].map((s, i) => (
          <div
            key={i}
            className="dash-stat-card"
            onClick={s.onClick}
            style={s.onClick ? { cursor: 'pointer' } : undefined}
          >
            <div className="dash-stat-label">{s.label}</div>
            <div className="dash-stat-value">{s.value}</div>
            <span className={`dash-stat-badge ${s.badge}`}>{s.badgeText}</span>
          </div>
        ))}
      </div>

      {/* Pending supervisors */}
      <div className="dash-table-wrap">
        <div className="dash-table-header">
          <div className="dash-table-title">
            Pending Supervisor Approvals
            {pendingSupervisors.length > 0 && (
              <span className="badge badge-pending" style={{ marginLeft: '10px' }}>
                {pendingSupervisors.length}
              </span>
            )}
          </div>
          <button className="dash-action-btn view" onClick={() => navigate('/admin/supervisors')}>
            View All Supervisors
          </button>
        </div>

        {pendingSupervisors.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <p>No pending supervisor approvals</p>
          </div>
        ) : (
          <>
            <div className="dt-scroll">
              <table className="dt-table">
                <thead>
                  <tr>
                    <th>Supervisor</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Registered</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingSupervisors.map(sup => (
                    <tr key={sup._id}>
                      <td><div className="dt-cell-primary">{sup.firstName} {sup.lastName}</div></td>
                      <td><span className="td-muted">{sup.email}</span></td>
                      <td><span className="td-muted">{sup.phone || '—'}</span></td>
                      <td><span className="td-muted">{new Date(sup.createdAt).toLocaleDateString('en-GB')}</span></td>
                      <td>
                        <div className="dt-actions">
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="dt-cards">
              {pendingSupervisors.map(sup => (
                <div key={sup._id} className="dt-card">
                  <div className="dt-card-top">
                    <div>
                      <div className="dt-card-name">{sup.firstName} {sup.lastName}</div>
                      <div className="dt-card-sub">{sup.email}</div>
                    </div>
                    <span className="badge badge-pending">Pending</span>
                  </div>
                  <div className="dt-card-meta">
                    <span>{sup.phone || 'No phone'}</span>
                    <span>Registered {new Date(sup.createdAt).toLocaleDateString('en-GB')}</span>
                  </div>
                  <div className="dt-card-actions">
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

export default AdminDashboard
