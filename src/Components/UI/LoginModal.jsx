import React from 'react';
import './LoginModal.css';

// Ensure these paths are correct
import Logo from '../../assets/Logo.jpeg'; 
import GoogleIcon from '../../assets/google.png'; 

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
                    
                    <button type="button" className="google-sign-in">
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