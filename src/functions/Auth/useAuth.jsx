import axios from "axios";
import {useState, useContext, createContext, useEffect, useMemo} from "react";
import {checkForToken, checkToken, getUserById} from "@/services/UserController";
import {usePathname, useRouter} from "next/navigation";

const AuthContext = createContext(null);

export const useAuth = () => {
  return useContext(AuthContext);
};

const PUBLIC_ROUTES = ['/login', '/register', '/', '/user', '/home', '/explore'];

export const AuthProvider = ({ children }) => {
  const [userAuth, setUserAuth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSessionExpired, setShowSessionExpired] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

  const formatDate = (isoString) => {
    if (!isoString) return ""; // Null or empty
    const date = new Date(isoString);
    if (isNaN(date)) return ""; // Invalid date
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Helper function to fetch user role and update auth state
  const fetchUserRole = async (userId) => {
    try {
      const userData = await getUserById(userId);
      if (userData) {
        return userData.role;
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
    return null;
  };

    // Helper to check if current path is public
    const isPublic = useMemo(() => {
        return PUBLIC_ROUTES.some(route =>
            pathname === route || pathname.startsWith(`${route}/`)
        );
    }, [pathname]);



  useEffect(() => {
    const initAuth = async () => {
        try {
            const response = await checkToken();
            if(response.data.expired || !response.data.valid){
                console.warn("token is expired or is not valid!");
                setShowSessionExpired(true);
            }
            else{
                const authData = {
                    userId: response.data.id,
                    role: response.data.role,
                    email: response.data.username,
                }
                setUserAuth(authData);
            }
        } catch (error) {
            setShowSessionExpired(true);
            console.error(error);
        }
      setLoading(false);
    };
    initAuth();
  }, []);


    useEffect(() => {
        if (!loading && !userAuth && !isPublic) {
            console.log("Unauthorized access attempt. Redirecting...");
            router.push("/login");
        }
    }, [userAuth, loading, isPublic, router]);


  useEffect(() => {
    const handleStorageChange = () => {
      const updatedEmail = sessionStorage.getItem("username") || localStorage.getItem("username");
      const updatedRole = sessionStorage.getItem("role") || localStorage.getItem("role");

      if (updatedEmail) {
        setUserAuth({ email: updatedEmail, role: updatedRole || null });
      } else {
        setUserAuth(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = async (username, password, rememberMe) => {
    try {
      const response = await axios.post("https://vtuber-fanhub-bsc3arfzhqhahshy.southeastasia-01.azurewebsites.net/vhub/api/v1/auth/login",
        { username, password }
      );
      if (response) {
        const userId = response.data.data.id;
        
        if (rememberMe) {
          localStorage.setItem("userID", userId);
          localStorage.setItem("username", response.data.data.username);
          localStorage.setItem("token", response.data.data.token);
          localStorage.setItem("refreshToken", response.data.data.refreshToken);
        }
        else {
          sessionStorage.setItem("userID", userId);
          sessionStorage.setItem("username", response.data.data.username);
          sessionStorage.setItem("token", response.data.data.token);
          sessionStorage.setItem("refreshToken", response.data.data.refreshToken);
        }

        // Fetch user role and store it
        const userData = await getUserById(userId);
        if (userData && userData.role) {
          if (rememberMe) {
            localStorage.setItem("role", userData.role);
          } else {
            sessionStorage.setItem("role", userData.role);
          }
          
          setUserAuth({
            email: response.data.data.username,
            role: userData.role
          });
        }

        window.dispatchEvent(new Event("storage"));

        return response.data;
      }
    } catch (error) {
      return error;
    }
  };

  // const googleLogin = async (email, idToken, rememberMe) => {
  //   try {
  //     const response = await axios.post("https://", 
  //       { idToken },
  //       { withCredentials: true } 
  //     );

  //     if (response) {
  //       if (rememberMe) {
  //         localStorage.setItem("username", response.data.name);
  //         localStorage.setItem("email", email);
  //         localStorage.setItem("LoggedInAs", "Google");
  //       }
  //       else {
  //         sessionStorage.setItem("username", response.data.name);
  //         sessionStorage.setItem("email", email);
  //         sessionStorage.setItem("LoggedInAs", "Google");
  //     }
        
  //       window.dispatchEvent(new Event("storage"));

  //       return response.data;
  //     } else {
  //       throw new Error("Invalid email or password");
  //     }
  //   } catch (error) {
  //     console.error("Login error:", error);
  //     return error;
  //   }
  // };

  const logout = () => {
  // axios.post(
  //     "https://Auth/logout",
  //     {},
  //     { withCredentials: true }
  //   ).finally(() => {
  //     sessionStorage.clear();
  //     localStorage.clear();
  //     window.dispatchEvent(new Event("storage"));
  //   });
    sessionStorage.clear();
    localStorage.clear();
    window.dispatchEvent(new Event("storage"));
  };

  const clearAuth = () => {
    sessionStorage.clear();
    localStorage.clear();
    setUserAuth(null);
    window.dispatchEvent(new Event("storage"));
  };

  const handleSessionExpiredConfirm = () => {
    setShowSessionExpired(false);
    logout();
    router.push("/login");
  };

  if (loading) {
    return <div className="loader" />;
  }

  return (
    <AuthContext.Provider value={{ userAuth, login, /*googleLogin,*/ logout, clearAuth, showSessionExpired }}>
      {children}
      
      {/* Session Expired Modal */}
      {showSessionExpired && (
        <div className="session-expired-overlay">
          <div className="session-expired-modal">
            <div className="session-expired-icon">⚠️</div>
            <h2>Session Expired</h2>
            <p>Your session has expired. Please log in again to continue.</p>
            <button className="session-expired-ok-btn" onClick={handleSessionExpiredConfirm}>
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
      if (response) {
        const userId = response.data.data.id;
        
        sessionStorage.setItem("userID", userId);
        sessionStorage.setItem("username", response.data.data.username);
        sessionStorage.setItem("token", response.data.data.token);
        sessionStorage.setItem("refreshToken", response.data.data.refreshToken);
        
        sessionStorage.setItem("role", "ADMIN");

        window.dispatchEvent(new Event("storage"));

        return response.data;
      }
    } catch (error) {
      return error;
    }
};

//#region 
// import axios from "axios";
// import { useState, useContext, createContext, useEffect } from "react";

// const AuthContext = createContext(null);

// export const useAuth = () => {
//   return useContext(AuthContext);
// };

// export const AuthProvider = ({ children }) => {
//   const [userAuth, setUserAuth] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const savedUser = sessionStorage.getItem("username");
//     // const savedRole = sessionStorage.getItem("selectedRole");

//     if (savedUser && savedRole) {
//       setUserAuth({ username: savedUser/*, role: savedRole*/ });
//     }
//     setLoading(false);
//   }, []);

//   useEffect(() => {
//     const handleStorageChange = () => {
//       const updatedUser = sessionStorage.getItem("username");
//       //const updatedRole = sessionStorage.getItem("selectedRole");

//       if (updatedUser && updatedRole) {
//         setUserAuth({ username: updatedUser/*, role: updatedRole*/ });
//       } else {
//         setUserAuth(null);
//       }
//     };

//     window.addEventListener("storage", handleStorageChange);
//     return () => window.removeEventListener("storage", handleStorageChange);
//   }, []);

//   const login = async (username, password) => {
//     try {
//       const response = await axios.post(
//         "http://",
//         { username, password }
//       );

//       if (response.status === 200 && response.data.success) {
//         const token = response.data.data; // JWT Token
//         const payload = JSON.parse(atob(token.split(".")[1])); // Decode JWT
//         const { sub, role } = payload; // Extract username & role

//         sessionStorage.setItem("accessToken", token);
//         sessionStorage.setItem("username", sub);
//         //sessionStorage.setItem("selectedRole", role);

//         window.dispatchEvent(new Event("storage"));

//         return sub; // Return the role
//       }
//     } catch (error) {
//       console.error("Login error:", error);
//       return null;
//     }
//   };

//   const logout = () => {
//     sessionStorage.clear();
//     window.dispatchEvent(new Event("storage"));
//   };

//   if (loading) {
//     return <div className="loader" />;
//   }

//   return (
//     <AuthContext.Provider value={{ userAuth, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };