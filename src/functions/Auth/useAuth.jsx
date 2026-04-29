"use client";

import axios from "axios";
import { useState, useContext, createContext, useEffect, useMemo, useCallback, useRef } from "react";
import { checkToken, getAuthToken, getCurrentUserProfile, getUserById, logoutUser } from "@/services/UserController";
import { API_BASE_URL } from "@/utils/axiosInstance";
import { usePathname, useRouter } from "next/navigation";

import LoadingImg1 from '../../assets/Decor/Loading-1.gif'
import LoadingImg2 from '../../assets/Decor/Loading-2.gif'
import LoadingImg3 from '../../assets/Decor/loading-3.gif'
import LoadingImg4 from '../../assets/Decor/loading-4.gif'
import LoadingImg5 from '../../assets/Decor/Loading-5.gif'
import LoadingImg6 from '../../assets/Decor/loading-6.gif'

const loadingImages = [LoadingImg1, LoadingImg2, LoadingImg3, LoadingImg4, LoadingImg5, LoadingImg6];

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// Configuration
const PUBLIC_ROUTES = ['/login', '/register', '/', '/user', '/home', '/explore', '/posts/*', '/hub/*'];
const PRIVATE_PATTERNS = ['/hub/*/moderation'];

export const AuthProvider = ({ children }) => {
  const [userAuth, setUserAuth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const [randomLoadingImage, setRandomLoadingImage] = useState(null);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * loadingImages.length);
    setRandomLoadingImage(loadingImages[randomIndex]);
  }, []);
  
  const [profile, setProfile] = useState({
    displayName: "",
    avatarUrl: "",
    points: 0,
    paidPoints: 0,
    translateLanguage: "",
    bio: ""
  });

  const pathname = usePathname();
  const router = useRouter();
  const initRef = useRef(false);

  // -- Helpers --

  const clearAuthData = useCallback(() => {
    sessionStorage.clear();
    localStorage.clear();
    setUserAuth(null);
    setProfile({
      displayName: "",
      avatarUrl: "",
      points: 0,
      paidPoints: 0,
      translateLanguage: "",
      bio: ""
    });
  }, []);

  const logout = useCallback(async () => {
    clearAuthData();
    try {
      // Call logout API to blacklist token on server
      await logoutUser();
    } catch (error) {
      console.error("Logout API error:", error);
      // Continue with local logout even if API fails
    }
    router.push("/login");
  }, [clearAuthData, router]);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await getCurrentUserProfile();
      if (userData) {
        console.log("Auth: Profile refreshed successfully", userData);
        setProfile({
          displayName: userData.displayName || "",
          avatarUrl: userData.avatarUrl || "",
          points: userData.points || 0,
          paidPoints: userData.paidPoints || 0,
          translateLanguage: userData.translateLanguage || "",
          bio: userData.bio || ""
        });
        
        // Keep auth state in sync with latest profile data
        setUserAuth(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                email: userData.username || prev.email,
                role: userData.role || prev.role
            };
        });
        return userData;
      }
    } catch (error) {
      console.error("Auth: Profile refresh failed", error);
    }
    return null;
  }, []);

  const updateProfile = useCallback((updates) => {
    setProfile(prev => ({ ...prev, ...updates }));
  }, []);

  const setPoints = useCallback((pointsOrUpdater) => {
    setProfile(prev => {
      const newPoints = typeof pointsOrUpdater === 'function' 
        ? pointsOrUpdater(prev.points) 
        : pointsOrUpdater;
      return { ...prev, points: newPoints };
    });
  }, []);

  // -- Actions --

  const login = useCallback(async (username, password, rememberMe) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { username, password });
      
      if (res.data?.success) {
        const { id, token, refreshToken, username: resUsername } = res.data.data;
        const storage = rememberMe ? localStorage : sessionStorage;
        
        storage.setItem("userID", id);
        storage.setItem("username", resUsername);
        storage.setItem("token", token);
        storage.setItem("refreshToken", refreshToken);

        // Get Role immediately to finalize auth state
        const userData = await getUserById(id);
        const role = userData?.role || "USER";
        storage.setItem("role", role);

        setUserAuth({ userId: id, email: resUsername, role });
        await refreshUser();
        return res.data;
      }
      return res.data;
    } catch (error) {
      console.error("Auth: Login failed", error);
      throw error;
    }
  }, [refreshUser]);

  // -- Auth Lifecycle & Guard --

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initAuth = async () => {
      try {
        const token = getAuthToken();
        const savedRole = sessionStorage.getItem("role") || localStorage.getItem("role");

        if (token) {
          if (savedRole === 'ADMIN') {
            const userId = sessionStorage.getItem("userID") || localStorage.getItem("userID");
            const username = sessionStorage.getItem("username") || localStorage.getItem("username");
            if (userId && username) {
              setUserAuth({ userId: userId, role: 'ADMIN', email: username });
            } else {
              logout();
            }
          } else {
            const response = await checkToken(token);
            if (response.data?.expired || !response.data?.valid) {
              setShowSessionExpired(true);
              clearAuthData();
            } else {
              setUserAuth({
                userId: response.data.userId,
                role: response.data.role,
                email: response.data.username,
              });
              await refreshUser();
            }
          }
        }
      } catch (error) {
        console.error("Auth: Initialization error", error);
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      }
    };

    initAuth();
  }, [logout, refreshUser, clearAuthData]);

  const isPublic = useMemo(() => {
    const isPrivate = PRIVATE_PATTERNS.some(pattern => {
      const regex = new RegExp(`^${pattern.replace(/\*/g, '[^/]+')}$`);
      return regex.test(pathname);
    });
    if (isPrivate) return false;

    return PUBLIC_ROUTES.some(route => {
      const base = route.endsWith('/*') ? route.slice(0, -2) : route;
      return pathname === base || pathname.startsWith(`${base}/`);
    });
  }, [pathname]);

  useEffect(() => {
    if (!loading && !userAuth && !isPublic) {
      router.push("/login");
    }
  }, [userAuth, loading, isPublic, router]);

  const loginAdmin = useCallback(async (username, password) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/system-account-login`, { username, password });
      if (res.data?.success) {
        const { id, token, refreshToken, username: resUsername } = res.data.data;
        sessionStorage.setItem("userID", id);
        sessionStorage.setItem("username", resUsername);
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("refreshToken", refreshToken);
        sessionStorage.setItem("role", "ADMIN");

        setUserAuth({ userId: id, role: 'ADMIN', email: resUsername });
        return res.data;
      }
      return res.data;
    } catch (error) {
      console.error("Auth: Admin login failed", error);
      throw error;
    }
  }, []);

  const value = useMemo(() => ({
    userAuth,
    loading,
    login,
    loginAdmin,
    logout,
    refreshUser,
    updateProfile,
    setPoints,
    showSessionExpired,
    setShowSessionExpired,
    ...profile, // Spreads displayName, points, etc. for direct access
    profile,     // Also provides the grouped object
  }), [userAuth, loading, login, loginAdmin, logout, refreshUser, updateProfile, setPoints, showSessionExpired, profile]);

  return (
    <AuthContext.Provider value={value}>
      {loading ? 
        <><div className="loading-overlay">
          <div className='global-loading'>
          {randomLoadingImage && (
            <img
              className='loading-animation'
              src={randomLoadingImage.src}
              alt=""
              onError={(e) => {
                e.target.src = "/picture-not-available-photo.jpg";
              }}
            />
          )}
          <div className='loading-bar'></div>
        </div>
        </div>
          {children}
        </> : 
      children}
      
      {showSessionExpired && (
        <div className="session-expired-overlay">
          <div className="session-expired-modal">
            <div className="session-expired-icon">⚠️</div>
            <h2>Session Expired</h2>
            <p>Your session has expired. Please log in again.</p>
            <button className="session-expired-ok-btn" onClick={() => { setShowSessionExpired(false); logout(); }}>
              OK
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const adminLogin = async (username, password) => {
  try {
    const res = await axios.post(`${API_BASE_URL}/auth/system-account-login`, { username, password });
    if (res.data?.success) {
      const { id, token, refreshToken, username: resUsername } = res.data.data;
      sessionStorage.setItem("userID", id);
      sessionStorage.setItem("username", resUsername);
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("refreshToken", refreshToken);
      sessionStorage.setItem("role", "ADMIN");
      return res.data;
    }
    return res.data;
  } catch (error) {
    console.error("Auth: Admin login failed", error);
    throw error;
  }
};
