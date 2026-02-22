// src/Pages/DoctorDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import './DoctorDashboard.css';

import Logo from '../../assets/Logo.jpeg'; 
import BellIcon from '../../assets/Bell.png'; 
import UserIcon from '../../assets/user.png'; 
import DoctorIcon from '../../assets/doctor.png'; 

import { auth, database } from "../../Firebase";
import { ref, get, update } from "firebase/database";

const kpis = [
    { title: 'Today’s Appointments', value: 5, icon: DoctorIcon, color: '#18D23A' },
    { title: 'Upcoming Appointments', value: 12, icon: null, color: '#96A1FF' },
    { title: 'Completed Consultations', value: 85, icon: null, color: '#07741B' },
    { title: 'Patient Reviews (Avg)', value: '4.7 ⭐', icon: null, color: '#07741B' },
    { title: 'Monthly Earnings', value: 'Rs. 250K', icon: null, color: '#18D23A' },
];

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('home');
    const [currentUserUid, setCurrentUserUid] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const [profileData, setProfileData] = useState({
        name: "",
        specialization: "",
        qualification: "",
        experience: "",
        fee: "",
        workingHours: { weekdays: { start: "", end: "" }, weekends: { start: "", end: "" }, unavailable: [] }
    });

    const [editData, setEditData] = useState({
        qualification: "",
        experience: "",
        fee: "",
        workingHours: { weekdays: { start: "", end: "" }, weekends: { start: "", end: "" }, unavailable: [] }
    });

    const [newUnavailable, setNewUnavailable] = useState(null);
    const [editIndex, setEditIndex] = useState(null);

    // --- Auth state ---
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) setCurrentUserUid(user.uid);
        });
        return () => unsubscribe();
    }, []);

    // --- Fetch doctor profile ---
    useEffect(() => {
        if (!currentUserUid) return;

        const doctorRef = ref(database, `doctors/${currentUserUid}`);
        get(doctorRef)
            .then(snapshot => {
                const data = snapshot.val();
                if (data) {
                    const workingHours = data.workingHours || { weekdays: { start: "", end: "" }, weekends: { start: "", end: "" }, unavailable: [] };
                    if (!workingHours.unavailable) workingHours.unavailable = [];
                    setProfileData({ ...data, workingHours });
                    setEditData({ ...data, workingHours });
                }
            })
            .catch(err => console.error("Failed to fetch doctor profile:", err));
    }, [currentUserUid]);

    // --- Input handlers ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };

    const handleWorkingHoursChange = (dayType, field, value) => {
        setEditData(prev => ({
            ...prev,
            workingHours: {
                ...prev.workingHours,
                [dayType]: { ...prev.workingHours[dayType], [field]: value }
            }
        }));
    };

    const isWithinWorkingHours = (date, startTime, endTime) => {
        if (!date) return false;
        const day = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
        const workingHours = editData.workingHours;
        let hours = {};
        if (['Monday','Tuesday','Wednesday','Thursday','Friday'].includes(day)) hours = workingHours.weekdays;
        else if (['Saturday','Sunday'].includes(day)) hours = workingHours.weekends;
        else return false;
        if (!hours.start || !hours.end) return false;
        return startTime >= hours.start && endTime <= hours.end;
    };

     const handleSaveProfile = async () => {
        if (!currentUserUid) return;
        try {
            const doctorRef = ref(database, `doctors/${currentUserUid}`);
            await update(doctorRef, { 
                qualification: editData.qualification,
                experience: editData.experience,
                fee: editData.fee,
                workingHours: editData.workingHours
            });
            alert("Profile updated successfully!");
            setProfileData(prev => ({ ...prev, ...editData }));
            setIsEditing(false);
        } catch (err) {
            console.error(err);
            alert("Failed to update profile.");
        }
    };

    // --- Save unavailable slot (new or edited) ---
    const handleSaveNewUnavailable = async () => {
        if (!currentUserUid || !newUnavailable) return;
        const { date, start, end } = newUnavailable;
        if (!date || !start || !end) {
            alert("Please fill all fields for the unavailable time.");
            return;
        }
        if (!isWithinWorkingHours(date, start, end)) {
            alert(`Unavailable time (${start} - ${end}) is outside working hours!`);
            return;
        }

        const existing = editData.workingHours.unavailable || [];
        const duplicate = existing.some((slot, idx) => idx !== editIndex && slot.date === date && slot.start === start && slot.end === end);
        if (duplicate) {
            alert("This unavailable time already exists.");
            return;
        }

        let updatedUnavailable = [];
        if (editIndex !== null) {
            updatedUnavailable = [...existing];
            updatedUnavailable[editIndex] = newUnavailable;
        } else {
            updatedUnavailable = [...existing, newUnavailable];
        }

        try {
            const doctorRef = ref(database, `doctors/${currentUserUid}/workingHours`);
            await update(doctorRef, { unavailable: updatedUnavailable });
            setEditData(prev => ({ ...prev, workingHours: { ...prev.workingHours, unavailable: updatedUnavailable } }));
            setProfileData(prev => ({ ...prev, workingHours: { ...prev.workingHours, unavailable: updatedUnavailable } }));
            setNewUnavailable(null);
            setEditIndex(null);
            alert("Unavailable time saved!");
        } catch(err) {
            console.error(err);
            alert("Failed to save unavailable time.");
        }
    };

    const handleDeleteUnavailable = async (index) => {
        if (!currentUserUid) return;
        const updated = [...(editData.workingHours.unavailable || [])];
        updated.splice(index, 1);
        try {
            const doctorRef = ref(database, `doctors/${currentUserUid}/workingHours`);
            await update(doctorRef, { unavailable: updated });
            setEditData(prev => ({ ...prev, workingHours: { ...prev.workingHours, unavailable: updated } }));
            setProfileData(prev => ({ ...prev, workingHours: { ...prev.workingHours, unavailable: updated } }));
            alert("Unavailable time deleted!");
        } catch(err) {
            console.error(err);
            alert("Failed to delete unavailable time.");
        }
    };

    const handleEditUnavailable = (slot, index) => {
        setNewUnavailable({ ...slot });
        setEditIndex(index);
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
        { id: 'profile', label: 'Profile & Settings', onClick: () => setActiveTab('profile') },
    ];

    const DashboardLayout = ({ title, subtitle, navLinks, children }) => (
        <div className="doctor-dashboard-container">
            <div className="dashboard-header">
                <div className="header-left">
                    <img src={Logo} alt="MediCare Logo" className="header-logo-img" />
                    <span className="header-title">Doctor Dashboard</span>
                </div>
                <div className="header-right">
                    <img src={BellIcon} alt="Notifications" className="notification-bell" />
                    <button className="pd-btn-text" onClick={handleLogout}>Log Out</button>
                    <img src={UserIcon} alt="Profile" className="profile-icon" />
                </div>
            </div>

            <div className="dashboard-nav">
                {navLinks.map(link => (
                    <a 
                        key={link.id} 
                        href="#"
                        className={`nav-link ${activeTab === link.id ? 'active' : ''}`}
                        onClick={e => { e.preventDefault(); link.onClick(); }}
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

    const renderContent = () => {
        if (!currentUserUid) return <div>Loading profile...</div>;

        switch(activeTab) {
            case 'home':
                return (
                    <div className="card-grid">
                        {kpis.map(kpi => (
                            <div className="card" key={kpi.title}>
                                <div className="card-header">
                                    <div className="card-title" style={{ color: kpi.color }}>{kpi.title}</div>
                                    {kpi.icon && <img src={kpi.icon} alt="Icon" className="card-icon" />}
                                </div>
                                <div className="card-content"><h3>{kpi.value}</h3></div>
                            </div>
                        ))}
                    </div>
                );

            case 'profile':
                return (
                    <div className="list-section profile-edit-container">
                        <div className="list-section-header"><h3>Doctor Profile Settings</h3></div>
                        <div className="profile-form">
                            <div className="form-left">
                                <label>Name (Read-only)</label>
                                <input type="text" value={profileData.name} className="form-input" disabled />
                                
                                <label>Specialization (Read-only)</label>
                                <input type="text" value={profileData.specialization} className="form-input" disabled />
                                
                                <label>Qualification</label>
                                <input type="text" name="qualification" value={editData.qualification} onChange={handleChange} className="form-input" disabled={!isEditing} />

                                <label>Experience (Years)</label>
                                <input type="number" name="experience" value={editData.experience} onChange={handleChange} className="form-input" disabled={!isEditing} />

                                <label>Consultation Fee (Rs)</label>
                                <input type="number" name="fee" value={editData.fee} onChange={handleChange} className="form-input" disabled={!isEditing} />

                                <h4>Working Hours</h4>
                                <label>Weekdays</label>
                                <input type="time" value={editData.workingHours.weekdays?.start || ""} onChange={e => handleWorkingHoursChange('weekdays','start', e.target.value)} disabled={!isEditing} /> to
                                <input type="time" value={editData.workingHours.weekdays?.end || ""} onChange={e => handleWorkingHoursChange('weekdays','end', e.target.value)} disabled={!isEditing} />

                                <label>Weekends</label>
                                <input type="time" value={editData.workingHours.weekends?.start || ""} onChange={e => handleWorkingHoursChange('weekends','start', e.target.value)} disabled={!isEditing} /> to
                                <input type="time" value={editData.workingHours.weekends?.end || ""} onChange={e => handleWorkingHoursChange('weekends','end', e.target.value)} disabled={!isEditing} />

                                <button className="edit-profile-btn" onClick={() => setIsEditing(!isEditing)}>{isEditing ? "Cancel Edit" : "Edit Profile"}</button>
                                {isEditing && <button className="save-profile-btn" onClick={handleSaveProfile}>Save Profile Changes</button>}
                            </div>

                            <div className="form-right">
                                <h4>Unavailable Periods</h4>
                                {!newUnavailable && <button className="add-unavailable-btn" onClick={() => setNewUnavailable({ date:"", start:"", end:"" })}>Add Unavailable Time</button>}

                                {newUnavailable && (
                                    <div className="unavailable-slot">
                                        <input type="date" value={newUnavailable.date} onChange={e => setNewUnavailable(prev => ({ ...prev, date: e.target.value }))} />
                                        <input type="time" value={newUnavailable.start} onChange={e => setNewUnavailable(prev => ({ ...prev, start: e.target.value }))} /> to
                                        <input type="time" value={newUnavailable.end} onChange={e => setNewUnavailable(prev => ({ ...prev, end: e.target.value }))} />
                                        <button className="save-unavailable-btn" onClick={handleSaveNewUnavailable}>Save</button>
                                    </div>
                                )}

                                {(editData.workingHours.unavailable || []).map((slot, idx) => (
                                    <div key={idx} className="unavailable-slot">
                                        <span>{slot.date} {slot.start} - {slot.end}</span>
                                        <button className="edit-unavailable-btn" onClick={() => handleEditUnavailable(slot, idx)}>Edit</button>
                                        <button className="delete-unavailable-btn" onClick={() => handleDeleteUnavailable(idx)}>Delete</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            default: return null;
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