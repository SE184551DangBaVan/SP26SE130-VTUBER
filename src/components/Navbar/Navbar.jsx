'use client';

import './Navbar.css'
import { useRouter } from "next/navigation";
import { ExpandMoreRounded, LiveTvRounded, AssignmentOutlined, NotificationsOutlined, PersonOutline, SettingsOutlined, LogoutOutlined, DarkModeOutlined, TranslateOutlined, ChatBubbleOutline, ArticleOutlined, EditNoteOutlined, FeedbackOutlined, AddOutlined } from '@mui/icons-material';
import { useState, useRef, useEffect } from 'react';
import LogoutButton from '@/functions/AccountActions/LogoutButton';
import {useAuth} from "@/functions/Auth/useAuth.jsx";

const Navbar = () => {
    const { logout, userAuth, loading } = useAuth();
    const router = useRouter();
    const [navScrollOffset, setNavScrollOffset] = useState(0);
    const rafRef = useRef(null);
    const lastScrollValue = useRef(0);
    const [open, setOpen] = useState(true);

    // Throttled scroll handler using requestAnimationFrame
    useEffect(() => {
        const handleScroll = () => {
            if (rafRef.current) return;

            rafRef.current = requestAnimationFrame(() => {
                const currentScroll = window.scrollY || window.pageYOffset;
                if (Math.abs(currentScroll - lastScrollValue.current) > 2) {
                    lastScrollValue.current = currentScroll;
                    setNavScrollOffset(currentScroll);
                }
                rafRef.current = null;
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    // User profile data from API
    const [profileData, setProfileData] = useState(null);

    // Dropdown states
    const [dailyMissionOpen, setDailyMissionOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
    const [updatingLanguage, setUpdatingLanguage] = useState(false);

    // Refs for click-outside detection
    const dailyMissionRef = useRef(null);
    const notificationRef = useRef(null);
    const profileDropdownRef = useRef(null);
    const languageDropdownRef = useRef(null);

    // Available languages for AI Translate
    const languageOptions = [
        { label: "English", value: "English" },
        { label: "Vietnamese", value: "Vietnamese" },
        { label: "Chinese (Simplified)", value: "Chinese (Simplified)" },
        { label: "Chinese (Traditional)", value: "Chinese (Traditional)" },
        { label: "Japanese", value: "Japanese" },
        { label: "Korean", value: "Korean" },
        { label: "Spanish", value: "Spanish" },
        { label: "French", value: "French" },
        { label: "German", value: "German" },
        { label: "Thai", value: "Thai" },
    ];

    // Fetch user profile data when logged in
    useEffect(() => {
        const fetchProfile = async () => {
            if (!userAuth) {
                setProfileData(null);
                return;
            }
            try {
                const token = sessionStorage.getItem("token") || localStorage.getItem("token");
                const response = await fetch(
                    "https://vtuber-fanhub-bsc3arfzhqhahshy.southeastasia-01.azurewebsites.net/vhub/api/v1/user/me",
                    {
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        setProfileData(result.data);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch user profile:", error);
            }
        };
        fetchProfile();
    }, [userAuth]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dailyMissionRef.current && !dailyMissionRef.current.contains(event.target)) {
        setDailyMissionOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setLanguageDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

    const handleLogout = () => {
        logout();
    }

    // Update user's translate language via API
    const handleUpdateLanguage = async (language) => {
        if (updatingLanguage) return;
        setUpdatingLanguage(true);
        try {
            const token = sessionStorage.getItem("token") || localStorage.getItem("token");
            const response = await fetch(
                "https://vtuber-fanhub-bsc3arfzhqhahshy.southeastasia-01.azurewebsites.net/vhub/api/v1/user/update",
                {
                    method: "PUT",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: profileData?.email || userAuth?.email,
                        displayName: profileData?.displayName || "",
                        translateLanguage: language,
                        bio: profileData?.bio || "",
                    }),
                }
            );
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setProfileData((prev) => ({ ...prev, translateLanguage: language }));
                }
            }
        } catch (error) {
            console.error("Failed to update language:", error);
        } finally {
            setUpdatingLanguage(false);
            setLanguageDropdownOpen(false);
        }
    };

    return (
    <header className={`header ${navScrollOffset > 20 ? 'away' : 'return' }`} >
        <nav className="navbar">
            <div className="nav-container">
              <div className="logo" onClick={()=>router.push("/home")}>
                  <img src="/Nav -_ Logo.svg" alt=''/>
              </div>

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

                {/* Navbar Actions */}
                <div className="navbar-actions">
                    {loading ? null : userAuth ? (
                        <>
                            {/* Daily Mission Dropdown */}
                            <div className="navbar-action-item" ref={dailyMissionRef}>
                                <button
                                    className={`navbar-action-btn ${dailyMissionOpen ? 'active' : ''}`}
                                    onClick={() => setDailyMissionOpen(!dailyMissionOpen)}
                                    aria-label="Daily Missions"
                                >
                                    <AssignmentOutlined />
                                </button>
                                {dailyMissionOpen && (
                                    <div className="dropdown-menu daily-mission-dropdown">
                                        <p className="dropdown-placeholder">Daily Mission Dropdown</p>
                                    </div>
                                )}
                            </div>

                            {/* Notification Dropdown */}
                            <div className="navbar-action-item" ref={notificationRef}>
                                <button
                                    className={`navbar-action-btn ${notificationOpen ? 'active' : ''}`}
                                    onClick={() => setNotificationOpen(!notificationOpen)}
                                    aria-label="Notifications"
                                >
                                    <NotificationsOutlined />
                                </button>
                                {notificationOpen && (
                                    <div className="dropdown-menu notification-dropdown">
                                        <p className="dropdown-placeholder">Notification Dropdown</p>
                                    </div>
                                )}
                            </div>

                            {/* User Profile Dropdown */}
                            <div className="navbar-action-item" ref={profileDropdownRef}>
                                <button
                                    className={`navbar-action-btn profile-btn ${profileDropdownOpen ? 'active' : ''}`}
                                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                                    aria-label="User Profile"
                                >
                                    <img
                                        src={profileData?.avatarUrl || "/profile-pic-undefined.jpg"}
                                        alt="User Avatar"
                                        className="user-avatar"
                                    />
                                </button>
                                {profileDropdownOpen && (
                                    <div className="dropdown-menu profile-dropdown">
                                        {/* Profile Header */}
                                        <div className="profile-dropdown-header">
                                            <img
                                                src={profileData?.avatarUrl || "/profile-pic-undefined.jpg"}
                                                alt="User Avatar"
                                                className="profile-avatar"
                                            />
                                            <div className="profile-greeting">
                                                <span className="greeting-text">Greetings,</span>
                                                <span className="username-text">{profileData?.displayName || userAuth.email}!</span>
                                            </div>
                                        </div>

                                        {/* Coins Section */}
                                        <div className="coins-section">
                                            <div className="coins-display">
                                                <span className="coin-icon-wrapper">
                                                    <span className="coin-icon">💎</span>
                                                    <span className="coin-tooltip">Points</span>
                                                </span>
                                                <span className="coin-amount">{profileData?.points ?? 0}</span>
                                            </div>
                                            <div className="coins-display paid-coins-display">
                                                <span className="coin-icon-wrapper">
                                                    <span className="coin-icon paid-coin-icon">💜</span>
                                                    <span className="coin-tooltip">Paid Points</span>
                                                </span>
                                                <span className="coin-amount paid-coin-amount">{profileData?.paidPoints ?? 0}</span>
                                            </div>
                                            <button className="add-coins-btn" aria-label="Add coins">
                                                <AddOutlined />
                                            </button>
                                        </div>

                                        {/* Menu Items */}
                                        <div className="profile-menu-items">
                                            <button className="profile-menu-item"
                                                    onClick={() => {router.push(`/user/${profileData?.username || userAuth.userId}`)}}>
                                                <PersonOutline />
                                                <span>User profile</span>
                                            </button>
                                            <button className="profile-menu-item">
                                                <SettingsOutlined />
                                                <span>Settings</span>
                                            </button>
                                            <button className="profile-menu-item" onClick={handleLogout}>
                                                <LogoutOutlined />
                                                <span>Logout</span>
                                            </button>
                                        </div>

                                        {/* Toggle Items */}
                                        <div className="profile-toggle-items">
                                            <button className="profile-toggle-item" onClick={() => setDarkMode(!darkMode)}>
                                                <DarkModeOutlined />
                                                <span>Dark mode: {darkMode ? 'ON' : 'OFF'}</span>
                                            </button>
                                            <div className="language-toggle-wrapper" ref={languageDropdownRef}>
                                                <button
                                                    className="profile-toggle-item language-toggle-btn"
                                                    onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
                                                >
                                                    <TranslateOutlined />
                                                    <span>AI Translate: {profileData?.translateLanguage || 'EN'}</span>
                                                </button>
                                                {languageDropdownOpen && (
                                                    <div className="language-dropdown">
                                                        {languageOptions.map((lang) => (
                                                            <button
                                                                key={lang.value}
                                                                className={`language-option ${profileData?.translateLanguage === lang.value ? 'active' : ''}`}
                                                                onClick={() => handleUpdateLanguage(lang.value)}
                                                                disabled={updatingLanguage}
                                                            >
                                                                {lang.label}
                                                                {profileData?.translateLanguage === lang.value && (
                                                                    <span className="check-mark">✓</span>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Additional Links */}
                                        <div className="profile-menu-items">
                                            <button className="profile-menu-item">
                                                <ChatBubbleOutline />
                                                <span>Your Comments</span>
                                            </button>
                                            <button className="profile-menu-item"
                                            onClick={() => {router.push("/my-posts")}}>
                                                <ArticleOutlined />
                                                <span>Your Posts</span>
                                            </button>
                                            <button className="profile-menu-item">
                                                <FeedbackOutlined />
                                                <span>Send Feedbacks</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <button className="login-btn" onClick={() => router.push('/login')}>
                            Login
                        </button>
                    )}
                </div>
            </div>
        </nav>
    </header>
  )
}

export default Navbar;