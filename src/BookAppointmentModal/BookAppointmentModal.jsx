// src/Components/BookAppointmentModal.jsx
import React, { useState, useEffect } from "react";
import "./BookAppointmentModal.css";
import { ref, get, push } from "firebase/database";
import { auth, database } from "../Firebase";

const BookAppointmentModal = ({ doctor, onClose }) => {
  const [formData, setFormData] = useState({
    patientName: "",
    date: "",
    time: "",
    reason: "",
  });

  const [patientList, setPatientList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showBusyPopup, setShowBusyPopup] = useState(false);

  // Convert HH:mm → minutes
  const toMinutes = (timeStr) => {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  // Check if time is inside range
  const isBetween = (time, start, end) => {
    const t = toMinutes(time);
    const s = toMinutes(start);
    const e = toMinutes(end);
    if (t === null || s === null || e === null) return false;
    return t >= s && t <= e;
  };

  // Fetch patient list
  useEffect(() => {
    const fetchPatients = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const snapshot = await get(ref(database, `patients/${user.uid}`));
        if (!snapshot.exists()) return;

        const patientData = snapshot.val();
        let list = [];
        if (patientData.basic?.name) {
          list.push({ id: user.uid, name: patientData.basic.name, relationship: "Myself" });
        }
        const familyArray = patientData.profile?.familyMembers || [];
        familyArray.forEach((member) => {
          if (member.name && member.relationship) {
            list.push({ id: member.id || member.name, name: member.name, relationship: member.relationship });
          }
        });
        setPatientList(list);
      } catch (err) {
        console.error("Error loading patients:", err);
      }
    };

    const unsub = auth.onAuthStateChanged((user) => { if (user) fetchPatients(); });
    return () => unsub();
  }, []);

  // 🔹 MAIN AVAILABILITY CHECK
  const checkAvailability = () => {
    if (!doctor || !formData.date || !formData.time) return null;

    const { date, time } = formData;
    const wh = doctor.workingHours || {};

    try {
      const dateObj = new Date(date);
      const day = dateObj.getDay(); // 0=Sunday, 6=Saturday
      const isWeekend = day === 0 || day === 6;

      // 1️⃣ Pick working hours
      const working = isWeekend ? wh.weekends : wh.weekdays;

      if (!working?.start || !working?.end) return false;

      // 2️⃣ Check if inside working hours
      if (!isBetween(time, working.start, working.end)) return false;

      // 3️⃣ Check unavailable slots
      let unavailableList = [];
      if (Array.isArray(wh.unavailable)) {
        unavailableList = wh.unavailable;
      } else if (wh.unavailable && typeof wh.unavailable === "object") {
        unavailableList = Object.values(wh.unavailable);
      }

      const isBlocked = unavailableList.some((slot) => {
        if (!slot.date) return false;
        if (slot.date !== date) return false;

        return isBetween(time, slot.start, slot.end);
      });

      return !isBlocked;
    } catch (err) {
      console.error("Availability error:", err);
      return false;
    }
  };

  const availability = checkAvailability();

  // Handle Booking
  const handleBooking = async (e) => {
    e.preventDefault();
    const { patientName, date, time, reason } = formData;

    if (!patientName || !date || !time || !reason) {
      alert("All fields are required!");
      return;
    }

    if (!availability) {
      alert("Selected time is unavailable.");
      return;
    }

    try {
      setLoading(true);

      const appointmentData = {
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorSpecialization: doctor.specialization,
        patientId: auth.currentUser.uid,
        patientName,
        date,
        time,
        reason,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      await push(ref(database, "appointments"), appointmentData);
      alert("Appointment booked successfully!");
      onClose();
    } catch (err) {
      console.error("Booking error:", err);
      alert("Error booking appointment.");
    } finally {
      setLoading(false);
    }
  };

  if (!doctor) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✕</button>

        <h2>Book Appointment</h2>

        <form className="booking-form" onSubmit={handleBooking}>
          {/* Patient */}
          <select
            value={formData.patientName || ""}
            onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
            required
          >
            <option value="">Select Patient</option>
            {patientList.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name} ({p.relationship})
              </option>
            ))}
          </select>

          {/* Date */}
          <input
            type="date"
            value={formData.date || ""}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />

          {/* Time */}
          <input
            type="time"
            value={formData.time || ""}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            required
          />

          {/* Availability */}
          {formData.date && formData.time && (
            <div className="availability-status">
              <strong>Doctor: </strong>
              {availability === null ? (
                <span>—</span>
              ) : availability ? (
                <span style={{ color: "green", fontWeight: 600 }}>● Available</span>
              ) : (
                <span style={{ color: "red", fontWeight: 600 }}>● Busy</span>
              )}
            </div>
          )}

          {/* Reason */}
          <textarea
            placeholder="Reason for appointment"
            value={formData.reason || ""}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            required
          />

          <button
            type="submit"
            className="confirm-booking-btn"
            disabled={loading || availability === false}
          >
            {loading ? "Booking..." : "Confirm Booking"}
          </button>

          {/* Check Busy Times */}
          <button type="button" className="check-busy-btn" onClick={() => setShowBusyPopup(true)}>
            Check Busy Times
          </button>
        </form>

        {/* Busy Times Popup */}
        {showBusyPopup && (
          <div className="busy-popup-overlay" onClick={() => setShowBusyPopup(false)}>
            <div className="busy-popup" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setShowBusyPopup(false)}>✕</button>
              <h3>Working Hours</h3>
              <p><strong>Weekdays:</strong> {doctor.workingHours?.weekdays?.start} - {doctor.workingHours?.weekdays?.end}</p>
              <p><strong>Weekends:</strong> {doctor.workingHours?.weekends?.start} - {doctor.workingHours?.weekends?.end}</p>

              <h3>Unavailable Slots</h3>
              {doctor.workingHours?.unavailable && doctor.workingHours.unavailable.length > 0 ? (
                <ul>
                  {doctor.workingHours.unavailable.map((slot, idx) => (
                    <li key={idx}>{slot.date}: {slot.start} - {slot.end}</li>
                  ))}
                </ul>
              ) : (
                <p>No unavailable slots</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookAppointmentModal;