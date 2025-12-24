// src/Pages/DoctorDashboard.jsx

import React, { useState } from 'react';
import './DoctorDashboard.css';

// Import necessary images (Ensure these files exist in your assets folder)
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
    const [activeTab, setActiveTab] = useState('home');

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
                    <span style={{ color: '#555' }}>Log Out</span>
                    <img src={UserIcon} alt="Profile" className="profile-icon" />
                </div>
            </div>

            <div className="dashboard-nav">
                {navLinks.map((link) => (
                    <a 
                        key={link.id} 
                        href="#"
                        className={`nav-link ${activeTab === link.id ? 'active' : ''}`}
                        onClick={link.onClick}
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
                    <>
                        {/* KPI Cards */}
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
                        
                        {/* Today's Appointments */}
                        <div className="list-section">
                            <div className="list-section-header">
                                <h3>Today’s Appointments</h3>
                                <button className="view-details-btn" onClick={() => setActiveTab('appointments')}>View All</button>
                            </div>
                            {appointmentsList.filter(a => a.status === 'Confirmed').map((a) => (
                                <div className="list-item" key={a.id}>
                                    <div className="item-details">
                                        <p>{a.patient}</p>
                                        <small>Reason: {a.reason} | Time: {a.time}</small>
                                    </div>
                                    <span className="item-status status-confirmed">Start Consultation</span>
                                </div>
                            ))}
                        </div>
                    </>
                );

            case 'appointments':
                return (
                    <div className="list-section">
                        <div className="list-section-header">
                            <h3>Appointment Management</h3>
                            <button className="view-details-btn">Book New</button>
                        </div>
                        {appointmentsList.map((a) => (
                            <div className="list-item" key={a.id}>
                                <div className="item-details">
                                    <p style={{ fontWeight: 600 }}>{a.patient}</p>
                                    <small>Time: {a.time} | Reason: {a.reason}</small>
                                </div>
                                <div>
                                    <span className={`item-status status-${a.status === 'Confirmed' ? 'confirmed' : 'pending'}`}>
                                        {a.status}
                                    </span>
                                    <button className="action-btn action-view" style={{ marginLeft: '10px' }}>Details</button>
                                </div>
                            </div>
                        ))}
                    </div>
                );

            case 'records':
                return (
                    <div className="table-section">
                        <div className="list-section-header">
                            <h3>Patient Records</h3>
                        </div>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Age/Gender</th>
                                    <th>Last Consultation</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {patientRecords.map(p => (
                                    <tr key={p.id}>
                                        <td>{p.name}</td>
                                        <td>{p.age} / {p.gender}</td>
                                        <td>{p.lastConsultation}</td>
                                        <td>
                                            <button className="action-btn action-view">View Profile</button>
                                            <button className="action-btn action-chat">Add Note</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            case 'prescription':
                return (
                    <div className="list-section">
                        <div className="list-section-header">
                            <h3>E-Prescription System</h3>
                        </div>
                        <p style={{ padding: '10px' }}>**Create Prescription Form:** Patient details auto-fill, Medicine recommendations, Dosage, Duration, Next appointment date.</p>
                        <button className="view-details-btn" style={{ margin: '10px 0' }}>Start New Prescription</button>
                    </div>
                );

            case 'chat':
                return (
                    <div className="list-section">
                        <div className="list-section-header">
                            <h3>Telemedicine / Chat Support</h3>
                        </div>
                        <p style={{ padding: '10px' }}>**Chat with Patients:** Secure messaging, Send voice notes, Send images (reports).</p>
                        <p style={{ padding: '10px' }}>**Video Consultation:** Start video call, Share medical advice, Record notes.</p>
                        <button className="view-details-btn" style={{ margin: '10px 0' }}>Go to Chat</button>
                    </div>
                );
            
            case 'profile':
                return (
                    <div className="list-section">
                        <div className="list-section-header">
                            <h3>Doctor Profile Settings</h3>
                        </div>
                        <p style={{ padding: '10px' }}>**Profile Details:** Name, Specialization, Qualifications, Experience, Consultation Fee, Available Hours, Profile Picture.</p>
                        <p style={{ padding: '10px' }}>**Account Settings:** Password change, Notification preferences.</p>
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