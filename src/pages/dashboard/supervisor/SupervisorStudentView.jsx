import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import API from '../../../api/axios'
import { useDialog } from '../../../components/dialogContext'
import usePageTitle from '../../../hooks/usePageTitle'
import './Supervisor.css'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
const DAY_LABELS = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday' }

const statusMeta = {
  draft:             { label: 'Draft',              cls: 'badge-trial' },
  submitted:         { label: 'Submitted',           cls: 'badge-pending' },
  industry_approved: { label: 'Industry Approved',   cls: 'badge-approved' },
  school_approved:   { label: 'School Signed Off',   cls: 'badge-active' },
}

const commentSchema = Yup.object({
  comment: Yup.string().trim().min(10, 'Comment must be at least 10 characters').required('Comment is required')
})

const visitSchema = Yup.object({
  visitDate: Yup.string().required('Visit date is required'),
  generalComments: Yup.string().trim().min(10, 'Comments must be at least 10 characters').required('Comments are required')
})

const ChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

const ChevronUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    <polyline points="18 15 12 9 6 15"/>
  </svg>
)

const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)

// ── Log Detail (expandable) ────────────────────────────────────────────
const LogDetail = ({ log, onCommentSaved }) => {
  const { showAlert, showConfirm } = useDialog()
  const [submitting, setSubmitting] = useState(false)
  const canComment = log.status === 'industry_approved'

  const handleComment = async (values, { resetForm }) => {
    const ok = await showConfirm(
      'Sign off on this log entry? This action cannot be undone.',
      { title: 'Confirm Sign-off', confirmText: 'Sign Off', variant: 'primary' }
    )
    if (!ok) return
    setSubmitting(true)
    try {
      await API.patch(`/logs/${log._id}/supervisor-comment`, { comment: values.comment })
      await showAlert('Log signed off successfully.', { title: 'Done', variant: 'success' })
      onCommentSaved(log._id)
      resetForm()
    } catch (err) {
      await showAlert(err.response?.data?.message || 'Failed to save comment.', { title: 'Error', variant: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="sv-log-detail">
      <div className="sv-log-detail-section">
        <div className="sv-log-detail-label">Period</div>
        <div className="sv-log-detail-value">
          {log.dateFrom ? new Date(log.dateFrom).toLocaleDateString('en-GB') : '—'}
          {' — '}
          {log.dateTo ? new Date(log.dateTo).toLocaleDateString('en-GB') : '—'}
        </div>
      </div>

      {log.sectionDepartment && (
        <div className="sv-log-detail-section">
          <div className="sv-log-detail-label">Section / Department</div>
          <div className="sv-log-detail-value">{log.sectionDepartment}</div>
        </div>
      )}

      <div className="sv-log-detail-section">
        <div className="sv-log-detail-label">Daily Activities</div>
        <div className="sv-days-grid">
          {DAYS.map(day => (
            <div key={day} className="sv-day-row">
              <div className="sv-day-name">{DAY_LABELS[day]}</div>
              <div className="sv-day-content">
                {log.dailyActivities?.[day] || <span className="sv-empty-day">No entry</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {log.weeklySummary && (
        <div className="sv-log-detail-section">
          <div className="sv-log-detail-label">Weekly Summary</div>
          <div className="sv-log-detail-value">{log.weeklySummary}</div>
        </div>
      )}

      {log.detailedReport && (
        <div className="sv-log-detail-section">
          <div className="sv-log-detail-label">Detailed Report</div>
          <div className="sv-log-detail-value sv-pre">{log.detailedReport}</div>
        </div>
      )}

      {log.studentRemark && (
        <div className="sv-log-detail-section">
          <div className="sv-log-detail-label">Student Remark</div>
          <div className="sv-log-detail-value">{log.studentRemark}</div>
        </div>
      )}

      {/* Industry Supervisor sign-off */}
      {log.industrySupervisorName && (
        <div className="sv-signoff-block industry">
          <div className="sv-signoff-label">Industry Supervisor Sign-off</div>
          <div className="sv-signoff-name">{log.industrySupervisorName}</div>
          {log.industrySupervisorComment && (
            <div className="sv-signoff-comment">{log.industrySupervisorComment}</div>
          )}
          <div className="sv-signoff-date">
            {log.industrySupervisorSignedAt
              ? new Date(log.industrySupervisorSignedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
              : '—'}
          </div>
        </div>
      )}

      {/* School Supervisor sign-off (already done) */}
      {log.status === 'school_approved' && (
        <div className="sv-signoff-block school">
          <div className="sv-signoff-label">School Supervisor Sign-off</div>
          {log.schoolSupervisorComment && (
            <div className="sv-signoff-comment">{log.schoolSupervisorComment}</div>
          )}
          <div className="sv-signoff-date">
            Signed: {log.schoolSupervisorSignedAt
              ? new Date(log.schoolSupervisorSignedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
              : '—'}
          </div>
        </div>
      )}

      {/* Comment form — only when industry_approved and waiting for school sign-off */}
      {canComment && (
        <div className="sv-comment-form-wrap">
          <div className="sv-comment-form-title">Add Your Comment and Sign Off</div>
          <Formik
            initialValues={{ comment: '' }}
            validationSchema={commentSchema}
            onSubmit={handleComment}
          >
            {({ isSubmitting: fSubmitting }) => (
              <Form>
                <div className="settings-field">
                  <Field
                    as="textarea"
                    name="comment"
                    className="settings-input sv-comment-textarea"
                    placeholder="Write your comment on this week's log..."
                    rows={4}
                  />
                  <ErrorMessage name="comment" component="div" className="settings-error" />
                </div>
                <button
                  type="submit"
                  className="settings-save-btn"
                  disabled={submitting || fSubmitting}
                >
                  {submitting ? 'Saving...' : 'Sign Off this Log'}
                </button>
              </Form>
            )}
          </Formik>
        </div>
      )}

      {log.attachments?.length > 0 && (
        <div className="sv-log-detail-section">
          <div className="sv-log-detail-label">Attachments</div>
          <div className="sv-attachments">
            {log.attachments.map(a => (
              <a key={a._id} href={a.url} target="_blank" rel="noreferrer" className="sv-attachment-link">
                {a.name || 'Attachment'}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────
const SupervisorStudentView = () => {
  const { studentUserId } = useParams()
  const navigate = useNavigate()
  const { showAlert } = useDialog()
  usePageTitle('Student Logbook')

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('logbook')
  const [expandedLogId, setExpandedLogId] = useState(null)

  const [student, setStudent] = useState(null)
  const [logs, setLogs] = useState([])
  const [placement, setPlacement] = useState(null)
  const [visits, setVisits] = useState([])
  const [visitsLoading, setVisitsLoading] = useState(false)
  const [visitSubmitting, setVisitSubmitting] = useState(false)

  const fetchCoreData = useCallback(async () => {
    try {
      const [logsRes, placementRes] = await Promise.all([
        API.get(`/logs/student/${studentUserId}`),
        API.get(`/supervisor/student/${studentUserId}/placement`)
      ])
      setStudent(logsRes.data.student)
      setLogs(logsRes.data.logs || [])
      setPlacement(placementRes.data.placement || null)
    } catch (err) {
      await showAlert(err.response?.data?.message || 'Failed to load student data.', { title: 'Error', variant: 'danger' })
      navigate('/supervisor/students')
    } finally {
      setLoading(false)
    }
  }, [studentUserId, navigate, showAlert])

  const fetchVisits = useCallback(async () => {
    setVisitsLoading(true)
    try {
      const res = await API.get(`/supervisor/visits/${studentUserId}`)
      setVisits(res.data.visits || [])
    } catch (err) {
      console.error(err)
    } finally {
      setVisitsLoading(false)
    }
  }, [studentUserId])

  useEffect(() => { fetchCoreData() }, [fetchCoreData])

  useEffect(() => {
    if (activeTab === 'visits') fetchVisits()
  }, [activeTab, fetchVisits])

  const handleCommentSaved = (logId) => {
    setLogs(prev => prev.map(l =>
      l._id === logId ? { ...l, status: 'school_approved' } : l
    ))
    setExpandedLogId(null)
  }

  const handleRecordVisit = async (values, { resetForm }) => {
    setVisitSubmitting(true)
    try {
      await API.post('/supervisor/visit', { studentUserId, ...values })
      await showAlert('Visit recorded successfully.', { title: 'Done', variant: 'success' })
      resetForm()
      fetchVisits()
    } catch (err) {
      await showAlert(err.response?.data?.message || 'Failed to record visit.', { title: 'Error', variant: 'danger' })
    } finally {
      setVisitSubmitting(false)
    }
  }

  if (loading) return <div className="dash-loading"><div className="dash-spinner" /></div>

  const activePlacement = placement?.industrySupervisors?.find(s => s.isActive)

  return (
    <div>
      {/* Back + Student header */}
      <div className="sv-page-header">
        <button className="sv-back-btn" onClick={() => navigate('/supervisor/students')}>
          <BackIcon /> Back to Students
        </button>
        <div className="sv-student-header">
          <div>
            <div className="dash-page-title" style={{ marginBottom: 4 }}>
              {student?.userId?.firstName || ''} {student?.userId?.lastName || ''}
            </div>
            <div className="dash-page-sub">
              {student?.matricNumber || '—'} · {student?.department || '—'} · {student?.faculty || '—'}
            </div>
          </div>
          {placement?.companyName && (
            <div className="sv-company-badge">{placement.companyName}</div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="sv-tabs">
        {[
          { id: 'logbook', label: 'Logbook' },
          { id: 'placement', label: 'Placement Info' },
          { id: 'visits', label: 'Visit Records' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`sv-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── LOGBOOK TAB ── */}
      {activeTab === 'logbook' && (
        <div className="dash-table-wrap" style={{ marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          {logs.length === 0 ? (
            <div className="dash-empty">
              <div className="dash-empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <p>This student has not submitted any log entries yet.</p>
            </div>
          ) : (
            <div className="sv-log-list">
              {logs.map(log => {
                const meta = statusMeta[log.status] || { label: log.status, cls: 'badge-trial' }
                const isExpanded = expandedLogId === log._id
                return (
                  <div key={log._id} className={`sv-log-item ${isExpanded ? 'expanded' : ''}`}>
                    <button
                      className="sv-log-row"
                      onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                    >
                      <div className="sv-log-row-left">
                        <div className="sv-log-week">Week {log.weekNumber}</div>
                        <div className="sv-log-period">
                          {log.dateFrom
                            ? new Date(log.dateFrom).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                            : '—'}
                          {' — '}
                          {log.dateTo
                            ? new Date(log.dateTo).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                            : ''}
                        </div>
                      </div>
                      <div className="sv-log-row-right">
                        <span className={`badge ${meta.cls}`}>{meta.label}</span>
                        {isExpanded ? <ChevronUp /> : <ChevronDown />}
                      </div>
                    </button>
                    {isExpanded && (
                      <LogDetail log={log} onCommentSaved={handleCommentSaved} />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── PLACEMENT TAB ── */}
      {activeTab === 'placement' && (
        <div className="dash-table-wrap" style={{ marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          {!placement ? (
            <div className="dash-empty">
              <div className="dash-empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                </svg>
              </div>
              <p>This student has not set up their placement profile yet.</p>
            </div>
          ) : (
            <div className="sv-placement-grid">
              {[
                { label: 'Company Name', value: placement.companyName },
                { label: 'Location', value: placement.companyLocation },
                { label: 'Year Operations Began', value: placement.yearOperationBegan },
                { label: 'Employment Size', value: placement.employmentSize ? placement.employmentSize.charAt(0).toUpperCase() + placement.employmentSize.slice(1) : null },
                { label: 'Major Areas of Operation', value: placement.majorAreasOfOperation },
                { label: 'Products / Jobs Undertaken', value: placement.productsJobUndertaken },
                { label: 'Full Operation', value: placement.fullOperation },
                { label: 'Minor Operation', value: placement.minorOperation },
                { label: 'Capital Investment', value: placement.capitalInvestment },
                { label: 'Other Relevant Info', value: placement.otherRelevantInfo },
              ].map(({ label, value }) => value ? (
                <div key={label} className="sv-placement-field">
                  <div className="sv-placement-label">{label}</div>
                  <div className="sv-placement-value">{value}</div>
                </div>
              ) : null)}

              {activePlacement && (
                <div className="sv-placement-field sv-placement-field--full">
                  <div className="sv-placement-label">Industry Supervisor</div>
                  <div className="sv-placement-value">
                    {activePlacement.name} · {activePlacement.email} · {activePlacement.phone}
                  </div>
                </div>
              )}

              {placement.organogramImage && (
                <div className="sv-placement-field sv-placement-field--full">
                  <div className="sv-placement-label">Organisation Chart</div>
                  <img
                    src={placement.organogramImage}
                    alt="Organogram"
                    className="sv-organogram"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── VISITS TAB ── */}
      {activeTab === 'visits' && (
        <div className="dash-table-wrap" style={{ marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          <div className="sv-visits-layout">
            {/* Record new visit */}
            <div className="sv-visit-form-wrap">
              <div className="sv-visit-form-title">Record a Visit</div>
              <Formik
                initialValues={{ visitDate: '', generalComments: '' }}
                validationSchema={visitSchema}
                onSubmit={handleRecordVisit}
              >
                {({ isSubmitting: fSubmitting }) => (
                  <Form className="sv-visit-form">
                    <div className="settings-field">
                      <label className="settings-label">Visit Date</label>
                      <Field
                        type="date"
                        name="visitDate"
                        className="settings-input"
                        max={new Date().toISOString().split('T')[0]}
                      />
                      <ErrorMessage name="visitDate" component="div" className="settings-error" />
                    </div>
                    <div className="settings-field">
                      <label className="settings-label">Observations / Comments</label>
                      <Field
                        as="textarea"
                        name="generalComments"
                        className="settings-input sv-comment-textarea"
                        placeholder="Record your observations from this visit..."
                        rows={5}
                      />
                      <ErrorMessage name="generalComments" component="div" className="settings-error" />
                    </div>
                    <button
                      type="submit"
                      className="settings-save-btn"
                      disabled={visitSubmitting || fSubmitting}
                    >
                      {visitSubmitting ? 'Saving...' : 'Record Visit'}
                    </button>
                  </Form>
                )}
              </Formik>
            </div>

            {/* Past visits list */}
            <div className="sv-visits-list-wrap">
              <div className="sv-visit-form-title">Visit History</div>
              {visitsLoading ? (
                <div className="dash-loading" style={{ height: 80 }}><div className="dash-spinner" /></div>
              ) : visits.length === 0 ? (
                <div className="dash-empty" style={{ padding: '24px 0' }}>
                  <p style={{ margin: 0 }}>No visits recorded yet.</p>
                </div>
              ) : (
                <div className="sv-visits-list">
                  {visits.map(v => (
                    <div key={v._id} className="sv-visit-card">
                      <div className="sv-visit-date">
                        {new Date(v.visitDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </div>
                      <div className="sv-visit-comment">{v.generalComments}</div>
                      <div className="sv-visit-signed">
                        Recorded {new Date(v.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SupervisorStudentView
