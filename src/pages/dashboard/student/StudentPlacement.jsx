import { useState, useEffect, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import API from '../../../api/axios'
import { useToast } from '../../../components/ToastContext'
import './Student.css'

const validationSchema = Yup.object({
  companyName: Yup.string().required('Company name is required'),
  companyLocation: Yup.string().required('Company location is required'),
  yearOperationBegan: Yup.string(),
  majorAreasOfOperation: Yup.string(),
  productsJobUndertaken: Yup.string(),
  employmentSize: Yup.string().required('Employment size is required'),
})

const supervisorValidationSchema = Yup.object({
  name: Yup.string().required('Supervisor name is required'),
  email: Yup.string().email('Enter a valid email').required('Supervisor email is required'),
  phone: Yup.string().required('Supervisor phone is required'),
})

const StudentPlacement = () => {
  const { setPlacementComplete } = useOutletContext() || {}
  const { showToast } = useToast()
  const [placement, setPlacement] = useState(null)
  const [duration, setDuration] = useState(null)
  const [loading, setLoading] = useState(true)
  const [orgUploading, setOrgUploading] = useState(false)
  const [showAddSupervisor, setShowAddSupervisor] = useState(false)
  const [addingSupervisor, setAddingSupervisor] = useState(false)
  const [removingId, setRemovingId] = useState(null)
  const fileRef = useRef()

  const fetchPlacement = async () => {
    try {
      const res = await API.get('/placement/my-placement')
      setPlacement(res.data.placement)
      setDuration(res.data.siwesDurationWeeks)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPlacement() }, [])

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      companyName: placement?.companyName || '',
      companyLocation: placement?.companyLocation || '',
      yearOperationBegan: placement?.yearOperationBegan || '',
      majorAreasOfOperation: placement?.majorAreasOfOperation || '',
      productsJobUndertaken: placement?.productsJobUndertaken || '',
      employmentSize: placement?.employmentSize || 'small',
      fullOperation: placement?.fullOperation || '',
      minorOperation: placement?.minorOperation || '',
      capitalInvestment: placement?.capitalInvestment || '',
      otherRelevantInfo: placement?.otherRelevantInfo || '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const res = await API.post('/placement/save', values)
        setPlacement(res.data.placement)
        // Unlock the rest of the dashboard immediately — no reload needed.
        // Company name + location alone counts as "complete enough" to
        // proceed; supervisors can be added later.
        if (setPlacementComplete) setPlacementComplete(true)
        showToast('Company profile saved successfully', 'success')
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to save company profile', 'error')
      }
    }
  })

  const supervisorFormik = useFormik({
    initialValues: { name: '', email: '', phone: '' },
    validationSchema: supervisorValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      setAddingSupervisor(true)
      try {
        const res = await API.post('/placement/supervisors', values)
        setPlacement(res.data.placement)
        resetForm()
        setShowAddSupervisor(false)
        showToast(`${values.name} has been added and notified by email`, 'success')
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to add supervisor', 'error')
      } finally {
        setAddingSupervisor(false)
      }
    }
  })

  const handleRemoveSupervisor = async (supervisorId, name) => {
    if (!window.confirm(`Remove ${name} from your active supervisors? Past approved weeks will still show their name.`)) return
    setRemovingId(supervisorId)
    try {
      const res = await API.delete(`/placement/supervisors/${supervisorId}`)
      setPlacement(res.data.placement)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove supervisor', 'error')
    } finally {
      setRemovingId(null)
    }
  }

  const handleOrganogramUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5MB', 'error')
      return
    }
    setOrgUploading(true)
    try {
      const formData = new FormData()
      formData.append('organogram', file)
      const res = await API.patch('/placement/organogram', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setPlacement(prev => ({ ...prev, organogramImage: res.data.organogramImage }))
      showToast('Organogram uploaded successfully', 'success')
    } catch (err) {
      showToast(err.response?.data?.message || 'Upload failed', 'error')
    } finally {
      setOrgUploading(false)
    }
  }

  if (loading) return <div className="dash-loading"><div className="dash-spinner" /></div>

  const activeSupervisors = placement?.industrySupervisors?.filter(s => s.isActive) || []
  const inactiveSupervisors = placement?.industrySupervisors?.filter(s => !s.isActive) || []

  return (
    <div className="settings-wrap">
      <div className="dash-page-header">
        <div className="dash-page-title">My Placement</div>
        <div className="dash-page-sub">Your company profile and industry supervisors</div>
      </div>

      {/* Read-only SIWES duration set at registration */}
      <div className="settings-section">
        <div className="settings-section-body">
          <div className="settings-info-grid">
            <div className="settings-info-item">
              <div className="settings-info-label">SIWES Duration</div>
              <div className="settings-info-value">{duration ? `${duration} weeks` : '—'}</div>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '10px' }}>
            This was set when you registered. Contact your IT admin if this needs correcting.
          </p>
        </div>
      </div>

      {/* Company Profile */}
      <form onSubmit={formik.handleSubmit} noValidate>
        <div className="settings-section">
          <div className="settings-section-header">
            <div className="settings-section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            </div>
            <div>
              <div className="settings-section-title">Company Profile</div>
              <div className="settings-section-sub">Details about your industrial training organization</div>
            </div>
          </div>
          <div className="settings-section-body">
            <div className="settings-field">
              <label className="settings-label">Company / Establishment Name</label>
              <input className="settings-input" name="companyName" value={formik.values.companyName} onChange={formik.handleChange} placeholder="e.g. SQI College of ICT" />
              {formik.touched.companyName && formik.errors.companyName && <div className="settings-error">{formik.errors.companyName}</div>}
            </div>
            <div className="settings-field">
              <label className="settings-label">Company Location / Address</label>
              <input className="settings-input" name="companyLocation" value={formik.values.companyLocation} onChange={formik.handleChange} placeholder="e.g. Opposite Jaiz Bank, Ogo Oluwa, Osogbo" />
              {formik.touched.companyLocation && formik.errors.companyLocation && <div className="settings-error">{formik.errors.companyLocation}</div>}
            </div>
            <div className="settings-input-row">
              <div className="settings-field">
                <label className="settings-label">Year Operation Began</label>
                <input className="settings-input" name="yearOperationBegan" value={formik.values.yearOperationBegan} onChange={formik.handleChange} placeholder="e.g. 2018" />
              </div>
              <div className="settings-field">
                <label className="settings-label">Employment Size</label>
                <select className="settings-input" name="employmentSize" value={formik.values.employmentSize} onChange={formik.handleChange}>
                  <option value="small">Small (1–49 employees)</option>
                  <option value="medium">Medium (50–499 employees)</option>
                  <option value="large">Large (500+ employees)</option>
                </select>
              </div>
            </div>
            <div className="settings-field">
              <label className="settings-label">Major Areas of Operation</label>
              <textarea className="settings-input" rows={2} name="majorAreasOfOperation" value={formik.values.majorAreasOfOperation} onChange={formik.handleChange} placeholder="e.g. ICT training and software development" />
            </div>
            <div className="settings-field">
              <label className="settings-label">Products / Job Undertaken</label>
              <textarea className="settings-input" rows={2} name="productsJobUndertaken" value={formik.values.productsJobUndertaken} onChange={formik.handleChange} placeholder="e.g. Web development training, software consulting" />
            </div>
            <div className="settings-input-row">
              <div className="settings-field">
                <label className="settings-label">Full Operation Capacity</label>
                <input className="settings-input" name="fullOperation" value={formik.values.fullOperation} onChange={formik.handleChange} />
              </div>
              <div className="settings-field">
                <label className="settings-label">Minor Operation Capacity</label>
                <input className="settings-input" name="minorOperation" value={formik.values.minorOperation} onChange={formik.handleChange} />
              </div>
            </div>
            <div className="settings-field">
              <label className="settings-label">Capital Investment to Date</label>
              <input className="settings-input" name="capitalInvestment" value={formik.values.capitalInvestment} onChange={formik.handleChange} />
            </div>
            <div className="settings-field">
              <label className="settings-label">Other Relevant Information</label>
              <textarea className="settings-input" rows={2} name="otherRelevantInfo" value={formik.values.otherRelevantInfo} onChange={formik.handleChange} />
            </div>
          </div>
        </div>

        <button type="submit" className="settings-save-btn" disabled={formik.isSubmitting}>
          {formik.isSubmitting ? <div className="settings-spinner" /> : placement ? 'Update Company Profile' : 'Save Company Profile'}
        </button>
      </form>

      {/* Organogram — only once company profile exists */}
      {placement && (
        <div className="settings-section" style={{ marginTop: '20px' }}>
          <div className="settings-section-header">
            <div className="settings-section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </div>
            <div>
              <div className="settings-section-title">Organization Structure (Organogram)</div>
              <div className="settings-section-sub">Upload a sketch or chart of your company's structure</div>
            </div>
          </div>
          <div className="settings-section-body">
            {placement?.organogramImage ? (
              <div style={{ marginBottom: '16px' }}>
                <img src={placement.organogramImage} alt="Organogram" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
              </div>
            ) : (
              <p style={{ fontSize: '13.5px', color: '#94A3B8', marginBottom: '16px' }}>No organogram uploaded yet</p>
            )}
            <button type="button" className="settings-upload-btn" onClick={() => fileRef.current.click()} disabled={orgUploading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              {orgUploading ? 'Uploading...' : 'Upload Organogram'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleOrganogramUpload} />
          </div>
        </div>
      )}

      {/* Industry Supervisors — only once company profile exists */}
      {placement && (
        <div className="settings-section" style={{ marginTop: '20px' }}>
          <div className="settings-section-header">
            <div className="settings-section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            </div>
            <div>
              <div className="settings-section-title">Industry-Based Supervisors</div>
              <div className="settings-section-sub">Add everyone who has supervised you — you'll pick who approves each week when you submit</div>
            </div>
          </div>
          <div className="settings-section-body">

            {activeSupervisors.length === 0 && !showAddSupervisor && (
              <p style={{ fontSize: '13.5px', color: '#94A3B8', marginBottom: '16px' }}>
                No industry supervisor added yet — add at least one to start submitting weekly logs.
              </p>
            )}

            {activeSupervisors.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: showAddSupervisor ? '20px' : '0' }}>
                {activeSupervisors.map(sup => (
                  <div key={sup._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 16px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>{sup.name}</div>
                      <div style={{ fontSize: '12.5px', color: '#64748B' }}>{sup.email} · {sup.phone}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSupervisor(sup._id, sup.name)}
                      disabled={removingId === sup._id}
                      style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      {removingId === sup._id ? '...' : 'Remove'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {inactiveSupervisors.length > 0 && (
              <details style={{ marginBottom: showAddSupervisor ? '20px' : '12px' }}>
                <summary style={{ fontSize: '12.5px', color: '#94A3B8', cursor: 'pointer' }}>
                  {inactiveSupervisors.length} previous supervisor{inactiveSupervisors.length > 1 ? 's' : ''} (removed)
                </summary>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                  {inactiveSupervisors.map(sup => (
                    <div key={sup._id} style={{ fontSize: '12.5px', color: '#94A3B8', padding: '8px 12px', background: '#F8FAFC', borderRadius: '6px' }}>
                      {sup.name} · {sup.email}
                    </div>
                  ))}
                </div>
              </details>
            )}

            {showAddSupervisor ? (
              <form onSubmit={supervisorFormik.handleSubmit} noValidate style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                <div className="settings-field">
                  <label className="settings-label">Supervisor Full Name</label>
                  <input className="settings-input" name="name" value={supervisorFormik.values.name} onChange={supervisorFormik.handleChange} placeholder="e.g. Mr Pamilerin Mbini" />
                  {supervisorFormik.touched.name && supervisorFormik.errors.name && <div className="settings-error">{supervisorFormik.errors.name}</div>}
                </div>
                <div className="settings-input-row">
                  <div className="settings-field">
                    <label className="settings-label">Supervisor Email</label>
                    <input className="settings-input" name="email" value={supervisorFormik.values.email} onChange={supervisorFormik.handleChange} placeholder="supervisor@company.com" />
                    {supervisorFormik.touched.email && supervisorFormik.errors.email && <div className="settings-error">{supervisorFormik.errors.email}</div>}
                  </div>
                  <div className="settings-field">
                    <label className="settings-label">Supervisor Phone</label>
                    <input className="settings-input" name="phone" value={supervisorFormik.values.phone} onChange={supervisorFormik.handleChange} placeholder="08012345678" />
                    {supervisorFormik.touched.phone && supervisorFormik.errors.phone && <div className="settings-error">{supervisorFormik.errors.phone}</div>}
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '16px' }}>
                  They'll get an email immediately letting them know they've been added — no account needed on their end.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="settings-save-btn" disabled={addingSupervisor} style={{ marginTop: 0 }}>
                    {addingSupervisor ? <div className="settings-spinner" /> : 'Add Supervisor'}
                  </button>
                  <button type="button" className="settings-resend" onClick={() => setShowAddSupervisor(false)}>Cancel</button>
                </div>
              </form>
            ) : (
              <button type="button" className="settings-upload-btn" onClick={() => setShowAddSupervisor(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Industry Supervisor
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentPlacement
