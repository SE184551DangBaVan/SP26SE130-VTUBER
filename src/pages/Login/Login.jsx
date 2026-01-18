import './Login.css'
import { useAuth } from '../../functions/Auth/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { showSuccess, showError, showLoading, updateToast } from '../../utils/toastUtils';
import CheckBox from '../../components/CheckBox/CheckBox';
import ToggleVisibility from '../../components/ToggleVisibility/ToggleVisibility';

export default function Login() {
  const {login} = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    const toastId = showLoading("Logging In...");
    try {
      setError("");
      const response = await login(email, password, rememberMe);
      if (response) {
        updateToast(toastId, "success", "Successfully logged in");
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
      setError("Đăng nhập thất bại. Hãy thử lại.");
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
                  <div className='input-field'><input className="flip-card__input" name="email" placeholder="Email" type="email" 
                  value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                  <div className='input-field'><input className="flip-card__input" name="password" placeholder="Password" type={showPassword ? "text" : "password"}
                  value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <div className='toggle-icon' onChange={() => setShowPassword(prev => !prev)}><ToggleVisibility/></div></div>
                  <div className='remember-me-box' onChange={() => setRememberMe(prev => !prev)}>Remember Me <CheckBox/></div>
                  <button className="flip-card__btn" type="submit">Let`s go!</button>
                </form>
                {error && <p className="login-error-message">{error}</p>}
              </div>
              <div className="flip-card__back">
                <div className="title">Sign up</div>
                <form className="flip-card__form">
                  <input className="flip-card__input" placeholder="Name" type="name" />
                  <input className="flip-card__input" name="email" placeholder="Email" type="email" />
                  <input className="flip-card__input" name="password" placeholder="Password" type="password" />
                  <button className="flip-card__btn">Confirm!</button>
                </form>
              </div>
            </div>
          </label>
        </div>   
      </div>
  )
}
