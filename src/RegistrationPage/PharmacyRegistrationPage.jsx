import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../assets/Logo.jpeg'; 
import RegistrationImage from '../assets/registration_img.png'; 
import '../RegistrationFormsCommon.css'; 
import API from "../api/api";

// ⭐ IMPORT LOGIN MODAL
import { LoginModal } from "../Components/models/LoginModal";



const PharmacyRegistrationPage = () => {
    const navigate = useNavigate();

    const [continuing, setContinuing] = useState(false);
    
    // ⭐ LOGIN MODAL STATE
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    const [formData, setFormData] = useState({
        pharmacyname: '', 
        email: '', 
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleContinue = async (e) => {
    e.preventDefault();
    setContinuing(true);

    try {
        const payload = {
            pharmacyname: formData.pharmacyname,
            officialEmail: formData.email,
            createdAt: Date.now()
        };

        const res = await API.post("/pharmacy/step1", payload);
        const pendingId = res.data?.pendingId;
        if (!pendingId) throw new Error("No pendingId returned");

        localStorage.setItem("pharmacy_pendingId", pendingId);

        navigate('/pharmacy-details', {
            state: {
                userData: {
                    role: 'Pharmacy',
                    pharmacyname: formData.pharmacyname,
                    officialEmail: formData.email
                }
            }
        });

    } catch (err) {
        console.error("pharmacy step1 failed", err);
        alert("Failed to submit pharmacy step 1.");
    } finally {
        setContinuing(false);
    }
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
                    <img src={RegistrationImage} alt="Pharmacy Illustration" />
                    <p className="image-caption">Join the digital network to grow your business.</p>
                </div>
                
                <div className="register-container">
                    <div className="header-logo">
                        <img src={Logo} alt="MediCare Logo" className="logo-img"/>
                    </div>

                    <h2>Register Pharmacy</h2>

                    <form onSubmit={handleContinue}>
                        <div className="admin-message">
                            <p>📝 **Note:** Your application will be reviewed by an Admin. If approved, your **Official Email** and **Password** for login will be provided directly by the Administration team.</p>
                        </div>

                        <div className="input-row">
                            <label htmlFor="pharmacyname">Pharmacy Name</label>
                            <input type="text" id="pharmacyname" name="pharmacyname" value={formData.pharmacyname} onChange={handleChange} placeholder="Pharmacy Name" required />
                        </div>
                        
                        <div className="input-row">
                            <label htmlFor="name">Official Email</label>
                            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="Official Pharmacy Email" required />
                        </div>
                        
                        <button
                         type="submit"className="register-btn primary-btn"style={{ marginTop: '20px' }}disabled={continuing}>
    {continuing ? "Continuing..." : "Continue"}
</button>

                        
                        <div className="separator">
                            <span>or</span>
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

export default PharmacyRegistrationPage;
