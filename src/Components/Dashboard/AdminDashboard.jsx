import React, { useState } from 'react';
import './AdminDashboard.css';

// --- Shared Assets ---
// NOTE: Please ensure these paths are correct relative to AdminDashboard.jsx
import Logo from '../../assets/Logo.jpeg'; 
import BellIcon from '../../assets/Bell.png'; 
import UserIcon from '../../assets/user.png'; 
// --- New Assets for KPIs ---
import HospitalIcon from '../../assets/HospitalIcon.png'; // Used for Pharmacies
import DoctorIcon from '../../assets/Doctor.png';   // Used for Doctors

// --- Mock Data ---
const kpis = [
    { title: 'Total Pharmacies Registered', value: 48, icon: HospitalIcon, color: '#18D23A' }, // 18D23A
    { title: 'Total Doctors Registered', value: 72, icon: DoctorIcon, color: '#96A1FF' },     // 96A1FF
    { title: 'Total Patients Registered', value: '1,560', icon: UserIcon, color: '#07741B' },   // 07741B
    { title: 'Pending Approvals', value: 12, icon: null, color: '#EC1414' },                  // EC1414
    { title: 'Total Orders', value: '2,500', icon: null, color: '#07741B' },
    { title: 'Total Revenue (This Month)', value: 'Rs. 4.5M', icon: null, color: '#18D23A' },
];

const pendingApprovalsData = [
    { id: 'P001', name: 'New City Pharmacy', type: 'Pharmacy', date: '2025-11-24', status: 'New' },
    { id: 'D005', name: 'Dr. S. Kaluarachchi', type: 'Doctor', date: '2025-11-23', status: 'New' },
    { id: 'R001', name: 'Greenwood Pharmacy', type: 'License Re-verification', date: '2025-11-23', status: 'Re-verify' },
];

const pharmacyListData = [
    { id: 1, name: 'Mega Pharma', owner: 'A. Perera', contact: '0111234567', status: 'Verified', date: '2025-01-10', license: 'B/224' },
    { id: 2, name: 'City Meds', owner: 'B. Fernando', contact: '0119876543', status: 'Pending', date: '2025-11-01', license: 'B/225' },
];

const doctorListData = [
    { id: 1, name: 'Dr. J. Silva', specialization: 'Cardiology', license: 'SLMC/450', status: 'Verified', rating: 4.8 },
    { id: 2, name: 'Dr. K. Alwis', specialization: 'Pediatrics', license: 'SLMC/451', status: 'Pending', rating: 0 },
];

const patientListData = [
    { id: 1, name: 'S. Dias', email: 's.dias@mail.com', contact: '0773456789', registeredDate: '2025-10-15' },
    { id: 2, name: 'H. Kumar', email: 'h.kumar@mail.com', contact: '0711234560', registeredDate: '2025-11-01' },
];

const ordersData = [
    { id: '#ORD1001', patient: 'S. Dias', pharmacy: 'Mega Pharma', amount: 'Rs. 850', payment: 'Paid', delivery: 'Delivered', date: '2025-11-23' },
    { id: '#ORD1002', patient: 'H. Kumar', pharmacy: 'City Meds', amount: 'Rs. 4,200', payment: 'Pending', delivery: 'Processing', date: '2025-11-24' },
];


const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('home');

    const adminNavLinks = [
        { id: 'home', label: '1. Overview', onClick: () => setActiveTab('home') },
        { id: 'approvals', label: '2. Approvals & Verification', onClick: () => setActiveTab('approvals') },
        { id: 'pharmacy', label: '3. Pharmacy Management', onClick: () => setActiveTab('pharmacy') },
        { id: 'doctor', label: '4. Doctor Management', onClick: () => setActiveTab('doctor') },
        { id: 'patient', label: '5. Patient Management', onClick: () => setActiveTab('patient') },
        { id: 'orders', label: '6. Orders & Transactions', onClick: () => setActiveTab('orders') },
    ];

    // --- Layout Component Logic (Adapted from Patient Design) ---
    const DashboardLayout = ({ title, subtitle, navLinks, children }) => (
        <div className="admin-dashboard-container">
            <div className="dashboard-header">
                <div className="header-left">
                    <img src={Logo} alt="MediCare Logo" className="header-logo-img" />
                    <span className="header-title">Admin Dashboard</span>
                </div>
                <div className="header-right">
                    <img src={BellIcon} alt="Notifications" className="notification-bell" />
                    <span className="logout-text">Log Out</span>
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
                    <p className="subtitle">{subtitle}</p>
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
                        <h2>System Overview</h2>
                        <div className="card-grid">
                            {kpis.map(kpi => (
                                <div className="card" key={kpi.title} style={{ borderColor: kpi.color, backgroundColor: '#FFFFFF' }}>
                                    <div className="card-header">
                                        <div className="card-title" style={{ color: kpi.color }}>{kpi.title}</div>
                                        {kpi.icon && <img src={kpi.icon} alt="Icon" className="card-icon" />}
                                    </div>
                                    <div className="card-content">
                                        <h3>{kpi.value}</h3>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="list-section">
                            <div className="list-section-header">
                                <h3>Pending Approvals (Quick View)</h3>
                                <button className="view-details-btn action-approve" onClick={() => setActiveTab('approvals')}>View All</button>
                            </div>
                            {pendingApprovalsData.slice(0, 3).map((item) => (
                                <div className="list-item" key={item.id}>
                                    <div className="item-details">
                                        <p>{item.name} ({item.id})</p>
                                        <small className={`status-tag status-${item.status.toLowerCase()}`}>{item.type} | {item.date}</small>
                                    </div>
                                    <div>
                                        <button className="action-btn action-approve">Approve</button>
                                        <button className="action-btn action-reject">Reject</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                );

            case 'approvals':
                return (
                    <div className="list-section">
                        <h2>Approvals & Verification Center</h2>
                        <p className="section-description">Review pending requests from new users and for re-verification.</p>
                        {pendingApprovalsData.map((item) => (
                            <div className="list-item approval-item" key={item.id}>
                                <div className="item-details">
                                    <p style={{ fontWeight: 600 }}>{item.name} ({item.id})</p>
                                    <small className={`status-tag status-${item.status.toLowerCase()}`}>Type: {item.type} | Date: {item.date}</small>
                                </div>
                                <div>
                                    <button className="action-btn action-approve">Approve</button>
                                    <button className="action-btn action-reject">Reject</button>
                                    <button className="action-btn action-view">Request Info</button>
                                </div>
                            </div>
                        ))}
                    </div>
                );

            case 'pharmacy':
                return (
                    <div className="table-section">
                        <div className="list-section-header">
                            <h2>Pharmacy Management</h2>
                            <button className="add-btn view-details-btn">Add New Pharmacy</button>
                        </div>
                        <table className="data-table">
                            <thead>
                                <tr style={{backgroundColor: '#BCFFC6'}}>
                                    <th>Name</th>
                                    <th>Owner</th>
                                    <th>License</th>
                                    <th>Status</th>
                                    <th>Joined Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pharmacyListData.map(p => (
                                    <tr key={p.id}>
                                        <td>{p.name}</td>
                                        <td>{p.owner}</td>
                                        <td>{p.license}</td>
                                        <td className={`status-text status-${p.status.toLowerCase()}`}>{p.status}</td>
                                        <td>{p.date}</td>
                                        <td>
                                            <button className="action-btn action-view">View Profile</button>
                                            <button className="action-btn action-suspend">Disable</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            case 'doctor':
                return (
                    <div className="table-section">
                        <div className="list-section-header">
                            <h2>Doctor Management</h2>
                            <button className="add-btn view-details-btn">Add New Doctor</button>
                        </div>
                        <table className="data-table">
                            <thead>
                                <tr style={{backgroundColor: '#BCFFC6'}}>
                                    <th>Name</th>
                                    <th>Specialization</th>
                                    <th>License</th>
                                    <th>Rating</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {doctorListData.map(d => (
                                    <tr key={d.id}>
                                        <td>{d.name}</td>
                                        <td>{d.specialization}</td>
                                        <td>{d.license}</td>
                                        <td>{d.rating} ⭐</td>
                                        <td className={`status-text status-${d.status.toLowerCase()}`}>{d.status}</td>
                                        <td>
                                            <button className="action-btn action-view">View Profile</button>
                                            <button className="action-btn action-suspend">Suspend</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            
            case 'patient':
                return (
                    <div className="table-section">
                        <h2>Patient Management</h2>
                        <table className="data-table">
                            <thead>
                                <tr style={{backgroundColor: '#BCFFC6'}}>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Contact</th>
                                    <th>Registered Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {patientListData.map(p => (
                                    <tr key={p.id}>
                                        <td>{p.name}</td>
                                        <td>{p.email}</td>
                                        <td>{p.contact}</td>
                                        <td>{p.registeredDate}</td>
                                        <td>
                                            <button className="action-btn action-view">View Profile</button>
                                            <button className="action-btn action-suspend">Disable</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            case 'orders':
                return (
                    <div className="table-section">
                        <div className="list-section-header">
                            <h2>Orders & Transactions</h2>
                            <button className="view-details-btn action-approve">View Full Analytics</button>
                        </div>
                        <table className="data-table">
                            <thead>
                                <tr style={{backgroundColor: '#BCFFC6'}}>
                                    <th>Order ID</th>
                                    <th>Patient</th>
                                    <th>Pharmacy</th>
                                    <th>Amount</th>
                                    <th>Payment</th>
                                    <th>Delivery</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ordersData.map(o => (
                                    <tr key={o.id}>
                                        <td>{o.id}</td>
                                        <td>{o.patient}</td>
                                        <td>{o.pharmacy}</td>
                                        <td>{o.amount}</td>
                                        <td className={`status-text status-${o.payment.toLowerCase()}`}>{o.payment}</td>
                                        <td className={`status-text status-${o.delivery.toLowerCase()}`}>{o.delivery}</td>
                                        <td>{o.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <DashboardLayout 
            title="Welcome, Admin" 
            subtitle="Monitor all pharmacies, doctors, patients, and activities in one central control panel." 
            navLinks={adminNavLinks}
        >
            {renderContent()}
        </DashboardLayout>
    );
};

export default AdminDashboard;