import { useNavigate } from 'react-router-dom'
import usePageTitle from '../hooks/usePageTitle'
import './ErrorPage.css'

const NotFoundPage = () => {
  usePageTitle('Page Not Found')
  const navigate = useNavigate()

  return (
    <div className="error-page">
      <nav className="error-nav">
        <div className="error-logo" onClick={() => navigate('/')}>
          SIWES<span>log</span>
        </div>
      </nav>

      <div className="error-body">
        <div className="error-code">404</div>
        <h1 className="error-title">Page not found</h1>
        <p className="error-desc">
          The page you're looking for doesn't exist, may have been moved, or the link you followed is broken.
        </p>
        <div className="error-actions">
          <button className="error-btn-primary" onClick={() => navigate('/')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Back to Home
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

export default NotFoundPage
