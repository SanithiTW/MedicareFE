// src/Pages/DoctorDashboard.jsx

import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import './DoctorDashboard.css';

// Import necessary images
import Logo from '../../assets/Logo.jpeg'; 
import BellIcon from '../../assets/Bell.png'; 
import UserIcon from '../../assets/user.png'; 
import DoctorIcon from '../../assets/doctor.png'; 

// --- Mock Data ---
const kpis = [
    { title: 'Today’s Appointments', value: 5, icon: DoctorIcon, color: '#18D23A' },
    { title: 'Upcoming Appointments', value: 12, icon: null, color: '#96A1FF' },
    { title: 'Completed Consultations', value: 85, icon: null, color: '#07741B' },
    { title: 'Patient Reviews (Avg)', value: '4.7 ⭐', icon: null, color: '#07741B' },
    { title: 'Monthly Earnings', value: 'Rs. 250K', icon: null, color: '#18D23A' },
];

const appointmentsList = [
    { id: 1, patient: 'S. Dias', time: '10:00 AM (Tele)', reason: 'Fever', status: 'Confirmed' },
    { id: 2, patient: 'K. Perera', time: '11:30 AM (Physical)', reason: 'Follow-up', status: 'Confirmed' },
    { id: 3, patient: 'A. Fernando', time: '02:00 PM (Tele)', reason: 'Checkup', status: 'Pending' },
];

const patientRecords = [
    { id: 1, name: 'S. Dias', age: 35, gender: 'M', lastConsultation: '2025-11-20' },
    { id: 2, name: 'K. Perera', age: 55, gender: 'F', lastConsultation: '2025-11-24' },
];

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('home');

    // ✅ Profile Form State
    const [profileData, setProfileData] = useState({
        name: "",
        specialization: "",
        qualification: "",
        experience: "",
        fee: "",
        hours: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleLogout = () => {
        localStorage.removeItem("auth_uid");
        localStorage.removeItem("auth_role");
        navigate("/");
    };

    const navLinks = [
        { id: 'home', label: 'Overview', onClick: () => setActiveTab('home') },
        { id: 'appointments', label: 'Appointment Management', onClick: () => setActiveTab('appointments') },
        { id: 'records', label: 'Patient Records', onClick: () => setActiveTab('records') },
        { id: 'prescription', label: 'E-Prescription System', onClick: () => setActiveTab('prescription') },
        { id: 'chat', label: 'Telemedicine / Chat', onClick: () => setActiveTab('chat') },
        { id: 'profile', label: 'Profile & Settings', onClick: () => setActiveTab('profile') },
    ];
    
    // --- Reusable Layout Component Logic ---
    const DashboardLayout = ({ title, subtitle, navLinks, children }) => (
        <div className="doctor-dashboard-container">
            <div className="dashboard-header">
                <div className="header-left">
                    <img src={Logo} alt="MediCare Logo" className="header-logo-img" />
                    <span className="header-title">Doctor Dashboard</span>
                </div>
                <div className="header-right">
                    <img src={BellIcon} alt="Notifications" className="notification-bell" />
                    <button className="pd-btn-text" onClick={handleLogout}>
                        Log Out
                    </button>
                    <img src={UserIcon} alt="Profile" className="profile-icon" />
                </div>
            </div>

            <div className="dashboard-nav">
                {navLinks.map((link) => (
                    <a 
                        key={link.id} 
                        href="#"
                        className={`nav-link ${activeTab === link.id ? 'active' : ''}`}
                        onClick={(e) => {
                            e.preventDefault();
                            link.onClick();
                        }}
                    >
                        {link.label}
                    </a>
                ))}
            </div>

            <div className="dashboard-main-content">
                <div className="welcome-section">
                    <h1>{title}</h1>
                    <h2>{subtitle}</h2>
                </div>
                {children}
            </div>
        </div>
    );

    // --- Tab Content Rendering ---
    const renderContent = () => {
        switch (activeTab) {

            case 'home':
                return (
                    <div className="card-grid">
                        {kpis.map(kpi => (
                            <div className="card" key={kpi.title}>
                                <div className="card-header">
                                    <div className="card-title" style={{ color: kpi.color }}>{kpi.title}</div>
                                    {kpi.icon && <img src={kpi.icon} alt="Icon" className="card-icon" style={{ opacity: 0.7 }} />}
                                </div>
                                <div className="card-content">
                                    <h3>{kpi.value}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                );

            case 'profile':
                return (
                    <div className="list-section">
                        <div className="list-section-header">
                            <h3>Doctor Profile Settings</h3>
                        </div>

                        <form 
                            style={{ padding: "20px", maxWidth: "500px" }} 
                            onSubmit={(e) => e.preventDefault()} // ✅ Prevent page reload
                        >

                            <label>Name</label>
                            <input type="text" name="name" value={profileData.name} onChange={handleChange} className="form-input" />

                            <label>Specialization</label>
                            <input type="text" name="specialization" value={profileData.specialization} onChange={handleChange} className="form-input" />

                            <label>Qualification</label>
                            <input type="text" name="qualification" value={profileData.qualification} onChange={handleChange} className="form-input" />

                            <label>Experience (Years)</label>
                            <input type="number" name="experience" value={profileData.experience} onChange={handleChange} className="form-input" />

                            <label>Consultation Fee (Rs)</label>
                            <input type="number" name="fee" value={profileData.fee} onChange={handleChange} className="form-input" />

                            <label>Available Hours</label>
                            <input type="text" name="hours" value={profileData.hours} onChange={handleChange} className="form-input" />

                            <button type="submit" className="view-details-btn" style={{ marginTop: "15px" }}>
                                Save Changes
                            </button>

                        </form>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <DashboardLayout 
            title="Welcome, Doctor" 
            subtitle="Manage your appointments, patients, and medical consultations in one place." 
            navLinks={navLinks}
        >
            {renderContent()}
        </DashboardLayout>
    );
};

export default DoctorDashboard;