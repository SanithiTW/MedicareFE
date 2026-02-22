// src/Pages/PharmacyDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";

import './PharmacyDashboard.css';

import AddMedicinePopup from '../PharmacyPopups/AddMedicinePopup';
import EditMedicinePopup from "../PharmacyPopups/EditMedicinePopup";


// Import necessary images (Ensure these files exist in your assets folder)
import Logo from '../../assets/Logo.jpeg'; 
import BellIcon from '../../assets/Bell.png'; 
import UserIcon from '../../assets/user.png'; 
import HospitalIcon from '../../assets/HospitalIcon.png'; 

import { auth, database } from "../../Firebase";
import { ref, onValue, update, remove } from "firebase/database";


// --- Mock Data ---
const kpis = [
    { title: 'Total Orders Today', value: 25, icon: null, color: '#18D23A' },
    { title: 'Pending Prescriptions', value: 8, icon: HospitalIcon, color: '#EC1414' },
    { title: 'Available Medicines', value: '1,200', icon: HospitalIcon, color: '#07741B' },
    { title: 'Low Stock Alerts', value: 15, icon: null, color: '#EC1414' },
    { title: 'Revenue (This Month)', value: 'Rs. 450K', icon: null, color: '#07741B' },
];

const pendingPrescriptions = [
    { id: '#P345', patient: 'A. Bandara', date: '10:30 AM', status: 'New' },
    { id: '#P344', patient: 'L. Perera', date: 'Yesterday', status: 'Reviewed' },
];

const PharmacyDashboard = () => {
    const [activeTab, setActiveTab] = useState('home');
    const [medicines, setMedicines] = useState([]);
    const [showAddPopup, setShowAddPopup] = useState(false);
    const navigate = useNavigate();

    const navLinks = [
        { id: 'home', label: 'Overview', onClick: () => setActiveTab('home') },
        { id: 'medicine', label: 'Medicine Management', onClick: () => setActiveTab('medicine') },
        { id: 'orders', label: 'Orders & Prescriptions', onClick: () => setActiveTab('orders') },
        { id: 'profile', label: 'Profile Management', onClick: () => setActiveTab('profile') },
        { id: 'growth', label: 'Business Growth Panel', onClick: () => setActiveTab('growth') },
    ];

const [editingMedicineId, setEditingMedicineId] = useState(null);

const [viewingMedicine, setViewingMedicine] = useState(null);

    
    // Logout function
    const handleLogout = async () => {
        try {
            await auth.signOut();
            localStorage.removeItem("auth_uid");
            localStorage.removeItem("auth_role");
            navigate("/");
        } catch (err) {
            console.error("Logout failed:", err);
            alert("Logout failed: " + err.message);
        }
    };

    const [currentUserUid, setCurrentUserUid] = useState(null);

useEffect(() => {
  const unsubscribeAuth = auth.onAuthStateChanged(user => {
    if (user) {
      setCurrentUserUid(user.uid);
    }
  });

  return () => unsubscribeAuth();
}, []);


    useEffect(() => {
  if (!currentUserUid) return; // wait until UID is known

  const medicinesRef = ref(database, 'medicines');
  const unsubscribe = onValue(
    medicinesRef,
    (snapshot) => {
      const data = snapshot.val() || {};
      console.log("All Medicines in DB:", data);

      const pharmacyMeds = Object.entries(data)
  .filter(([id, med]) => med.pharmacyUID === currentUserUid)
  .map(([id, med]) => ({
  id,
  name: med.name || 'Unnamed',
  stock: med.stock ?? 0,
  price: med.price ?? '0.00',
  expiry: med.expiryDate || 'N/A',
  description: med.description || '',
  imageUrl: med.imageUrl || '',
  prescriptionRequired: med.prescriptionRequired || false,
  availability: med.availability || "Available",
  categories: med.categories || []
}));


      console.log("Mapped Medicines for this pharmacy:", pharmacyMeds);
      setMedicines(pharmacyMeds);
    },
    (error) => console.error("Error fetching medicines:", error)
  );

  return () => unsubscribe();
}, [currentUserUid]);


const handleDelete = (medId) => {
  const confirmDelete = window.confirm("Are you sure you want to delete this medicine?");
  if (!confirmDelete) return;

  const medRef = ref(database, `medicines/${medId}`);

  remove(medRef)
    .then(() => {
      console.log("Medicine deleted successfully");
    })
    .catch(err => console.error("Delete failed:", err));
};



    // Toggle availability
 const handleToggleAvailability = async (medId, currentStatus) => {
  const medRef = ref(database, `medicines/${medId}`);

  const newStatus =
    currentStatus === "Available"
      ? "Unavailable"
      : "Available";

  try {
    await update(medRef, {
      availability: newStatus,
      stock: newStatus === "Unavailable" ? 0 : undefined
    });

    console.log("Availability updated");
  } catch (err) {
    console.error("Update failed:", err);
  }
};





    // --- Dashboard Layout ---
    const DashboardLayout = ({ title, subtitle, navLinks, children }) => (
        <div className="pharmacy-dashboard-container">
            <div className="dashboard-header">
                <div className="header-left">
                    <img src={Logo} alt="MediCare Logo" className="header-logo-img" />
                    <span className="header-title">Pharmacy Dashboard</span>
                </div>
                <div className="header-right">
                    <img src={BellIcon} alt="Notifications" className="notification-bell" />
                    <button className="pd-btn-text" onClick={handleLogout}>Log Out</button>
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

    // --- Render Tabs ---
    const renderContent = () => {
        switch (activeTab) {
            case 'home':
                return (
                    <>
                        <div className="card-grid">
                            {kpis.map(kpi => (
                                <div className="card" key={kpi.title}>
                                    <div className="card-header">
                                        <div className="card-title" style={{ color: kpi.color }}>{kpi.title}</div>
                                        {kpi.icon && <img src={kpi.icon} alt="Icon" className="card-icon" style={{ opacity: 0.7 }} />}
                                    </div>
                                    <div className="card-content"><h3>{kpi.value}</h3></div>
                                </div>
                            ))}
                        </div>

                        <div className="card-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            <div className="list-section">
                                <div className="list-section-header">
                                    <h3>Low Stock Alerts</h3>
                                    <button className="view-details-btn" onClick={() => setActiveTab('medicine')}>Manage Stock</button>
                                </div>
                                {medicines.filter(m => m.stock < 10).map((m) => (
                                    <div className="list-item" key={m.id}>
                                        <div className="item-details">
                                            <p>{m.name}</p>
                                            <small style={{ color: '#EC1414' }}>Stock: {m.stock} | Expires: {m.expiry || 'N/A'}</small>
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
                            <button className="view-details-btn" onClick={() => setShowAddPopup(true)}>Add New Medicine</button>

                            {showAddPopup && (
                                <AddMedicinePopup
                                    onClose={() => setShowAddPopup(false)}
                                    onSuccess={() => setShowAddPopup(false)}
                                />
                            )}
                        </div>

                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Stock</th>
                                    <th>Unit Price</th>
                                    <th>Expiry Date</th>
                                    <th>Availability</th>
                                    <th>Prescription</th>   
                                    <th>Actions</th>
                                </tr>
                            </thead>
                           <tbody>
  {medicines.map((m) => (
    <tr key={m.id}>
      <td>{m.name}</td>
      <td>
        {m.categories.length > 0 ? m.categories.join(", ") : "N/A"}
      </td>
      <td style={{ color: m.stock < 10 ? "#EC1414" : "#07741B" }}>
        {m.stock}
      </td>
      <td>{m.price}</td>
      <td>{m.expiry}</td>
      <td>
        <button
          className={`action-btn ${
            m.availability === "Available"
              ? "action-available"
              : "action-unavailable"
          }`}
          onClick={() => handleToggleAvailability(m.id, m.availability)}
        >
          {m.availability}
        </button>
      </td>
      <td>
        {m.prescriptionRequired ? (
          <span style={{ color: "#EC1414", fontWeight: 600 }}>
            Required
          </span>
        ) : (
          <span style={{ color: "#07741B" }}>Not Required</span>
        )}
      </td>
      <td>
        <button
          className="action-btn action-view"
          onClick={() => setViewingMedicine(m)}
        >
          Details
        </button>
        <button
          className="action-btn action-edit"
          onClick={() => setEditingMedicineId(m.id)}
        >
          Edit
        </button>
        <button
          className="action-btn action-reject"
          onClick={() => handleDelete(m.id)}
        >
          Delete
        </button>
      </td>
    </tr>
  ))}
</tbody>



                        </table>

                        {viewingMedicine && (
  <div className="popup-overlay" onClick={() => setViewingMedicine(null)}>
    <div
      className="popup-container"
      onClick={(e) => e.stopPropagation()}
    >
      <h2>{viewingMedicine.name}</h2>

      <p><strong>Description:</strong> {viewingMedicine.description}</p>
      <p><strong>Price:</strong> Rs. {viewingMedicine.price}</p>
      <p><strong>Stock:</strong> {viewingMedicine.stock}</p>
      <p><strong>Expiry:</strong> {viewingMedicine.expiry}</p>
      <p><strong>Categories:</strong> {viewingMedicine.categories.join(", ")}</p>
      <p>
        <strong>Prescription:</strong>{" "}
        {viewingMedicine.prescriptionRequired ? "Required" : "Not Required"}
      </p>

      <button
        className="action-btn action-reject"
        onClick={() => setViewingMedicine(null)}
      >
        Close
      </button>
    </div>
  </div>
)}

                        <p style={{ marginTop: '20px', fontSize: '0.9rem' }}>
                            *Features: Low stock alerts, Expiry reminders, Bulk stock update.*
                        </p>
                        {editingMedicineId && (
  <EditMedicinePopup
    medicineId={editingMedicineId}
    onClose={() => setEditingMedicineId(null)}
  />
)}

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
                        <div className="list-section-header"><h3>Pharmacy Profile Management</h3></div>
                        <p style={{ padding: '10px' }}>**Details:** Pharmacy Name, Address, Contact, Owner, License Numbers.</p>
                        <p style={{ padding: '10px' }}>**Settings:** Change Password, Manage Working Hours (9:00 - 17:00), Upload Logo.</p>
                    </div>
                );

            case 'growth':
                return (
                    <div className="list-section">
                        <div className="list-section-header"><h3>Pharmacy Business Growth Panel</h3></div>
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
