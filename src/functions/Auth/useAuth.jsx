"use client";

import axios from "axios";
import { useState, useContext, createContext, useEffect, useMemo, useCallback, useRef } from "react";
import { checkToken, getAuthToken, getCurrentUserProfile, getUserById } from "@/services/UserController";
import { usePathname, useRouter } from "next/navigation";

const AuthContext = createContext(null);

export const useAuth = () => {
  return useContext(AuthContext);
};

const PUBLIC_ROUTES = ['/login', '/register', '/', '/user', '/home', '/explore', '/posts/*', '/hub/*'];
const PRIVATE_PATTERNS = ['/hub/*/moderation'];

export const AuthProvider = ({ children }) => {
  const [userAuth, setUserAuth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  
  // Group profile data to minimize re-renders
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

  const refreshUser = useCallback(async () => {
    try {
      const userData = await getCurrentUserProfile();
      if (userData) {
        setProfile({
          displayName: userData.displayName || "",
          avatarUrl: userData.avatarUrl || "",
          points: userData.points || 0,
          paidPoints: userData.paidPoints || 0,
          translateLanguage: userData.translateLanguage || "",
          bio: userData.bio || ""
        });
        return userData;
      }
    } catch (error) {
      console.error("Error refreshing user profile:", error);
    }
    return null;
  }, []);

  const clearAuth = useCallback(() => {
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

  const logout = useCallback(() => {
    clearAuth();
    router.push("/login");
  }, [clearAuth, router]);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    let isMounted = true;
    const initAuth = async () => {
      try {
        const token = getAuthToken();
        if (token) {
          const response = await checkToken(token);
          if (response.data?.expired || !response.data?.valid) {
            if (isMounted) {
              setShowSessionExpired(true);
              clearAuth();
            }
          } else if (isMounted) {
            setUserAuth({
              userId: response.data.userId,
              role: response.data.role,
              email: response.data.username,
            });
            await refreshUser();
          }
        }
      } catch (error) {
        console.error("Init auth error:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();
    return () => { isMounted = false; };
  }, [refreshUser, clearAuth]);

  // Auth Guard Logic
  const isPrivatePath = useMemo(() => {
    return PRIVATE_PATTERNS.some(pattern => {
      const regexPattern = pattern.replace(/\*/g, '[^/]+');
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(pathname);
    });
  }, [pathname]);

  const isPublic = useMemo(() => {
    if (isPrivatePath) return false;
    return PUBLIC_ROUTES.some(route => {
      if (route.endsWith('/*')) {
        const base = route.slice(0, -2);
        return pathname === base || pathname.startsWith(`${base}/`);
      }
      return pathname === route || pathname.startsWith(`${route}/`);
    });
  }, [pathname, isPrivatePath]);

  useEffect(() => {
    if (!loading && !userAuth && !isPublic) {
      router.push("/login");
    }
  }, [userAuth, loading, isPublic, router]);

  const login = async (username, password, rememberMe) => {
    try {
      const response = await axios.post("https://vtuber-fanhub-bsc3arfzhqhahshy.southeastasia-01.azurewebsites.net/vhub/api/v1/auth/login",
        { username, password }
      );
      if (response && response.data.success) {
        const userId = response.data.data.id;
        const storage = rememberMe ? localStorage : sessionStorage;
        
        storage.setItem("userID", userId);
        storage.setItem("username", response.data.data.username);
        storage.setItem("token", response.data.data.token);
        storage.setItem("refreshToken", response.data.data.refreshToken);

        const userData = await getUserById(userId);
        if (userData && userData.role) {
          storage.setItem("role", userData.role);
          setUserAuth({
            userId,
            email: response.data.data.username,
            role: userData.role
          });
          await refreshUser();
        }
        return response.data;
      }
    } catch (error) {
      console.error("Login error:", error);
      return error;
    }
  };

  const value = useMemo(() => ({
    userAuth,
    loading,
    login,
    logout,
    clearAuth,
    showSessionExpired,
    ...profile,
    setDisplayName: (val) => setProfile(p => ({ ...p, displayName: val })),
    setAvatarUrl: (val) => setProfile(p => ({ ...p, avatarUrl: val })),
    setPoints: (val) => setProfile(p => ({ ...p, points: val })),
    setPaidPoints: (val) => setProfile(p => ({ ...p, paidPoints: val })),
    setTranslateLanguage: (val) => setProfile(p => ({ ...p, translateLanguage: val })),
    refreshUser
  }), [userAuth, loading, login, logout, clearAuth, showSessionExpired, profile, refreshUser]);

  return (
    <AuthContext.Provider value={value}>
      {loading ? <div className="loader" /> : children}
      
      {showSessionExpired && (
        <div className="session-expired-overlay">
          <div className="session-expired-modal">
            <div className="session-expired-icon">⚠️</div>
            <h2>Session Expired</h2>
            <p>Your session has expired. Please log in again to continue.</p>
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
    const response = await axios.post("https://vtuber-fanhub-bsc3arfzhqhahshy.southeastasia-01.azurewebsites.net/vhub/api/v1/auth/system-account-login",
      { username, password }
    );
    if (response && response.data.success) {
      const userId = response.data.data.id;
      sessionStorage.setItem("userID", userId);
      sessionStorage.setItem("username", response.data.data.username);
      sessionStorage.setItem("token", response.data.data.token);
      sessionStorage.setItem("refreshToken", response.data.data.refreshToken);
      sessionStorage.setItem("role", "ADMIN");
      return response.data;
    }
  } catch (error) {
    return error;
  }
};
