// src/Pages/PatientRegistrationPage.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../assets/Logo.jpeg'; 
import RegistrationImage from '../assets/registration_img.png'; // Using the confirmed image name
import '../RegistrationFormsCommon.css'; 
import GoogleIcon from '../assets/google.png'; 

const PatientRegistrationPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleContinue = (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        navigate('/patient-details', { 
            state: { 
                userData: {
                    role: 'Patient',
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                }
            }
        });
    };

    return (
        <div className="registration-page">
            <div className="form-wrapper">
                {/* 1. Left Side: Image/Illustration Container (65%) */}
                <div className="image-container">
                    <img src={RegistrationImage} alt="Patient Illustration" />
                    <p className="image-caption">Manage your health records and prescriptions digitally.</p>
                </div>
                
                {/* 2. Right Side: Registration Form (35%) */}
                <div className="register-container">
                    <div className="header-logo">
                        <img src={Logo} alt="MediCare Logo" className="logo-img"/>
                    </div>

                    <h2>Register Patient</h2>

                    <form onSubmit={handleContinue}>
                        <div className="input-row">
                            <label htmlFor="name">Full Name</label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Your Full Name" required />
                        </div>
                        
                        <div className="input-row">
                            <label htmlFor="email">Email</label>
                            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="Your Email Address" required />
                        </div>
                        
                        <div className="input-row">
                            <label htmlFor="password">Password</label>
                            <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} placeholder="Create Password" required />
                        </div>

                        <div className="input-row">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm Password" required />
                        </div>
                        
                        <button type="submit" className="register-btn primary-btn" style={{ marginTop: '20px' }}>
                            Continue
                        </button>
                        
                        <div className="separator">
                            <span>or</span>
                        </div>
                        
                    <button type="button" className="google-sign-in">
                        <img src={GoogleIcon} alt="Google" />
                        Sign in with Google
                    </button>

                        <p className="login-link">
                            Already have an account? <span onClick={() => navigate('/login')}>Sign In</span>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PatientRegistrationPage;