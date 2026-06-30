import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import usePageTitle from '../hooks/usePageTitle'
import './ErrorPage.css'

const roleDashboard = {
  student: '/student/dashboard',
  it_admin: '/admin/dashboard',
  school_supervisor: '/supervisor/dashboard',
  super_admin: '/super-admin/dashboard',
}

const UnauthorizedPage = () => {
  usePageTitle('Access Denied')
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const handleGoHome = () => {
    if (user && roleDashboard[user.role]) {
      navigate(roleDashboard[user.role])
    } else {
      navigate('/')
    }
  }

  return (
    <div className="error-page">
      <nav className="error-nav">
        <div className="error-logo" onClick={() => navigate('/')}>
          SIWES<span>log</span>
        </div>
      </nav>

      <div className="error-body">
        <div className="error-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h1 className="error-title">Access denied</h1>
        <p className="error-desc">
          You don't have permission to view this page. It may belong to a different account type.
        </p>
        <div className="error-actions">
          <button className="error-btn-primary" onClick={handleGoHome}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            {user ? 'Go to My Dashboard' : 'Back to Home'}
          </button>
          <button className="error-btn-secondary" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>

      <div className="error-footer">© {new Date().getFullYear()} SIWESlog. All rights reserved.</div>
    </div>
  )
}

export default UnauthorizedPage
