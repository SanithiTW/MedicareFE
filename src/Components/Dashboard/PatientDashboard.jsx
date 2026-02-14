import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./PatientDashboard.css";
import MediChatBot from "./Chatbot/MediChatBot";

// 🔹 ADDED
import DoctorListing from "../../DoctorListing/DoctorListing";

// 🔹 Firebase
import { ref, get } from "firebase/database";
import { database } from "../../Firebase"; 

import Logo from "../../assets/Logo.jpeg";
import UserImg from "../../assets/user.png";
import DoctorImg from "../../assets/doctor.png";
import ReportImg from "../../assets/report.png";
import ChatbotIcon from "../../assets/chatbot.png";
import ReminderImg from "../../assets/reminder.png";
import BellImg from "../../assets/Bell.png";
import GuyImg from "../../assets/Guy.png";
import DelivaryImg from "../../assets/delivary.png";

export default function PatientDashboard() {
  const [chatOpen, setChatOpen] = useState(false);
  const containerRef = useRef();
  const chatWrapperRef = useRef(); 
  const [profilePhoto, setProfilePhoto] = useState(null);
  const navigate = useNavigate();

  // 🔹 ADDED
  const [showDoctorPopup, setShowDoctorPopup] = useState(false);
  const [showDoctorResults, setShowDoctorResults] = useState(false);
  const [doctorFilters, setDoctorFilters] = useState({
    name: "",
    specialization: "",
    time: "",
  });

  useEffect(() => {
    const uid = localStorage.getItem("auth_uid");
    const role = localStorage.getItem("auth_role");

    if (!uid || role !== "Patient") {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const uid = localStorage.getItem("auth_uid");
    if (!uid) return;

    const profileRef = ref(database, `patients/${uid}/profile`);
    get(profileRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data.profilePhoto) {
            setProfilePhoto(data.profilePhoto);
          }
        }
      })
      .catch((err) => console.error("Profile load error:", err));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    requestAnimationFrame(() => el?.classList?.add("appear"));
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        chatOpen &&
        chatWrapperRef.current &&
        !chatWrapperRef.current.contains(event.target)
      ) {
        setChatOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [chatOpen]);

  const handleLogout = () => {
    localStorage.removeItem("auth_uid");
    localStorage.removeItem("auth_role");
    navigate("/");
  };

  return (
    <div className="pd-root" ref={containerRef}>
      {/* Header */}
      <header className="pd-header">
        <div className="pd-header-left">
          <img src={Logo} alt="Logo" className="pd-logo" />
          <div className="pd-brand">
            <div className="pd-brand-sub">Dashboard</div>
          </div>
        </div>

        <div className="pd-header-center">
          <input className="pd-search" placeholder="Search..." />
        </div>

        <div className="pd-header-right">
          <button className="pd-btn-text" onClick={handleLogout}>
            Log Out
          </button>
          <img src={BellImg} alt="bell" className="pd-icon small" />
          <img
            src={profilePhoto || UserImg}
            alt="user"
            className="pd-user clickable"
            onClick={() => navigate("/patientProfile")}
          />
        </div>
      </header>

      {/* Navigation */}
      <nav className="pd-nav">
        <ul>
          <li
            className="active"
            onClick={() => setShowDoctorPopup(true)} // ✅ ADDED
          >
            Channel Doctor
          </li>
          <li onClick={() => setShowDoctorResults(true)}>Doctor</li> {/* ✅ ADDED */}
          <li onClick={() => alert("Nearest Pharmacy coming soon")}>
            Nearest Pharmacy
          </li>
          <li onClick={() => alert("Set Reminder coming soon")}>
            Set Reminder
          </li>
          <li onClick={() => alert("Order Medicine coming soon")}>
            Order Medicine
          </li>
          <li onClick={() => alert("Medicine Information coming soon")}>
            Medicine Information
          </li>
        </ul>
      </nav>

      {/* Status Cards */}
      <section className="pd-status-row">
        <div className="status-card">
          <div className="status-title">Upcoming Appointment</div>
          <div className="status-icon">
            <img src={DoctorImg} alt="doctor" />
          </div>
          <div className="status-body">
            <div className="muted">Dr. A. Perera</div>
            <div className="small muted">Tomorrow at 4:30 PM</div>
          </div>
          <button className="pd-btn small">View Details</button>
        </div>

        <div className="status-card">
          <div className="status-title">Active Orders</div>
          <div className="status-icon">
            <img src={DelivaryImg} alt="orders" />
          </div>
          <div className="status-body">
            <div className="muted">2 orders in delivery process</div>
          </div>
          <button className="pd-btn small">View Details</button>
        </div>

        <div className="status-card">
          <div className="status-title">Health Records</div>
          <div className="status-icon">
            <img src={ReportImg} alt="records" />
          </div>
          <div className="status-body">
            <div className="muted">Recent checkup uploaded</div>
          </div>
          <button className="pd-btn small">View Details</button>
        </div>

        <div className="status-card wider">
          <div className="status-title">New Reminder</div>
          <div className="status-icon">
            <img src={ReminderImg} alt="reminder" />
          </div>
          <div className="status-body">
            <div className="muted">3 reminders set</div>
          </div>
          <button className="pd-btn small">View Details</button>
        </div>
      </section>


      {/* Main Grid */}
      <main className="pd-grid">
        <section className="pd-col">
          <div className="panel fade-in">
            <div className="panel-header">My Doctor Appointments</div>
            <div className="panel-body list">
              <div className="list-item">
                <img src={GuyImg} alt="u" className="avatar" />
                <div className="li-content">
                  <div className="li-title">Dr. A. Perera</div>
                  <div className="li-sub muted">Tomorrow at 8:30 PM • Confirmed</div>
                </div>
              </div>

              <div className="list-item">
                <img src={GuyImg} alt="u" className="avatar" />
                <div className="li-content">
                  <div className="li-title">Dr. S. Fernando</div>
                  <div className="li-sub muted">Tomorrow at 8:30 PM • Pending</div>
                </div>
              </div>

              <button className="pd-btn block">Book a New Appointment</button>
            </div>
          </div>

          <div className="panel mt fade-in">
            <div className="panel-header">
              <div>My Family</div>
              <button className="tag">Add New</button>
            </div>
            <div className="panel-body">
              <div className="panel-row">
                <img src={UserImg} alt="u" className="mini-avatar" />
                <div>S. Silva</div>
              </div>
              <div className="panel-row muted">
                <img src={UserImg} alt="u" className="mini-avatar" />
                <div>S.K. Alvis</div>
              </div>
            </div>
          </div>
        </section>

        <section className="pd-col">
          <div className="panel fade-in">
            <div className="panel-header">
              <div>My Medicine Orders</div>
              <button className="tag">View Details</button>
            </div>
            <div className="panel-body list">
              <div className="order-row">
                <div>Order #123</div>
                <div className="muted">Delivered</div>
                <div className="muted">Rs. 240</div>
              </div>

              <div className="order-row">
                <div>Order #144523</div>
                <div className="muted">Delivered</div>
                <div className="muted">Rs. 348</div>
              </div>

              <button className="pd-btn block">View Details</button>
            </div>
          </div>

          <div className="panel mt fade-in">
            <div className="panel-header">
              <div>Payment History</div>
              <button className="tag">View Details</button>
            </div>
            <div className="panel-body">
              <div className="payment-row">
                <div>June 10, 2025</div>
                <div className="muted">Rs. 245</div>
              </div>
              <div className="payment-row">
                <div>August 23, 2025</div>
                <div className="muted">Rs. 340</div>
              </div>

              <button className="pd-btn block">Book a New Appointment</button>
            </div>
          </div>
        </section>
      </main>

      {/* 🔹 ADDED: Doctor Search Popup */}
      {showDoctorPopup && (
        <div
  className="modal-overlay"
  onClick={() => setShowDoctorPopup(false)}
  style={{
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  }}
>

          
          <div
  className="modal-box"
  onClick={(e) => e.stopPropagation()}
  style={{
    background: "#fff",
    padding: "24px",
    borderRadius: "12px",
    position: "relative",
    width: "320px",
  }}
>



            <button
  onClick={() => setShowDoctorPopup(false)}
  style={{
    position: "absolute",
    top: "12px",
    right: "12px",
    border: "none",
    background: "transparent",
    fontSize: "20px",
    cursor: "pointer",
  }}
>
  ✕
</button>


            <h2 style={{ marginBottom: "16px", textAlign: "center" }}>
  Search Doctor
</h2>

            <form
              className="search-form vertical-form doctor-form"
              onSubmit={(e) => {
                e.preventDefault();
                setShowDoctorPopup(false);
                setShowDoctorResults(true);
              }}
            >
              <input
                type="text"
                placeholder="Doctor Name"
                onChange={(e) =>
                  setDoctorFilters({ ...doctorFilters, name: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Specialization"
                onChange={(e) =>
                  setDoctorFilters({
                    ...doctorFilters,
                    specialization: e.target.value,
                  })
                }
              />
              <input
                type="text"
                placeholder="Time"
                onChange={(e) =>
                  setDoctorFilters({ ...doctorFilters, time: e.target.value })
                }
              />
              <button type="submit" className="search-button">
                Search Doctor
              </button>
            </form>
          </div>
        </div>
      )}


      {/* 🔹 ADDED: Doctor Listing */}
      {showDoctorResults && <DoctorListing filters={doctorFilters} />}

      {/* Chat Wrapper */}
      <div className="chat-wrapper" ref={chatWrapperRef}>
        <button
          className={`chat-bubble ${chatOpen ? "hidden" : ""}`}
          onClick={() => setChatOpen(true)}
          aria-label="Open chat"
        >
          <img src={ChatbotIcon} alt="chat" />
        </button>

        <div className={`chat-panel ${chatOpen ? "open" : ""}`} aria-hidden={!chatOpen}>
          <MediChatBot onClose={() => setChatOpen(false)} />
        </div>
      </div>
  


      {/* Chat Wrapper */}
      <div className="chat-wrapper" ref={chatWrapperRef}>
        {/* Floating Chatbot Button */}
        <button
          className={`chat-bubble ${chatOpen ? "hidden" : ""}`}
          onClick={() => setChatOpen(true)}
          aria-label="Open chat"
        >
          <img src={ChatbotIcon} alt="chat" />
        </button>

        {/* Chatbot Panel */}
        <div className={`chat-panel ${chatOpen ? "open" : ""}`} aria-hidden={!chatOpen}>
          <MediChatBot onClose={() => setChatOpen(false)} />
        </div>
      </div>
    </div>
  );
}
