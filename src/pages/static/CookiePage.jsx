import { useNavigate } from 'react-router-dom'
import usePageTitle from '../../hooks/usePageTitle'
import './StaticPage.css'
const CookiePage = () => {
  usePageTitle('Cookie Policy')
  const navigate = useNavigate()
  return (
    <div className="static-page">
      <nav className="static-nav">
        <div className="static-logo" onClick={() => navigate('/')}>SIWES<span>log</span></div>
        <button className="static-back" onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back to home
        </button>
      </nav>
      <div className="static-hero"><div className="static-eyebrow">Legal</div><h1 className="static-title">Cookie Policy</h1><p className="static-desc">Last updated: January 2026</p></div>
      <div className="static-body">
        <div className="static-section"><h2>1. What Are Cookies</h2><p>Cookies are small text files stored on your device when you visit a website. SIWESlog uses cookies to keep you logged in securely and to remember your preferences.</p></div>
        <div className="static-section"><h2>2. Cookies We Use</h2><p>We use a single HttpOnly refresh token cookie for authentication purposes. This cookie cannot be accessed by JavaScript, making it secure against cross-site scripting attacks. We do not use advertising cookies or third-party tracking cookies.</p></div>
        <div className="static-section"><h2>3. Managing Cookies</h2><p>You can control cookies through your browser settings. Note that disabling cookies will prevent you from staying logged in to SIWESlog.</p></div>
        <div className="static-section"><h2>4. Contact</h2><p>For questions about our cookie usage, contact us at hello@siweslog.com.</p></div>
      </div>
      <footer className="static-footer"><div className="static-footer-brand">SIWES<span>log</span></div><p>© {new Date().getFullYear()} SIWESlog. All rights reserved.</p></footer>
    </div>
  )
}
export default CookiePage
