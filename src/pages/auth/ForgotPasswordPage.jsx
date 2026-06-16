import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import API from '../../api/axios'
import { useDialog } from '../../components/dialogContext'
import './LoginPage.css'
import './RegisterPage.css'

const passwordRules = Yup.string()
  .min(8, 'Minimum 8 characters')
  .matches(/[A-Z]/, 'Must include an uppercase letter')
  .matches(/[a-z]/, 'Must include a lowercase letter')
  .matches(/[0-9]/, 'Must include a number')
  .matches(/[@$!%*?&#^]/, 'Must include a special character')
  .required('Password is required')

const ErrorAlert = ({ message }) => (
  <div className="auth-alert">
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    {message}
  </div>
)

const SuccessAlert = ({ message }) => (
  <div className="auth-alert success">
    <svg viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
    {message}
  </div>
)

const ForgotPasswordPage = () => {
  const navigate = useNavigate()
  const { showAlert } = useDialog()
  const [step, setStep] = useState('email')
  const [serverError, setServerError] = useState('')
  const [notice, setNotice] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const emailFormik = useFormik({
    initialValues: { email: '' },
    validationSchema: Yup.object({
      email: Yup.string().email('Enter a valid email address').required('Email is required')
    }),
    onSubmit: async (values, helpers) => {
      setServerError('')
      setNotice('')
      try {
        const res = await API.post('/auth/forgot-password', values)
        setNotice(res.data.message)
        resetFormik.setFieldValue('email', values.email)
        setStep('reset')
      } catch (err) {
        setServerError(err.response?.data?.message || 'Could not send verification code. Please try again.')
      } finally {
        helpers.setSubmitting(false)
      }
    }
  })

  const resetFormik = useFormik({
    initialValues: {
      email: '',
      otp: '',
      newPassword: '',
      confirmPassword: ''
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Enter a valid email address').required('Email is required'),
      otp: Yup.string().matches(/^\d{6}$/, 'Enter the 6-digit code').required('Verification code is required'),
      newPassword: passwordRules,
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], 'Passwords do not match')
        .required('Please confirm your password')
    }),
    onSubmit: async (values, helpers) => {
      setServerError('')
      setNotice('')
      try {
        const res = await API.patch('/auth/reset-password', {
          email: values.email,
          otp: values.otp,
          newPassword: values.newPassword
        })
        await showAlert(res.data.message, {
          title: 'Password Reset Complete',
          confirmText: 'Sign In',
          variant: 'primary'
        })
        navigate('/login')
      } catch (err) {
        setServerError(err.response?.data?.message || 'Password reset failed. Please try again.')
      } finally {
        helpers.setSubmitting(false)
      }
    }
  })

  const resendCode = async () => {
    const email = resetFormik.values.email || emailFormik.values.email
    if (!email) return
    setServerError('')
    setNotice('')
    try {
      const res = await API.post('/auth/forgot-password', { email })
      setNotice(res.data.message)
    } catch (err) {
      setServerError(err.response?.data?.message || 'Could not resend verification code. Please try again.')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-logo" onClick={() => navigate('/')}>
          <div className="auth-logo-dot" />
          SIWES<span>log</span>
        </div>

        <div className="auth-left-body">
          <div className="auth-left-icon">
            <svg viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2 className="auth-left-heading">
            Reset<br />securely.
          </h2>
          <p className="auth-left-sub">
            We will send a short verification code to your registered email address.
          </p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-right-top">
          <p className="auth-switch">
            Remember your password?{' '}
            <a onClick={() => navigate('/login')}>Sign in</a>
          </p>
          <button className="auth-back-link" onClick={() => navigate('/')}>
            <svg viewBox="0 0 24 24">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Back to home
          </button>
        </div>

        <div className="auth-form-body">
          <h1 className="auth-form-title">Forgot Password</h1>
          <p className="auth-form-subtitle">
            {step === 'email'
              ? 'Enter your account email and we will send a reset code.'
              : 'Enter the code from your email and choose a new password.'}
          </p>

          {serverError && <ErrorAlert message={serverError} />}
          {notice && <SuccessAlert message={notice} />}

          {step === 'email' ? (
            <form onSubmit={emailFormik.handleSubmit} noValidate>
              <div className="field-group">
                <div className="field-label"><span>Email Address</span></div>
                <div className="field-input-wrap">
                  <div className="field-icon">
                    <svg viewBox="0 0 24 24">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="you@university.edu.ng"
                    className={`field-input ${emailFormik.touched.email && emailFormik.errors.email ? 'error' : ''}`}
                    value={emailFormik.values.email}
                    onChange={emailFormik.handleChange}
                    onBlur={emailFormik.handleBlur}
                  />
                </div>
                {emailFormik.touched.email && emailFormik.errors.email && (
                  <div className="field-error">{emailFormik.errors.email}</div>
                )}
              </div>

              <button type="submit" className="auth-submit" disabled={emailFormik.isSubmitting}>
                {emailFormik.isSubmitting ? <div className="spinner" /> : <>Send Verification Code<svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>}
              </button>
            </form>
          ) : (
            <form onSubmit={resetFormik.handleSubmit} noValidate>
              <div className="field-group">
                <div className="field-label">
                  <span>Email Address</span>
                  <a onClick={() => setStep('email')}>Change email</a>
                </div>
                <div className="field-input-wrap">
                  <div className="field-icon">
                    <svg viewBox="0 0 24 24">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <input
                    type="email"
                    name="email"
                    className="field-input"
                    value={resetFormik.values.email}
                    onChange={resetFormik.handleChange}
                    onBlur={resetFormik.handleBlur}
                  />
                </div>
              </div>

              <div className="field-group">
                <div className="field-label">
                  <span>Verification Code</span>
                  <a onClick={resendCode}>Resend code</a>
                </div>
                <div className="field-input-wrap">
                  <div className="field-icon">
                    <svg viewBox="0 0 24 24">
                      <line x1="4" y1="6" x2="20" y2="6"/>
                      <line x1="4" y1="12" x2="20" y2="12"/>
                      <line x1="4" y1="18" x2="14" y2="18"/>
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="otp"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    className={`field-input ${resetFormik.touched.otp && resetFormik.errors.otp ? 'error' : ''}`}
                    value={resetFormik.values.otp}
                    onChange={e => resetFormik.setFieldValue('otp', e.target.value.replace(/\D/g, ''))}
                    onBlur={resetFormik.handleBlur}
                  />
                </div>
                {resetFormik.touched.otp && resetFormik.errors.otp && (
                  <div className="field-error">{resetFormik.errors.otp}</div>
                )}
              </div>

              <div className="field-group">
                <div className="field-label"><span>New Password</span></div>
                <div className="field-input-wrap">
                  <div className="field-icon">
                    <svg viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="newPassword"
                    placeholder="Create a new password"
                    className={`field-input ${resetFormik.touched.newPassword && resetFormik.errors.newPassword ? 'error' : ''}`}
                    value={resetFormik.values.newPassword}
                    onChange={resetFormik.handleChange}
                    onBlur={resetFormik.handleBlur}
                  />
                  <button
                    type="button"
                    className="field-toggle"
                    onClick={() => setShowPassword(s => !s)}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                <div className="field-hint">Min 8 chars · uppercase · lowercase · number · special character</div>
                {resetFormik.touched.newPassword && resetFormik.errors.newPassword && (
                  <div className="field-error">{resetFormik.errors.newPassword}</div>
                )}
              </div>

              <div className="field-group">
                <div className="field-label"><span>Confirm Password</span></div>
                <div className="field-input-wrap">
                  <div className="field-icon">
                    <svg viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Repeat your new password"
                    className={`field-input ${resetFormik.touched.confirmPassword && resetFormik.errors.confirmPassword ? 'error' : ''}`}
                    value={resetFormik.values.confirmPassword}
                    onChange={resetFormik.handleChange}
                    onBlur={resetFormik.handleBlur}
                  />
                  <button
                    type="button"
                    className="field-toggle"
                    onClick={() => setShowConfirmPassword(s => !s)}
                  >
                    {showConfirmPassword ? (
                      <svg viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                {resetFormik.touched.confirmPassword && resetFormik.errors.confirmPassword && (
                  <div className="field-error">{resetFormik.errors.confirmPassword}</div>
                )}
              </div>

              <button type="submit" className="auth-submit" disabled={resetFormik.isSubmitting}>
                {resetFormik.isSubmitting ? <div className="spinner" /> : <>Reset Password<svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>}
              </button>
            </form>
          )}
        </div>

        <div className="auth-right-footer">
          © {new Date().getFullYear()} SIWESlog. All rights reserved.
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
