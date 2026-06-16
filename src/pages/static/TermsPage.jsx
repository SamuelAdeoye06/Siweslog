import { useNavigate } from 'react-router-dom'
import './StaticPage.css'
const TermsPage = () => {
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
      <div className="static-hero"><div className="static-eyebrow">Legal</div><h1 className="static-title">Terms of Use</h1><p className="static-desc">Last updated: January 2026</p></div>
      <div className="static-body">
        <div className="static-section"><h2>1. Acceptance of Terms</h2><p>By accessing or using SIWESlog, you agree to be bound by these Terms of Use. If you do not agree, you may not use the platform.</p></div>
        <div className="static-section"><h2>2. Use of the Platform</h2><p>SIWESlog is intended for use by Nigerian university students, academic supervisors, industry supervisors, and institutional administrators in connection with the SIWES industrial training programme. You agree to use the platform only for its intended purpose and in compliance with all applicable laws.</p></div>
        <div className="static-section"><h2>3. Account Responsibilities</h2><p>You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account. You must not share your login details with others or attempt to access accounts that do not belong to you.</p></div>
        <div className="static-section"><h2>4. Content</h2><p>You retain ownership of the content you submit to SIWESlog. By submitting content, you grant SIWESlog a limited licence to store and display that content as necessary to provide the service.</p></div>
        <div className="static-section"><h2>5. Termination</h2><p>We reserve the right to suspend or terminate accounts that violate these terms or are used in a manner that is fraudulent, abusive, or harmful to other users.</p></div>
        <div className="static-section"><h2>6. Contact</h2><p>For questions about these terms, contact us at hello@siweslog.com.</p></div>
      </div>
      <footer className="static-footer"><div className="static-footer-brand">SIWES<span>log</span></div><p>© {new Date().getFullYear()} SIWESlog. All rights reserved.</p></footer>
    </div>
  )
}
export default TermsPage
