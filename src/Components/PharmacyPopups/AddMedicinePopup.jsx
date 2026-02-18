// src/PharmacyPopups/AddMedicinePopup.jsx

import React, { useState } from "react";
import { supabase } from "../../supabase";
import "./AddMedicinePopup.css";

// --- Firebase imports ---
import { ref, push, serverTimestamp, set } from "firebase/database"; // for Realtime DB
import { auth, database } from "../../Firebase";


const uploadToSupabase = async (file, pharmacyUID) => {
  // Store images in pharmacy-specific folder
  const filePath = `${pharmacyUID}/${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("medicine_images") // Bucket name
    .upload(filePath, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from("medicine_images")
    .getPublicUrl(filePath);

  return data.publicUrl;
};

const AddMedicinePopup = ({ onClose, onSuccess }) => {
  const [details, setDetails] = useState({
    name: "",
    description: "",
    availability: "Available",
    stock: "",
    price: "",
    discount: "",
    notice: "",
    imageFile: null,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setDetails({ ...details, [name]: files[0] });
      setImagePreview(URL.createObjectURL(files[0]));
    } else {
      setDetails({ ...details, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setSubmitting(true);

  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not logged in");

    let imageUrl = "";
    if (details.imageFile) {
      imageUrl = await uploadToSupabase(details.imageFile, user.uid);
    }

    const medicineData = {
      pharmacyUID: user.uid,
      name: details.name,
      description: details.description,
      availability: details.availability,
      stock: Number(details.stock),
      price: details.price,
      discount: details.discount || null,
      notice: details.notice || null,
      imageUrl,
    };

    const medicinesRef = ref(database, "medicines");
    const newMedicineRef = push(medicinesRef);
    await set(newMedicineRef, {
      ...medicineData,
      createdAt: serverTimestamp()
    });

    onSuccess?.();
    onClose();
  } catch (err) {
    console.error("Error saving medicine:", err);
    alert("Failed to add medicine: " + err.message);
  } finally {
    setSubmitting(false);
  }
};



     
  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2>Add New Medicine</h2>
        <form onSubmit={handleSubmit} className="medicine-form">
          <label>
            Medicine Name
            <input
              type="text"
              name="name"
              value={details.name}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Description
            <textarea
              name="description"
              value={details.description}
              onChange={handleChange}
            />
          </label>

          <label>
            Availability
            <select name="availability" value={details.availability} onChange={handleChange}>
              <option value="Available">Available</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </label>

          <label>
            Stock Amount
            <input type="number" name="stock" value={details.stock} onChange={handleChange} required />
          </label>

          <label>
            Price
            <input type="text" name="price" value={details.price} onChange={handleChange} required />
          </label>

          <label>
            Discount / Offers
            <input type="text" name="discount" value={details.discount} onChange={handleChange} placeholder="Optional" />
          </label>

          <label>
            Notice / Special Instructions
            <textarea name="notice" value={details.notice} onChange={handleChange} placeholder="Optional" />
          </label>

          <label>
            Upload Image
            <input type="file" name="imageFile" accept="image/*" onChange={handleChange} />
          </label>

          {imagePreview && <img src={imagePreview} alt="Preview" className="image-preview" />}

          <div className="form-buttons">
            <button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Add Medicine"}
            </button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMedicinePopup;
