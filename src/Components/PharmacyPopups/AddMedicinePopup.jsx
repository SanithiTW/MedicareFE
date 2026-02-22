// src/PharmacyPopups/AddMedicinePopup.jsx

import React, { useState } from "react";
import { supabase } from "../../supabase";
import "./AddMedicinePopup.css";

// --- Firebase imports ---
import { ref, push, serverTimestamp, set } from "firebase/database"; // for Realtime DB
import { auth, database } from "../../Firebase";


const uploadToSupabase = async (file, pharmacyUID) => {
  const filePath = `${pharmacyUID}/${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("medicine_images")
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
    prescriptionRequired: false,
    stock: "",
    price: "",
    discount: "",
    notice: "",
    categories: [],
    imageFile: null,
    

    // ✅ NEW FIELDS
    dosage: "",
    form: "",
    usageInstructions: "",
    sideEffects: "",
    warnings: "",
    manufacturer: "",
    expiryDate: "",
    batchNumber: "",
    deliveryFee: "",
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const categoryOptions = [
    "Medicines",
    "Baby Care",
    "Personal Care",
    "Health Devices",
    "Vitamins",
    "Diabetes Care",
    "First Aid",
    "Other"
  ];
  
  const handleChange = (e) => {
  const { name, value, type, files } = e.target;

  if (type === "file") {
    setDetails(prev => ({
      ...prev,
      imageFile: files[0]
    }));
    setImagePreview(URL.createObjectURL(files[0]));
  }

  else if (name === "categories") {
    const selectedOptions = Array.from(e.target.selectedOptions).map(
      option => option.value
    );

    setDetails(prev => ({
      ...prev,
      categories: selectedOptions
    }));
  }

  else {
    setDetails(prev => ({
      ...prev,
      [name]: value
    }));
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
        stock: Number(details.stock) || 0,
        price: parseFloat(String(details.price).replace(/[^0-9.]/g, "")) || 0,
        discount: details.discount || null,
        notice: details.notice || null,
        categories: details.categories,
        imageUrl,

        // ✅ NEW DATA SAVED
        dosage: details.dosage,
        form: details.form,
        usageInstructions: details.usageInstructions,
        sideEffects: details.sideEffects,
        warnings: details.warnings,
        manufacturer: details.manufacturer,
        expiryDate: details.expiryDate,
        batchNumber: details.batchNumber,
        deliveryFee: details.deliveryFee || 0,
        
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
            <input type="text" name="name" value={details.name} onChange={handleChange} required />
          </label>

          <label>
            Description
            <textarea name="description" value={details.description} onChange={handleChange} />
          </label>

        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
  <input
    type="checkbox"
    name="prescriptionRequired"
    checked={details.prescriptionRequired}
    onChange={(e) =>
      setDetails(prev => ({
        ...prev,
        prescriptionRequired: e.target.checked
      }))
    }
  />
  Prescription Required
</label>




          <label>
            Availability
            <select name="availability" value={details.availability} onChange={handleChange}>
              <option value="Available">Available</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </label>

          <label>
            Categories
            <select name="categories" multiple value={details.categories} onChange={handleChange}>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </label>

          <label>
            Dosage
            <input type="text" name="dosage" value={details.dosage} onChange={handleChange} />
          </label>

          <label>
            Form (Tablet/Syrup/etc)
            <input type="text" name="form" value={details.form} onChange={handleChange} />
          </label>

          <label>
            Usage Instructions
            <textarea name="usageInstructions" value={details.usageInstructions} onChange={handleChange} />
          </label>

          <label>
            Side Effects
            <textarea name="sideEffects" value={details.sideEffects} onChange={handleChange} />
          </label>

          <label>
            Warnings
            <textarea name="warnings" value={details.warnings} onChange={handleChange} />
          </label>

          <label>
            Manufacturer
            <input type="text" name="manufacturer" value={details.manufacturer} onChange={handleChange} />
          </label>

          <label>
            Expiry Date
            <input type="date" name="expiryDate" value={details.expiryDate} onChange={handleChange} />
          </label>

          <label>
            Batch Number
            <input type="text" name="batchNumber" value={details.batchNumber} onChange={handleChange} />
          </label>

          <label>
            Stock Amount
            <input type="number" name="stock" value={details.stock} onChange={handleChange} required />
          </label>

          <label>
            Price
            <input type="number" name="price" value={details.price} onChange={handleChange} required />
          </label>

          <label>
            Delivery Fee (Rs)
            <input type="number"name="deliveryFee"value={details.deliveryFee}onChange={handleChange}placeholder="Optional"min="0"/>
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
