import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginModal.css';
import Logo from '../../assets/Logo.jpeg'; 
import GoogleIcon from '../../assets/google.png'; 
import API from '../../api/api';

import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../Firebase";


export const LoginModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // ---------------- Role Dropdown ----------------
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const signupRef = useRef(null);
  const [emailLoading, setEmailLoading] = useState(false);
const [googleLoading, setGoogleLoading] = useState(false);



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

  setEmailLoading(true);

  try {
    const res = await API.post("/../login/email", { email, password });
    const { uid, role } = res.data;

    if (!uid) throw new Error("Invalid login response");

    await signInWithEmailAndPassword(auth, email, password);

    localStorage.setItem("auth_uid", uid);
    localStorage.setItem("auth_role", role || "Patient");

    if (role === "Admin") navigate("/AdminDashboard");
    else if (role === "Doctor") navigate("/DoctorDashboard");
    else if (role === "Pharmacy") navigate("/PharmacyDashboard");
    else navigate("/PatientDashboard");

  } catch (err) {
  console.error(err);

  if (err.response?.status === 403) {
    alert(err.response.data.error); // 👈 pharmacy pending message
  } else {
    alert(err.response?.data?.error || "Failed to login");
  }

  setEmailLoading(false);
}

};


  // -------------------- Google Sign-In --------------------
  const handleGoogleSignIn = async () => {
  setGoogleLoading(true);

  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    const user = result.user;

    await API.post("/patient/google", {
      uid: user.uid,
      email: user.email,
      name: user.displayName
    });

    localStorage.setItem("auth_uid", user.uid);
    localStorage.setItem("auth_role", "Patient");

    navigate("/PatientDashboard");

  } catch (err) {
    console.error(err);
    alert("Google login failed");
    setGoogleLoading(false);
  }
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
          <button
  type="submit"
  className="sign-in-button"
  disabled={emailLoading || googleLoading}
>
  {emailLoading ? "Signing in..." : "Sign In"}
</button>


          <div className="separator"><span>or</span></div>

          <div id="googleBtn" style={{ marginTop: "10px" }}>
           <button
  type="button"
  className="google-sign-in"
  onClick={handleGoogleSignIn}
  disabled={emailLoading || googleLoading}
>
  <img src={GoogleIcon} alt="Google" />
  {googleLoading ? "Signing in..." : "Sign in with Google"}
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
