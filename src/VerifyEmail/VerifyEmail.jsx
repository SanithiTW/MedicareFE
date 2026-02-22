import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Logo from '../assets/Logo.jpeg';
import "./VerifyEmail.css";

import { auth } from "../Firebase";
import {
  sendEmailVerification,
  verifyBeforeUpdateEmail,
  onAuthStateChanged 
} from "firebase/auth";

import { useEffect } from "react";

import API from "../api/api";

const VerifyEmail = () => {
  const location = useLocation();
  const { email, uid } = location.state || {};

  const [currentEmail, setCurrentEmail] = useState(email || "");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ FIXED: sync email + verified AFTER user clicks verification link
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user && uid) {
        try {
          // ✅ update verified flag if user verified email
          if (user.emailVerified) {
            await API.patch(`/patient/${uid}/verify-email`, {
              emailVerified: true
            });
          }

          // ✅ update email in realtime DB if different
          if (user.email !== currentEmail) {
            await API.patch(`/patient/${uid}/update-email`, {
              email: user.email
            });

            // update local state to reflect new email
            setCurrentEmail(user.email);
          }

          console.log("✅ Email + verification synced");

        } catch (err) {
          console.error("Backend update failed", err);
        }
      }
    });

    return () => unsub();
  }, [uid, currentEmail]);

  // ✅ RESEND VERIFICATION
  const handleResend = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        alert("Session expired. Please login again.");
        return;
      }

      await sendEmailVerification(user);
      alert("✅ Verification email resent!");

    } catch (err) {
      console.error(err);
      alert("Failed to resend verification email.");
    }
  };

  // ✅ CHANGE EMAIL
  const handleEmailUpdate = async () => {
    try {
      if (!currentEmail) {
        alert("Enter a valid email");
        return;
      }

      setLoading(true);

      const user = auth.currentUser;

      if (!user) {
        alert("Session expired. Please login again.");
        setLoading(false);
        return;
      }

      // ✅ NEW FIREBASE WAY
      await verifyBeforeUpdateEmail(user, currentEmail);

      alert("✅ Verification sent to new email. Please verify first.");

      // ❗ DO NOT update backend yet
      // backend update must happen AFTER verification

      setEditing(false);

    } catch (err) {
      console.error(err);

      if (err.code === "auth/requires-recent-login") {
        alert("Please login again to change email.");
      } else {
        alert(err.message || "Failed to update email.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-email-page center-wrapper">
      <div className="verify-card">
        <img src={Logo} alt="Logo" />

        <h2>📧 Verify Your Email</h2>

        {/* ✅ EMAIL DISPLAY / EDIT */}
        {!editing ? (
          <p>
            We sent a verification link to: <b>{currentEmail}</b>
            <br />
            <span
              style={{ color: "#0C6C1E", cursor: "pointer" }}
              onClick={() => setEditing(true)}
            >
              ✏️ Change email
            </span>
          </p>
        ) : (
          <div style={{ width: "100%" }}>
            <input
              type="email"
              value={currentEmail}
              onChange={(e) => setCurrentEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc"
              }}
            />

            <button
              onClick={handleEmailUpdate}
              className="primary-btn"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Email"}
            </button>
          </div>
        )}

        {/* ✅ RESEND BUTTON */}
        <button
          onClick={handleResend}
          className="primary-btn"
          style={{ marginTop: "12px" }}
        >
          Resend Email
        </button>
      </div>
    </div>
  );
};

export default VerifyEmail;