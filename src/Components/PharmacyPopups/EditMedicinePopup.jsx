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
    expiry: "",
    availability: "Available",
    imageUrl: ""
  });

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
          expiry: data.expiry || "",
          availability: data.availability || "Available",
          imageUrl: data.imageUrl || ""
        });
      }
    });
  }, [medicineId]);

  // 🔹 Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
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
        expiry: formData.expiry,
        availability: formData.availability,
        imageUrl: formData.imageUrl
        // ❌ pharmacyUID NOT included (so it won’t change)
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

        <input
          type="text"
          name="name"
          placeholder="Medicine Name"
          value={formData.name}
          onChange={handleChange}
        />

        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
        />

        <input
          type="number"
          name="price"
          placeholder="Price"
          value={formData.price}
          onChange={handleChange}
        />

        <input
          type="number"
          name="stock"
          placeholder="Stock"
          value={formData.stock}
          onChange={handleChange}
        />

        <input
          type="date"
          name="expiry"
          value={formData.expiry}
          onChange={handleChange}
        />

        <select
          name="availability"
          value={formData.availability}
          onChange={handleChange}
        >
          <option value="Available">Available</option>
          <option value="Unavailable">Unavailable</option>
        </select>

        <input
          type="text"
          name="imageUrl"
          placeholder="Image URL"
          value={formData.imageUrl}
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
