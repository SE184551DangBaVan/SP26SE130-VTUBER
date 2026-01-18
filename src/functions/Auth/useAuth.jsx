import axios from "axios";
import { useState, useContext, createContext, useEffect } from "react";

const AuthContext = createContext(null);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [userAuth, setUserAuth] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatDate = (isoString) => {
    if (!isoString) return ""; // Null or empty
    const date = new Date(isoString);
    if (isNaN(date)) return ""; // Invalid date
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const savedEmail = sessionStorage.getItem("email") || localStorage.getItem("email");

    if (savedEmail) {
      setUserAuth({ email: savedEmail });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const updatedEmail = sessionStorage.getItem("email") || localStorage.getItem("email");

      if (updatedEmail) {
        setUserAuth({ email: updatedEmail });
      } else {
        setUserAuth(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = async (email, password, rememberMe) => {
    try {
      const response = await axios.post("https://pleasant-grace-production.up.railway.app/pulse/api/v1/auth/login", 
        { email, password }
      );
      if (response) {
        if (rememberMe) {
          localStorage.setItem("userID", response.data.data.userId);
          sessionStorage.setItem("email", response.data.data.email);
          localStorage.setItem("token", response.data.data.token);
        }
        else {
          sessionStorage.setItem("userID", response.data.data.userId);
          sessionStorage.setItem("email", response.data.data.email);
          sessionStorage.setItem("token", response.data.data.token);
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

  if (loading) {
    return <div className="loader" />;
  }

  return (
    <AuthContext.Provider value={{ userAuth, login, /*googleLogin,*/ logout }}>
      {children}
    </AuthContext.Provider>
  );
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