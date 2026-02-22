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
  const [availableHours, setAvailableHours] = useState([]);

  // Fetch main user + family members
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
            list.push({
              id: member.id || member.name,
              name: member.name,
              relationship: member.relationship,
            });
          }
        });

        setPatientList(list);
      } catch (err) {
        console.error("Error loading patients:", err);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchPatients();
    });

    return () => unsubscribe();
  }, []);

  // Compute available hours for selected date
  useEffect(() => {
    if (!formData.date) {
      setAvailableHours([]);
      return;
    }

    const selectedDay = new Date(formData.date).getDay(); // 0=Sun, 6=Sat
    let workingStart = "";
    let workingEnd = "";

    if (selectedDay === 0 || selectedDay === 6) {
      // Weekend
      workingStart = doctor.workingHours?.weekends?.start || "";
      workingEnd = doctor.workingHours?.weekends?.end || "";
    } else {
      // Weekday
      workingStart = doctor.workingHours?.weekdays?.start || "";
      workingEnd = doctor.workingHours?.weekdays?.end || "";
    }

    // If doctor doesn't work this day
    if (!workingStart || !workingEnd) {
      setAvailableHours([]);
      return;
    }

    // Start with full working slot
    let slots = [{ start: workingStart, end: workingEnd }];

    // Exclude unavailable slots
    const unavailable = doctor.workingHours?.unavailable?.filter(
      (u) => u.date === formData.date
    );

    if (unavailable?.length > 0) {
      // For simplicity, we will just remove times overlapping with unavailable
      slots = slots.flatMap((slot) => {
        let result = [];
        let currentStart = slot.start;

        unavailable.forEach((un) => {
          if (un.start > currentStart) {
            result.push({ start: currentStart, end: un.start });
          }
          currentStart = un.end > currentStart ? un.end : currentStart;
        });

        if (currentStart < slot.end) {
          result.push({ start: currentStart, end: slot.end });
        }

        return result;
      });
    }

    setAvailableHours(slots);
  }, [formData.date, doctor]);

  const validateAppointment = () => {
    const { date, time } = formData;
    if (!date || !time) return false;

    // Determine day
    const selectedDay = new Date(date).getDay();
    let workingStart = "";
    let workingEnd = "";
    if (selectedDay === 0 || selectedDay === 6) {
      workingStart = doctor.workingHours?.weekends?.start || "";
      workingEnd = doctor.workingHours?.weekends?.end || "";
    } else {
      workingStart = doctor.workingHours?.weekdays?.start || "";
      workingEnd = doctor.workingHours?.weekdays?.end || "";
    }

    if (!workingStart || !workingEnd) return false;
    if (time < workingStart || time > workingEnd) return false;

    // Check unavailable slots
    const unavailable = doctor.workingHours?.unavailable?.filter(
      (u) => u.date === date
    );
    if (unavailable?.some((u) => time >= u.start && time <= u.end)) return false;

    return true;
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    const { patientName, date, time, reason } = formData;

    if (!patientName || !date || !time || !reason) {
      alert("All fields are required!");
      return;
    }

    if (!validateAppointment()) {
      alert("Selected time is outside working hours or unavailable.");
      return;
    }

    try {
      setLoading(true);
      const patientId = auth.currentUser.uid;

      const appointmentData = {
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorSpecialization: doctor.specialization,
        patientId,
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
          {/* Patient Dropdown */}
          <select
            value={formData.patientName}
            onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
            required
          >
            <option value="">Select Patient</option>
            {patientList.map((patient) => (
              <option key={patient.id} value={patient.name}>
                {patient.name} ({patient.relationship})
              </option>
            ))}
          </select>

          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />

          {/* Display available hours for selected date */}
          {formData.date && (
            <div className="available-hours">
              <strong>Available Hours:</strong>
              {availableHours.length === 0 ? (
                <p>Doctor is unavailable on this day.</p>
              ) : (
                <ul>
                  {availableHours.map((slot, idx) => (
                    <li key={idx}>{slot.start} - {slot.end}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <input
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            required
          />

          <textarea
            placeholder="Reason for appointment"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            required
          />

          <button type="submit" className="confirm-booking-btn" disabled={loading}>
            {loading ? "Booking..." : "Confirm Booking"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookAppointmentModal;