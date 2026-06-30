import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import API from '../../../api/axios'
import useAuthStore from '../../../store/authStore'
import { useToast } from '../../../components/ToastContext'
import './SettingsPage.css'

// ── ALERT ──
const Alert = ({ type, message }) => (
  <div className={`settings-alert ${type}`}>
    {type === 'error' ? (
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    ) : (
      <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
    )}
    {message}
  </div>
)

// ── PHOTO PREVIEW MODAL ──
const PhotoModal = ({ currentPhoto, initials, onClose, onSaved }) => {
  const { updateUser } = useAuthStore()
  const fileRef = useRef()
  const [preview, setPreview] = useState(currentPhoto || null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB')
      return
    }
    setError('')
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target.result)
    reader.readAsDataURL(file)
    // Reset input value so the same file can be re-selected after an error
    e.target.value = ''
  }

  const handleSave = async () => {
    if (!selectedFile) { setError('Please choose a photo first'); return }
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('photo', selectedFile)
      const res = await API.patch('/settings/update-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const photoUrl = res.data.profilePhoto
      // Sync into authStore so the topbar avatar updates immediately
      updateUser({ profilePhoto: photoUrl })
      onSaved({ profilePhoto: photoUrl })
    } catch (err) {
      // If the session token had just expired, axios already refreshed it
      // behind the scenes (see api/axios.js). To prevent the user from
      // having to click a second time, we immediately retry the request
      // with a fresh FormData instance.
      if (err.response?.status === 401) {
        try {
          const retryFormData = new FormData()
          retryFormData.append('photo', selectedFile)
          const res = await API.patch('/settings/update-photo', retryFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          const photoUrl = res.data.profilePhoto
          updateUser({ profilePhoto: photoUrl })
          onSaved({ profilePhoto: photoUrl })
        } catch (retryErr) {
          setError(retryErr.response?.data?.message || 'Photo upload failed. Please try again.')
        }
      } else {
        setError(err.response?.data?.message || 'Photo upload failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="photo-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="photo-modal">
        <div className="photo-modal-header">
          <div>
            <div className="photo-modal-title">Profile Picture</div>
            <div className="photo-modal-sub">Upload a new photo or keep your current one.</div>
          </div>
          <button className="photo-modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="photo-modal-preview-wrap">
          {preview ? (
            <img src={preview} alt="Preview" className="photo-modal-preview-img" />
          ) : (
            <div className="photo-modal-preview-placeholder">{initials}</div>
          )}
        </div>

        {error && <div className="photo-modal-error">{error}</div>}

        <button
          className="photo-modal-choose-btn"
          onClick={() => fileRef.current.click()}
          disabled={loading}
        >
          <svg viewBox="0 0 24 24"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
          Choose a photo
        </button>
        <div className="photo-modal-hint">JPG, PNG or WebP · Max 5MB</div>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        <div className="photo-modal-actions">
          <button className="photo-modal-cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="photo-modal-save" onClick={handleSave} disabled={loading || !selectedFile}>
            {loading ? <div className="settings-spinner" /> : 'Save Photo'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── PROFILE SECTION ──
const ProfileSection = ({ user, onUpdate }) => {
  const { showToast } = useToast()
  const [showModal, setShowModal] = useState(false)

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
    },
    validationSchema: Yup.object({
      firstName: Yup.string().required('First name is required'),
      lastName: Yup.string().required('Last name is required'),
    }),
    onSubmit: async (values) => {
      try {
        const res = await API.patch('/settings/update-profile', values)
        const stored = JSON.parse(localStorage.getItem('user') || '{}')
        const updated = { ...stored, firstName: res.data.user.firstName, lastName: res.data.user.lastName }
        localStorage.setItem('user', JSON.stringify(updated))
        showToast('Profile updated successfully', 'success')
        onUpdate(res.data.user)
      } catch (err) {
        showToast(err.response?.data?.message || 'Update failed', 'error')
      }
    }
  })

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : '?'

  const handlePhotoSaved = useCallback((updates) => {
    onUpdate(updates)
    setShowModal(false)
    showToast('Profile photo updated successfully', 'success')
  }, [onUpdate, showToast])

  return (
    <>
      {showModal && (
        <PhotoModal
          currentPhoto={user?.profilePhoto}
          initials={initials}
          onClose={() => setShowModal(false)}
          onSaved={handlePhotoSaved}
        />
      )}
      <div className="settings-section">
        <div className="settings-section-header">
          <div className="settings-section-icon">
            <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div>
            <div className="settings-section-title">Profile Information</div>
            <div className="settings-section-sub">Update your name, phone and profile photo</div>
          </div>
        </div>
        <div className="settings-section-body">
          {/* Photo */}
          <div className="settings-photo-row">
            <div className="settings-avatar-wrap">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt="Profile" className="settings-avatar" />
              ) : (
                <div className="settings-avatar-placeholder">{initials}</div>
              )}
              <button
                className="settings-avatar-camera-btn"
                onClick={() => setShowModal(true)}
                title="Change photo"
              >
                <svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </button>
            </div>
            <div className="settings-photo-actions">
              <button
                className="settings-upload-btn"
                onClick={() => setShowModal(true)}
              >
                <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Upload Photo
              </button>
              <span className="settings-photo-hint">JPG, PNG or WebP · Max 5MB</span>
            </div>
          </div>

          {/* Name fields */}
          <form onSubmit={formik.handleSubmit} noValidate>
            <div className="settings-input-row">
              <div className="settings-field">
                <label className="settings-label">First Name</label>
                <input
                  className="settings-input"
                  name="firstName"
                  value={formik.values.firstName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.firstName && formik.errors.firstName && (
                  <div className="settings-error">{formik.errors.firstName}</div>
                )}
              </div>
              <div className="settings-field">
                <label className="settings-label">Last Name</label>
                <input
                  className="settings-input"
                  name="lastName"
                  value={formik.values.lastName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.lastName && formik.errors.lastName && (
                  <div className="settings-error">{formik.errors.lastName}</div>
                )}
              </div>
            </div>
            <div className="settings-field">
              <label className="settings-label">Phone Number</label>
              <input
                className="settings-input"
                name="phone"
                value={formik.values.phone}
                onChange={formik.handleChange}
                placeholder="08012345678"
              />
            </div>
            <div className="settings-field">
              <label className="settings-label">Email Address</label>
              <input className="settings-input" value={user?.email || ''} readOnly />
            </div>
            <button type="submit" className="settings-save-btn" disabled={formik.isSubmitting}>
              {formik.isSubmitting ? <div className="settings-spinner" /> : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

// ── PASSWORD SECTION ──
const PasswordSection = () => {
  const navigate = useNavigate()
  const { clearAuth } = useAuthStore()
  const [step, setStep] = useState('idle') // idle | sent | confirm
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleRequestOTP = async () => {
    setLoading(true)
    setAlert(null)
    try {
      const res = await API.post('/settings/request-password-change')
      setAlert({ type: 'success', message: res.data.message })
      setStep('sent')
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to send OTP' })
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!otp || otp.length !== 6) {
      setAlert({ type: 'error', message: 'Enter the 6-digit code from your email' })
      return
    }
    if (!newPassword) {
      setAlert({ type: 'error', message: 'Enter your new password' })
      return
    }
    setLoading(true)
    setAlert(null)
    try {
      const res = await API.patch('/settings/confirm-password-change', { otp, newPassword })
      setAlert({ type: 'success', message: res.data.message })
      setTimeout(() => {
        clearAuth()
        navigate('/login')
      }, 2000)
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to change password' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <div className="settings-section-icon">
          <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <div>
          <div className="settings-section-title">Change Password</div>
          <div className="settings-section-sub">A verification code will be sent to your email</div>
        </div>
      </div>
      <div className="settings-section-body">
        {alert && <Alert type={alert.type} message={alert.message} />}

        {step === 'idle' && (
          <div>
            <p style={{ fontSize: '13.5px', color: '#64748B', marginBottom: '16px', lineHeight: '1.6' }}>
              Click the button below to receive a 6-digit verification code on your registered email address. You will need this code to set your new password.
            </p>
            <button className="settings-save-btn" onClick={handleRequestOTP} disabled={loading}>
              {loading ? <div className="settings-spinner" /> : 'Send Verification Code'}
            </button>
          </div>
        )}

        {(step === 'sent') && (
          <div className="settings-otp-step">
            <div className="settings-otp-sent">
              <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              Verification code sent to your email. Enter it below.
            </div>
            <div className="settings-field">
              <label className="settings-label">Verification Code</label>
              <input
                className="settings-otp-input"
                type="text"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <div className="settings-field">
              <label className="settings-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="settings-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 chars · uppercase · lowercase · number · special char"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {showPassword
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                    }
                  </svg>
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="settings-save-btn" onClick={handleConfirm} disabled={loading}>
                {loading ? <div className="settings-spinner" /> : 'Change Password'}
              </button>
              <button className="settings-resend" onClick={handleRequestOTP} disabled={loading}>
                Resend code
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── ACCOUNT INFO SECTION ──
const AccountInfoSection = ({ user }) => {
  const roleLabels = {
    student: 'Student',
    school_supervisor: 'School Supervisor',
    it_admin: 'IT Admin',
    super_admin: 'Super Admin',
    industry_supervisor: 'Industry Supervisor'
  }

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <div className="settings-section-icon">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        </div>
        <div>
          <div className="settings-section-title">Account Information</div>
          <div className="settings-section-sub">Read-only details about your account</div>
        </div>
      </div>
      <div className="settings-section-body">
        <div className="settings-info-grid">
          <div className="settings-info-item">
            <div className="settings-info-label">Role</div>
            <div className="settings-info-value">{roleLabels[user?.role] || user?.role}</div>
          </div>
          <div className="settings-info-item">
            <div className="settings-info-label">School</div>
            <div className="settings-info-value">{user?.schoolId?.name || 'N/A'}</div>
          </div>
          <div className="settings-info-item">
            <div className="settings-info-label">Email</div>
            <div className="settings-info-value" style={{ fontSize: '13px' }}>{user?.email}</div>
          </div>
          <div className="settings-info-item">
            <div className="settings-info-label">Member Since</div>
            <div className="settings-info-value">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
            </div>
          </div>
        </div>

        {/* Show registration code for IT admin */}
        {user?.role === 'it_admin' && user?.schoolId?.registrationCode && (
          <div className="settings-code-box">
            <div className="settings-code-label">School Registration Code</div>
            <div className="settings-code-value">{user.schoolId.registrationCode}</div>
            <div className="settings-code-hint">Share this code with students and supervisors to register</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── DANGER ZONE ──
const DangerZone = () => {
  const navigate = useNavigate()
  const { clearAuth } = useAuthStore()
  const [step, setStep] = useState('idle')
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)
  const [otp, setOtp] = useState('')

  const handleRequestDeletion = async () => {
    setLoading(true)
    setAlert(null)
    try {
      const res = await API.post('/settings/request-account-deletion')
      setAlert({ type: 'success', message: res.data.message })
      setStep('confirm')
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to send OTP' })
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDeletion = async () => {
    if (!otp || otp.length !== 6) {
      setAlert({ type: 'error', message: 'Enter the 6-digit code from your email' })
      return
    }
    setLoading(true)
    setAlert(null)
    try {
      await API.delete('/settings/confirm-account-deletion', { data: { otp } })
      clearAuth()
      navigate('/')
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Deletion failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="settings-danger-section">
      <div className="settings-danger-header">
        <div className="settings-danger-title">Danger Zone</div>
        <div className="settings-danger-sub">These actions are permanent and cannot be undone</div>
      </div>
      <div className="settings-danger-body">
        {alert && <Alert type={alert.type} message={alert.message} />}

        {step === 'idle' && (
          <>
            <p className="settings-danger-desc">
              Deleting your account will permanently remove all your data including your logbook entries, placements and profile. This action cannot be reversed.
            </p>
            <button className="settings-danger-btn" onClick={handleRequestDeletion} disabled={loading}>
              {loading ? 'Sending code...' : 'Delete My Account'}
            </button>
          </>
        )}

        {step === 'confirm' && (
          <div className="settings-otp-step">
            <p className="settings-danger-desc">
              Enter the 6-digit verification code sent to your email to confirm account deletion.
            </p>
            <div className="settings-field">
              <label className="settings-label">Verification Code</label>
              <input
                className="settings-otp-input"
                type="text"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="settings-danger-btn" onClick={handleConfirmDeletion} disabled={loading}>
                {loading ? 'Deleting...' : 'Confirm Deletion'}
              </button>
              <button className="settings-resend" onClick={() => setStep('idle')}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── MAIN SETTINGS PAGE ──
const SettingsPage = () => {
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get('/settings/me')
        setUserData(res.data.user)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleUpdate = (updates) => {
    setUserData(prev => ({ ...prev, ...updates }))
  }

  if (loading) {
    return <div className="dash-loading"><div className="dash-spinner" /></div>
  }

  const canDeleteAccount = ['student', 'school_supervisor'].includes(userData?.role)

  return (
    <div className="settings-wrap">
      <div className="dash-page-header">
        <div className="dash-page-title">Settings</div>
        <div className="dash-page-sub">Manage your account preferences and security</div>
      </div>

      <ProfileSection user={userData} onUpdate={handleUpdate} />
      <AccountInfoSection user={userData} />
      <PasswordSection />
      {canDeleteAccount && <DangerZone />}
    </div>
  )
}

export default SettingsPage
