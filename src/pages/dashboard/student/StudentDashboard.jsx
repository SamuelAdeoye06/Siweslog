import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../../../api/axios'
import useAuthStore from '../../../store/authStore'
import usePageTitle from '../../../hooks/usePageTitle'

const StudentDashboard = () => {
  usePageTitle('Dashboard')
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [logbook, setLogbook] = useState([])
  const [placement, setPlacement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [student, setStudent] = useState(null)

  useEffect(() => {
    const fetchData = async (isBackgroundRefresh = false) => {
      try {
        const [logRes, placementRes] = await Promise.all([
          API.get('/logs/my-logbook'),
          API.get('/placement/my-placement')
        ])
        setLogbook(logRes.data.logs)
        setPlacement(placementRes.data.placement)
        setStudent(logRes.data.student)
      } catch (err) {
        console.error(err)
      } finally {
        if (!isBackgroundRefresh) setLoading(false)
      }
    }

    fetchData()
    // Quietly refresh so an approval that just landed (industry or school
    // supervisor) shows up here without the student needing to reload.
    const interval = setInterval(() => fetchData(true), 30000)
    return () => clearInterval(interval)
  }, [])

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      const res = await API.get('/pdf/logbook', { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'SIWES_Logbook.pdf')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text()
        try {
          const parsed = JSON.parse(text)
          alert(parsed.message || 'Failed to export PDF')
        } catch {
          alert('Failed to export PDF')
        }
      } else {
        alert(err.response?.data?.message || 'Failed to export PDF')
      }
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <div className="dash-loading"><div className="dash-spinner" /></div>

  const totalWeeks = student?.siwesDurationWeeks || 24
  const approvedWeeks = logbook.filter(l => l.status === 'industry_approved' || l.status === 'school_approved').length
  const submittedWeeks = logbook.filter(l => l.status === 'submitted').length
  const draftWeeks = logbook.filter(l => l.status === 'draft').length
  const progressPercent = Math.round((approvedWeeks / totalWeeks) * 100)

  // Find current/next week to log
  const loggedWeekNumbers = logbook.map(l => l.weekNumber)
  const nextWeek = Array.from({ length: totalWeeks }, (_, i) => i + 1)
    .find(w => !loggedWeekNumbers.includes(w)) || totalWeeks

  const recentLogs = [...logbook].sort((a, b) => b.weekNumber - a.weekNumber).slice(0, 5)

  const statusBadge = (status) => {
    const map = {
      draft: <span className="badge badge-pending">Draft</span>,
      submitted: <span className="badge" style={{ background: '#E0F2FE', color: '#0369A1' }}>Awaiting Approval</span>,
      industry_approved: <span className="badge badge-approved">Approved</span>,
      school_approved: <span className="badge badge-approved">Signed Off</span>,
    }
    return map[status] || <span className="badge">{status}</span>
  }

  return (
    <div>
      <div className="dash-page-header">
        <div className="dash-page-title">Welcome, {user?.firstName}</div>
        <div className="dash-page-sub">Track your SIWES progress and manage your weekly logs</div>
      </div>

      {!placement && (
        <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '10px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span style={{ fontSize: '13.5px', color: '#92400E', fontWeight: 500 }}>
              You haven't set up your placement profile yet. Add your company details to start logging.
            </span>
          </div>
          <button className="dash-action-btn approve" onClick={() => navigate('/student/placement')}>
            Set Up Now
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="dash-stats-grid">
        {[
          { label: 'Overall Progress', value: `${progressPercent}%`, badge: 'total', badgeText: `${approvedWeeks}/${totalWeeks} weeks` },
          { label: 'Approved Weeks', value: approvedWeeks, badge: 'active', badgeText: 'Locked & signed' },
          { label: 'Pending Approval', value: submittedWeeks, badge: 'pending', badgeText: 'With supervisor' },
          { label: 'Drafts', value: draftWeeks, badge: 'total', badgeText: 'Not submitted' },
        ].map((s, i) => (
          <div key={i} className="dash-stat-card">
            <div className="dash-stat-label">{s.label}</div>
            <div className="dash-stat-value">{s.value}</div>
            <span className={`dash-stat-badge ${s.badge}`}>{s.badgeText}</span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="dash-table-wrap" style={{ marginBottom: '20px' }}>
        <div className="dash-table-header">
          <div className="dash-table-title">SIWES Progress</div>
          <button className="dash-action-btn approve" onClick={() => navigate(`/student/logbook/week/${nextWeek}`)}>
            {loggedWeekNumbers.length === 0 ? 'Start Week 1' : `Continue Week ${nextWeek}`}
          </button>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ background: '#F1F5F9', borderRadius: '20px', height: '10px', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{ background: 'linear-gradient(90deg, #1B3A6B, #4F8EF7)', height: '100%', width: `${progressPercent}%`, transition: 'width 0.4s' }} />
          </div>
          <div style={{ fontSize: '12.5px', color: '#64748B' }}>
            {approvedWeeks} of {totalWeeks} weeks approved by your industry supervisor
          </div>
        </div>
      </div>

      {/* Recent logs */}
      <div className="dash-table-wrap">
        <div className="dash-table-header">
          <div className="dash-table-title">Recent Entries</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="dash-action-btn approve" onClick={handleExportPDF} disabled={exporting}>
              {exporting ? 'Generating...' : 'Export PDF'}
            </button>
            <button className="dash-action-btn view" onClick={() => navigate('/student/logbook')}>
              View Full Logbook
            </button>
          </div>
        </div>
        {recentLogs.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <p>No log entries yet — start your first week</p>
          </div>
        ) : (
          <>
            {/* ── Desktop Table ── */}
            <div className="dt-scroll">
              <table className="dt-table">
                <thead>
                  <tr>
                    <th>Week</th>
                    <th>Period</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map(log => (
                    <tr key={log._id}>
                      <td>
                        <div className="dt-user-cell">
                          <div className="dt-user-avatar" style={{ background: 'linear-gradient(135deg, #1B3A6B, #4F8EF7)', fontSize: '10px' }}>
                            W{log.weekNumber}
                          </div>
                          <div className="dt-cell-primary">Week {log.weekNumber}</div>
                        </div>
                      </td>
                      <td><span className="td-muted">{new Date(log.dateFrom).toLocaleDateString('en-GB')} – {new Date(log.dateTo).toLocaleDateString('en-GB')}</span></td>
                      <td>{statusBadge(log.status)}</td>
                      <td>
                        <button className="dash-action-btn view" onClick={() => navigate(`/student/logbook/week/${log.weekNumber}`)}>
                          {log.status === 'draft' ? 'Continue' : 'View'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile Cards ── */}
            <div className="dt-cards">
              {recentLogs.map(log => (
                <div key={log._id} className="dt-card">
                  <div className="dt-card-top">
                    <div className="dt-card-user-row">
                      <div className="dt-user-avatar sm" style={{ background: 'linear-gradient(135deg, #1B3A6B, #4F8EF7)', fontSize: '9px' }}>
                        W{log.weekNumber}
                      </div>
                      <div>
                        <div className="dt-card-name">Week {log.weekNumber}</div>
                        <div className="dt-card-sub">{new Date(log.dateFrom).toLocaleDateString('en-GB')} – {new Date(log.dateTo).toLocaleDateString('en-GB')}</div>
                      </div>
                    </div>
                    <div className="dt-card-badges">{statusBadge(log.status)}</div>
                  </div>
                  <div className="dt-card-actions">
                    <button className="dash-action-btn view" onClick={() => navigate(`/student/logbook/week/${log.weekNumber}`)}>
                      {log.status === 'draft' ? 'Continue' : 'View'}
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

export default StudentDashboard
