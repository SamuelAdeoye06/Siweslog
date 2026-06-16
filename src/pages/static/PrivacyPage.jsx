import { useNavigate } from 'react-router-dom'
import './StaticPage.css'
const PrivacyPage = () => {
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
      <div className="static-hero"><div className="static-eyebrow">Legal</div><h1 className="static-title">Privacy Policy</h1><p className="static-desc">Last updated: January 2026</p></div>
      <div className="static-body">
        <div className="static-section"><h2>1. Information We Collect</h2><p>We collect information you provide directly to us when you register, including your name, email address, phone number, institutional details, and any content you submit through the platform such as weekly logbook entries.</p></div>
        <div className="static-section"><h2>2. How We Use Your Information</h2><p>We use your information to provide and improve our services, facilitate communication between students, supervisors and institutions, send notifications about your logbook activity, and comply with legal obligations.</p></div>
        <div className="static-section"><h2>3. Data Sharing</h2><p>We do not sell your personal data. We share your information only with your institution (the school you are registered under) and industry supervisors assigned to you, as necessary to deliver our services.</p></div>
        <div className="static-section"><h2>4. Data Security</h2><p>We implement industry-standard security measures including encrypted data transmission, hashed passwords, and role-based access controls to protect your information.</p></div>
        <div className="static-section"><h2>5. Your Rights</h2><p>You have the right to access, correct, or request deletion of your personal data. Contact us at hello@siweslog.com for any data-related requests.</p></div>
        <div className="static-section"><h2>6. Contact</h2><p>If you have questions about this privacy policy, please contact us at hello@siweslog.com.</p></div>
      </div>
      <footer className="static-footer"><div className="static-footer-brand">SIWES<span>log</span></div><p>© {new Date().getFullYear()} SIWESlog. All rights reserved.</p></footer>
    </div>
  )
}
export default PrivacyPage
