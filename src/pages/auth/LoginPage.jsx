import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import API from '../../api/axios'
import useAuthStore from '../../store/authStore'
import usePageTitle from '../../hooks/usePageTitle'
import './LoginPage.css'

const LoginPage = () => {
  usePageTitle('Sign In')
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    // We deliberately do NOT pass validateOnMount/enableReinitialize here,
    // and onSubmit never calls resetForm() — so a failed login keeps
    // whatever the user typed in both fields.
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Enter a valid email address')
        .required('Email is required'),
      password: Yup.string()
        .required('Password is required'),
    }),
    onSubmit: async (values) => {
      setLoading(true)
      setServerError('')
      try {
        const res = await API.post('/auth/login', values)
        setAuth(res.data.user, res.data.accessToken)

        const role = res.data.user.role
        if (role === 'student') navigate('/student/dashboard')
        else if (role === 'it_admin') navigate('/admin/dashboard')
        else if (role === 'school_supervisor') navigate('/supervisor/dashboard')
        else if (role === 'super_admin') navigate('/super-admin/dashboard')
        else navigate('/')
      } catch (err) {
        // IMPORTANT: do not call formik.resetForm() or clear formik.values
        // here. The error message is set in local state (serverError) and
        // has no timer attached to it anywhere in this component — it will
        // stay visible until the user dismisses it or submits again.
        setServerError(err.response?.data?.message || 'Something went wrong. Please try again.')
      } finally {
        setLoading(false)
      }
    },
  })

  return (
    <div className="auth-page">

      {/* Left Panel */}
      <div className="auth-left">
        <div className="auth-logo" onClick={() => navigate('/')}>
          <div className="auth-logo-dot" />
          SIWES<span>log</span>
        </div>

        <div className="auth-left-body">
          <div className="auth-left-icon">
            <svg viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>

          <h2 className="auth-left-heading">
            Welcome<br />back.
          </h2>
          <p className="auth-left-sub">
            Your logbook, supervisor sign-offs and school records are right where you left them.
          </p>

          <div className="auth-stat-cards">
            {[
              { value: '100%', label: 'Paperless' },
              { value: '24/7', label: 'Access' },
              { value: 'Secure', label: 'Platform' },
            ].map((s, i) => (
              <div key={i} className="auth-stat-card">
                <div className="auth-stat-value">{s.value}</div>
                <div className="auth-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="auth-quote">
            <p>"Digitizing industrial training, one university at a time."</p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        <div className="auth-right-top">
          <p className="auth-switch">
            Don't have an account?{' '}
            <a onClick={() => navigate('/register')}>Create one free</a>
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
          <h1 className="auth-form-title">Sign In</h1>
          <p className="auth-form-subtitle">
            Enter your credentials to access your dashboard
          </p>

          {serverError && (
            <div className="auth-alert" role="alert">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span style={{ flex: 1 }}>{serverError}</span>
              <button
                type="button"
                onClick={() => setServerError('')}
                aria-label="Dismiss error"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'inherit',
                  fontSize: '18px',
                  lineHeight: 1,
                  padding: '0 0 0 8px',
                  opacity: 0.6,
                  flexShrink: 0
                }}
              >
                ×
              </button>
            </div>
          )}

          <form onSubmit={formik.handleSubmit} noValidate autoComplete="on">

            {/* Email */}
            <div className="field-group">
              <div className="field-label">
                <span>Email Address</span>
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
                  placeholder="you@university.edu.ng"
                  className={`field-input ${formik.touched.email && formik.errors.email ? 'error' : ''}`}
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </div>
              {formik.touched.email && formik.errors.email && (
                <div className="field-error">{formik.errors.email}</div>
              )}
            </div>

            {/* Password */}
            <div className="field-group">
              <div className="field-label">
                <span>Password</span>
                <a onClick={() => navigate('/forgot-password')}>Forgot password?</a>
              </div>
              <div className="field-input-wrap">
                <div className="field-icon">
                  <svg viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  className={`field-input ${formik.touched.password && formik.errors.password ? 'error' : ''}`}
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                <button
                  type="button"
                  className="field-toggle"
                  onClick={() => setShowPassword(p => !p)}
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
              {formik.touched.password && formik.errors.password && (
                <div className="field-error">{formik.errors.password}</div>
              )}
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? (
                <div className="spinner" />
              ) : (
                <>
                  Sign In
                  <svg viewBox="0 0 24 24">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </>
              )}
            </button>

          </form>
        </div>

        <div className="auth-right-footer">
          © {new Date().getFullYear()} SIWESlog. All rights reserved.
        </div>
      </div>

    </div>
  )
}

export default LoginPage
