import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginModal.css';
import Logo from '../../assets/Logo.jpeg'; 
import GoogleIcon from '../../assets/google.png'; 
import API from '../../api/api';

export const LoginModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // ---------------- Role Dropdown ----------------
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const signupRef = useRef(null);

  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  if (!isOpen) return null;

  // -------------------- Email/Password Login --------------------
  const handleEmailLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter both email and password");
      return;
    }

    try {
      const res = await API.post("/../login/email", { email, password });
      const { uid, role } = res.data;

      if (!uid) {
        alert("Invalid login response from backend");
        return;
      }

      localStorage.setItem("user_uid", uid);
      localStorage.setItem("user_role", role || "Patient");

      navigate("/PatientDashboard");
    } catch (err) {
      console.error("Email login error:", err);
      alert(err.response?.data?.error || "Failed to login");
    }
  };

  // -------------------- Google Sign-In --------------------
  const handleGoogleSignIn = () => {
    if (!window.google) {
      alert("Google API not loaded");
      return;
    }

    window.google.accounts.id.initialize({
      client_id: "1080448394290-dk4th5n17iljbv4fco2v9kaf2j8t73as.apps.googleusercontent.com",
      callback: async (response) => {
        const idToken = response.credential;

        if (!idToken) {
          alert("No token received");
          return;
        }

        try {
          const res = await API.post("/patient/google", { idToken });
          const uid = res.data.uid;
          localStorage.setItem("patient_uid", uid);

          navigate("/PatientDashboard", {
            state: { userData: { role: "Patient" } }
          });
        } catch (err) {
          alert("Backend error: " + (err.response?.data?.error || err.message));
        }
      },
    });

    window.google.accounts.id.renderButton(
      document.getElementById("googleBtn"),
      {
        theme: "outline",
        size: "large",
        text: "continue_with",
      }
    );
  };

  // -------------------- Role Selection --------------------
  const handleRoleSelect = (role) => {
  setIsDropdownOpen(false);
  onClose();

  if (role === "Patient") {
    navigate("/register-patient");
  } else if (role === "Pharmacy") {
    navigate("/register-pharmacy");
  }
};


  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="login-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>&times;</button>
        
        <div className="modal-header">
          <img src={Logo} alt="MEDICARE Logo" className="modal-logo" />
        </div>
        
        <form className="login-form" onSubmit={handleEmailLogin}>
          <h2>Sign In</h2>

          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <button type="submit" className="sign-in-button">Sign In</button>

          <div className="separator"><span>or</span></div>

          <div id="googleBtn" style={{ marginTop: "10px" }}>
            <button type="button" className="google-sign-in" onClick={handleGoogleSignIn}>
              <img src={GoogleIcon} alt="Google" />
              Sign in with Google
            </button>
          </div>

          <p className="signup-link">
            Don't have an account?{" "}
            <a 
              href="#"
              ref={signupRef}
              onClick={(e) => {
                e.preventDefault();
                setIsDropdownOpen(prev => !prev);
              }}
            >
              Sign up
            </a>
          </p>

          {/* Dropdown */}
          {isDropdownOpen && (
            <div className="signup-dropdown">
              <button onClick={() => handleRoleSelect("Patient")}>Sign up as Patient</button>
              <button onClick={() => handleRoleSelect("Pharmacy")}>Sign up as Pharmacy</button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
