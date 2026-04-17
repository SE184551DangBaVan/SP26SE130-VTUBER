'use client';

import './Navbar.css'
import { useRouter } from "next/navigation";
import { ExpandMoreRounded, LiveTvRounded, AssignmentOutlined, NotificationsOutlined, PersonOutline, SettingsOutlined, LogoutOutlined, DarkModeOutlined, TranslateOutlined, ChatBubbleOutline, ArticleOutlined, EditNoteOutlined, FeedbackOutlined, AddOutlined, PostAdd } from '@mui/icons-material';
import { useState, useRef, useEffect } from 'react';
import {useAuth} from "@/functions/Auth/useAuth.jsx";
import { updateUserProfile } from '@/services/UserController';
import { languageOptions } from '@/constants/languageOptions';
import NotificationDropdown from '../Notification/NotificationDropdown';
import DailyMissionDropdown from '../DailyMission/DailyMissionDropdown';
import { useNotifications } from '@/hooks/useNotifications';

import PointsIco from '../../assets/UI-Elements/Coin.png';
import PaidPointsIco from "../../assets/UI-Elements/le'Gem.gif";

const Navbar = () => {
    const {
        logout,
        userAuth,
        loading,
        displayName,
        avatarUrl,
        points,
        paidPoints,
        translateLanguage,
        bio,
        refreshUser
    } = useAuth();
    const router = useRouter();
    const [navScrollOffset, setNavScrollOffset] = useState(0);
    const rafRef = useRef(null);
    const lastScrollValue = useRef(0);
    const [open, setOpen] = useState(true);

    // Notifications logic
    const {
        notifications,
        unreadCount,
        handleMarkAsRead,
        handleMarkAllAsRead,
        handleDelete,
        filter,
        setFilter,
        hasMore,
        handleLoadMore,
        loadingMore
    } = useNotifications(userAuth);

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
            const result = await updateUserProfile({
                email: userAuth?.email || "",
                displayName: displayName || "",
                translateLanguage: language,
                bio: bio || "",
            });

            if (result?.success) {
                await refreshUser();
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
                            {/* Create Post Button */}
                            <div className="navbar-action-item">
                                <button
                                    className="navbar-action-btn create-post-btn"
                                    onClick={() => router.push('/create-post')}
                                    aria-label="Create Post"
                                >
                                    <PostAdd />
                                </button>
                            </div>

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
                                    <div className="dropdown-menu navbar-daily-mission-dropdown">
                                        <DailyMissionDropdown />
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
                                    {unreadCount > 0 && (
                                        <span className="notification-badge">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                </button>
                                {notificationOpen && (
                                    <NotificationDropdown
                                        notifications={notifications}
                                        onMarkAllAsRead={handleMarkAllAsRead}
                                        onDelete={handleDelete}
                                        filter={filter}
                                        onFilterChange={setFilter}
                                        hasMore={hasMore}
                                        onLoadMore={handleLoadMore}
                                        loadingMore={loadingMore}
                                        onNotificationClick={(notif) => {
                                            handleMarkAsRead(notif.id);
                                            if (notif.relatedPostId) {
                                                router.push(`/posts?id=${notif.relatedPostId}`);
                                            } else if (notif.triggeredByUsername) {
                                                router.push(`/user/${notif.triggeredByUsername}`);
                                            }
                                            setNotificationOpen(false);
                                        }}
                                    />
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
                                        src={avatarUrl || "/profile-pic-undefined.jpg"}
                                        alt="User Avatar"
                                        className="user-avatar"
                                    />
                                </button>
                                {profileDropdownOpen && (
                                    <div className="dropdown-menu profile-dropdown">
                                        {/* Profile Header */}
                                        <div className="profile-dropdown-header">
                                            <img
                                                src={avatarUrl || "/profile-pic-undefined.jpg"}
                                                alt="User Avatar"
                                                className="profile-avatar"
                                            />
                                            <div className="profile-greeting">
                                                <span className="greeting-text">Greetings,</span>
                                                <span className="username-text" title={`${displayName || userAuth.email}`}>{displayName || userAuth.email}!</span>
                                            </div>
                                        </div>

                                        {/* Coins Section */}
                                        <div className="coins-section">
                                            <div className="coins-display">
                                                <span className="coin-icon-wrapper">
                                                    <img className="coin-icon" src={PointsIco.src} alt='points'/>
                                                    <span className="coin-tooltip">Points</span>
                                                </span>
                                                <span className="coin-amount">{points ?? 0}</span>
                                            </div>
                                            <div className="coins-display paid-coins-display">
                                                <span className="coin-icon-wrapper">
                                                    <img className="coin-icon paid-coin-icon" src={PaidPointsIco.src} alt='paid points'/>
                                                    <span className="coin-tooltip">Paid Points</span>
                                                </span>
                                                <span className="coin-amount paid-coin-amount">{paidPoints ?? 0}</span>
                                            </div>
                                            <button className="add-coins-btn" aria-label="Add coins">
                                                <AddOutlined />
                                            </button>
                                        </div>

                                        {/* Menu Items */}
                                        <div className="profile-menu-items">
                                            <button className="profile-menu-item"
                                                    onClick={() => {router.push(`/user/${userAuth.email}`)}}>
                                                <PersonOutline />
                                                <span>User profile</span>
                                            </button>
                                            <button className="profile-menu-item"
                                            onClick={() => {router.push("/settings")}}>
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
                                                    <span>AI Translate: {translateLanguage || 'EN'}</span>
                                                </button>
                                                {languageDropdownOpen && (
                                                    <div className="language-dropdown">
                                                        {languageOptions.map((lang) => (
                                                            <button
                                                                key={lang.value}
                                                                className={`language-option ${translateLanguage === lang.value ? 'active' : ''}`}
                                                                onClick={() => handleUpdateLanguage(lang.value)}
                                                                disabled={updatingLanguage}
                                                            >
                                                                {lang.label}
                                                                {translateLanguage === lang.value && (
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
                                            <button className="profile-menu-item"
                                            onClick={() => {router.push("/my-reports")}}>
                                                <AssignmentOutlined />
                                                <span>Your Reports</span>
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