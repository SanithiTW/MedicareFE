import React, { useState, useEffect } from "react";
import "./DoctorList.css";
import { ref, get } from "firebase/database";
import { database } from "../Firebase";

import Logo from "../assets/Logo.jpeg";
import { useLocation, useNavigate } from "react-router-dom";

const DoctorList = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 🔹 Get filters from navigation state
  const filters = location.state?.filters || {};

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch doctors from Firebase
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const doctorsRef = ref(database, "doctors");
        const snapshot = await get(doctorsRef);

        if (snapshot.exists()) {
          const data = snapshot.val();
          const doctorsArray = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));

          // 🔹 Only show active doctors (not suspended)
          const activeDoctors = doctorsArray.filter(
            (doc) => doc.value !== "suspended"
          );

          setDoctors(activeDoctors);
        }
      } catch (error) {
        console.error("Error fetching doctors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // 🔹 Apply filters from Search Form
  const filteredDoctors = doctors.filter((dr) => {
    const nameMatch =
      !filters?.name ||
      dr.name?.toLowerCase().includes(filters.name.toLowerCase());

    const specializationMatch =
      !filters?.specialization ||
      dr.specialization
        ?.toLowerCase()
        .includes(filters.specialization.toLowerCase());

    return nameMatch && specializationMatch;
  });

  return (
    <div className="doctor-list-page">
      {/* Header */}
      <header className="doctor-header">
        <div className="header-left">
          <img src={Logo} alt="Logo" className="header-logo" />
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>
        <div className="header-right">
          <span className="user-name">Find Doctors</span>
          <div className="mini-profile"></div>
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
              filteredDoctors.map((dr) => (
                <div className="doctor-item-card" key={dr.id}>
                  <div className="dr-profile-section">
                    <div className="dr-image-container">
                      <div className="dr-img-placeholder">
                        {dr.name?.charAt(0)}
                      </div>
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

                        <div
                          className={`meta-tag status ${
                            dr.value === "active" ? "online" : "away"
                          }`}
                        >
                          ● {dr.value === "active" ? "Available" : dr.value}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="dr-action-section">
                    <button className="view-profile-btn">View Profile</button>
                    <button className="book-now-btn">Book Appointment</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorList;