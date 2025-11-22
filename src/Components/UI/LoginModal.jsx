import React from 'react';
import './LoginModal.css';

// Ensure these paths are correct
import Logo from '../../assets/Logo.jpeg'; 
import GoogleIcon from '../../assets/google.png'; 

const handleGoogleSignIn = async () => {
    try {
        // 1. Load Google Auth (using new Google Identity Services)
        const google = window.google;
        if (!google) {
            alert("Google API not loaded");
            return;
        }

        const tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: "1080448394290-dk4th5n17iljbv4fco2v9kaf2j8t73as.apps.googleusercontent.com", 
            scope: "email profile",
            callback: async (tokenResponse) => {
                const idToken = response.credential; 

                console.log("🔵 Google ID Token:", idToken);

                // 2. Call backend
                const res = await API.post("/register/patient/google", { idToken });

                console.log("🟩 Backend response:", res.data);

                const uid = res.data?.uid;
                if (!uid) {
                    throw new Error("Backend did not return UID");
                }

                // Save UID for next step
                localStorage.setItem("patient_uid", uid);

                // Navigate to patient details page
                navigate("/patient-details", {
                    state: {
                        userData: {
                            role: "Patient",
                            name: "", // you can use res.data.name if backend returns it
                            email: "", // same
                        }
                    }
                });
            },
        });

        tokenClient.requestAccessToken();
    } catch (err) {
        console.error("Google Sign-In error:", err);
        alert("Failed to sign in with Google. Check console.");
    }
};


export const LoginModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div 
                className="login-modal-content" 
                onClick={e => e.stopPropagation()} 
            >
                {/* Close button positioned absolutely */}
                <button className="close-button" onClick={onClose}>
                    &times; 
                </button>
                
                {/* Simplified Header: Just for background/padding if needed. Now white. */}
                <div className="modal-header">
                    <img src={Logo} alt="MEDICARE Logo" className="modal-logo" />
                </div>
                
                <form className="login-form">
                    <h2>Sign In</h2> {/* Title moved into the form/content area */}
                    <input type="email" placeholder="Email" required />
                    <input type="password" placeholder="Password" required />
                    <button type="submit" className="sign-in-button">Sign In</button>
                    
                    <button type="button" className="google-sign-in" onClick={handleGoogleSignIn}>
                        <img src={GoogleIcon} alt="Google" />
                        Sign in with Google
                    </button>
                    
                    <p className="signup-link">
                        Don't have an account? <a href="#">Sign up</a>
                    </p>
                </form>
            </div>
        </div>
    );
};