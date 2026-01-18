import './App.css'
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar/Navbar'
import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import Hero from './pages/Users/HomePage/Hero/Hero'
import { Routes, Route, BrowserRouter } from "react-router-dom";
import MainPage from './pages/Users/HomePage/MainPage/MainPage';
import { useAuth, AuthProvider } from './functions/Auth/useAuth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from "./firebase";
import { ToastContainer } from 'react-toastify';
import "react-toastify/ReactToastify.css";
import Login from './pages/Login/Login';
import ProtectedRoutes from './utils/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

function AppRoutes() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const authen = useAuth();
  const userAuth = authen ? authen.userAuth : null;

  window.addEventListener(
    "scroll",
    () => {
      document.body.style.setProperty(
        "--scroll",
        window.pageYOffset / (document.body.offsetHeight - window.innerHeight)
      );
    },
    false
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="loader" />;
  return (
    <div className="app">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
      />
      <ScrollToTop />
      <Routes>
        <Route
          path="/"
          element={
            <>
            <Navbar />
            <Hero />
            </>
          }
        />

        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoutes user={userAuth} />}>
          <Route
            path="/home"
            element={
              <>
              <Navbar />
              <MainPage />
              </>
            }
          />
        </Route>
      </Routes>
    </div>
  )
}

export default App
