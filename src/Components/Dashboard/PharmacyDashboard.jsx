// src/Pages/PharmacyDashboard.jsx

import React, { useState } from 'react';
import './PharmacyDashboard.css';

// Import necessary images (Ensure these files exist in your assets folder)
import Logo from '../../assets/Logo.jpeg'; 
import BellIcon from '../../assets/Bell.png'; 
import UserIcon from '../../assets/user.png'; 
import HospitalIcon from '../../assets/HospitalIcon.png'; 

// --- Mock Data ---
const kpis = [
    { title: 'Total Orders Today', value: 25, icon: null, color: '#18D23A' },
    { title: 'Pending Prescriptions', value: 8, icon: HospitalIcon, color: '#EC1414' },
    { title: 'Available Medicines', value: '1,200', icon: HospitalIcon, color: '#07741B' },
    { title: 'Low Stock Alerts', value: 15, icon: null, color: '#EC1414' },
    { title: 'Revenue (This Month)', value: 'Rs. 450K', icon: null, color: '#07741B' },
];

const medicinesList = [
    { id: 1, name: 'Paracetamol 500mg', category: 'Painkiller', stock: 120, price: 'Rs. 10', expiry: '2026-05-01' },
    { id: 2, name: 'Amoxicillin 250mg', category: 'Antibiotic', stock: 25, price: 'Rs. 55', expiry: '2025-12-15' },
    { id: 3, name: 'Atorvastatin 10mg', category: 'Cardiology', stock: 5, price: 'Rs. 80', expiry: '2026-11-01' }, // Low Stock
];

const pendingPrescriptions = [
    { id: '#P345', patient: 'A. Bandara', date: '10:30 AM', status: 'New' },
    { id: '#P344', patient: 'L. Perera', date: 'Yesterday', status: 'Reviewed' },
];

const PharmacyDashboard = () => {
    const [activeTab, setActiveTab] = useState('home');

    const navLinks = [
        { id: 'home', label: 'Overview', onClick: () => setActiveTab('home') },
        { id: 'medicine', label: 'Medicine Management', onClick: () => setActiveTab('medicine') },
        { id: 'orders', label: 'Orders & Prescriptions', onClick: () => setActiveTab('orders') },
        { id: 'profile', label: 'Profile Management', onClick: () => setActiveTab('profile') },
        { id: 'growth', label: 'Business Growth Panel', onClick: () => setActiveTab('growth') },
    ];
    
    // --- Reusable Layout Component Logic ---
    const DashboardLayout = ({ title, subtitle, navLinks, children }) => (
        <div className="pharmacy-dashboard-container">
            <div className="dashboard-header">
                <div className="header-left">
                    <img src={Logo} alt="MediCare Logo" className="header-logo-img" />
                    <span className="header-title">Pharmacy Dashboard</span>
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
                        
                        {/* Low Stock Alerts & Prescriptions */}
                        <div className="card-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <div className="list-section">
                                <div className="list-section-header">
                                    <h3>Low Stock Alerts</h3>
                                    <button className="view-details-btn" onClick={() => setActiveTab('medicine')}>Manage Stock</button>
                                </div>
                                {medicinesList.filter(m => m.stock < 10).map((m) => (
                                    <div className="list-item" key={m.id}>
                                        <div className="item-details">
                                            <p>{m.name}</p>
                                            <small style={{ color: '#EC1414' }}>Stock: {m.stock} | Expires: {m.expiry}</small>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="list-section">
                                <div className="list-section-header">
                                    <h3>Pending Prescriptions</h3>
                                    <button className="view-details-btn" onClick={() => setActiveTab('orders')}>View All</button>
                                </div>
                                {pendingPrescriptions.map((p) => (
                                    <div className="list-item" key={p.id}>
                                        <div className="item-details">
                                            <p>{p.id} - {p.patient}</p>
                                            <small>Time: {p.date}</small>
                                        </div>
                                        <div>
                                            <button className="action-btn action-view">Validate</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                );

            case 'medicine':
                return (
                    <div className="table-section">
                        <div className="list-section-header">
                            <h3>Medicine Management</h3>
                            <button className="view-details-btn">Add New Medicine</button>
                        </div>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Stock</th>
                                    <th>Unit Price</th>
                                    <th>Expiry Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {medicinesList.map(m => (
                                    <tr key={m.id}>
                                        <td>{m.name}</td>
                                        <td>{m.category}</td>
                                        <td style={{ color: m.stock < 10 ? '#EC1414' : '#07741B' }}>{m.stock}</td>
                                        <td>{m.price}</td>
                                        <td>{m.expiry}</td>
                                        <td>
                                            <button className="action-btn action-edit">Edit</button>
                                            <button className="action-btn action-reject">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <p style={{ marginTop: '20px', fontSize: '0.9rem' }}>*Features: Low stock alerts, Expiry reminders, Bulk stock update.</p>
                    </div>
                );

            case 'orders':
                return (
                    <div className="list-section">
                        <div className="list-section-header">
                            <h3>Orders & Prescriptions</h3>
                            <button className="view-details-btn">View Order History</button>
                        </div>
                        <p style={{ padding: '10px' }}>*Insert Orders Table (Ongoing, Completed, etc.)*</p>
                        <p style={{ padding: '10px' }}>**Prescription Validation:** View uploaded images, Approve/Reject, Add recommended medicines.</p>
                    </div>
                );

            case 'profile':
                return (
                    <div className="list-section">
                        <div className="list-section-header">
                            <h3>Pharmacy Profile Management</h3>
                        </div>
                        <p style={{ padding: '10px' }}>**Details:** Pharmacy Name, Address, Contact, Owner, License Numbers.</p>
                        <p style={{ padding: '10px' }}>**Settings:** Change Password, Manage Working Hours (9:00 - 17:00), Upload Logo.</p>
                    </div>
                );

            case 'growth':
                return (
                    <div className="list-section">
                        <div className="list-section-header">
                            <h3>Pharmacy Business Growth Panel</h3>
                        </div>
                        <p style={{ padding: '10px' }}>**Insights:** Most demanded medicines, Monthly order trends, Sales comparison chart, Customer retention data.</p>
                        <p style={{ padding: '10px' }}>**Promotions:** Create discount coupons, Add promotional banners, Highlight featured medicines.</p>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <DashboardLayout 
            title="Welcome to Your Pharmacy Dashboard" 
            subtitle="Manage your pharmacy operations efficiently and grow your business." 
            navLinks={navLinks}
        >
            {renderContent()}
        </DashboardLayout>
    );
};

export default PharmacyDashboard;