import { nav } from 'framer-motion/m';
import './Navbar.css'
import {useNavigate} from "react-router-dom";
import { Telegram } from '@mui/icons-material';

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <header className="header">
        <nav className="navbar">
            <div className="nav-container">
              <div className="logo"><span className='logoInitials'>Discord</span><span>Messaging</span><span>Clone</span><span><Telegram /></span></div>
              <ul className="nav-links">
                  <li><a href=""onClick={() => navigate('/')}>Introduction</a></li>
                  <li><a href="#demo">Demo</a></li>
                  <li><a href="">About</a></li>
              </ul>
              <button className="btn-primary" onClick={() => navigate('/admin/home')}>Get Started</button>
            </div>
        </nav>
    </header>
  )
}
