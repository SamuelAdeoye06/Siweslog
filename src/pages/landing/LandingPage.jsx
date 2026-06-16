import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './LandingPage.css'

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1600&auto=format&fit=crop&q=80',
    eyebrow: 'Built for Nigerian Universities',
    title: <>The Modern Way to Manage <em>SIWES Logbooks</em></>,
    desc: 'Say goodbye to paper logbooks. SIWESlog digitizes the entire industrial training process — from student logs to supervisor sign-offs, all in one place.',
  },
  {
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&auto=format&fit=crop&q=80',
    eyebrow: 'Weekly Log Entries',
    title: <>Students Log Their Work. Supervisors <em>Sign Instantly.</em></>,
    desc: 'No more chasing signatures. Industry supervisors review and approve weekly entries with one click — from anywhere, any device.',
  },
  {
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1600&auto=format&fit=crop&q=80',
    eyebrow: 'Real-Time Monitoring',
    title: <>Schools Stay in <em>Full Control</em> of Every Student</>,
    desc: 'IT admins get a complete dashboard — track progress, assign supervisors, monitor placements and generate reports for ITF submission.',
  },
]

const features = [
  {
    title: 'Digital Weekly Logs',
    desc: 'Students fill Monday to Friday activities, weekly summaries and detailed reports online with auto-save.',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
    ),
  },
  {
    title: 'One-Click Supervisor Approval',
    desc: 'Industry supervisors get a secure link via email or WhatsApp to review and approve entries — no account needed.',
    icon: (
      <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
    ),
  },
  {
    title: 'School Supervisor Monitoring',
    desc: 'Academic supervisors track assigned students, comment on logs and record visit observations in real time.',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    ),
  },
  {
    title: 'Multi-School Platform',
    desc: 'Each university gets their own isolated workspace. One platform, multiple institutions, zero conflict.',
    icon: (
      <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
    ),
  },
  {
    title: 'PDF Export for ITF',
    desc: 'Generate a clean, complete PDF of any student logbook at the end of SIWES for ITF submission.',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    ),
  },
  {
    title: 'Secure and Tamper-Proof',
    desc: 'Approved entries are permanently locked. Every action is timestamped and verifiable with a unique code.',
    icon: (
      <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    ),
  },
]

const LandingPage = () => {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const [progressKey, setProgressKey] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length)
      setProgressKey(k => k + 1)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const goTo = (i) => {
    setCurrent(i)
    setProgressKey(k => k + 1)
  }

  const prev = () => {
    setCurrent(p => (p - 1 + slides.length) % slides.length)
    setProgressKey(k => k + 1)
  }

  const next = () => {
    setCurrent(p => (p + 1) % slides.length)
    setProgressKey(k => k + 1)
  }

  return (
    <div style={{ background: '#080F1F' }}>

      {/* Navbar */}
      <nav className="nav">
        <div className="nav-logo" onClick={() => navigate('/')}>
          SIWES<span>log</span>
        </div>

        <div className="nav-center-links">
          <button className="nav-link" onClick={() => navigate('/about')}>About</button>
          <button className="nav-link" onClick={() => navigate('/contact')}>Contact</button>
        </div>

        <div className="nav-links">
          <button className="nav-btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
          <button className="nav-btn-solid" onClick={() => navigate('/register')}>Get Started</button>
        </div>

        <button className="nav-hamburger" onClick={() => setMenuOpen(o => !o)}>
          {menuOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          )}
        </button>

        {menuOpen && (
          <div className="nav-mobile-menu">
            <button className="nav-mobile-link" onClick={() => { navigate('/about'); setMenuOpen(false) }}>About</button>
            <button className="nav-mobile-link" onClick={() => { navigate('/contact'); setMenuOpen(false) }}>Contact</button>
            <div className="nav-mobile-divider" />
            <button className="nav-mobile-link" onClick={() => { navigate('/login'); setMenuOpen(false) }}>Sign In</button>
            <button className="nav-mobile-btn" onClick={() => { navigate('/register'); setMenuOpen(false) }}>Get Started</button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="hero">
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`hero-slide ${i === current ? 'active' : ''}`}
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="hero-overlay" />
          </div>
        ))}

        <div className="hero-body">
          <div className="hero-eyebrow">{slides[current].eyebrow}</div>
          <h1 className="hero-title">{slides[current].title}</h1>
          <p className="hero-desc">{slides[current].desc}</p>
          <div className="hero-actions">
            <button className="hero-cta-primary" onClick={() => navigate('/register')}>
              Get Started Free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
            <button className="hero-cta-ghost" onClick={() => navigate('/login')}>
              Sign In
            </button>
          </div>
        </div>

        <button className="carousel-arrow prev" onClick={prev}>&#8249;</button>
        <button className="carousel-arrow next" onClick={next}>&#8250;</button>

        <div className="carousel-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`carousel-dot ${i === current ? 'active' : ''}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>

        <div key={progressKey} className="carousel-progress" />
      </section>

      {/* Stats */}
      <div className="stats-bar">
        {[
          { value: '100%', label: 'Paperless Process' },
          { value: '24/7', label: 'Access Anywhere' },
          { value: '5 min', label: 'School Setup Time' },
          { value: '4 roles', label: 'Fully Role-Based Access' },
        ].map((s, i) => (
          <div key={i} className="stat-block">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <section className="features">
        <div className="features-layout">
          <div className="features-left">
            <div className="section-label">Why SIWESlog</div>
            <h2 className="section-heading">Everything your school needs in one platform</h2>
            <p className="section-sub">
              Designed specifically for how Nigerian universities run their SIWES programme. No workarounds, no adapting generic tools.
            </p>
          </div>
          <div className="features-right">
            {features.map((f, i) => (
              <div key={i} className="feature-row">
                <div className="feature-row-icon">{f.icon}</div>
                <div>
                  <div className="feature-row-title">{f.title}</div>
                  <p className="feature-row-desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how">
        <div className="how-header">
          <div className="section-label">How It Works</div>
          <h2 className="section-heading">Up and running in minutes</h2>
          <p className="section-sub" style={{ margin: '0 auto' }}>
            From school registration to fully active logbooks — the entire setup takes less than a day.
          </p>
        </div>
        <div className="steps">
          {[
            { n: '01', title: 'School Registers', desc: 'Your IT unit signs up on SIWESlog and gets a unique registration code for students and supervisors.' },
            { n: '02', title: 'Students Sign Up', desc: 'Students register using the school code, fill personal data, company profile and organogram.' },
            { n: '03', title: 'Weekly Logging', desc: 'Students submit their log every week. Industry supervisors approve via a secure link — no account needed.' },
            { n: '04', title: 'Sign-Off and Export', desc: 'Academic supervisors visit, comment and sign off. Admin exports a clean PDF for ITF submission.' },
          ].map((s, i) => (
            <div key={i} className="step">
              <div className="step-num">{s.n}</div>
              <div className="step-title">{s.title}</div>
              <p className="step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who it's for */}
      <section className="roles">
        <div className="roles-header">
          <div className="section-label">Who It Is For</div>
          <h2 className="section-heading">Built for every stakeholder</h2>
          <p className="section-sub" style={{ margin: '0 auto' }}>
            Four distinct roles, each with a tailored experience designed around their specific responsibilities.
          </p>
        </div>
        <div className="roles-grid">
          {[
            { tag: 'Student', title: 'IT Students', desc: 'Log weekly activities, upload evidence, track your progress and submit for supervisor approval — all from your phone.' },
            { tag: 'Industry', title: 'Industry Supervisors', desc: 'Receive weekly approval requests via WhatsApp or email. Review and sign off on student entries in seconds.' },
            { tag: 'Academic', title: 'School Supervisors', desc: 'Monitor assigned students, record visit observations and sign off on logbooks when students return.' },
            { tag: 'Admin', title: 'IT Unit Admins', desc: 'Manage all students and supervisors, approve placements, track completion rates and export ITF reports.' },
          ].map((r, i) => (
            <div key={i} className="role-card">
              <div className="role-tag">{r.tag}</div>
              <div className="role-title">{r.title}</div>
              <p className="role-desc">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <h2 className="cta-title">Ready to take your school paperless?</h2>
        <p className="cta-sub">
          Join the future of SIWES management. Get your school on SIWESlog today.
        </p>
        <button className="cta-action" onClick={() => navigate('/register')}>
          Register Your School
        </button>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-top">
          <div className="footer-brand-col">
            <div className="footer-brand">SIWES<span>log</span></div>
            <p className="footer-tagline">
              Digitizing industrial training for Nigerian universities. Built for students, supervisors and schools.
            </p>
          </div>
          <div>
            <div className="footer-col-title">Platform</div>
            <ul className="footer-col-links">
              <li><a onClick={() => document.querySelector('.features').scrollIntoView({ behavior: 'smooth' })} style={{cursor:'pointer'}}>Features</a></li>
              <li><a onClick={() => document.querySelector('.how').scrollIntoView({ behavior: 'smooth' })} style={{cursor:'pointer'}}>How It Works</a></li>
              <li><a onClick={() => document.querySelector('.roles').scrollIntoView({ behavior: 'smooth' })} style={{cursor:'pointer'}}>Who It Is For</a></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-title">Get Started</div>
            <ul className="footer-col-links">
              <li><Link to="/register">Register Your School</Link></li>
              <li><Link to="/login">Sign In</Link></li>
              <li><Link to="/register">Student Registration</Link></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-title">Legal</div>
            <ul className="footer-col-links">
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Use</Link></li>
              <li><Link to="/cookies">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-copy">© {new Date().getFullYear()} SIWESlog. All rights reserved.</p>
          <div className="footer-legal">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/cookies">Cookies</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}

export default LandingPage
