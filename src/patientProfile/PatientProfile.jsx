import React, { useState, useEffect, useCallback } from 'react';
import './PatientProfile.css';
import Logo from '../assets/Logo.jpeg';
import BellIcon from '../assets/Bell.png';
import UserIcon from '../assets/user.png';
import HomeIcon from '../assets/Home.png';

import { useNavigate } from 'react-router-dom';
import { signOut } from "firebase/auth";
import { ref, get, update, set } from 'firebase/database';
import { auth, database } from '../Firebase';
import { supabase } from "../supabase"; 

const PatientProfile = () => {
    const [patientData, setPatientData] = useState(null);
    const [familyMembers, setFamilyMembers] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [editMode, setEditMode] = useState(null);
    const [documentUploadMember, setDocumentUploadMember] = useState('');
    const [isMemberEditOpen, setIsMemberEditOpen] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [extraDetails, setExtraDetails] = useState([]);
    const navigate = useNavigate();
    const [uploading, setUploading] = useState(false);

    const [selectedDocument, setSelectedDocument] = useState(null);
    const [documentPreviewUrl, setDocumentPreviewUrl] = useState(null);
    const [documentCategory, setDocumentCategory] = useState("report");

    const [showAddMember, setShowAddMember] = useState(false);
    const [newMember, setNewMember] = useState({
      name: "",
      relationship: "",
      dob: "",
      bloodGroup: "",
      conditions: "",
      allergies: "",
      chronicDiseases: "",
      currentMedications: "",
      photo: ""
    });

    const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
    const [profilePhotoFile, setProfilePhotoFile] = useState(null);
    const [activeReportOwner, setActiveReportOwner] = useState("SELF");



    // Load user data
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (!user) return;

            const uid = user.uid;
            const snapshot = await get(ref(database, `patients/${uid}/profile`));

            if (snapshot.exists()) {
                const data = snapshot.val();
                setPatientData({
                    profilePhoto: data.profilePhoto || '',
                    fullName: data.name || user.displayName || '',
                    email: data.email || user.email || '',
                    phone: data.phone || '',
                    street: data.street || '',
                    city: data.city || '',
                    district: data.district || '',
                    postalCode: data.postalCode || '',
                    dob: data.dob || '',
                    gender: data.gender || '',
                    nic: data.nic || '',
                    bloodGroup: data.bloodGroup || '',
                    conditions: data.conditions || '',
                    allergies: data.allergies || '',
                    chronicDiseases: data.chronicDiseases || '',
                    currentMedications: data.currentMedications || '',
                    alternativeContact: data.alternativeContact || '',
                    description: data.description || '',
                });
                
                setActiveReportOwner(data.name || user.displayName || "SELF");

                setExtraDetails(data.extraDetails || []);
                setFamilyMembers(data.familyMembers || []);
                setDocuments(data.documents || []);
                setDocumentUploadMember(data.fullName || user.displayName || '');
            } else {
                setPatientData({
                    fullName: user.displayName || '',
                    email: user.email || ''
                });
            }
        });
        return () => unsubscribe();
    }, []);

    const handleChange = (e, section, memberId = null) => {
        const { name, value } = e.target;
        if (section === 'main') setPatientData({ ...patientData, [name]: value });
        else if (section === 'member') {
            setFamilyMembers(familyMembers.map(m => m.id === memberId ? { ...m, [name]: value } : m));
        }
    };

    

    const handleProfilePhotoSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setProfilePhotoFile(file);
        setProfilePhotoPreview(URL.createObjectURL(file));
    };

    const handleProfilePhotoSave = async () => {
        if (!profilePhotoFile) return;
        const uid = auth.currentUser.uid;

        if (patientData.profilePhoto) {
            try {
                const oldFile = patientData.profilePhoto.split('/').pop();
                await supabase.storage.from('patient-profile-pics').remove([oldFile]);
            } catch (err) { console.error("Failed to delete old profile photo", err); }
        }

        const path = `${uid}/profile-${Date.now()}`;
        const { error } = await supabase.storage.from("patient-profile-pics").upload(path, profilePhotoFile, { upsert: true });
        if (error) { alert("Upload failed"); return; }

        const { data } = supabase.storage.from("patient-profile-pics").getPublicUrl(path);
        await update(ref(database, `patients/${uid}/profile`), { profilePhoto: data.publicUrl });
        setPatientData({ ...patientData, profilePhoto: data.publicUrl });
        setProfilePhotoFile(null);
        setProfilePhotoPreview(null);
    };

    const handleSave = async (section) => {
        const uid = auth.currentUser.uid;
        const userRef = ref(database, `patients/${uid}/profile`);
        if (section === 'main') await update(userRef, patientData);
        else if (section === 'family') await update(userRef, { familyMembers });
        else if (section === 'extra') await update(userRef, { extraDetails });
        setEditMode(null);
        alert('Saved successfully!');
    };

    const handleDeleteMember = async (id) => {
        if (!window.confirm("Are you sure you want to delete this family member?")) return;
        const updated = familyMembers.filter(m => m.id !== id);
        setFamilyMembers(updated);
        const uid = auth.currentUser.uid;
        await update(ref(database, `patients/${uid}/profile`), { familyMembers: updated });
    };

    const handleDocumentSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const isPDF = file.type === "application/pdf";
        const isImage = file.type.startsWith("image/");

        if (!isPDF && !isImage) {
            alert("Only PDF and image files are allowed");
            return;
        }

        setSelectedDocument(file);
        setDocumentPreviewUrl(URL.createObjectURL(file));
    };

    const handleNewMemberChange = (field, value) => {
        setNewMember(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSaveDocument = async () => {
        if (!selectedDocument) return;

        try {
            setUploading(true);

            const uid = auth.currentUser.uid;
            const isPDF = selectedDocument.type === "application/pdf";
            const folderName = isPDF ? "pdfs" : "images";

            const safeName = selectedDocument.name.replace(/[^a-zA-Z0-9.-]/g, "_");
            const filePath = `${uid}/${folderName}/${Date.now()}-${safeName}`;

            const { error } = await supabase.storage
                .from("medical_reports")
                .upload(filePath, selectedDocument, {
                    upsert: true,
                    contentType: selectedDocument.type,
                });

            if (error) throw error;

            const { data } = supabase.storage
                .from("medical_reports")
                .getPublicUrl(filePath);

            const newDoc = {
                id: Date.now(),
                name: selectedDocument.name,
                path: filePath,
                publicUrl: data.publicUrl,
                type: isPDF ? "pdf" : "image",
                date: new Date().toISOString().slice(0, 10),
                member: documentUploadMember,
                category: documentCategory,
            };

            const updatedDocs = [...documents, newDoc];
            setDocuments(updatedDocs);

            await update(
                ref(database, `patients/${uid}/profile`),
                { documents: updatedDocs }
            );

            alert("Document saved successfully");
            setSelectedDocument(null);
            setDocumentPreviewUrl(null);

        } catch (err) {
            console.error(err);
            alert("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleCancelDocumentUpload = () => {
        setSelectedDocument(null);
        setDocumentPreviewUrl(null);
    };

    const handleDeleteDocument = async (id) => {
        if (!window.confirm("Are you sure you want to delete this document?")) return;
        const updated = documents.filter(d => d.id !== id);
        setDocuments(updated);
        const uid = auth.currentUser.uid;
        await update(ref(database, `patients/${uid}/profile`), { documents: updated });
    };

    const handleViewDocument = async (doc) => {
        try {
            const { data, error } = await supabase.storage.from("medical_reports").createSignedUrl(doc.path, 60);
            if (error) { alert("Unable to open document"); return; }
            window.open(data.signedUrl, "_blank");
        } catch (err) { console.error(err); alert("Something went wrong"); }
    };

    const handleLogout = async () => { await signOut(auth); localStorage.clear(); navigate("/"); };

    const handleEditMember = (member) => { setEditingMember({ ...member }); setIsMemberEditOpen(true); };

    const handleSaveExtraDetails = async () => { const uid = auth.currentUser.uid; await update(ref(database, `patients/${uid}/profile`), { extraDetails }); alert("Extra details saved successfully!"); };

    // ---- FIXED AddFamilyMemberModal ----
    const AddFamilyMemberModal = ({ onClose }) => {
    const [localMember, setLocalMember] = useState({ ...newMember });

    const handleFieldChange = (field, value) => {
        setLocalMember(prev => ({ ...prev, [field]: value }));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setLocalMember(prev => ({ ...prev, photo: reader.result }));
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (familyMembers.length >= 3) {
            alert("Maximum 3 members allowed");
            return;
        }

        const uid = auth.currentUser.uid;
        let photoUrl = "";

        if (localMember.photo) {
            const fileName = `${uid}/family-${Date.now()}.jpg`;
            await supabase.storage.from("patient-profile-pics")
                .upload(fileName, await fetch(localMember.photo).then(r => r.blob()), { upsert: true });
            photoUrl = supabase.storage.from("patient-profile-pics")
                .getPublicUrl(fileName).data.publicUrl;
        }

        const updatedMembers = [
            ...familyMembers,
            { ...localMember, id: Date.now(), photo: photoUrl }
        ];

        setFamilyMembers(updatedMembers);
        await set(ref(database, `patients/${uid}/profile/familyMembers`), updatedMembers);

        onClose(); // Close modal
        setNewMember({ name:"", relationship:"", dob:"", bloodGroup:"", conditions:"", allergies:"", chronicDiseases:"", currentMedications:"", photo:"" });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3>Add Family Member</h3>
                {localMember.photo && <img src={localMember.photo} alt="Preview" style={{ width: "80px", height: "80px", borderRadius: "50%" }}/>}
                <input className="edit-input" placeholder="Name" value={localMember.name} onChange={e => handleFieldChange("name", e.target.value)}/>
                <input className="edit-input" placeholder="Relationship" value={localMember.relationship} onChange={e => handleFieldChange("relationship", e.target.value)}/>
                <input type="date" className="edit-input" value={localMember.dob} onChange={e => handleFieldChange("dob", e.target.value)}/>
                <input className="edit-input" placeholder="Blood Group" value={localMember.bloodGroup} onChange={e => handleFieldChange("bloodGroup", e.target.value)}/>
                <textarea className="description-textarea" placeholder="Existing Conditions" value={localMember.conditions} onChange={e => handleFieldChange("conditions", e.target.value)}/>
                <input type="file" accept="image/*" onChange={handlePhotoChange}/>

                <div className="modal-actions">
                    <button className="save-btn" onClick={handleSave}>Save</button>
                    <button className="cancel-btn" onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
};


 


    const FamilyMemberModal = ({ member, onClose }) => {
        if (!member) return null;

        const [localMember, setLocalMember] = useState({ ...member });

        const handleFieldChange = (field, value) => {
            setLocalMember(prev => ({ ...prev, [field]: value }));
        };

        const handleProfilePhotoChange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => setLocalMember(prev => ({ ...prev, photo: reader.result, newPhotoFile: file }));
            reader.readAsDataURL(file);
        };

        const handleSaveEdit = async () => {
            const uid = auth.currentUser.uid;

            if (localMember.newPhotoFile && member.photo) {
                try {
                    const oldFile = member.photo.split('/').pop();
                    await supabase.storage.from("patient-profile-pics").remove([oldFile]);
                } catch (err) {
                    console.error("Failed to delete old member photo:", err);
                }
            }

            let photoUrl = localMember.photo;
            if (localMember.newPhotoFile) {
                const fileName = `${uid}/family-${Date.now()}.jpg`;
                await supabase.storage.from("patient-profile-pics").upload(fileName, localMember.newPhotoFile, { upsert: true });
                photoUrl = supabase.storage.from("patient-profile-pics").getPublicUrl(fileName).data.publicUrl;
            }

            const updatedMembers = familyMembers.map(m => m.id === localMember.id ? { ...localMember, photo: photoUrl } : m);
            setFamilyMembers(updatedMembers);
            await update(ref(database, `patients/${uid}/profile/familyMembers`), updatedMembers);
            onClose();
        };

        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <h3>Edit Family Member: {member.name}</h3>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div>
                            <img
                                src={localMember.photo || UserIcon}
                                alt="Member"
                                className="edit-member-photo"
                            />
                            <input type="file" accept="image/*" onChange={handleProfilePhotoChange} />
                        </div>

                        <div style={{ flexGrow: 1 }}>
                            <input className="edit-input" placeholder="Name" value={localMember.name} onChange={e => handleFieldChange('name', e.target.value)} />
                            <input className="edit-input" placeholder="Relationship" value={localMember.relationship} onChange={e => handleFieldChange('relationship', e.target.value)} />
                            <input type="date" className="edit-input" value={localMember.dob} onChange={e => handleFieldChange('dob', e.target.value)} />
                            <input className="edit-input" placeholder="Blood Group" value={localMember.bloodGroup} onChange={e => handleFieldChange('bloodGroup', e.target.value)} />
                            <textarea className="description-textarea" placeholder="Existing Conditions" value={localMember.conditions} onChange={e => handleFieldChange('conditions', e.target.value)} />
                            <input className="edit-input" placeholder="Allergies" value={localMember.allergies} onChange={e => handleFieldChange('allergies', e.target.value)} />
                            <input className="edit-input" placeholder="Chronic Diseases" value={localMember.chronicDiseases} onChange={e => handleFieldChange('chronicDiseases', e.target.value)} />
                            <input className="edit-input" placeholder="Current Medications" value={localMember.currentMedications} onChange={e => handleFieldChange('currentMedications', e.target.value)} />
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button className="save-btn" onClick={handleSaveEdit}>Save</button>
                        <button className="cancel-btn" onClick={onClose}>Close</button>
                    </div>
                </div>
            </div>
        );
    };

    const renderInfoField = (label, name, value, type = "text") => {
        const isReadOnly = name === "email" || name === "fullName";
        const cannotDelete = name === "phone";
        return (
            <div className="profile-info-field">
                <label>{label}</label>
                {editMode === name && !isReadOnly ? (
                    <>
                        <input type={type} name={name} value={value || ""} onChange={(e) => setPatientData({ ...patientData, [name]: e.target.value })} className="edit-input" />
                        <button className="save-btn" onClick={() => handleSave("main")}>Save</button>
                    </>
                ) : (
                    <>
                        <p>{value || "N/A"}</p>
                        {!isReadOnly && <button className="save-btn" onClick={() => setEditMode(name)}>✏️</button>}
                        {!isReadOnly && !cannotDelete && value && <button className="delete-btn" onClick={() => setPatientData({ ...patientData, [name]: "" })}>🗑️</button>}
                    </>
                )}
            </div>
        );
    };

    if (!patientData) return <p>Loading profile...</p>;
// ================================
// REPORTS
// ================================
const filteredReports = documents.filter(doc =>
  doc.category === "report" &&
  (activeReportOwner === "SELF"
    ? doc.member === patientData.fullName
    : doc.member === activeReportOwner)
);

// ================================
// PRESCRIPTIONS
// ================================
const filteredPrescriptions = documents.filter(doc =>
  doc.category === "prescription" &&
  (activeReportOwner === "SELF"
    ? doc.member === patientData.fullName
    : doc.member === activeReportOwner)
);



    const ProfileHeader = () => (
        <div className="dashboard-header">
            <div className="header-left">
                <img src={Logo} alt="MediCare Logo" className="header-logo-img" />
                <span className="header-title">My Profile</span>
            </div>
            <div className="header-right">
                <div className="home-icon" onClick={() => navigate("/PatientDashboard")}>
                    <img src={HomeIcon} alt="Home" />
                </div>
                <img src={BellIcon} alt="Notifications" className="notification-bell" />
                <button className="pd-btn-text" onClick={handleLogout}>Log Out</button>
            </div>
        </div>
    );

    return (
        <div className="patient-profile-container">
            <ProfileHeader />
            <div className="profile-main-content">
                {/* Profile Header */}
                <div className="profile-header-card">
                    <div className="profile-photo-area">
                        <div className="profile-photo-placeholder">
                            <img src={profilePhotoPreview || patientData.profilePhoto || UserIcon} alt="Profile" />
                        </div>
                        <input type="file" accept="image/*" id="profile-photo-upload" style={{ display: "none" }} onChange={handleProfilePhotoSelect}/>
                        <button className="upload-photo-btn" onClick={() => document.getElementById("profile-photo-upload").click()}>Upload Photo</button>
                        {profilePhotoFile && <button className="save-btn" onClick={handleProfilePhotoSave}>Save Photo</button>}
                    </div>
                    <div className="welcome-info">
                        <h2>Hello, {patientData.fullName}!</h2>
                        <p>Manage your account, health records, and family details here.</p>
                        <button className="change-password-btn" onClick={() => alert("Redirecting to Change Password page...")}>Change Password</button>
                    </div>
                </div>

                {/* Profile Info */}
                <div className="profile-grid">
                    {/* Basic Info */}
                    <div className="profile-section basic-info">
                        <h3>✅ Basic & Contact Information</h3>
                        {renderInfoField('Full Name', 'fullName', patientData.fullName)}
                        {renderInfoField('Email Address', 'email', patientData.email)}
                        {renderInfoField('Phone Number', 'phone', patientData.phone)}

                        <h3>🏠 Address Details</h3>
                        {renderInfoField('Street Address', 'street', patientData.street)}
                        {renderInfoField('City', 'city', patientData.city)}
                        {renderInfoField('District / Province', 'district', patientData.district)}
                        {renderInfoField('Postal Code', 'postalCode', patientData.postalCode)}
                        {renderInfoField('Alternative Contact', 'alternativeContact', patientData.alternativeContact)}
                    </div>

                    {/* Health Info */}
                    <div className="profile-section health-info">
                        <h3>🆔 Identity & DOB</h3>
                        {renderInfoField('Date of Birth', 'dob', patientData.dob)}
                        {renderInfoField('Gender', 'gender', patientData.gender)}
                        {renderInfoField('NIC', 'nic', patientData.nic)}

                        <h3>🩺 Health Profile</h3>
                        {renderInfoField('Blood Group', 'bloodGroup', patientData.bloodGroup)}
                        {renderInfoField('Existing Conditions', 'conditions', patientData.conditions)}
                        {renderInfoField('Allergies (Drug/Food)', 'allergies', patientData.allergies)}
                        {renderInfoField('Chronic Diseases (e.g., BP, Diabetes)', 'chronicDiseases', patientData.chronicDiseases)}
                        {renderInfoField('Current Medications', 'currentMedications', patientData.currentMedications)}
                    </div>

                    {/* Description Section */}
                    <div className="profile-section">
                        <h3>📝 Description</h3>
                        <textarea
                            value={patientData.description || ''}
                            onChange={(e) => setPatientData({ ...patientData, description: e.target.value })}
                            placeholder="Add your personal notes or description..."
                            className="description-textarea"
                        />
                        <button className="save-btn" onClick={() => handleSave('main')}>Save Description</button>
                    </div>

                    {/* Extra Details Section */}
                    <div className="profile-section">
                        <h3>➕ Extra Details</h3>
                        {extraDetails.map((item, idx) => (
                            <div key={idx} className="profile-info-field">
                                <input
                                    type="text"
                                    placeholder="Field Name"
                                    value={item.key}
                                    onChange={(e) => {
                                        const updated = [...extraDetails];
                                        updated[idx].key = e.target.value;
                                        setExtraDetails(updated);
                                    }}
                                    className="edit-input"
                                />
                                <input
                                    type="text"
                                    placeholder="Field Value"
                                    value={item.value}
                                    onChange={(e) => {
                                        const updated = [...extraDetails];
                                        updated[idx].value = e.target.value;
                                        setExtraDetails(updated);
                                    }}
                                    className="edit-input"
                                />
                                <button className="delete-btn" onClick={() => {
                                    const updated = extraDetails.filter((_, i) => i !== idx);
                                    setExtraDetails(updated);
                                }}>Delete</button>
                            </div>
                        ))}
                        <button className="add-member-btn" onClick={() => setExtraDetails([...extraDetails, { key: '', value: '' }])}>
                            Add New Detail
                        </button>
                        <button className="save-btn" onClick={() => handleSaveExtraDetails()}>Save Extra Details</button>
                    </div>
                </div>

                {/* Family Members Section */}
                <div className="profile-section family-section">
                    <div className="section-header">
                        <h3>👨‍👩‍👧‍👦 Family Members</h3>
                        <button
                            className="add-member-btn"
                            onClick={() => {
                                if (familyMembers.length >= 3) {
                                    alert("You can only add up to 3 family members");
                                    return;
                                }
                                setShowAddMember(true);
                            }}
                        >
                            + Add New Member
                        </button>
                    </div>
                    <div className="family-members-list">
                        {familyMembers.map(member => (
    <div className="member-card" key={member.id}>
        <div className="member-details">
            <img
                src={member.photo || UserIcon}
                alt="member"
                style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover", marginBottom:"10px" }}
            />
            <h4>{member.name} <small>({member.relationship})</small></h4>
            {member.dob && <p>DOB: {member.dob}</p>}
            {member.bloodGroup && <p>Blood Group: {member.bloodGroup}</p>}
            {member.conditions && <small>Conditions: {member.conditions}</small>}
            {member.allergies && <small>Allergies: {member.allergies}</small>}
            {member.chronicDiseases && <small>Chronic: {member.chronicDiseases}</small>}
            {member.currentMedications && <small>Medications: {member.currentMedications}</small>}
        </div>
        <div className="member-actions">
            <button className="edit-btn" onClick={() => handleEditMember(member)}>Edit</button>
            <button className="delete-btn" onClick={() => handleDeleteMember(member.id)}>Delete</button>
        </div>
    </div>
))}

                    </div>
                </div>

                {/* Documents Section */}
                <div className="profile-section document-section">
                    <div className="section-header">
                        <h3>📁 Reports </h3>
                        <div className="document-upload-controls">
                            <label htmlFor="member-select" className="member-select-label">Upload For:</label>
                            <select
                                id="member-select"
                                className="member-select"
                                value={documentUploadMember}
                                onChange={(e) => setDocumentUploadMember(e.target.value)}
                            >
                                <option value={patientData.fullName}>{patientData.fullName} (Self)</option>
                                {familyMembers.map(member => <option key={member.id} value={member.name}>{member.name}</option>)}
                            </select>

                            <label htmlFor="document-upload" className="upload-label">
                                <span role="img" aria-label="Upload" className="upload-icon">&#x2B06;</span> Upload Document
                            </label>
                            <input
                                type="file"
                                id="document-upload"
                                onChange={handleDocumentSelect}
                                style={{ display: 'none' }}
                                accept=".pdf,.jpg,.jpeg,.png"
                            />
                        </div>
                    </div>

                    {selectedDocument && (
                        <div className="document-preview-box">
                            <h4>Preview</h4>
                            {selectedDocument.type.startsWith("image/") ? (
                                <img
                                    src={documentPreviewUrl}
                                    alt="Preview"
                                    style={{ width: "200px", borderRadius: "8px" }}
                                />
                            ) : (
                                <p>📄 {selectedDocument.name}</p>
                            )}
                            <button
                              className="save-btn"
                              onClick={handleSaveDocument}
                              disabled={uploading}
                            >
                              {uploading ? "Saving..." : "Save Document"}
                            </button>

                            <button
                              className="cancel-btn"
                              onClick={handleCancelDocumentUpload}
                              disabled={uploading}
                            >
                              Cancel
                            </button>
                        </div>
                    )}

                    <div className="report-owner-tabs">
  <button
    className={activeReportOwner === "SELF" ? "active-tab" : ""}
    onClick={() => setActiveReportOwner("SELF")}
  >
    {patientData.fullName} (Self)
  </button>

  {familyMembers.map(member => (
    <button
      key={member.id}
      className={activeReportOwner === member.name ? "active-tab" : ""}
      onClick={() => setActiveReportOwner(member.name)}
    >
      {member.name}
    </button>
  ))}
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
  {filteredReports.length === 0 ? (
    <tr>
      <td colSpan="4" style={{ textAlign: "center", color: "#888" }}>
        No reports available
      </td>
    </tr>
  ) : (
    filteredReports.map(doc => (
      <tr key={doc.id}>
        <td>{doc.name}</td>
        <td>{doc.member}</td>
        <td>{doc.date}</td>
        <td>
          <button className="action-view" onClick={() => handleViewDocument(doc)}>View</button>
          <button className="action-delete" onClick={() => handleDeleteDocument(doc.id)}>🗑️</button>
        </td>
      </tr>
    ))
  )}
</tbody>

                    </table>
                </div>

                {showAddMember && <AddFamilyMemberModal onClose={() => setShowAddMember(false)} />}

                {isMemberEditOpen && (
                    <FamilyMemberModal member={editingMember} onClose={() => setIsMemberEditOpen(false)} />
                )}

                            {/* Prescriptions Section */}
<div className="profile-section document-section">
  <div className="section-header">
    <h3>🩺 Prescriptions</h3>
  </div>

  {/* Tabs */}
  <div className="report-owner-tabs">
    <button
      className={activeReportOwner === "SELF" ? "active-tab" : ""}
      onClick={() => setActiveReportOwner("SELF")}
    >
      {patientData.fullName} (Self)
    </button>

    {familyMembers.map(member => (
      <button
        key={member.id}
        className={activeReportOwner === member.name ? "active-tab" : ""}
        onClick={() => setActiveReportOwner(member.name)}
      >
        {member.name}
      </button>
    ))}
  </div>

  <table className="document-table">
    <thead>
      <tr>
        <th>Prescription Name</th>
        <th>Patient</th>
        <th>Date</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {filteredPrescriptions.length === 0 ? (
        <tr>
          <td colSpan="4" style={{ textAlign: "center", color: "#888" }}>
            No prescriptions available
          </td>
        </tr>
      ) : (
        filteredPrescriptions.map(doc => (
          <tr key={doc.id}>
            <td>{doc.name}</td>
            <td>{doc.member}</td>
            <td>{doc.date}</td>
            <td>
              <button className="action-view" onClick={() => handleViewDocument(doc)}>View</button>
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>
            </div>

        </div>
    );
};

export default PatientProfile;