'use client';

import './Navbar.css'
import { useRouter } from "next/navigation";
import { ExpandMoreRounded, LiveTvRounded } from '@mui/icons-material';
import { useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from 'react';
import LogoutButton from '@/functions/AccountActions/LogoutButton';

const Navbar = ({LoggedIn}) => {
  const router = useRouter();
  const [navScrollOffset, setNavScrollOffset] = useState(0);
  const [open, setOpen] = useState(true);
  const [userProfile, setUserProfile] = useState({
    username: "",
    displayName: "",
    email: ""
  });

  const { scrollY } = useScroll();
    useMotionValueEvent(scrollY, "change", (latest) => {
      setNavScrollOffset(latest);
  });

  return (
    <header className={`header ${navScrollOffset > 20 ? 'away' : 'return' }`} >
        <nav className="navbar">
            <div className="nav-container">
              <div className="logo"><img src="/Nav -_ Logo.svg" alt=''/></div>
              
              {LoggedIn ?
              (<>
                <div className="search-bar">
                  <div className="InputContainer">
                    <input
                      className="input"
                      id="search-input"
                      placeholder="Search..."
                      type="text"
                    />
                  </div>
                  <div className="search-categories">
                    <div className={`categories-btn ${open ? '' : 'open'}`} onClick={() => setOpen(!open)}>
                      <span>All Categories</span>
                      <ExpandMoreRounded />
                    </div>
                    {!open ? (<div className='categories-menu-overlay' onClick={() => setOpen(true)}>
                      <div className='categories-menu'>
                        <ul className='category-list'>
                          <div className='category-name'>Gaming</div>
                          <li className='category-tag'></li>
                          <li className='category-tag'></li>
                          <li className='category-tag'></li>
                          <li className='category-tag'></li>
                        </ul>
                      </div>
                    </div>) : (<></>)}
                  </div>
                  <button aria-label="Voice search" className="searchButton">
                    <svg
                      className="searchIcon"
                      width="20px"
                      viewBox="0 0 24 24"
                      height="20px"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path fill="none" d="M0 0h24v24H0z"></path>
                      <path
                        d="M15.5 14h-.79l-.28-.27A6.518 6.518 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
                      ></path>
                    </svg>
                  </button>
                </div>
                <div className='quick-access'>
                  <div></div>
                  <div><LogoutButton /></div>
                  <div className='navbar-profile-pic'>Pfp</div>
                </div>
              </>)
              :
              (<>
                <ul className="nav-links">
                    <li className="nav-selected"><a href="" onClick={(e) => {e.preventDefault(); router.push('/');}}>Home</a></li>
                    <li><a href="" >Hubs</a></li>
                    <li><a href="" >Store</a></li>
                    <li><a href="" >About</a></li>
                </ul>
                <button className="button-primary" onClick={() => router.push('/login')}>
                  Login
                </button>
              </>)}
            </div>
        </nav>
    </header>
  )
}

export default Navbar;