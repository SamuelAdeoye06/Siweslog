import { useNavigate } from 'react-router-dom'
import usePageTitle from '../../hooks/usePageTitle'
import './StaticPage.css'

const AboutPage = () => {
  usePageTitle('About Us')
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
      <div className="static-hero">
        <div className="static-eyebrow">About Us</div>
        <h1 className="static-title">Built for Nigerian universities,<br /><em>by people who understand them.</em></h1>
        <p className="static-desc">SIWESlog was created to solve a problem every Nigerian IT student knows too well — the stress, cost and inefficiency of the physical SIWES logbook.</p>
      </div>
      <div className="static-body">
        <div className="static-section">
          <h2>The Problem We Solve</h2>
          <p>Every year, thousands of Nigerian university students are required to maintain physical SIWES logbooks during their industrial training. These logbooks need to be physically signed by industry supervisors weekly, carried around for school supervisor visits, and ultimately submitted to ITF at the end of the programme.</p>
          <p>The process is plagued with issues — logbooks get lost, supervisors are hard to reach, students pay out of pocket for printing, and schools have no real-time visibility into what their students are doing.</p>
        </div>
        <div className="static-section">
          <h2>What SIWESlog Does</h2>
          <p>SIWESlog is a multi-tenant SaaS platform that digitizes the entire SIWES logbook process. Students log their weekly activities online, industry supervisors approve via a simple link sent to their email, and school supervisors monitor everything from a dashboard in real time.</p>
          <p>Schools get a complete platform — student management, supervisor assignment, placement tracking, and PDF export for ITF submission. No more paper, no more lost logbooks, no more chasing signatures.</p>
        </div>
        <div className="static-section">
          <h2>Our Mission</h2>
          <p>To digitize industrial training management for every Nigerian university — making the SIWES process more transparent, accountable and stress-free for students, supervisors and institutions alike.</p>
        </div>
        <div className="static-cta">
          <h3>Ready to get started?</h3>
          <p>Register your school or sign up as a student today.</p>
          <button onClick={() => navigate('/register')}>Get Started</button>
        </div>
      </div>
      <footer className="static-footer">
        <div className="static-footer-brand">SIWES<span>log</span></div>
        <p>© {new Date().getFullYear()} SIWESlog. All rights reserved.</p>
      </footer>
    </div>
  )
}
export default AboutPage
