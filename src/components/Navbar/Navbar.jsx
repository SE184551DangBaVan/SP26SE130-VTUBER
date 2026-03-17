import './Navbar.css'
import {useNavigate} from "react-router-dom";
import { LiveTvRounded } from '@mui/icons-material';
import { useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from 'react';
import Logo from "/Nav -_ Logo.svg"; 

const Navbar = ({LoggedIn}) => {
  const navigate = useNavigate();
  const [navScrollOffset, setNavScrollOffset] = useState(0);

  const { scrollY } = useScroll();
    useMotionValueEvent(scrollY, "change", (latest) => {
      setNavScrollOffset(latest);
  });

  return (
    <header className={`header ${navScrollOffset > 20 ? 'away' : 'return' }`} >
        <nav className="navbar">
            <div className="nav-container">
              <div className="logo"><img src={Logo} alt=''/></div>
              <ul className="nav-links">
                  <li className="nav-selected"><a href="" onClick={() => navigate('/')}>Home</a></li>
                  <li><a href="" >Hubs</a></li>
                  <li><a href="" >Store</a></li>
                  <li><a href="" >About</a></li>
              </ul>
              {LoggedIn ?
              (<div className='navbar-profile-pic'>Pfp</div>)
              :
              (<button className="button-primary" onClick={() => navigate('/home')}>
                Login
              </button>)}
            </div>
        </nav>
    </header>
  )
}

export default Navbar;