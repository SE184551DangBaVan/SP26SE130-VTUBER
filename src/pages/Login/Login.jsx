import './Login.css'
import { useAuth } from '../../functions/Auth/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { showSuccess, showError, showLoading, updateToast } from '../../utils/toastUtils';
import CheckBox from '../../components/CheckBox/CheckBox';
import ToggleVisibility from '../../components/ToggleVisibility/ToggleVisibility';
import { verifyEmail, signUp } from '../../functions/Auth/registerAccount';

export default function Login() {
  const {login} = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [translateLanguage, setTranslateLanguage] = useState("En");
  const [bio, setBio] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    const toastId = showLoading("Logging in...");
    try {
      setError("");
      const response = await login(username, password, rememberMe);
      if (response) {
        updateToast(toastId, "success", "Login Success!");
        setTimeout(() => {
          navigate(response ? "/home" : "/login");
        }, 100);
      }
      else if(response.code === "ERR_BAD_REQUEST") {
        updateToast(toastId, "error", response.response.data.message);
        console.log("Error Login:", response)
        setError(response.response.data.message);
      }

    } catch (error) {
      console.error("Login error:", error);
      updateToast(toastId, "error", "Network Error. Please try again.");
      setError("Login Failed. Please try again.");
    }
  };
  
  const handleSignup = async (e) => {

  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    const toastId = showLoading("Logging in...");
    try {
      setError("");
      const response = await verifyEmail(email);
      if (response) {
        setOtp(response);
        updateToast(toastId, "success", "Email Verified!");
      }
      else if(response.code === "ERR_BAD_REQUEST") {
        updateToast(toastId, "error", response.response.data.message);
        console.log("Error Login:", response)
        setError(response.response.data.message);
      }

    } catch (error) {
      console.error("Login error:", error);
      updateToast(toastId, "error", "Network Error. Please try again.");
      setError("Login Failed. Please try again.");
    }
  };

  return (
      <div className="login-wrapper">
        <div className="card-switch">
          <label className="switch">
            <input type="checkbox" className="toggle" />
            <span className="slider" />
            <span className="card-side" />
            <div className="flip-card__inner">
              <div className="flip-card__front">
                <div className="title">Log in</div>
                <form onSubmit={handleLogin} className="flip-card__form" >
                  <div className='input-field'><input className="flip-card__input" name="username" placeholder="Username" type="text" 
                  value={username} onChange={(e) => setUsername(e.target.value)} required /></div>
                  <div className='input-field'><input className="flip-card__input" name="password" placeholder="Password" type={showPassword ? "text" : "password"}
                  value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <div className='toggle-icon' onChange={() => setShowPassword(prev => !prev)}><ToggleVisibility/></div></div>
                  <div className='remember-me-box' onChange={() => setRememberMe(prev => !prev)}>Remember Me <CheckBox/></div>
                  <button className="flip-card__btn" type="submit">Login!</button>
                </form>
                {error && <p className="login-error-message">{error}</p>}
              </div>
              <div className="flip-card__back">
                <div className="title">Sign up</div>
                {otp ? (
                  <form onSubmit={handleSignup} className="flip-card__form">
                    <div className='input-field'><input className="flip-card__input" name="displayName" placeholder="Display Name" type="text" 
                    value={displayName} onChange={(e) => setDisplayName(e.target.value)} required /></div>
                    <div className='input-field'><textarea className="flip-card__input" name="bio" placeholder="Bio" type="text" 
                    value={bio} onChange={(e) => setBio(e.target.value)}/></div>
                    <div className='input-field'>
                      <div class="select">
                        <div
                          class="selected"
                          data-default="EN"
                          data-one="VN"
                          data-two="EN"
                          data-three="CN"
                          data-four="JP"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="1em"
                            viewBox="0 0 512 512"
                            class="arrow"
                          >
                            <path
                              d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
                            ></path>
                          </svg>
                        </div>
                        <div class="options">
                          <div title="VN">
                            <input id="VN" name="option" type="radio" />
                            <label class="option" for="VN" data-txt="VN"></label>
                          </div>
                          <div title="EN">
                            <input id="EN" name="option" type="radio" />
                            <label class="option" for="EN" data-txt="EN"></label>
                          </div>
                          <div title="CN">
                            <input id="CN" name="option" type="radio" />
                            <label class="option" for="CN" data-txt="CN"></label>
                          </div>
                          <div title="JP">
                            <input id="JP" name="option" type="radio" />
                            <label class="option" for="JP" data-txt="JP"></label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button className="flip-card__btn">Sign In!</button>
                  </form>
                  ) : (
                  <form onSubmit={handleVerifyEmail} className="flip-card__form">
                    <input className="flip-card__input" name="username" placeholder="Username" type="text" required/>
                    <input className="flip-card__input" name="email" placeholder="Email" type="email" required/>
                    <input className="flip-card__input" name="password" placeholder="Password" type="password" required/>
                    <button className="flip-card__btn">Confirm!</button>
                  </form>
                )}
              </div>
            </div>
          </label>
        </div>   
      </div>
  )
}
