import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../assets/Logo.jpeg'; 
import RegistrationImage from '../assets/registration_img.png';
import '../RegistrationFormsCommon.css'; 
import GoogleIcon from '../assets/google.png'; 
import API from "../api/api";


import { LoginModal } from "../Components/UI/LoginModal";

const PatientRegistrationPage = () => {
  const navigate = useNavigate();


  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    handleGoogleSignIn();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleContinue = async (e) => {
    e.preventDefault();
    console.log("🔵 Register button clicked");

    if (!formData.name || !formData.email || !formData.password) {
      alert("Please fill all fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password
      };

      console.log("🟦 Sending payload to backend:", payload);

      const res = await API.post("/patient/step1", payload);

      console.log("🟩 Backend response:", res.data);

      const uid = res.data?.uid;
      if (!uid) {
        throw new Error("Backend did not return a UID");
      }

      localStorage.setItem("patient_uid", uid);

      console.log("🟩 UID saved:", uid);

      navigate("/patient-details", {
        state: {
          userData: {
            role: "Patient",
            name: formData.name,
            email: formData.email,
            password: formData.password,
          }
        }
      });

    } catch (err) {
      console.error(" Registration Step1 Error:", err);

      if (err.response) {
        alert("Error: " + err.response.data.error);
      } else {
        alert("Failed to connect to backend. Check console.");
      }
    }
  };

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

          navigate("/patient-details", {
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

  return (
    <div className="registration-page">

      {/* ⭐ LOGIN MODAL */}
      <LoginModal 
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />

      <div className="form-wrapper">
        
        <div className="image-container">
          <img src={RegistrationImage} alt="Patient Illustration" />
          <p className="image-caption">
            Manage your health records and prescriptions digitally.
          </p>
        </div>

        <div className="register-container">
          <div className="header-logo">
            <img src={Logo} alt="MediCare Logo" className="logo-img"/>
          </div>

          <h2>Register Patient</h2>

          <form onSubmit={handleContinue}>
            <div className="input-row">
              <label htmlFor="name">Full Name</label>
              <input type="text" id="name" name="name" value={formData.name}
              onChange={handleChange} placeholder="Your Full Name" required />
            </div>

            <div className="input-row">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" value={formData.email}
              onChange={handleChange} placeholder="Your Email Address" required />
            </div>

            <div className="input-row">
              <label htmlFor="password">Password</label>
              <input type="password" id="password" name="password" 
              value={formData.password} onChange={handleChange}
              placeholder="Create Password" required />
            </div>

            <div className="input-row">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input type="password" id="confirmPassword" 
              name="confirmPassword" value={formData.confirmPassword}
              onChange={handleChange} placeholder="Confirm Password" required />
            </div>

            <button type="submit" className="register-btn primary-btn" style={{ marginTop: '20px' }}>
              Register
            </button>

            <div className="separator">
              <span>or</span>
            </div>

            <div id="googleBtn" style={{ marginTop: "10px" }}>
                          <button type="button" className="google-sign-in" onClick={handleGoogleSignIn}>
                            <img src={GoogleIcon} alt="Google" />
                            Sign in with Google
                          </button>
                        </div>

            {/* ⭐ FIXED SIGN-IN CLICK */}
            <p className="login-link">
              Already have an account?{" "}
              <span onClick={() => setIsLoginOpen(true)}>Sign In</span>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
};

export default PatientRegistrationPage;
