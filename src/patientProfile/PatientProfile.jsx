import React, { useState } from 'react';
import './PatientProfile.css';

// --- Assets ---
// NOTE: Please ensure these paths are correct relative to PatientProfile.jsx
import Logo from '../../assets/Logo.jpeg'; 
import BellIcon from '../../assets/Bell.png'; 
import UserIcon from '../../assets/user.png'; 
import PencilIcon from '../../assets/pencil.png'; // Used for edit buttons
import UploadIcon from '../../assets/upload.png'; // Used for report uploads
import DeleteIcon from '../../assets/delete.png'; // Used for delete actions
import AddIcon from '../../assets/add.png';       // Used for adding family members

// --- Mock Data ---
const initialPatientData = {
    fullName: 'Kamal Perera',
    email: 'kamal.perera@mail.com',
    phone: '077-123-4567',
    street: '123, Galle Road',
    city: 'Colombo 03',
    district: 'Colombo',
    postalCode: '00300',
    dob: '1990-05-15',
    gender: 'Male',
    nic: '901351234V',
    bloodGroup: 'O+',
    conditions: 'Mild Hypertension, Seasonal Allergies',
    allergies: 'Penicillin, Dust',
    chronicDiseases: 'BP',
    currentMedications: 'Amlodipine (5mg)',
    alternativeContact: '071-987-6543',
};

const initialFamilyMembers = [
    { id: 1, name: 'Samanthi Perera', dob: '1992-08-20', bloodGroup: 'A+', conditions: 'None', allergies: 'Pollen' },
    { id: 2, name: 'Nimal Perera', dob: '2018-03-10', bloodGroup: 'B-', conditions: 'Asthma', allergies: 'Dust Mites' },
];

const initialDocuments = [
    { id: 1, name: 'Blood Test Report - Nov 2025', date: '2025-11-20', member: 'Kamal Perera' },
    { id: 2, name: 'Doctor Prescription - Oct 2025', date: '2025-10-01', member: 'Nimal Perera' },
];


const PatientProfile = () => {
    // State for main patient data
    const [patientData, setPatientData] = useState(initialPatientData);
    // State for family members
    const [familyMembers, setFamilyMembers] = useState(initialFamilyMembers);
    // State for documents
    const [documents, setDocuments] = useState(initialDocuments);
    // State to track which section is being edited (e.g., 'basic', 'address', 'health')
    const [editMode, setEditMode] = useState(null); 

    // General handler for form field changes
    const handleChange = (e, section) => {
        const { name, value } = e.target;
        if (section === 'main') {
            setPatientData({ ...patientData, [name]: value });
        }
        // Add logic for family member editing if needed
    };

    // Save handler
    const handleSave = (section) => {
        // Here you would typically call an API to save the data
        console.log(`Saving ${section} data...`, patientData);
        setEditMode(null); // Exit edit mode
    };

    // Delete family member handler
    const handleDeleteMember = (id) => {
        if (window.confirm("Are you sure you want to delete this family member?")) {
            setFamilyMembers(familyMembers.filter(member => member.id !== id));
            // API call to delete
        }
    };

    // Delete document handler
    const handleDeleteDocument = (id) => {
        if (window.confirm("Are you sure you want to delete this document?")) {
            setDocuments(documents.filter(doc => doc.id !== id));
            // API call to delete
        }
    };

    // Placeholder for document upload
    const handleDocumentUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            console.log("Uploading file:", file.name);
            alert(`Document ${file.name} uploaded successfully! (Mock)`);
            // Add to mock state for display
            setDocuments([...documents, {
                id: Date.now(),
                name: file.name,
                date: new Date().toISOString().slice(0, 10),
                member: patientData.fullName, // Default to patient's name
            }]);
        }
    };


    const renderInfoField = (label, name, value, isEditable = true, type = 'text') => (
        <div className="profile-info-field" key={name}>
            <label>{label}</label>
            {isEditable && editMode === name ? (
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={(e) => handleChange(e, 'main')}
                    className="edit-input"
                />
            ) : (
                <p>{value || 'N/A'}</p>
            )}
            {isEditable && editMode !== name && (
                <button 
                    className="edit-btn" 
                    onClick={() => setEditMode(name)}
                >
                    <img src={PencilIcon} alt="Edit" />
                </button>
            )}
            {editMode === name && (
                <button 
                    className="save-btn" 
                    onClick={() => handleSave(name)}
                >
                    Save
                </button>
            )}
        </div>
    );

    // --- Header Layout (Simplified) ---
    const ProfileHeader = () => (
        <div className="dashboard-header">
            <div className="header-left">
                <img src={Logo} alt="MediCare Logo" className="header-logo-img" />
                <span className="header-title">My Profile</span>
            </div>
            <div className="header-right">
                <img src={BellIcon} alt="Notifications" className="notification-bell" />
                <span className="logout-text">Log Out</span>
                <img src={UserIcon} alt="Profile" className="profile-icon" />
            </div>
        </div>
    );

    return (
        <div className="patient-profile-container">
            <ProfileHeader />

            <div className="profile-main-content">
                
                {/* 1. Profile Photo & Quick Actions */}
                <div className="profile-header-card">
                    <div className="profile-photo-area">
                        {/* Placeholder for actual photo */}
                        <div className="profile-photo-placeholder">
                            <img src={UserIcon} alt="Profile" />
                        </div>
                        <button className="upload-photo-btn">Upload Photo</button>
                    </div>

                    <div className="welcome-info">
                        <h2>Hello, {patientData.fullName}!</h2>
                        <p>Manage your account, health records, and family details here.</p>
                        <button 
                            className="change-password-btn" 
                            onClick={() => alert("Redirecting to Change Password page...")}
                        >
                            Change Password
                        </button>
                    </div>
                </div>

                <div className="profile-grid">
                    {/* 2. Basic and Address Info */}
                    <div className="profile-section basic-info">
                        <h3>✅ Basic & Contact Information</h3>
                        {renderInfoField('Full Name', 'fullName', patientData.fullName)}
                        {renderInfoField('Email Address', 'email', patientData.email, false)} {/* Email usually requires re-verification */}
                        {renderInfoField('Phone Number', 'phone', patientData.phone)}
                        
                        <h3>🏠 Address Details</h3>
                        {renderInfoField('Street Address', 'street', patientData.street)}
                        {renderInfoField('City', 'city', patientData.city)}
                        {renderInfoField('District / Province', 'district', patientData.district)}
                        {renderInfoField('Postal Code', 'postalCode', patientData.postalCode)}
                        {renderInfoField('Alternative Contact', 'alternativeContact', patientData.alternativeContact)}
                    </div>
                    
                    {/* 3. Identity and Health Profile */}
                    <div className="profile-section health-info">
                        <h3>🆔 Identity & DOB</h3>
                        {renderInfoField('Date of Birth', 'dob', patientData.dob, true, 'date')}
                        {renderInfoField('Gender', 'gender', patientData.gender)}
                        {renderInfoField('NIC', 'nic', patientData.nic)}

                        <h3>🩺 Health Profile</h3>
                        {renderInfoField('Blood Group', 'bloodGroup', patientData.bloodGroup)}
                        {renderInfoField('Existing Conditions', 'conditions', patientData.conditions)}
                        {renderInfoField('Allergies (Drug/Food)', 'allergies', patientData.allergies)}
                        {renderInfoField('Chronic Diseases (e.g., BP, Diabetes)', 'chronicDiseases', patientData.chronicDiseases)}
                        {renderInfoField('Current Medications', 'currentMedications', patientData.currentMedications)}
                    </div>
                </div>

                {/* 4. Family Members Section */}
                <div className="profile-section family-section">
                    <div className="section-header">
                        <h3>👨‍👩‍👧‍👦 Family Members</h3>
                        <button className="add-member-btn" onClick={() => alert("Open 'Add Family Member' Form")}>
                            <img src={AddIcon} alt="Add" className="add-icon" /> Add New Member
                        </button>
                    </div>

                    <div className="family-members-list">
                        {familyMembers.map(member => (
                            <div className="member-card" key={member.id}>
                                <div className="member-details">
                                    <h4>{member.name}</h4>
                                    <p>DOB: {member.dob} | Blood Group: {member.bloodGroup}</p>
                                    <small>Conditions: {member.conditions || 'None'} | Allergies: {member.allergies || 'None'}</small>
                                </div>
                                <div className="member-actions">
                                    <button className="edit-btn" onClick={() => alert(`Editing ${member.name}`)}><img src={PencilIcon} alt="Edit" /></button>
                                    <button className="delete-btn" onClick={() => handleDeleteMember(member.id)}><img src={DeleteIcon} alt="Delete" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 5. Reports and Prescriptions Upload */}
                <div className="profile-section document-section">
                    <div className="section-header">
                        <h3>📁 Reports & Prescriptions</h3>
                        <label htmlFor="document-upload" className="upload-label">
                            <img src={UploadIcon} alt="Upload" className="upload-icon" /> Upload Document
                        </label>
                        <input 
                            type="file" 
                            id="document-upload" 
                            onChange={handleDocumentUpload} 
                            style={{ display: 'none' }}
                            accept=".pdf, .jpg, .jpeg, .png"
                        />
                    </div>
                    
                    <table className="document-table">
                        <thead>
                            <tr>
                                <th>Document Name</th>
                                <th>Related Member</th>
                                <th>Date Uploaded</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.map(doc => (
                                <tr key={doc.id}>
                                    <td className="doc-name">{doc.name}</td>
                                    <td>{doc.member}</td>
                                    <td>{doc.date}</td>
                                    <td>
                                        <button className="action-view">View</button>
                                        <button className="action-delete" onClick={() => handleDeleteDocument(doc.id)}><img src={DeleteIcon} alt="Delete" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
};

export default PatientProfile;