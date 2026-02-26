import React, { useState, useEffect } from "react";
import "./DoctorSearch.css";
import { ref, get } from "firebase/database";
import { database } from "../Firebase";

import BookAppointmentModal from "../BookAppointmentModal/BookAppointmentModal";

import Logo from "../assets/Logo.jpeg";
import { useLocation, useNavigate } from "react-router-dom";

const DoctorList = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const filters = location.state?.filters || {};

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [bookingDoctor, setBookingDoctor] = useState(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const snapshot = await get(ref(database, "doctors"));
        if (snapshot.exists()) {
          const data = snapshot.val();
          const doctorsArray = Object.keys(data).map((key) => {
  const doc = data[key];

  return {
    id: key,
    ...doc,
    workingHours: doc.workingHours || {},
  };
});

          const activeDoctors = doctorsArray.filter((doc) => doc.value !== "suspended");
          setDoctors(activeDoctors);
        }
      } catch (err) {
        console.error("Error fetching doctors:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // 🔹 Determine doctor availability if date/time search provided
 // 🔹 helper to compare HH:mm times
const isTimeBetween = (time, start, end) => {
  return time >= start && time <= end;
};

const checkAvailability = (doc) => {
  if (!filters.date || !filters.time) return null;

  try {
    const searchDate = filters.date; // "2026-02-26"
    const searchTime = filters.time; // "14:45"

    const dateObj = new Date(searchDate);
    const day = dateObj.getDay(); // 0=Sun,6=Sat
    const isWeekend = day === 0 || day === 6;

    const wh = doc.workingHours || {};

    // ✅ STEP 1 — get working range
    const workingRange = isWeekend
      ? wh.weekends
      : wh.weekdays;

    if (!workingRange?.start || !workingRange?.end) {
      return false;
    }

    // ❌ Not inside working hours
    const insideWorking = isTimeBetween(
      searchTime,
      workingRange.start,
      workingRange.end
    );

    if (!insideWorking) return false;

    // ✅ STEP 2 — check unavailable slots for SAME DATE
    const unavailableList = Array.isArray(wh.unavailable)
      ? wh.unavailable
      : wh.unavailable
      ? Object.values(wh.unavailable)
      : [];

    const isBlocked = unavailableList.some((slot) => {
      if (slot.date !== searchDate) return false;

      return isTimeBetween(searchTime, slot.start, slot.end);
    });

    // ✅ FINAL DECISION
    return !isBlocked;
  } catch (err) {
    console.error("Availability check error:", err);
    return false;
  }
};
// 🔹 filter doctors by name + specialization
const filteredDoctors = doctors.filter((dr) => {
  const nameMatch =
    !filters.name ||
    dr.name?.toLowerCase().includes(filters.name.toLowerCase());

  const specializationMatch =
    !filters.specialization ||
    dr.specialization
      ?.toLowerCase()
      .includes(filters.specialization.toLowerCase());

  return nameMatch && specializationMatch;
});
  return (
    <div className="doctor-list-page">
      <header className="doctor-header">
        <div className="header-left">
          <img src={Logo} alt="Logo" className="header-logo" />
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>
        <div className="header-right">
          <span className="user-name">Find Doctors</span>
        </div>
      </header>

      <div className="doctor-container">
        <div className="list-controls">
          <h2>Available Doctors</h2>
          <p>{filteredDoctors.length} Doctors found</p>
        </div>

        {loading ? (
          <p>Loading doctors...</p>
        ) : (
          <div className="doctors-stack">
            {filteredDoctors.length === 0 ? (
              <p>No doctors found for your search.</p>
            ) : (
              filteredDoctors.map((dr) => {
                const available = checkAvailability(dr);
                return (
                  <div className="doctor-item-card" key={dr.id}>
                    <div className="dr-profile-section">
                      <div className="dr-image-container">
                        <div className="dr-img-placeholder">{dr.name?.charAt(0)}</div>
                      </div>

                      <div className="dr-details">
                        <div className="dr-name-row">
                          <h3>{dr.name}</h3>
                          <span className="dr-rating">⭐ {dr.rating || "4.5"}</span>
                        </div>

                        <p className="dr-spec">{dr.specialization}</p>

                        <div className="dr-meta">
                          <div className="meta-tag appts">
                            <strong>License:</strong> {dr.license}
                          </div>
                          {filters.date && filters.time ? (
                            <div
                              className={`meta-tag status ${
                                available ? "online" : "away"
                              }`}
                            >
                              ● {available ? "Available" : "Unavailable"}
                            </div>
                          ) : (
                            <div
                              className={`meta-tag status ${
                                dr.value === "active" ? "online" : "away"
                              }`}
                            >
                              ● {dr.value === "active" ? "Available" : dr.value}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="dr-action-section">
                      <button
                        className="view-profile-btn"
                        onClick={() => setSelectedDoctor(dr)}
                      >
                        View Profile
                      </button>
                      <button
  className="book-now-btn"
  onClick={() => setBookingDoctor(dr)}
>
  Book Appointment
</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Doctor Details Popup */}
      {selectedDoctor && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedDoctor(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "12px",
              position: "relative",
              width: "360px",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <button
              onClick={() => setSelectedDoctor(null)}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                border: "none",
                background: "transparent",
                fontSize: "20px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>

            <h2 style={{ textAlign: "center", marginBottom: "16px" }}>
              {selectedDoctor.name}
            </h2>

            <p><strong>Specialization:</strong> {selectedDoctor.specialization}</p>
            <p><strong>License:</strong> {selectedDoctor.license}</p>
            <p><strong>Rating:</strong> {selectedDoctor.rating || "4.5"}</p>
            <p>
              <strong>Status:</strong>{" "}
              {selectedDoctor.value === "active"
                ? "Available"
                : selectedDoctor.value}
            </p>

            {selectedDoctor.workingHours && (
  <div>
    <strong>Working Hours:</strong>
    <ul>
      {selectedDoctor.workingHours.weekdays && (
        <li>
          Weekdays:{" "}
          {selectedDoctor.workingHours.weekdays.start} -{" "}
          {selectedDoctor.workingHours.weekdays.end}
        </li>
      )}

      {selectedDoctor.workingHours.weekends && (
        <li>
          Weekends:{" "}
          {selectedDoctor.workingHours.weekends.start} -{" "}
          {selectedDoctor.workingHours.weekends.end}
        </li>
      )}
    </ul>
  </div>
)}

            {selectedDoctor.workingHours?.unavailable && (
  <div>
    <strong>Unavailable Slots:</strong>
    <ul>
      {Object.values(selectedDoctor.workingHours.unavailable).map(
        (un, idx) => (
          <li key={idx}>
            {un.date}: {un.start} - {un.end}
          </li>
        )
      )}
    </ul>
  </div>
)}
          </div>
        </div>
      )}
      {/* ✅ ADDED BOOKING MODAL */}
      {bookingDoctor && (
        <BookAppointmentModal
          doctor={bookingDoctor}
          onClose={() => setBookingDoctor(null)}
        />
      )}
    </div>
  );
};

export default DoctorList;