'use client';

import './Login.css'
import { useAuth } from '../../functions/Auth/useAuth';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { showLoading, updateToast } from '../../utils/toastUtils';
import CheckBox from '../../components/CheckBox/CheckBox';
import ToggleVisibility from '../../components/ToggleVisibility/ToggleVisibility';
import ImageGalleryBackdrop from '../../components/ImageGalleryBackdrop/ImageGalleryBackdrop';

export default function Login() {
  const {login} = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [loginError, setLoginError] = useState(null);
  const [showExitAnimation, setShowExitAnimation] = useState(false);
  const [rotatingTextIndex, setRotatingTextIndex] = useState(0);

  const rotatingTexts = ["Interests", "Hobbies", "Oshi"];

  useEffect(() => {
    const interval = setInterval(() => {
      setRotatingTextIndex((prevIndex) => (prevIndex + 1) % rotatingTexts.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    const toastId = showLoading("Logging in...");
    try {
      setLoginError("");
      const response = await login(username, password, rememberMe);
      if (response.code === "ERR_BAD_REQUEST") {
        updateToast(toastId, "error", response.response.data.message);
        console.log("Error Login:", response)
        setLoginError(response.response.data.data);
      }
      else {
        updateToast(toastId, "success", "Login Success!");
        setShowExitAnimation(true);
        setTimeout(() => {
          router.push(response ? "/home" : "/login");
        }, 800);
      }

    } catch (error) {
      console.error("Login error:", error);
      updateToast(toastId, "error", "Login Failed. Please try again.");
      setLoginError(error.response?.data?.data ||"Login Failed. Please try again.");
    }
  };

  const handleNavigateToRegister = () => {
    setShowExitAnimation(true);
    setTimeout(() => {
      router.push("/register");
    }, 800);
  };

  return (
      <div className={`login-wrapper ${showExitAnimation ? 'exit' : ''}`}>
        <ImageGalleryBackdrop />
        <div className="background-grid-vfx login"></div>
        <div className="background-welcome-login">
          <div className="background-welcome-login-text">
            <span>Find A Community</span>
            <span>With Matching </span>
            <span className='background-welcome-login-rotating-text'>
              <p key={rotatingTextIndex} className="rotating-text-item">
                {rotatingTexts[rotatingTextIndex]}
              </p>
            </span>
            <span>Today!</span>
          </div>
        </div>
        <div className="card-switch">
          <div className="flip-card__inner">
            <div className="flip-card__front">
              <div className="flip-card__front-left">
                <div className="title">Log in</div>
                {loginError && <p className="login-error-message">{loginError}</p>}
                <form onSubmit={handleLogin} className="flip-card__form" >
                  <div className='input-field'><input className="flip-card__input" name="username" placeholder="Username" type="text" 
                  value={username} onChange={(e) => setUsername(e.target.value)} required />
                  <span className='required-field'>*</span></div>
                  <div className='input-field'><input className="flip-card__input" name="password" placeholder="Password" type={showPassword ? "text" : "password"}
                  value={password} onChange={(e) => setPassword(e.target.value)} required minLength="6" />
                  <div className='toggle-icon' onChange={() => setShowPassword(prev => !prev)}><ToggleVisibility/></div>
                  <span className='required-field'>*</span></div>
                  <div className='remember-me-box' onChange={() => setRememberMe(prev => !prev)}>Remember Me <CheckBox/></div>
                  <div className='auth-link'>
                    Don't have an account? <span className='link-text' onClick={handleNavigateToRegister}>Sign up</span>
                  </div>
                  <button className="flip-card__btn" type="submit">Login!</button>
                </form>
              </div>
              <div className="flip-card__front-right">
                <div className="flip-card__front-right-bg"></div>
                <div className="flip-card__front-right-welcome-text">
                  Welcome to
                  <div className="flip-card__front-right-welcome-text-logo">
                    <img src="/Nav -_ Logo.svg" alt=''/>
                  </div>!
                </div>
                <div className="flip-card__front-right-welcome-text-bottom">
                  Where Fans and Vtubers Connect!
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}
