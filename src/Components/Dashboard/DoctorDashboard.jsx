// src/Pages/DoctorDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import './DoctorDashboard.css';

import Logo from '../../assets/Logo.jpeg'; 
import BellIcon from '../../assets/Bell.png'; 
import UserIcon from '../../assets/user.png'; 
import DoctorIcon from '../../assets/doctor.png'; 

import { auth, database } from "../../Firebase";
import { ref, get, update,query, orderByChild, equalTo,onValue,  } from "firebase/database";

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

    const [selectedAppointment, setSelectedAppointment] = useState(null);
const [selectedPatient, setSelectedPatient] = useState(null);



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

    const openDetailsPopup = (appointment) => {
    setSelectedAppointment(appointment);
};


const loadPatientDetails = async () => {
    if (!selectedAppointment) return;

    const snap = await get(ref(database, `patients/${selectedAppointment.patientId}`));

    if (!snap.exists()) return;

    const data = snap.val();
    const profile = data.profile;

    // Check if name matches main patient
    if (profile.name === selectedAppointment.patientName) {
        setSelectedPatient(profile);
        return;
    }

    // Check family members
    const member = (profile.familyMembers || [])
        .find(m => m.name === selectedAppointment.patientName);

    if (member) {
        setSelectedPatient(member);
    }
};

useEffect(() => {
    if (!currentUserUid) return;

    const doctorRef = ref(database, `doctors/${currentUserUid}`);
    get(doctorRef)
        .then(snapshot => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setProfileData(data);
                setEditData({
                    qualification: data.qualification || "",
                    experience: data.experience || "",
                    fee: data.fee || "",
                    workingHours: data.workingHours || { weekdays: { start: "", end: "" }, weekends: { start: "", end: "" }, unavailable: [] }
                });
            }
        })
        .catch(err => console.error("Failed to load doctor profile:", err));
}, [currentUserUid]);
    // --- Auth state ---
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) setCurrentUserUid(user.uid);
        });
        return () => unsubscribe();
    }, []);

    // --- Fetch doctor profile ---






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

   const handleUpdateAppointmentStatus = async (appointmentId, newStatus) => {
    if (!currentUserUid) return;

    const appointment = appointments.find(a => a.id === appointmentId);
    if (!appointment) return alert("Appointment not found.");

    const confirmMessage = `Are you sure you want to ${newStatus} the appointment for ${appointment.patientName}?`;
    if (!window.confirm(confirmMessage)) return;

    try {
        // Fetch patient email from DB
        const patientSnap = await get(ref(database, `patients/${appointment.patientId}/profile/email`));
        if (!patientSnap.exists()) throw new Error("Patient email not found");
        const patientEmail = patientSnap.val();

        if (newStatus === "approved") {
            await update(
                ref(database, `patients/${appointment.patientId}/allowedDoctors`),
                { [currentUserUid]: true }
            );

            // 🔹 Add appointment time to doctor's unavailable periods
            const doctorRef = ref(database, `doctors/${currentUserUid}/workingHours/unavailable`);
            const snap = await get(doctorRef);
            const existingUnavailable = snap.exists() ? snap.val() : [];

            const newUnavailable = {
                date: appointment.date,
                start: appointment.time,
                end: appointment.time, // If appointment has endTime, use that
                fromAppointment: true, // Flag to identify auto-generated slots
                patientName: appointment.patientName // Optional, for display
            };

            const updatedUnavailable = [...existingUnavailable, newUnavailable];
            await update(ref(database, `doctors/${currentUserUid}/workingHours`), { unavailable: updatedUnavailable });
            setEditData(prev => ({ 
                ...prev, 
                workingHours: { ...prev.workingHours, unavailable: updatedUnavailable } 
            }));
            setProfileData(prev => ({ 
                ...prev, 
                workingHours: { ...prev.workingHours, unavailable: updatedUnavailable } 
            }));
        }

        await update(ref(database, `appointments/${appointmentId}`), { status: newStatus });

        setAppointments(prev =>
            prev.map(a =>
                a.id === appointmentId ? { ...a, status: newStatus } : a
            )
        );

        alert(`Appointment ${newStatus}!`);

        // Send email
        const payload = {
            patientEmail,
            patientName: appointment.patientName,
            appointmentId,
            status: newStatus
        };

        await fetch("http://localhost:8080/api/email/sendAppointmentStatusEmail", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        console.log("Email notification sent successfully.");
    } catch (err) {
        console.error(err);
        alert("Failed to update appointment status or send email.");
    }
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

const [appointments, setAppointments] = useState([]);
const [appointmentTab, setAppointmentTab] = useState('pending'); // pending | approved | rejected



useEffect(() => {
    if (!currentUserUid) return;

    const appointmentsQuery = query(
        ref(database, "appointments"),
        orderByChild("doctorId"),
        equalTo(currentUserUid)
    );

    get(appointmentsQuery)
        .then(snapshot => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const doctorAppointments = Object.entries(data).map(([id, a]) => ({
                    id,
                    ...a
                }));
                setAppointments(doctorAppointments);
            } else {
                setAppointments([]);
            }
        })
        .catch(err => console.error("Failed to fetch appointments:", err));
}, [currentUserUid]);

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

    const handleChange = (e) => {
    const { name, value } = e.target;

    setEditData(prev => ({
        ...prev,
        [name]: value
    }));
};

const handleWorkingHoursChange = (dayType, field, value) => {
    setEditData(prev => ({
        ...prev,
        workingHours: {
            ...prev.workingHours,
            [dayType]: {
                ...prev.workingHours[dayType],
                [field]: value
            }
        }
    }));
};
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

                case 'appointments':

    const pendingAppointments = appointments.filter(a => a.status === 'pending');
    const approvedAppointments = appointments.filter(a => a.status === 'approved');
    const rejectedAppointments = appointments.filter(a => a.status === 'rejected');

    const renderTable = (data) => (
    <table className="appointment-table">
        <thead>
            <tr>
                <th>Patient</th>
                <th>Date</th>
                <th>Time</th>
                <th>Reason</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            {data.map(app => (
                <tr key={app.id}>
                    <td>{app.patientName}</td>
                    <td>{app.date}</td>
                    <td>{app.time}</td>
                    <td>{app.reason}</td>
                    <td>
                        <button 
                            className="details-btn"
                            onClick={() => openDetailsPopup(app)}
                        >
                            Details
                        </button>
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
);
    return (
        <div className="appointments-wrapper">

            {/* 🔹 Pending Section (Normal Display) */}
            <h3 className="section-title">Pending Appointments</h3>

            {pendingAppointments.map(app => (
                <div key={app.id} className="pending-card">
                    <div>
                        <strong>{app.patientName}</strong> | {app.date} | {app.time}
                    </div>

                    <div className="appointment-actions">
                        <button 
                            className="approve-btn"
                            onClick={() => handleUpdateAppointmentStatus(app.id, 'approved')}
                        >
                            Approve
                        </button>

                        <button 
                            className="reject-btn"
                            onClick={() => handleUpdateAppointmentStatus(app.id, 'rejected')}
                        >
                            Reject
                        </button>

                        <button 
                            className="details-btn"
                            onClick={() => openDetailsPopup(app)}
                        >
                            Details
                        </button>
                    </div>
                </div>
            ))}

            {/* 🔹 Tabs for Approved & Rejected */}
            <div className="status-tabs">
                <button
                    className={appointmentTab === 'approved' ? 'active' : ''}
                    onClick={() => setAppointmentTab('approved')}
                >
                    Accepted ({approvedAppointments.length})
                </button>

                <button
                    className={appointmentTab === 'rejected' ? 'active' : ''}
                    onClick={() => setAppointmentTab('rejected')}
                >
                    Rejected ({rejectedAppointments.length})
                </button>
            </div>

            {appointmentTab === 'approved' && renderTable(approvedAppointments)}
            {appointmentTab === 'rejected' && renderTable(rejectedAppointments)}

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
        <span>{slot.date} {slot.start} - {slot.end} {slot.patientName ? `(Appointment)` : ""}</span>
        
        { !slot.fromAppointment && (
            <>
                <button className="edit-unavailable-btn" onClick={() => handleEditUnavailable(slot, idx)}>Edit</button>
                <button className="delete-unavailable-btn" onClick={() => handleDeleteUnavailable(idx)}>Delete</button>
            </>
        )}
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

        {/* Appointment Details Popup */}
        {selectedAppointment && (
            <div className="modal-overlay">
                <div className="modal">
                    <h3>Appointment Details</h3>
                    <p><strong>Patient:</strong> {selectedAppointment.patientName}</p>
                    <p><strong>Date:</strong> {selectedAppointment.date}</p>
                    <p><strong>Time:</strong> {selectedAppointment.time}</p>
                    <p><strong>Reason:</strong> {selectedAppointment.reason}</p>

                    <button 
                        className="patient-btn"
                        onClick={loadPatientDetails}
                    >
                        View Patient Details
                    </button>

                    <button onClick={() => {
                        setSelectedAppointment(null);
                        setSelectedPatient(null);
                    }}>
                        Close
                    </button>
                </div>
            </div>
        )}

        {/* Patient Details Popup */}
        {selectedPatient && (
            <div className="modal-overlay">
                <div className="modal">
                    <h3>Patient Details</h3>
                    <p><strong>Name:</strong> {selectedPatient.name}</p>
                    <p><strong>DOB:</strong> {selectedPatient.dob}</p>
                    <p><strong>Blood Group:</strong> {selectedPatient.bloodGroup}</p>
                    <p><strong>Allergies:</strong> {selectedPatient.allergies}</p>
                    <p><strong>Conditions:</strong> {selectedPatient.conditions || selectedPatient.chronicDiseases}</p>

                    <button onClick={() => setSelectedPatient(null)}>
                        Close
                    </button>
                </div>
            </div>
        )}

    </DashboardLayout>
);
};

export default DoctorDashboard;