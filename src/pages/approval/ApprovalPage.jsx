import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import API from '../../api/axios'
import './ApprovalPage.css'

const dayLabels = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
]

const ApprovalPage = () => {
  const { token } = useParams()
  const [log, setLog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [approved, setApproved] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const [supervisorName, setSupervisorName] = useState('')
  const [comment, setComment] = useState('')
  const [nameError, setNameError] = useState('')

  useEffect(() => {
    const fetchLog = async () => {
      try {
        const res = await API.get(`/logs/approve/${token}`)
        setLog(res.data.log)
      } catch (err) {
        setError(err.response?.data?.message || 'This approval link is invalid or has expired')
      } finally {
        setLoading(false)
      }
    }
    fetchLog()
  }, [token])

  const handleApprove = async () => {
    if (!supervisorName.trim()) {
      setNameError('Please enter your full name to confirm approval')
      return
    }
    setNameError('')
    setSubmitting(true)
    try {
      const res = await API.patch(`/logs/approve/${token}`, {
        supervisorName: supervisorName.trim(),
        comment: comment.trim()
      })
      setSuccessMessage(res.data.message)
      setApproved(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve this entry')
    } finally {
      setSubmitting(false)
    }
  }

  // ── LOADING STATE ──
  if (loading) {
    return (
      <div className="appr-page">
        <nav className="appr-nav"><div className="appr-logo">SIWES<span>log</span></div></nav>
        <div className="appr-body">
          <div className="appr-container">
            <div className="appr-state-card">
              <div className="appr-spinner" />
              <div className="appr-state-title">Loading entry...</div>
              <p className="appr-state-desc">Please wait while we fetch the logbook details.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── ERROR STATE ──
  if (error) {
    return (
      <div className="appr-page">
        <nav className="appr-nav"><div className="appr-logo">SIWES<span>log</span></div></nav>
        <div className="appr-body">
          <div className="appr-container">
            <div className="appr-state-card">
              <div className="appr-state-icon error">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              </div>
              <div className="appr-state-title">Unable to Load Entry</div>
              <p className="appr-state-desc">{error}</p>
            </div>
          </div>
        </div>
        <div className="appr-footer">© {new Date().getFullYear()} SIWESlog. All rights reserved.</div>
      </div>
    )
  }

  // ── SUCCESS STATE ──
  if (approved) {
    return (
      <div className="appr-page">
        <nav className="appr-nav"><div className="appr-logo">SIWES<span>log</span></div></nav>
        <div className="appr-body">
          <div className="appr-container">
            <div className="appr-state-card">
              <div className="appr-state-icon success">
                <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div className="appr-state-title">Entry Approved</div>
              <p className="appr-state-desc">{successMessage}</p>
            </div>
          </div>
        </div>
        <div className="appr-footer">© {new Date().getFullYear()} SIWESlog. All rights reserved.</div>
      </div>
    )
  }

  // ── MAIN VIEW ──
  const filledDays = dayLabels.filter(d => log.dailyActivities?.[d.key]?.trim())

  return (
    <div className="appr-page">
      <nav className="appr-nav"><div className="appr-logo">SIWES<span>log</span></div></nav>
      <div className="appr-body">
        <div className="appr-container">

          {/* Header card */}
          <div className="appr-card">
            <div className="appr-card-header">
              <div className="appr-eyebrow">Logbook Approval Request</div>
              <div className="appr-title">Week {log.weekNumber} — {log.userId?.firstName} {log.userId?.lastName}</div>
              <div className="appr-subtitle">{log.schoolId?.name}</div>
            </div>
            <div className="appr-card-body">
              <div className="appr-info-grid">
                <div className="appr-info-item">
                  <div className="appr-info-label">Period</div>
                  <div className="appr-info-value">
                    {new Date(log.dateFrom).toLocaleDateString('en-GB')} – {new Date(log.dateTo).toLocaleDateString('en-GB')}
                  </div>
                </div>
                <div className="appr-info-item">
                  <div className="appr-info-label">Section / Department</div>
                  <div className="appr-info-value">{log.sectionDepartment || '—'}</div>
                </div>
              </div>

              <div className="appr-section-title">Daily Activities</div>
              {filledDays.length === 0 ? (
                <p className="appr-day-empty">No daily activities recorded</p>
              ) : (
                filledDays.map(d => (
                  <div className="appr-day-block" key={d.key}>
                    <div className="appr-day-label">{d.label}</div>
                    <div className="appr-day-text">{log.dailyActivities[d.key]}</div>
                  </div>
                ))
              )}

              {log.weeklySummary && (
                <>
                  <div className="appr-section-title">Summary of Work for the Week</div>
                  <div className="appr-text-block">{log.weeklySummary}</div>
                </>
              )}

              {log.detailedReport && (
                <>
                  <div className="appr-section-title">Detailed Report</div>
                  <div className="appr-text-block">{log.detailedReport}</div>
                </>
              )}

              {log.studentRemark && (
                <>
                  <div className="appr-section-title">Student's Remark</div>
                  <div className="appr-text-block">{log.studentRemark}</div>
                </>
              )}

              {log.attachments?.length > 0 && (
                <>
                  <div className="appr-section-title">Attachments</div>
                  <div className="appr-attachments">
                    {log.attachments.map((att, i) => (
                      <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="appr-attachment-link">
                        <svg viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                        {att.name}
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action card */}
          <div className="appr-action-card">
            <div className="appr-section-title" style={{ marginTop: 0 }}>Review & Approve</div>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px', lineHeight: '1.6' }}>
              By approving, you confirm that this student completed the activities described above during their placement at your organization.
            </p>

            <div className="appr-field">
              <label className="appr-label">Your Full Name</label>
              <input
                className="appr-input"
                placeholder="e.g. Mr Pamilerin Mbini"
                value={supervisorName}
                onChange={e => setSupervisorName(e.target.value)}
              />
              {nameError && <div className="appr-error">{nameError}</div>}
            </div>

            <div className="appr-field">
              <label className="appr-label">Comments (optional)</label>
              <textarea
                className="appr-textarea"
                rows={3}
                placeholder="Any feedback on the student's performance this week..."
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
            </div>

            <div className="appr-actions">
              <button className="appr-btn-approve" onClick={handleApprove} disabled={submitting}>
                {submitting ? <div className="appr-btn-spinner" /> : (
                  <>
                    <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                    Approve This Entry
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
      <div className="appr-footer">© {new Date().getFullYear()} SIWESlog. All rights reserved.</div>
    </div>
  )
}

export default ApprovalPage
