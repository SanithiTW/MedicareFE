import React, { useState, useEffect } from "react";
import { database } from "../../Firebase";
import { ref, get, update } from "firebase/database";
import "./AddMedicinePopup.css"; 
import "./EditMedicinePopup.css";

const EditMedicinePopup = ({ medicineId, onClose }) => {
  const [formData, setFormData] = useState({
  name: "",
  description: "",
  price: "",
  stock: "",
  availability: "Available",
  prescriptionRequired: false,
  imageUrl: "",
  categories: [],

  dosage: "",
  form: "",
  usageInstructions: "",
  sideEffects: "",
  warnings: "",
  manufacturer: "",
  expiryDate: "",
  batchNumber: ""
});

const categoryOptions = [
  "Medicines",
  "Baby Care",
  "Personal Care",
  "Health Devices",
  "Vitamins",
  "Diabetes Care",
  "First Aid",
];



  // 🔹 Load medicine details when popup opens
  useEffect(() => {
    if (!medicineId) return;

    const medRef = ref(database, `medicines/${medicineId}`);

    get(medRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();

        setFormData({
  name: data.name || "",
  description: data.description || "",
  price: data.price || "",
  stock: data.stock || "",
  availability: data.availability || "Available",
  prescriptionRequired: data.prescriptionRequired || false,

  imageUrl: data.imageUrl || "",
  categories: data.categories || [],

  dosage: data.dosage || "",
  form: data.form || "",
  usageInstructions: data.usageInstructions || "",
  sideEffects: data.sideEffects || "",
  warnings: data.warnings || "",
  manufacturer: data.manufacturer || "",
  expiryDate: data.expiryDate || "",
  batchNumber: data.batchNumber || ""
});

      }
    });
  }, [medicineId]);

  // 🔹 Handle input change
  const handleChange = (e) => {
  const { name, value, options } = e.target;

  if (name === "categories") {
    const selected = Array.from(options)
      .filter(option => option.selected)
      .map(option => option.value);

    setFormData(prev => ({
      ...prev,
      categories: selected
    }));
  } else {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }
};


  // 🔹 Save updated data
  const handleSave = async () => {
    const medRef = ref(database, `medicines/${medicineId}`);

    try {
      await update(medRef, {
  name: formData.name,
  description: formData.description,
  price: formData.price,
  stock: Number(formData.stock),
  availability: formData.availability,
  prescriptionRequired: formData.prescriptionRequired,

  imageUrl: formData.imageUrl,
  categories: formData.categories,

  dosage: formData.dosage,
  form: formData.form,
  usageInstructions: formData.usageInstructions,
  sideEffects: formData.sideEffects,
  warnings: formData.warnings,
  manufacturer: formData.manufacturer,
  expiryDate: formData.expiryDate,
  batchNumber: formData.batchNumber
});


      alert("Medicine updated successfully!");
      onClose();
    } catch (err) {
      console.error("Update failed:", err);
      alert("Update failed: " + err.message);
    }
  };

  return (
    <div className="popup-overlay">
  <div className="popup-container">
    <h2>Edit Medicine</h2>

    <label htmlFor="name">Medicine Name *</label>
    <input
      id="name"
      type="text"
      name="name"
      placeholder="Medicine Name"
      value={formData.name}
      onChange={handleChange}
    />

    <label htmlFor="description">Description</label>
    <textarea
      id="description"
      name="description"
      placeholder="Description"
      value={formData.description}
      onChange={handleChange}
    />

    <label htmlFor="price">Price *</label>
    <input
      id="price"
      type="number"
      name="price"
      placeholder="Price"
      value={formData.price}
      onChange={handleChange}
    />

    <label htmlFor="stock">Stock *</label>
    <input
      id="stock"
      type="number"
      name="stock"
      placeholder="Stock"
      value={formData.stock}
      onChange={handleChange}
    />

    <label htmlFor="expiryDate">Expiry Date *</label>
    <input
      id="expiryDate"
      type="date"
      name="expiryDate"
      value={formData.expiryDate}
      onChange={handleChange}
    />

    <label htmlFor="availability">Availability</label>
    <select
      id="availability"
      name="availability"
      value={formData.availability}
      onChange={handleChange}
    >
      <option value="Available">Available</option>
      <option value="Unavailable">Unavailable</option>
    </select>

    <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <input
        type="checkbox"
        name="prescriptionRequired"
        checked={formData.prescriptionRequired}
        onChange={(e) =>
          setFormData(prev => ({
            ...prev,
            prescriptionRequired: e.target.checked
          }))
        }
      />
      Prescription Required *
    </label>

    <label htmlFor="categories">Categories</label>
    <select
      id="categories"
      name="categories"
      multiple
      value={formData.categories}
      onChange={handleChange}
    >
      {categoryOptions.map((cat) => (
        <option key={cat} value={cat}>
          {cat}
        </option>
      ))}
    </select>

    <label htmlFor="imageUrl">Upload Image</label>
    <input
      id="imageUrl"
      type="file"
      accept="image/*"
      onChange={(e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setFormData(prev => ({
              ...prev,
              imageUrl: reader.result
            }));
          };
          reader.readAsDataURL(file);
        }
      }}
    />

    <label htmlFor="dosage">Dosage *</label>
    <input
      id="dosage"
      type="text"
      name="dosage"
      placeholder="Dosage"
      value={formData.dosage}
      onChange={handleChange}
    />

    <label htmlFor="form">Form (Tablet/Syrup/etc)</label>
    <input
      id="form"
      type="text"
      name="form"
      placeholder="Form"
      value={formData.form}
      onChange={handleChange}
    />

    <label htmlFor="usageInstructions">Usage Instructions</label>
    <textarea
      id="usageInstructions"
      name="usageInstructions"
      placeholder="Usage Instructions"
      value={formData.usageInstructions}
      onChange={handleChange}
    />

    <label htmlFor="sideEffects">Side Effects</label>
    <textarea
      id="sideEffects"
      name="sideEffects"
      placeholder="Side Effects"
      value={formData.sideEffects}
      onChange={handleChange}
    />

    <label htmlFor="warnings">Warnings</label>
    <textarea
      id="warnings"
      name="warnings"
      placeholder="Warnings"
      value={formData.warnings}
      onChange={handleChange}
    />

    <label htmlFor="manufacturer">Manufacturer</label>
    <input
      id="manufacturer"
      type="text"
      name="manufacturer"
      placeholder="Manufacturer"
      value={formData.manufacturer}
      onChange={handleChange}
    />

    <label htmlFor="batchNumber">Batch Number</label>
    <input
      id="batchNumber"
      type="text"
      name="batchNumber"
      placeholder="Batch Number"
      value={formData.batchNumber}
      onChange={handleChange}
    />

    <div className="popup-actions">
      <button className="action-btn action-available" onClick={handleSave}>
        Save
      </button>
      <button className="action-btn action-reject" onClick={onClose}>
        Cancel
      </button>
    </div>
  </div>
</div>

  );
};

export default EditMedicinePopup;
