import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import usePageTitle from '../../hooks/usePageTitle'
import './StaticPage.css'

const ContactPage = () => {
  usePageTitle('Contact Us')
  const navigate = useNavigate()
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
  }

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
        <div className="static-eyebrow">Contact Us</div>
        <h1 className="static-title">Get in touch with<br /><em>the SIWESlog team.</em></h1>
        <p className="static-desc">Have a question about onboarding your school, pricing, or how the platform works? We would love to hear from you.</p>
      </div>
      <div className="static-body">
        <div className="contact-layout">
          <div className="contact-info">
            <div className="contact-info-item">
              <div className="contact-info-label">Email</div>
              <div className="contact-info-value">hello@siweslog.com</div>
            </div>
            <div className="contact-info-item">
              <div className="contact-info-label">WhatsApp</div>
              <div className="contact-info-value">+234 800 000 0000</div>
            </div>
            <div className="contact-info-item">
              <div className="contact-info-label">Response Time</div>
              <div className="contact-info-value">Within 24 hours on business days</div>
            </div>
          </div>
          <div className="contact-form-wrap">
            {sent ? (
              <div className="contact-success">
                <div className="contact-success-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3>Message sent!</h3>
                <p>We will get back to you within 24 hours.</p>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="contact-row">
                  <div className="contact-field">
                    <label>Full Name</label>
                    <input type="text" placeholder="Your name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                  </div>
                  <div className="contact-field">
                    <label>Email Address</label>
                    <input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                  </div>
                </div>
                <div className="contact-field">
                  <label>Subject</label>
                  <input type="text" placeholder="e.g. School onboarding enquiry" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required />
                </div>
                <div className="contact-field">
                  <label>Message</label>
                  <textarea rows={5} placeholder="Tell us how we can help..." value={form.message} onChange={e => setForm({...form, message: e.target.value})} required />
                </div>
                <button type="submit" className="contact-submit">Send Message</button>
              </form>
            )}
          </div>
        </div>
      </div>
      <footer className="static-footer">
        <div className="static-footer-brand">SIWES<span>log</span></div>
        <p>© {new Date().getFullYear()} SIWESlog. All rights reserved.</p>
      </footer>
    </div>
  )
}
export default ContactPage
