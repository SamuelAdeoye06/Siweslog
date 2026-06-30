import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../../../api/axios'

const StudentLogbook = () => {
  const navigate = useNavigate()
  const [logbook, setLogbook] = useState([])
  const [totalWeeks, setTotalWeeks] = useState(24)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const fetchLogbook = async (isBackgroundRefresh = false) => {
      try {
        const res = await API.get('/logs/my-logbook')
        setLogbook(res.data.logs)
        setTotalWeeks(res.data.student?.siwesDurationWeeks || 24)
      } catch (err) {
        console.error(err)
      } finally {
        if (!isBackgroundRefresh) setLoading(false)
      }
    }

    fetchLogbook()
    const interval = setInterval(() => fetchLogbook(true), 30000)
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
      // err.response.data is a Blob here since responseType is 'blob' —
      // read it as text to get the actual JSON error message from the backend
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

  const getLogForWeek = (weekNum) => logbook.find(l => l.weekNumber === weekNum)

  const statusInfo = (log) => {
    if (!log) return { label: 'Not Started', badge: <span className="badge" style={{ background: '#F1F5F9', color: '#64748B' }}>Not Started</span> }
    const map = {
      draft: { label: 'Draft', badge: <span className="badge badge-pending">Draft</span> },
      submitted: { label: 'Awaiting Approval', badge: <span className="badge" style={{ background: '#E0F2FE', color: '#0369A1' }}>Awaiting Approval</span> },
      industry_approved: { label: 'Approved', badge: <span className="badge badge-approved">Approved</span> },
      school_approved: { label: 'Signed Off', badge: <span className="badge badge-approved">Signed Off</span> },
    }
    return map[log.status] || { label: log.status, badge: <span className="badge">{log.status}</span> }
  }

  if (loading) return <div className="dash-loading"><div className="dash-spinner" /></div>

  return (
    <div>
      <div className="dash-page-header">
        <div className="dash-page-title">My Logbook</div>
        <div className="dash-page-sub">All {totalWeeks} weeks of your SIWES industrial training</div>
      </div>

      <div className="dash-table-wrap">
        <div className="dash-table-header">
          <div className="dash-table-title">Weekly Entries</div>
          <div className="dash-table-actions">
            <span style={{ fontSize: '12.5px', color: '#64748B' }}>
              {logbook.filter(l => l.status === 'industry_approved' || l.status === 'school_approved').length} / {totalWeeks} approved
            </span>
          </div>
        </div>

        {/* ── Desktop Table ── */}
        <div className="dt-scroll">
          <table className="dt-table">
            <thead>
              <tr>
                <th>Week</th>
                <th>Period</th>
                <th>Status</th>
                <th>Industry Supervisor</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(weekNum => {
                const log = getLogForWeek(weekNum)
                const { badge } = statusInfo(log)
                const isLocked = log?.isLocked

                return (
                  <tr key={weekNum}>
                    <td>
                      <div className="dt-user-cell">
                        <div
                          className="dt-user-avatar"
                          style={{
                            background: log
                              ? 'linear-gradient(135deg, #1B3A6B, #4F8EF7)'
                              : '#E2E8F0',
                            color: log ? '#fff' : '#94A3B8',
                            fontSize: '10px'
                          }}
                        >
                          {weekNum}
                        </div>
                        <div className="dt-cell-primary">Week {weekNum}</div>
                      </div>
                    </td>
                    <td>
                      <span className="td-muted">
                        {log
                          ? `${new Date(log.dateFrom).toLocaleDateString('en-GB')} – ${new Date(log.dateTo).toLocaleDateString('en-GB')}`
                          : '—'
                        }
                      </span>
                    </td>
                    <td>{badge}</td>
                    <td>
                      <span className="td-muted">
                        {log?.industrySupervisorName || (log?.status === 'submitted' ? 'Pending review' : '—')}
                      </span>
                    </td>
                    <td>
                      <button
                        className="dash-action-btn view"
                        onClick={() => navigate(`/student/logbook/week/${weekNum}`)}
                      >
                        {!log ? 'Start' : isLocked ? 'View' : 'Continue'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* ── Mobile Cards ── */}
        <div className="dt-cards">
          {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(weekNum => {
            const log = getLogForWeek(weekNum)
            const { badge } = statusInfo(log)
            const isLocked = log?.isLocked

            return (
              <div key={weekNum} className="dt-card">
                <div className="dt-card-top">
                  <div className="dt-card-user-row">
                    <div
                      className="dt-user-avatar sm"
                      style={{
                        background: log
                          ? 'linear-gradient(135deg, #1B3A6B, #4F8EF7)'
                          : '#E2E8F0',
                        color: log ? '#fff' : '#94A3B8',
                        fontSize: '9px'
                      }}
                    >
                      {weekNum}
                    </div>
                    <div>
                      <div className="dt-card-name">Week {weekNum}</div>
                      <div className="dt-card-sub">
                        {log
                          ? `${new Date(log.dateFrom).toLocaleDateString('en-GB')} – ${new Date(log.dateTo).toLocaleDateString('en-GB')}`
                          : 'Not started'
                        }
                      </div>
                    </div>
                  </div>
                  <div className="dt-card-badges">{badge}</div>
                </div>
                {log?.industrySupervisorName && (
                  <div className="dt-card-meta">
                    <span>Supervisor: {log.industrySupervisorName}</span>
                  </div>
                )}
                <div className="dt-card-actions">
                  <button
                    className="dash-action-btn view"
                    onClick={() => navigate(`/student/logbook/week/${weekNum}`)}
                  >
                    {!log ? 'Start' : isLocked ? 'View' : 'Continue'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default StudentLogbook
