'use client';

import './Login.css'
import { useAuth } from '../../functions/Auth/useAuth';
import { verifyEmail, signUp } from '../../functions/Auth/registerAccount';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { showSuccess, showError, showLoading, updateToast } from '../../utils/toastUtils';
import CheckBox from '../../components/CheckBox/CheckBox';
import ToggleVisibility from '../../components/ToggleVisibility/ToggleVisibility';
import RetroWindow from '../../components/RetroWindow/RetroWindow';
import IDBadgeIcon from '../../assets/UI-Elements/id-badge-identity-card-svgrepo-com.svg'

export default function Login() {
  const {login} = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [email, setEmail] = useState("");
  const [emailEntered, setEmailEntered] = useState("");
  const [password, setPassword] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [translateLanguage, setTranslateLanguage] = useState("En");
  const [bio, setBio] = useState("");
  const [otp, setOtp] = useState("");
  const [userInput, setUserInput] = useState("");
  const [confirmUserInput, setConfirmUserInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showOTPBox, setShowOTPBox] = useState(false);
  const [showInfoBox, setShowInfoBox] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [switchLogin, setSwitchLogin] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    const toastId = showLoading("Logging in...");
    try {
      setError("");
      const response = await login(username, password, rememberMe);
      if (response.code === "ERR_BAD_REQUEST") {
        updateToast(toastId, "error", response.response.data.message);
        console.log("Error Login:", response)
        setError(response.response.data.data);
      }
      else {
        updateToast(toastId, "success", "Login Success!");
        setTimeout(() => {
          router.push(response ? "/home" : "/login");
        }, 100);
      }

    } catch (error) {
      console.error("Login error:", error);
      updateToast(toastId, "error", "Network Error. Please try again.");
      setError("Login Failed. Please try again.");
    }
  };
  
  const handleSignup = async (e) => {
    e.preventDefault();
    const toastId = showLoading("Creating account...");

    try {
      setError("");
      const response = await signUp(  
        registerUsername,
        emailEntered,
        registerPassword,
        displayName,
        translateLanguage,
        bio,
        otp
      );

      if (response.message !== "Fail") {
        updateToast(toastId, "success", "Account created successfully!");

        resetSignupState();
        setTimeout(() => {
          setSwitchLogin(!switchLogin);
        }, 500);
      } else {
        updateToast(toastId, "error", response.data || "Signup failed");
        setError(response.message);
      }

    } catch (error) {
      console.error("Signup error:", error);

      const message =
        error.response?.data?.message || "Signup failed. Please try again.";

      updateToast(toastId, "error", message);
      setError(message);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    const toastId = showLoading("Verify Email...");
    try {
      setError("");
      const response = await verifyEmail(email);
      setEmailEntered(email);
      if (response) {
        setOtp(response.data);
        updateToast(toastId, "success", "OTP Sent, Check Your Mail.");
      }
      else if(response.code === "ERR_BAD_REQUEST") {
        updateToast(toastId, "error", response.response.data.message);
        setError(response.response.data.message);
      }

    } catch (error) {
      console.error("Error When Verifying:", error);
      updateToast(toastId, "error", "Network Error. Please try again.");
      setError("Verifying Failed. Please try again.");
    }
  };

  const resetSignupState = () => {
    setRegisterUsername("");
    setEmail("");
    setEmailEntered("");
    setRegisterPassword("");
    setDisplayName("");
    setTranslateLanguage("En");
    setBio("");
    setOtp("");
    setUserInput("");
    setConfirmUserInput("");
    setShowOTPBox(false);
    setShowInfoBox(false);
  };

  return (
      <div className="login-wrapper">
        <div className="card-switch">
          <label className="switch" >
            <input type="checkbox" className="toggle" checked={switchLogin} onChange={(e) => e.preventDefault}/>
            <span className="slider" onClick={() => setSwitchLogin(!switchLogin)}/>
            <span className="card-side" onClick={() => setSwitchLogin(!switchLogin)}/>
            <div className="flip-card__inner">
              <div className="flip-card__front">
                <div className="title">Log in</div>
                <form onSubmit={handleLogin} className="flip-card__form" >
                  <div className='input-field'><input className="flip-card__input" name="username" placeholder="Username" type="text" 
                  value={username} onChange={(e) => setUsername(e.target.value)} required /></div>
                  <div className='input-field'><input className="flip-card__input" name="password" placeholder="Password" type={showPassword ? "text" : "password"}
                  value={password} onChange={(e) => setPassword(e.target.value)} required minLength="6" />
                  <div className='toggle-icon' onChange={() => setShowPassword(prev => !prev)}><ToggleVisibility/></div></div>
                  <div className='remember-me-box' onChange={() => setRememberMe(prev => !prev)}>Remember Me <CheckBox/></div>
                  <button className="flip-card__btn" type="submit">Login!</button>
                </form>
                {error && <p className="login-error-message">{error}</p>}
              </div>
              <div className="flip-card__back">
                <div className="title">Sign up</div>
                  <form onSubmit={handleVerifyEmail} className="flip-card__form">
                    <input className="flip-card__input" name="username" placeholder="UserName" type="text" 
                    value={registerUsername} onChange={(e) => setRegisterUsername(e.target.value)} required/>
                    <input className="flip-card__input" name="email" placeholder="Email" type="email" 
                    value={email} onChange={(e) => setEmail(e.target.value)} required/>
                    <input className="flip-card__input" name="password" placeholder="Password" type="password" 
                    value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} required minLength="6"/>
                    <button className="flip-card__btn" type="submit">Confirm!</button>
                  </form>
              </div>
            </div>
          </label>
        </div>
      {switchLogin && emailEntered ?
      (<RetroWindow
        windowWidth="80px"
        windowHeight="135px"
        windowColor="yellow" //there is only red, blue, yellow
        windowTitle="OTP Box"
        windowContent={(
          <div className={`signIn-OTP ${showOTPBox ? '' : ''}`}>
            <div className='input-field'><input className="flip-card__input text-big" name="bio" placeholder="Enter OTP" type="text"
            value={userInput} title='Please check your mail for the code.' onChange={(e) => setUserInput(e.target.value)} required/></div>
            <label className="signIn-OTP-themed-btn" onClick={() => setConfirmUserInput(userInput)}>
              <input className="signIn-OTP-themed-input" type="checkbox" defaultChecked="" />
              <svg width="24" viewBox="0 0 24 24" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" height="24" fill="none" className="icon"><path xmlns="http://www.w3.org/2000/svg" d="M4 12.6111L8.92308 17.5L20 6.5" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </label>
            {confirmUserInput ?
              (confirmUserInput!=otp ? (<p className='incorrect'>OTP does not match</p>) : (<p className='correct'>OTP is correct.</p>))
            :
              (<></>)
            }
            </div>)}
      />) : (<></>)}
      
      {switchLogin && otp && confirmUserInput==otp ?
      (<RetroWindow
        windowWidth="200px"
        windowHeight="400px"
        windowColor="blue" //there is only red, blue, yellow
        windowTitle="User Information"
        windowContent={(
          <div className={`signIn-Info ${showInfoBox ? '' : ''} `}>
            <div className='signIn-Info-ico'><img src={IDBadgeIcon.src} alt=''></img></div>
            <form onSubmit={handleSignup} className="flip-card__form">
              <div className='input-field'>
                <div className="select">
                  <div
                    className="selected"
                    data-default="EN"
                    data-one="VN"
                    data-two="CN"
                    data-three="JP"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="1em"
                      viewBox="0 0 512 512"
                      className="arrow"
                    >
                      <path
                        d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
                      ></path>
                    </svg>
                  </div>
                  <div className="options">
                    <div title="English">
                      <input id="en" name="option" type="radio" checked={translateLanguage == "En"} onChange={() => setTranslateLanguage("En")} />
                      <label className="option" htmlFor="en" data-txt="EN" ></label>
                    </div>
                    <div title="Tiếng Việt">
                      <input id="vn" name="option" type="radio" checked={translateLanguage == "Vn"} onChange={() => setTranslateLanguage("Vn")} />
                      <label className="option" htmlFor="vn" data-txt="VN" ></label>
                    </div>
                    <div title="中文">
                      <input id="cn" name="option" type="radio" checked={translateLanguage == "Cn"} onChange={() => setTranslateLanguage("Cn")} />
                      <label className="option" htmlFor="cn" data-txt="CN" ></label>
                    </div>
                    <div title="日本語">
                      <input id="jp" name="option" type="radio" checked={translateLanguage == "Jp"} onChange={() => setTranslateLanguage("Jp")} />
                      <label className="option" htmlFor="jp" data-txt="JP" ></label>
                    </div>
                  </div>
                </div>
              </div><div className='input-field'><input className="flip-card__input" name="displayName" placeholder="Display Name" type="text"
                value={displayName} onChange={(e) => setDisplayName(e.target.value)} required /></div>
              <div className='input-field'><textarea className="flip-card__input text-big" name="bio" placeholder="Bio" type="text"
                value={bio} onChange={(e) => setBio(e.target.value)} /></div>
              <button className="flip-card__btn">Sign In!</button>
            </form>
          </div>
        )}
      />) : (<></>)}
      </div>
  )
}
