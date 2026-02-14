import React, { useState, useEffect, useRef } from 'react';
import './AdminDashboard.css';

// --- Shared Assets ---
import Logo from '../../assets/Logo.jpeg'; 
import BellIcon from '../../assets/Bell.png'; 
import UserIcon from '../../assets/user.png'; 
// --- New Assets for KPIs ---
import HospitalIcon from '../../assets/HospitalIcon.png';
import DoctorIcon from '../../assets/Doctor.png';
import { useNavigate } from 'react-router-dom';

// --- Firebase ---
import { ref, set, push, onValue } from "firebase/database";
import { firebaseConfig, auth, database } from "../../Firebase";


import { 
    createUserWithEmailAndPassword, 
    fetchSignInMethodsForEmail,
    onAuthStateChanged
} from "firebase/auth";


import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const secondaryApp =
  getApps().find(app => app.name === "Secondary")
    ? getApp("Secondary")
    : initializeApp(firebaseConfig, "Secondary");

const secondaryAuth = getAuth(secondaryApp);


// --- Mock Data ---
const kpis = [
    { title: 'Total Pharmacies Registered', value: 48, icon: HospitalIcon, color: '#18D23A' },
    { title: 'Total Doctors Registered', value: 0, icon: DoctorIcon, color: '#96A1FF' },
    { title: 'Total Patients Registered', value: '1,560', icon: UserIcon, color: '#07741B' },
    { title: 'Pending Approvals', value: 12, icon: null, color: '#EC1414' },
    { title: 'Total Orders', value: '2,500', icon: null, color: '#07741B' },
    { title: 'Total Revenue (This Month)', value: 'Rs. 4.5M', icon: null, color: '#18D23A' },
];

const pendingApprovalsData = [
    { id: 'P001', name: 'New City Pharmacy', type: 'Pharmacy', date: '2025-11-24', status: 'New' },
    { id: 'D005', name: 'Dr. S. Kaluarachchi', type: 'Doctor', date: '2025-11-23', status: 'New' },
    { id: 'R001', name: 'Greenwood Pharmacy', type: 'License Re-verification', date: '2025-11-23', status: 'Re-verify' },
];



// --- Layout Component ---
    const DashboardLayout = ({ title, subtitle, navLinks, children, activeTab, onNavClick, onLogout, showDoctorModal,setShowDoctorModal,newDoctor, handleDoctorInputChange, handleCreateDoctor }) => (

        <div className="admin-dashboard-container">
        <div className="dashboard-header">
            <div className="header-left">
                <img src={Logo} alt="MediCare Logo" className="header-logo-img" />
                <span className="header-title">Admin Dashboard</span>
            </div>
            <div className="header-right">
                <img src={BellIcon} alt="Notifications" className="notification-bell" />
                <button className="pd-btn-text" onClick={onLogout}>Log Out</button> {/* ✅ Use prop */}
                <img src={UserIcon} alt="Profile" className="profile-icon" />
            </div>
        </div>

            <div className="dashboard-nav">
                {navLinks.map((link) => (
                    <a 
                        key={link.id} 
                    href="#"
                    className={`nav-link ${activeTab === link.id ? 'active' : ''}`} 
                    onClick={() => onNavClick(link.id)}
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

                {/* --- Doctor Modal --- */}
                {showDoctorModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2>Create New Doctor</h2>
                            <div className="form-group">
                                <label>Name</label>
                                <input type="text" name="name" value={newDoctor.name} onChange={handleDoctorInputChange} />
                            </div>
                            <div className="form-group">
                                <label>Specialization</label>
                                <input type="text" name="specialization" value={newDoctor.specialization} onChange={handleDoctorInputChange} />
                            </div>
                            <div className="form-group">
                                <label>License</label>
                                <input type="text" name="license" value={newDoctor.license} onChange={handleDoctorInputChange} />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" name="email" value={newDoctor.email} onChange={handleDoctorInputChange} />
                            </div>
                            <div className="form-group">
                                <label>Rating</label>
                                <input type="number" name="rating" min="0" max="5" step="0.1" value={newDoctor.rating} onChange={handleDoctorInputChange} />
                            </div>
                            <div className="modal-actions">
                                <button className="action-btn action-approve" onClick={handleCreateDoctor}>Create</button>
                                <button className="action-btn action-reject" onClick={() => setShowDoctorModal(false)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

const AdminDashboard = () => {

    

    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('home');

    // --- Modal & form state for new doctor ---
    const [showDoctorModal, setShowDoctorModal] = useState(false);
    const [newDoctor, setNewDoctor] = useState({
        name: '',
        specialization: '',
        license: '',
        email: '',
        rating: 0,
        status: 'Pending'
    });

    const [doctorsData, setDoctorsData] = useState([]);
    const adminEmailRef = useRef('');

    const adminNavLinks = [
        { id: 'home', label: 'Overview', onClick: () => setActiveTab('home') },
        { id: 'approvals', label: 'Approvals & Verification', onClick: () => setActiveTab('approvals') },
        { id: 'pharmacy', label: 'Pharmacy Management', onClick: () => setActiveTab('pharmacy') },
        { id: 'doctor', label: 'Doctor Management', onClick: () => setActiveTab('doctor') },
        { id: 'patient', label: 'Patient Management', onClick: () => setActiveTab('patient') },
        { id: 'orders', label: 'Orders & Transactions', onClick: () => setActiveTab('orders') },
    ];

    const handleLogout = () => {
        navigate("/");  
    };

    // --- Form Handlers ---
    const handleDoctorInputChange = (e) => {
        const { name, value } = e.target;
        setNewDoctor(prev => ({ ...prev, [name]: value }));
    };

    // --- Generate random password ---
    const generateRandomPassword = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$_!";
        let password = "";
        for (let i = 0; i < 10; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    };

    

    const handleCreateDoctor = async () => {
    try {
        if (!newDoctor.email) {
            alert("Please provide email for the doctor.");
            return;
        }

        // Get admin email BEFORE creating new user
        const adminEmail = auth.currentUser?.email;
        if (!adminEmail) {
            alert("Admin not logged in properly. Please refresh the page.");
            return;
        }

        // Check if email already exists
        const methods = await fetchSignInMethodsForEmail(auth, newDoctor.email);
        if (methods.length > 0) {
            alert("This email is already used by another account.");
            return;
        }

        const password = generateRandomPassword();

        // Create the doctor user
        const userCredential = await createUserWithEmailAndPassword(
    secondaryAuth,
    newDoctor.email,
    password
);
await secondaryAuth.signOut();
        const doctorId = userCredential.user.uid;

        // Save doctor in database
        await set(ref(database, `doctors/${doctorId}`), {
            name: newDoctor.name,
            specialization: newDoctor.specialization,
            license: newDoctor.license,
            email: newDoctor.email,
            rating: Number(newDoctor.rating),
            status: newDoctor.status,
            createdBy: adminEmail, // ✅ now correct
            generatedPassword: password
        });

        alert(`Doctor created successfully!\nGenerated password: ${password}`);
        setShowDoctorModal(false);
        setNewDoctor({ name: '', specialization: '', license: '', email: '', rating: 0, status: 'Pending' });
    } catch (error) {
        console.error(error);
        alert("Failed to create doctor. See console for details.");
    }
};


    // --- Fetch doctors + admin email safely ---
    useEffect(() => {
         console.log("🔥 useEffect executed");
    const unsubAuth = onAuthStateChanged(auth, (user) => {
        if (user?.email) {
            adminEmailRef.current = user.email;
        }
    });
console.log("🧪 Database object:", database);
const doctorsRef = ref(database, 'doctors');
console.log("📌 doctorsRef:", doctorsRef.toString());

const unsubscribe = onValue(
  doctorsRef,
  (snapshot) => {
    console.log("🔥 onValue triggered");
    const data = snapshot.val() || {};

    const doctorsArray = Object.entries(data).map(([id, doctor]) => ({
      id,
      ...doctor
    }));

    console.log("✅ Parsed doctors:", doctorsArray);
    setDoctorsData(doctorsArray); // ⭐ THIS WAS MISSING
  },
  (error) => {
    console.error("❌ onValue error:", error);
  }
);


    return () => {
        unsubAuth();
        unsubscribe();
    };
}, []);

    
    const kpisDisplay = kpis.map(kpi => {
    if (kpi.title === 'Total Doctors Registered') {
        return { ...kpi, value: doctorsData.length };
    }
    return kpi;
});


    // --- Tab Content Rendering ---
    const renderContent = () => {
        switch (activeTab) {
            case 'home':
                return (
                    <>
                        <h2>System Overview</h2>
                        <div className="card-grid">
                            {kpisDisplay.map(kpi => (
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

            case 'doctor':
                return (
                    <div className="table-section">
                        <div className="list-section-header">
                            <h2>Doctor Management</h2>
                            <button className="add-btn view-details-btn" onClick={() => setShowDoctorModal(true)}>Add New Doctor</button>
                        </div>
                        <table className="data-table">
                            <thead>
                                <tr style={{backgroundColor: '#BCFFC6'}}>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Specialization</th>
                                    <th>License</th>
                                    <th>Rating</th>
                                    <th>Status</th>
                                    <th>Created By</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
  {doctorsData.length === 0 ? (
    <tr>
      <td colSpan="8" style={{ textAlign: 'center' }}>No doctors found</td>
    </tr>
  ) : (
    doctorsData.map(d => (
      <tr key={d.id}>
        <td>{d.name || '-'}</td>
        <td>{d.email || '-'}</td>
        <td>{d.specialization || '-'}</td>
        <td>{d.license || '-'}</td>
        <td>{d.rating ?? 0} ⭐</td>
        <td className={`status-text status-${(d.status || '').toLowerCase()}`}>{d.status || '-'}</td>
        <td>{d.createdBy || '-'}</td>
        <td>
          <button className="action-btn action-view">View Profile</button>
          <button className="action-btn action-suspend">Suspend</button>
        </td>
      </tr>
    ))
  )}
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
        activeTab={activeTab}
        onNavClick={setActiveTab}
        onLogout={handleLogout}
        showDoctorModal={showDoctorModal}
        setShowDoctorModal={setShowDoctorModal}
        newDoctor={newDoctor}
        handleDoctorInputChange={handleDoctorInputChange}
        handleCreateDoctor={handleCreateDoctor} 
>

            {renderContent()}
        </DashboardLayout>
    );
};

export default AdminDashboard;
