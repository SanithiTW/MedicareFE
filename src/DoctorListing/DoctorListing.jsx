import React from 'react';
import './DoctorListing.css';
import guyImg from '../assets/guy.png'; // Path to your doctor image

const doctors = [
  {
    id: 1,
    name: "Dr. Kamal Perera",
    specialty: "Cardiologist",
    appointments: 150,
    isAvailable: true,
  },
  {
    id: 2,
    name: "Dr. Sarah Fernando",
    specialty: "Neurologist",
    appointments: 85,
    isAvailable: false,
  },
  {
    id: 3,
    name: "Dr. Nimal Silva",
    specialty: "Dermatologist",
    appointments: 210,
    isAvailable: true,
  },
  {
    id: 4,
    name: "Dr. Priyantha Bandara",
    specialty: "General Surgeon",
    appointments: 45,
    isAvailable: false,
  },
];

const DoctorListing = () => {
  return (
    <div className="doctor-page-container">
      <div className="doctor-header-section">
        <h2>Find Your Specialist</h2>
        <p>Book appointments with our top-rated medical professionals</p>
      </div>

      <div className="doctor-list-wrapper">
        {doctors.map((doctor) => (
          <div className="doctor-row-card" key={doctor.id}>
            {/* 1. Profile Photo */}
            <div className="doc-col doc-profile">
              <div className="avatar-bg">
                <img src={guyImg} alt="Doctor" className="doc-img" />
              </div>
              <div className="doc-name-group">
                <h4>{doctor.name}</h4>
                <span>{doctor.specialty}</span>
              </div>
            </div>

            {/* 2. Appointments */}
            <div className="doc-col doc-stats">
              <span className="stat-value">{doctor.appointments}+</span>
              <span className="stat-label">Appointments</span>
            </div>

            {/* 3. Availability */}
            <div className="doc-col doc-availability">
              <span className={`status-pill ${doctor.isAvailable ? 'available' : 'unavailable'}`}>
                {doctor.isAvailable ? 'Available' : 'Unavailable'}
              </span>
            </div>

            {/* 4. Action Button */}
            <div className="doc-col doc-action">
              <button 
                className={`book-btn ${!doctor.isAvailable ? 'disabled' : ''}`}
                disabled={!doctor.isAvailable}
              >
                Book Doctor
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorListing;