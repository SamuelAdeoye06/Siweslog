import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import API from '../../../api/axios'
import { useDialog } from '../../../components/dialogContext'
import usePageTitle from '../../../hooks/usePageTitle'
import './Student.css'

const days = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
]

const WeeklyLogEntry = () => {
  const { weekNumber } = useParams()
  const navigate = useNavigate()
  const week = parseInt(weekNumber)
  usePageTitle(`Week ${week}`)
  const { showConfirm, showAlert: showDialogAlert } = useDialog()

  const [log, setLog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [alert, setAlert] = useState(null)
  const [saveStatus, setSaveStatus] = useState('') // '', 'saving', 'saved'
  const [uploadingFile, setUploadingFile] = useState(false)
  const fileRef = useRef()

  // Industry supervisors available to pick from when submitting this week
  const [supervisors, setSupervisors] = useState([])
  const [showSupervisorPicker, setShowSupervisorPicker] = useState(false)
  const [selectedSupervisorId, setSelectedSupervisorId] = useState('')

  const [form, setForm] = useState({
    dateFrom: '',
    dateTo: '',
    dailyActivities: { monday: '', tuesday: '', wednesday: '', thursday: '', friday: '' },
    sectionDepartment: '',
    weeklySummary: '',
    studentRemark: '',
    detailedReport: '',
  })

  const isLocked = log?.isLocked
  const isDraft = !log || log.status === 'draft'

  useEffect(() => {
    const fetchLog = async () => {
      setLoading(true)
      try {
        const [logRes, placementRes] = await Promise.all([
          API.get(`/logs/week/${week}`),
          API.get('/placement/my-placement')
        ])
        if (logRes.data.log) {
          setLog(logRes.data.log)
          setForm({
            dateFrom: logRes.data.log.dateFrom ? logRes.data.log.dateFrom.split('T')[0] : '',
            dateTo: logRes.data.log.dateTo ? logRes.data.log.dateTo.split('T')[0] : '',
            dailyActivities: logRes.data.log.dailyActivities || { monday: '', tuesday: '', wednesday: '', thursday: '', friday: '' },
            sectionDepartment: logRes.data.log.sectionDepartment || '',
            weeklySummary: logRes.data.log.weeklySummary || '',
            studentRemark: logRes.data.log.studentRemark || '',
            detailedReport: logRes.data.log.detailedReport || '',
          })
        }
        const activeSupervisors = placementRes.data.placement?.industrySupervisors?.filter(s => s.isActive) || []
        setSupervisors(activeSupervisors)
        if (activeSupervisors.length === 1) {
          setSelectedSupervisorId(activeSupervisors[0]._id)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchLog()
  }, [week])

  // Auto-save draft every 30 seconds if there's content and not locked
  const saveDraft = useCallback(async (silent = true) => {
    if (isLocked) return
    if (!form.dateFrom || !form.dateTo) return

    if (!silent) setSaving(true)
    else setSaveStatus('saving')

    try {
      const res = await API.post('/logs/save', { weekNumber: week, ...form })
      setLog(res.data.log)
      if (silent) {
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus(''), 2000)
      } else {
        setAlert({ type: 'success', message: 'Draft saved successfully' })
      }
    } catch (err) {
      if (!silent) setAlert({ type: 'error', message: err.response?.data?.message || 'Save failed' })
    } finally {
      setSaving(false)
    }
  }, [form, week, isLocked])

  useEffect(() => {
    if (isLocked || loading) return
    const timer = setInterval(() => {
      saveDraft(true)
    }, 30000)
    return () => clearInterval(timer)
  }, [saveDraft, isLocked, loading])

  // Auto-dismiss inline alert after 5 seconds
  useEffect(() => {
    if (!alert) return
    const t = setTimeout(() => setAlert(null), 5000)
    return () => clearTimeout(t)
  }, [alert])

  const handleDayChange = (dayKey, value) => {
    setForm(prev => ({ ...prev, dailyActivities: { ...prev.dailyActivities, [dayKey]: value } }))
  }

  const handleSubmitLog = () => {
    if (!form.dateFrom || !form.dateTo) {
      setAlert({ type: 'error', message: 'Please set the week start and end dates' })
      return
    }
    const hasContent = Object.values(form.dailyActivities).some(v => v.trim().length > 0)
    if (!hasContent) {
      setAlert({ type: 'error', message: 'Fill in at least one day before submitting' })
      return
    }
    if (supervisors.length === 0) {
      setAlert({ type: 'error', message: 'Add an industry supervisor on your Placement page before submitting' })
      return
    }
    // Open the picker — actual submission happens in confirmSubmitWithSupervisor
    setShowSupervisorPicker(true)
  }

  const confirmSubmitWithSupervisor = async () => {
    if (!selectedSupervisorId) {
      setAlert({ type: 'error', message: 'Select which supervisor should review this week' })
      return
    }

    const chosen = supervisors.find(s => s._id === selectedSupervisorId)
    const confirmed = await showConfirm(
      `${chosen?.name} will be emailed a link to review and approve this entry. You will no longer be able to edit it after approval.`,
      {
        title: 'Submit Week ' + week + ' for Approval',
        confirmText: 'Submit for Approval',
        cancelText: 'Not Yet',
        variant: 'primary'
      }
    )
    if (!confirmed) return

    setShowSupervisorPicker(false)
    setSubmitting(true)
    setAlert(null)
    try {
      // Save first, then submit
      await API.post('/logs/save', { weekNumber: week, ...form })
      const res = await API.patch(`/logs/${week}/submit`, { industrySupervisorId: selectedSupervisorId })
      setLog(res.data.log)
      setAlert({ type: 'success', message: res.data.message })
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Submission failed' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setAlert({ type: 'error', message: 'File must be under 10MB' })
      return
    }
    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await API.post(`/logs/${week}/attachment`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setLog(prev => ({ ...prev, attachments: res.data.attachments }))
      setAlert({ type: 'success', message: 'File attached successfully' })
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Upload failed' })
    } finally {
      setUploadingFile(false)
    }
  }

  const handleDeleteAttachment = async (attachmentId) => {
    const confirmed = await showConfirm('Are you sure you want to remove this attachment? This cannot be undone.', {
      title: 'Remove Attachment',
      confirmText: 'Remove',
      cancelText: 'Keep it',
      variant: 'danger'
    })
    if (!confirmed) return
    try {
      const res = await API.delete(`/logs/${week}/attachment/${attachmentId}`)
      setLog(prev => ({ ...prev, attachments: res.data.attachments }))
    } catch (err) {
      await showDialogAlert(err.response?.data?.message || 'Failed to remove attachment', {
        title: 'Remove Failed',
        variant: 'danger'
      })
    }
  }

  const statusBadge = () => {
    if (!log) return null
    const map = {
      draft: <span className="badge badge-pending">Draft</span>,
      submitted: <span className="badge" style={{ background: '#E0F2FE', color: '#0369A1' }}>Awaiting Industry Approval</span>,
      industry_approved: <span className="badge badge-approved">Industry Approved</span>,
      school_approved: <span className="badge badge-approved">Signed Off by School</span>,
    }
    return map[log.status]
  }

  if (loading) return <div className="dash-loading"><div className="dash-spinner" /></div>

  return (
    <div className="log-entry-wrap">
      <div className="log-entry-header">
        <div>
          <button className="log-back-btn" onClick={() => navigate('/student/logbook')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Back to Logbook
          </button>
          <div className="dash-page-title" style={{ marginTop: '8px' }}>Week {week}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {saveStatus === 'saving' && <span className="log-autosave">Saving...</span>}
          {saveStatus === 'saved' && <span className="log-autosave saved">Saved</span>}
          {statusBadge()}
        </div>
      </div>

      {isLocked && (
        <div className="log-locked-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          This entry has been approved and is permanently locked. No further edits can be made.
        </div>
      )}

      {alert && (
        <div className={`log-toast ${alert.type}`}>
          <div className="log-toast-icon">
            {alert.type === 'success' ? (
              <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            )}
          </div>
          <div className="log-toast-body">
            <div className="log-toast-title">
              {alert.type === 'success' ? 'Submitted Successfully' : 'Something went wrong'}
            </div>
            <div className="log-toast-msg">{alert.message}</div>
          </div>
          <button className="log-toast-dismiss" onClick={() => setAlert(null)} aria-label="Dismiss">
            <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="log-toast-progress">
            <div className="log-toast-progress-bar" key={alert.message} />
          </div>
        </div>
      )}

      {/* Date range */}
      <div className="settings-section">
        <div className="settings-section-body">
          <div className="settings-input-row">
            <div className="settings-field">
              <label className="settings-label">Week Starts (Monday)</label>
              <input
                type="date"
                className="settings-input"
                value={form.dateFrom}
                onChange={e => setForm(prev => ({ ...prev, dateFrom: e.target.value }))}
                disabled={isLocked}
              />
            </div>
            <div className="settings-field">
              <label className="settings-label">Week Ends (Friday)</label>
              <input
                type="date"
                className="settings-input"
                value={form.dateTo}
                onChange={e => setForm(prev => ({ ...prev, dateTo: e.target.value }))}
                disabled={isLocked}
              />
            </div>
          </div>
          <div className="settings-field">
            <label className="settings-label">Section / Department</label>
            <input
              className="settings-input"
              value={form.sectionDepartment}
              onChange={e => setForm(prev => ({ ...prev, sectionDepartment: e.target.value }))}
              placeholder="e.g. Software Development Unit"
              disabled={isLocked}
            />
          </div>
        </div>
      </div>

      {/* Daily activities */}
      <div className="settings-section">
        <div className="settings-section-header">
          <div className="settings-section-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div>
            <div className="settings-section-title">Daily Record of Activities</div>
            <div className="settings-section-sub">Describe what you did each day this week</div>
          </div>
        </div>
        <div className="settings-section-body">
          {days.map(day => (
            <div className="settings-field" key={day.key}>
              <label className="settings-label">{day.label}</label>
              <textarea
                className="settings-input"
                rows={3}
                value={form.dailyActivities[day.key]}
                onChange={e => handleDayChange(day.key, e.target.value)}
                placeholder={`Describe your activities on ${day.label}...`}
                disabled={isLocked}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Weekly summary */}
      <div className="settings-section">
        <div className="settings-section-body">
          <div className="settings-field">
            <label className="settings-label">Summary of Project / Job for the Week</label>
            <textarea
              className="settings-input"
              rows={3}
              value={form.weeklySummary}
              onChange={e => setForm(prev => ({ ...prev, weeklySummary: e.target.value }))}
              placeholder="Summarize the key tasks and what you learned this week..."
              disabled={isLocked}
            />
          </div>
          <div className="settings-field">
            <label className="settings-label">Student's Remark</label>
            <textarea
              className="settings-input"
              rows={2}
              value={form.studentRemark}
              onChange={e => setForm(prev => ({ ...prev, studentRemark: e.target.value }))}
              placeholder="Any additional remarks..."
              disabled={isLocked}
            />
          </div>
        </div>
      </div>

      {/* Detailed report */}
      <div className="settings-section">
        <div className="settings-section-header">
          <div className="settings-section-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </div>
          <div>
            <div className="settings-section-title">Detailed Report on Work Done</div>
            <div className="settings-section-sub">Include sketches or diagrams where necessary via attachments below</div>
          </div>
        </div>
        <div className="settings-section-body">
          <div className="settings-field">
            <textarea
              className="settings-input"
              rows={6}
              value={form.detailedReport}
              onChange={e => setForm(prev => ({ ...prev, detailedReport: e.target.value }))}
              placeholder="Provide a detailed write-up of the work done this week..."
              disabled={isLocked}
            />
          </div>

          {/* Attachments */}
          <div className="log-attachments">
            <label className="settings-label">Attachments</label>
            {log?.attachments?.length > 0 && (
              <div className="log-attachment-list">
                {log.attachments.map(att => (
                  <div className="log-attachment-item" key={att._id}>
                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="log-attachment-link">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                      {att.name}
                    </a>
                    {!isLocked && (
                      <button className="log-attachment-remove" onClick={() => handleDeleteAttachment(att._id)}>×</button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!isLocked && (
              <>
                <button type="button" className="settings-upload-btn" onClick={() => fileRef.current.click()} disabled={uploadingFile}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  {uploadingFile ? 'Uploading...' : 'Attach Sketch / Diagram'}
                </button>
                <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleFileUpload} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      {!isLocked && (
        <div className="log-actions">
          <button className="settings-upload-btn" onClick={() => saveDraft(false)} disabled={saving}>
            {saving ? 'Saving...' : 'Save as Draft'}
          </button>
          {isDraft && (
            <button className="settings-save-btn" onClick={handleSubmitLog} disabled={submitting}>
              {submitting ? <div className="settings-spinner" /> : 'Submit for Approval'}
            </button>
          )}
        </div>
      )}

      {/* Industry supervisor picker modal */}
      {showSupervisorPicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '440px' }}>
            <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
              Who should review Week {week}?
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748B', marginBottom: '20px' }}>
              Choose the industry supervisor who oversaw your work this week.
            </p>
            <select
              className="settings-input"
              value={selectedSupervisorId}
              onChange={e => setSelectedSupervisorId(e.target.value)}
              style={{ marginBottom: '20px' }}
            >
              <option value="">Select a supervisor...</option>
              {supervisors.map(sup => (
                <option key={sup._id} value={sup._id}>{sup.name} — {sup.email}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="settings-resend" onClick={() => setShowSupervisorPicker(false)}>Cancel</button>
              <button
                className="settings-save-btn"
                style={{ marginTop: 0 }}
                onClick={confirmSubmitWithSupervisor}
                disabled={!selectedSupervisorId || submitting}
              >
                {submitting ? <div className="settings-spinner" /> : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval info if approved */}
      {log?.status === 'industry_approved' || log?.status === 'school_approved' ? (
        <div className="settings-section">
          <div className="settings-section-header">
            <div className="settings-section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <div className="settings-section-title">Approval Details</div>
            </div>
          </div>
          <div className="settings-section-body">
            <div className="settings-info-grid">
              <div className="settings-info-item">
                <div className="settings-info-label">Approved By</div>
                <div className="settings-info-value">{log.industrySupervisorName}</div>
              </div>
              <div className="settings-info-item">
                <div className="settings-info-label">Approved On</div>
                <div className="settings-info-value">{new Date(log.industrySupervisorSignedAt).toLocaleDateString('en-GB')}</div>
              </div>
            </div>
            {log.industrySupervisorComment && (
              <div className="settings-field" style={{ marginTop: '16px' }}>
                <label className="settings-label">Supervisor's Comment</label>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 14px', fontSize: '13.5px', color: '#334155' }}>
                  {log.industrySupervisorComment}
                </div>
              </div>
            )}
            {log.schoolSupervisorComment && (
              <div className="settings-field" style={{ marginTop: '16px' }}>
                <label className="settings-label">School Supervisor's Comment</label>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 14px', fontSize: '13.5px', color: '#334155' }}>
                  {log.schoolSupervisorComment}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default WeeklyLogEntry
