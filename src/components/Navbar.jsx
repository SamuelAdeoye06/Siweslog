import { useNavigate } from 'react-router-dom'
import './Navbar.css'

const Navbar = () => {
  const navigate = useNavigate()

  return (
    <nav className="navbar-wrapper">
      <div className="navbar-logo" onClick={() => navigate('/')}>
        SIWES<span>log</span>
      </div>
      <div className="navbar-actions">
        <button className="btn-outline-custom" onClick={() => navigate('/login')}>
          Sign In
        </button>
        <button className="btn-primary-custom" onClick={() => navigate('/register')}>
          Get Started
        </button>
      </div>
    </nav>
  )
}

export default Navbar