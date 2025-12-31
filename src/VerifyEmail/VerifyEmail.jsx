import React from 'react';
import { useLocation } from 'react-router-dom';
import Logo from '../assets/Logo.jpeg';
import "./VerifyEmail.css";


const VerifyEmail = () => {
  const location = useLocation();
  const { email } = location.state || {};

  const handleResend = async () => {
    // call firebase service
    alert("Verification email resent!");
  };

  return (
    <div className="verify-email-page center-wrapper">
      <div className="verify-card">
        <img src={Logo} alt="Logo" />
        <h2>📧 Verify Your Email</h2>
        <p>We sent a verification link to: <b>{email}</b></p>
        <button onClick={handleResend} className="primary-btn">Resend Email</button>
      </div>
    </div>
  );
};

export default VerifyEmail;
