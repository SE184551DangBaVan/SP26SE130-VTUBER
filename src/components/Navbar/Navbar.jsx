import './Navbar.css'
import {useNavigate} from "react-router-dom";
import { LiveTvRounded } from '@mui/icons-material';
import { useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from 'react';

export default function Navbar() {
  const navigate = useNavigate();
  const [navScrollOffset, setNavScrollOffset] = useState(0);

  const { scrollY } = useScroll();
    useMotionValueEvent(scrollY, "change", (latest) => {
      setNavScrollOffset(latest);
  });

  return (
    <header className="header">
        <nav className="navbar">
            <div className="nav-container" style={{border: `${navScrollOffset > 20 ? '2px solid #303030' : '2px solid transparent' }`,
                                                  backgroundColor: `${navScrollOffset > 20 ? 'rgb(255, 255, 255)' : 'transparent'}`}}>
              <div className="logo"><span className='logoInitials'>VTuber</span><span>Fan</span><span>Hub</span><span><LiveTvRounded /></span></div>
              <ul className="nav-links">
                  <li><a href=""onClick={() => navigate('/')}>Introduction</a></li>
                  <li><a href="#demo">Demo</a></li>
                  <li><a href="">About</a></li>
              </ul>
              <button className="button-primary" onClick={() => navigate('/home')}>
                Login
              </button>
            </div>
        </nav>
    </header>
  )
}
