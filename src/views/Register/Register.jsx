'use client';

import './Register.css'
import { verifyEmail, signUp } from '../../functions/Auth/registerAccount';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { showLoading, updateToast } from '../../utils/toastUtils';
import IDBadgeIcon from '../../assets/UI-Elements/id-badge-identity-card-svgrepo-com.svg'

export default function Register() {
  const router = useRouter();

  const [registerUsername, setRegisterUsername] = useState("");
  const [email, setEmail] = useState("");
  const [emailEntered, setEmailEntered] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [translateLanguage, setTranslateLanguage] = useState("En");
  const [bio, setBio] = useState("");
  const [otp, setOtp] = useState("");
  const [userInput, setUserInput] = useState("");
  const [confirmUserInput, setConfirmUserInput] = useState("");
  const [error, setError] = useState(null);

  const [isOTPVerified, setIsOTPVerified] = useState(false);
  const [showExitAnimation, setShowExitAnimation] = useState(false);

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

  const handleSignup = async (e) => {
    e.preventDefault();
    const toastId = showLoading("Creating account...");
    
    if (userInput !== otp) {
      updateToast(toastId, "warning", "Invalid OTP");
      return;
    }

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

      if (response.data === "Email is already in use") {
        updateToast(toastId, "warning", response.response.data);
        setError("Warning: Email is already in use");
        return;
      }
      if (response.message === "Success") {
        updateToast(toastId, "success", "Account created successfully!");

        setShowExitAnimation(true);
        setTimeout(() => {
          router.push("/login");
        }, 800);
      } else {
        updateToast(toastId, "error", response.data || "Signup failed");
        setError(response.data);
      }

    } catch (error) {
      console.error("Signup error:", error);
      const message =
        error.data || "Signup failed. Please try again.";

      updateToast(toastId, "error", "Signup failed. Please try again.");
      setError(message);
    }
  };

  const handleConfirmOTP = () => {
    if (userInput) {
      setConfirmUserInput(userInput);
      setIsOTPVerified(true);
    }
  };

  const handleNavigateToLogin = () => {
    setShowExitAnimation(true);
    setTimeout(() => {
      router.push("/login");
    }, 800);
  };

  return (
      <div className={`register-wrapper ${showExitAnimation ? 'exit' : ''}`}>
        <div className="background-grid-vfx signup"></div>
        <div className="card-switch">
          <div className="flip-card__inner">
            <div className="flip-card__front">
              <div className="flip-card__front-left">
                <div className="title">Sign up</div>
                {error && <p className="register-error-message">{error}</p>}
                <form className="flip-card__form">
                  <div className='input-field'>
                    <input className="flip-card__input" name="username" placeholder="Username" type="text" 
                    value={registerUsername} onChange={(e) => setRegisterUsername(e.target.value)} required/>
                  </div>
                  <div className='input-field'>
                    <input className="flip-card__input" name="displayName" placeholder="Display Name" type="text"
                    value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
                  </div>
                  <input className="flip-card__input" name="email" placeholder="Email" type="email" 
                    value={email} onChange={(e) => setEmail(e.target.value)} required/>
                    <div className='flip-card__input-block'>
                      <div className='input-field'>
                        <input className="flip-card__input" name="otp" placeholder="Enter OTP" type="text"
                        value={userInput} onChange={(e) => setUserInput(e.target.value)}  onBlur={() => handleConfirmOTP()} required minLength="6"/>
                        <button className="flip-card__btn" type="submit" onClick={handleVerifyEmail}>Send OTP!</button>
                      </div>
                      {confirmUserInput && confirmUserInput != otp && (
                        <p className='incorrect-otp'>OTP does not match</p>
                      )}
                    </div>
                  <div className='input-field'>
                    <input className="flip-card__input" name="password" placeholder="Password" type="password" 
                    value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} required minLength="6"/>
                  </div>
                  <div className='auth-link'>
                    Already have an account? <span className='link-text' onClick={handleNavigateToLogin}>Log in</span>
                  </div>
                </form>
              </div>
              <div className="flip-card__front-right">
                <div className='signIn-Info'>
                  <div className='signIn-Info-ico'><img src={IDBadgeIcon.src} alt=''/></div>
                  
                    <form className="flip-card__form">
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
                              <label className="option" htmlFor="en-r" data-txt="EN" ></label>
                            </div>
                            <div title="Tiếng Việt">
                              <input id="vn" name="option" type="radio" checked={translateLanguage == "Vn"} onChange={() => setTranslateLanguage("Vn")} />
                              <label className="option" htmlFor="vn-r" data-txt="VN" ></label>
                            </div>
                            <div title="中文">
                              <input id="cn" name="option" type="radio" checked={translateLanguage == "Cn"} onChange={() => setTranslateLanguage("Cn")} />
                              <label className="option" htmlFor="cn-r" data-txt="CN" ></label>
                            </div>
                            <div title="日本語">
                              <input id="jp" name="option" type="radio" checked={translateLanguage == "Jp"} onChange={() => setTranslateLanguage("Jp")} />
                              <label className="option" htmlFor="jp-r" data-txt="JP" ></label>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className='input-field'><textarea className="flip-card__input text-big" name="bio" placeholder="Bio (Optional)" 
                        value={bio} onChange={(e) => setBio(e.target.value)} /></div>
                      <button className="flip-card__btn" type="button" onClick={handleSignup}>Sign Up!</button>
                    </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}
