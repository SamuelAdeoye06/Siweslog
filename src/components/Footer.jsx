import './Footer.css'

const Footer = () => {
  return (
    <footer className="footer-wrapper">
      <div className="footer-inner">
        <div className="footer-logo">
          SIWES<span>log</span>
        </div>
        <p className="footer-tagline">
          Digitizing industrial training for Nigerian universities.
        </p>
        <p className="footer-copy">
          © {new Date().getFullYear()} SIWESlog. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer