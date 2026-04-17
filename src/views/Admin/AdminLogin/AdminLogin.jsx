'use client';

import { useRouter } from 'next/navigation';
import './AdminLogin.css'
import { useState } from 'react';
import { showSuccess, showError, showLoading, updateToast } from '../../../utils/toastUtils';
import { adminLogin, useAuth } from '../../../functions/Auth/useAuth';

export default function AdminLogin() {
  const router = useRouter();
  const { loginAdmin } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState(null);

  const handleAdminLogin = async (e) => {
      e.preventDefault();
      const toastId = showLoading("Logging in...");
      try {
        setError("");
        const response = await loginAdmin(username, password);
        if (response) {
          updateToast(toastId, "success", "Login Success!");
          setTimeout(() => {
            router.push(response ? "/Admin_MainPage" : "/login/admin");
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

  return (
    <div className="glitch-form-wrapper">
        {/* From Uiverse.io by pharmacist-sabot*/}
        <form className="glitch-card" onSubmit={handleAdminLogin}>
            <div className="card-header">
            <div className="card-title">
                <span>ADMIN_LOGIN</span>
            </div>

            <div className="card-dots"><span></span><span></span><span></span></div>
            </div>

            <div className="card-body">
            <div className="form-group">
                <input
                type="text"
                id="username"
                name="username"
                placeholder=""
                required
                value={username} onChange={(e) => setUsername(e.target.value)}
                />
                <label htmlFor="username" className="form-label" data-text="USERNAME"
                >USERNAME</label>
            </div>

            <div className="form-group">
                <input
                type="password"
                id="password"
                name="password"
                placeholder=""
                required
                value={password} onChange={(e) => setPassword(e.target.value)}
                />
                <label htmlFor="password" className="form-label" data-text="PASSWORD"
                >PASSWORD</label>
            </div>

            <button data-text="SYSTEM_LOGIN" type="submit" className="submit-btn">
                <span className="btn-text">SYSTEM_LOGIN</span>
            </button>
            </div>
        </form>
    </div>
  )
}
