import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../../../api/axios'
import { useDialog } from '../../../components/dialogContext'

const SADashboard = () => {
  const navigate = useNavigate()
  const { showAlert } = useDialog()
  const [stats, setStats] = useState(null)
  const [pendingSchools, setPendingSchools] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, schoolsRes] = await Promise.all([
          API.get('/super-admin/stats'),
          API.get('/super-admin/schools?status=pending_approval')
        ])
        setStats(statsRes.data)
        setPendingSchools(schoolsRes.data.schools)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleApprove = async (id) => {
    try {
      await API.patch(`/super-admin/schools/${id}/approve`, {
        action: 'approve',
        subscriptionPlan: 'trial'
      })
      setPendingSchools(prev => prev.filter(s => s._id !== id))
      setStats(prev => ({
        ...prev,
        pendingSchools: prev.pendingSchools - 1,
        activeSchools: prev.activeSchools + 1
      }))
    } catch (err) {
      await showAlert(err.response?.data?.message || 'Failed to approve school', {
        title: 'Approval Failed',
        variant: 'danger'
      })
    }
  }

  if (loading) {
    return <div className="dash-loading"><div className="dash-spinner" /></div>
  }

  return (
    <div>
      <div className="dash-page-header">
        <div className="dash-page-title">Overview</div>
        <div className="dash-page-sub">Platform-wide statistics and pending actions</div>
      </div>

      {/* Stats */}
      <div className="dash-stats-grid">
        {[
          { label: 'Total Schools', value: stats?.totalSchools ?? 0, badge: 'total', badgeText: 'All time' },
          { label: 'Pending Approval', value: stats?.pendingSchools ?? 0, badge: 'pending', badgeText: 'Needs review' },
          { label: 'Active Schools', value: stats?.activeSchools ?? 0, badge: 'active', badgeText: 'Live on platform' },
          { label: 'Total Users', value: stats?.totalUsers ?? 0, badge: 'total', badgeText: 'All roles' },
        ].map((s, i) => (
          <div key={i} className="dash-stat-card">
            <div className="dash-stat-label">{s.label}</div>
            <div className="dash-stat-value">{s.value}</div>
            <span className={`dash-stat-badge ${s.badge}`}>{s.badgeText}</span>
          </div>
        ))}
      </div>

      {/* Secondary stats */}
      <div className="dash-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '28px' }}>
        {[
          { label: 'Students', value: stats?.totalStudents ?? 0 },
          { label: 'School Supervisors', value: stats?.totalSupervisors ?? 0 },
          { label: 'IT Admins', value: stats?.totalAdmins ?? 0 },
        ].map((s, i) => (
          <div key={i} className="dash-stat-card">
            <div className="dash-stat-label">{s.label}</div>
            <div className="dash-stat-value" style={{ fontSize: '24px' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Pending schools table */}
      <div className="dash-table-wrap">
        <div className="dash-table-header">
          <div className="dash-table-title">
            Pending School Approvals
            {pendingSchools.length > 0 && (
              <span className="badge badge-pending" style={{ marginLeft: '10px' }}>
                {pendingSchools.length}
              </span>
            )}
          </div>
          <button
            className="dash-action-btn view"
            onClick={() => navigate('/super-admin/schools')}
          >
            View All Schools
          </button>
        </div>

        {pendingSchools.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon">
              <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <p>No pending approvals — all schools are reviewed</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="dt-scroll">
              <table className="dt-table">
                <thead>
                  <tr>
                    <th>School Name</th>
                    <th>Slug</th>
                    <th>Email</th>
                    <th>Registered</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingSchools.map(school => (
                    <tr key={school._id}>
                      <td><div className="dt-cell-primary">{school.name}</div></td>
                      <td><span className="td-muted">{school.slug}</span></td>
                      <td><span className="td-muted">{school.contactEmail}</span></td>
                      <td><span className="td-muted">{new Date(school.createdAt).toLocaleDateString('en-GB')}</span></td>
                      <td>
                        <div className="dt-actions">
                          <button className="dash-action-btn approve" onClick={() => handleApprove(school._id)}>
                            Approve
                          </button>
                          <button className="dash-action-btn view" onClick={() => navigate('/super-admin/schools')}>
                            Review
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="dt-cards">
              {pendingSchools.map(school => (
                <div key={school._id} className="dt-card">
                  <div className="dt-card-top">
                    <div>
                      <div className="dt-card-name">{school.name}</div>
                      <div className="dt-card-sub">{school.contactEmail}</div>
                    </div>
                    <span className="badge badge-pending">Pending</span>
                  </div>
                  <div className="dt-card-meta">
                    <span>{school.slug}</span>
                    <span>{new Date(school.createdAt).toLocaleDateString('en-GB')}</span>
                  </div>
                  <div className="dt-card-actions">
                    <button className="dash-action-btn approve" onClick={() => handleApprove(school._id)}>Approve</button>
                    <button className="dash-action-btn view" onClick={() => navigate('/super-admin/schools')}>Review</button>
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

export default SADashboard
