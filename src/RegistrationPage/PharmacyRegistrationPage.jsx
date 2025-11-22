// src/Pages/PharmacyRegistrationPage.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../assets/Logo.jpeg'; 
import RegistrationImage from '../assets/registration_img.png'; 
import '../RegistrationFormsCommon.css'; 
import API from "../api/api";



const PharmacyRegistrationPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        pharmacyname: '', 
        name: '', 
        // Email and Password removed from this step
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleContinue = async (e) => {
  e.preventDefault();

  try {
    const payload = {
      pharmacyname: formData.pharmacyname,
      name: formData.name,
      createdAt: Date.now()
    };

    const res = await API.post("/pharmacy/step1", payload);
    const pendingId = res.data?.pendingId;
    if (!pendingId) throw new Error("No pendingId returned");

    // store and navigate to details page
    localStorage.setItem("pharmacy_pendingId", pendingId);

    navigate('/pharmacy-details', {
      state: { userData: { role: 'Pharmacy', pharmacyname: formData.pharmacyname, name: formData.name } }
    });

  } catch (err) {
    console.error("pharmacy step1 failed", err);
    alert("Failed to submit pharmacy step 1.");
  }
};

    return (
        <div className="registration-page">
            <div className="form-wrapper">
                {/* 1. Left Side: Image/Illustration Container */}
                <div className="image-container">
                    <img src={RegistrationImage} alt="Pharmacy Illustration" />
                    <p className="image-caption">Join the digital network to grow your business.</p>
                </div>
                
                {/* 2. Right Side: Registration Form */}
                <div className="register-container">
                    <div className="header-logo">
                        <img src={Logo} alt="MediCare Logo" className="logo-img"/>
                    </div>

                    <h2>Register Pharmacy</h2>

                    <form onSubmit={handleContinue}>

                        {/* Admin Approval Message */}
                        <div className="admin-message">
                            <p>📝 **Note:** Your application will be reviewed by an Admin. If approved, your **Official Email** and **Password** for login will be provided directly by the Administration team.</p>
                        </div>

                        <div className="input-row">
                            <label htmlFor="pharmacyname">Pharmacy Name</label>
                            <input type="text" id="pharmacyname" name="pharmacyname" value={formData.pharmacyname} onChange={handleChange} placeholder="Pharmacy Name" required />
                        </div>
                        
                        <div className="input-row">
                            <label htmlFor="name">Owner/Manager Name</label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Owner / Manager Name" required />
                        </div>
                        
                        {/* Email and Password inputs removed as per new requirement */}
                        
                        <button type="submit" className="register-btn primary-btn" style={{ marginTop: '20px' }}>
                            Continue
                        </button>
                        
                        <div className="separator">
                            <span>or</span>
                        </div>
                        


                        <p className="login-link">
                            Already have an account? <span onClick={() => navigate('/login')}>Sign In</span>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PharmacyRegistrationPage;