// src/CheckoutPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import './CheckoutPage.css';
import Logo from '../assets/Logo.jpeg';


import { auth, database } from "../Firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, get, push } from "firebase/database";
import { supabase } from "../supabase";



// Sandbox Merchant ID for PayHere
const SANDBOX_MERCHANT_ID = "1234122";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const passedItems = location.state?.items || [];

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [suggestedDeliveryTime, setSuggestedDeliveryTime] = useState("");
  const [prescriptionFile, setPrescriptionFile] = useState(null);

  const [mainPatient, setMainPatient] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [customPatientName, setCustomPatientName] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);

  // --- Map cart items with price, discount, pharmacy info ---
  const [cartItems, setCartItems] = useState(
    passedItems.map(item => {
      const price = Number(parseFloat(String(item.price).replace(/[^0-9.]/g, ""))) || 0;
      const qty = Number(item.qty || item.quantity || 1);
      const deliveryFee = Number(parseFloat(String(item.deliveryFee).replace(/[^0-9.]/g, ""))) || 250;

      // Ensure pharmacy name
      const pharmacyname = item.pharmacyname || item.pharmacy || "Unknown Pharmacy";

      // Ensure pharmacy UID (try multiple possible keys)
      const pharmacyUID = item.pharmacyUID || item.pharmacyId || item.pharmacy_id || "";

      const discountRaw = item.offer || item.discount || null;

      let discountedPrice = price;
      let discountText = "";
      let freeGiftText = "";

      if (discountRaw) {
        const discountStr = String(discountRaw).trim();
        if (discountStr.match(/\d+%/)) {
          const percent = parseFloat(discountStr) || 0;
          discountedPrice = price - (price * percent / 100);
          discountText = discountStr;
        } else if (discountStr.match(/\d+/)) {
          const numericDiscount = parseFloat(discountStr.replace(/[^0-9.]/g, "")) || 0;
          discountedPrice = price - numericDiscount;
          discountText = "Rs. " + numericDiscount.toFixed(2) + " off";
        } else {
          discountedPrice = price;
          freeGiftText = discountStr;
        }
      }

      discountedPrice = Math.max(discountedPrice, 0);

      return {
  ...item,   // ✅ keeps ALL medicine fields from Firebase

  pharmacyUID: item.pharmacyUID || null,
  pharmacyname,

  price,
  qty,
  deliveryFee,
  prescriptionRequired: item.prescriptionRequired || false,
  discountedPrice,
  discountText,
  freeGiftText
};
    })
  );

  const subtotal = cartItems.reduce((acc, item) => acc + (item.discountedPrice * item.qty), 0);
  const discount = cartItems.reduce((acc, item) => acc + ((item.price - item.discountedPrice) * item.qty), 0);
  const deliveryFee = cartItems.reduce(
  (acc, item) => acc + Number(item.deliveryFee || 0),
  0
);
  const total = Math.max(subtotal + deliveryFee, 0);

  const requiresPrescription = cartItems.some(item => item.prescriptionRequired);

  const uploadPrescription = async (file) => {
    const user = auth.currentUser;
    const filePath = `prescriptions/${user.uid}/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("patient-profile-pics")
      .upload(filePath, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from("patient-profile-pics")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

 const handleSandboxPayment = async () => {
  if (requiresPrescription && !prescriptionFile) {
    alert("Prescription is required before payment.");
    return;
  }

  if (!window.payhere) {
    alert("PayHere SDK not loaded");
    return;
  }

  const user = auth.currentUser;
  if (!user) return alert("Please login");

  let uploadedPrescriptionUrl = "";

  // ✅ UPLOAD HERE BEFORE PAYMENT
  if (requiresPrescription && prescriptionFile) {
    try {
      uploadedPrescriptionUrl = await uploadPrescription(prescriptionFile);
    } catch (err) {
      alert("Failed to upload prescription.");
      return;
    }
  }

  // Save temporarily in state
  sessionStorage.setItem("tempPrescriptionUrl", uploadedPrescriptionUrl);

  const orderId = "ORDER_" + new Date().getTime();
  const amountStr = total.toFixed(2);

    let hash = "";
    try {
      const res = await fetch(`http://localhost:8080/api/get-payhere-hash?order_id=${orderId}&amount=${amountStr}&currency=LKR`);
      const data = await res.json();
      hash = data.hash;
    } catch (err) {
      console.error("Error fetching hash:", err);
      alert("Could not generate payment hash");
      return;
    }

    const payment = {
      sandbox: true,
      merchant_id: SANDBOX_MERCHANT_ID,
      return_url: "http://localhost:3000/checkout-success",
      cancel_url: "http://localhost:3000/checkout-cancel",
      notify_url: "http://localhost:3000/api/payhere-notify",
      order_id: orderId,
      items: "Medicine Order",
      amount: amountStr,
      currency: "LKR",
      hash,
      first_name: customPatientName || mainPatient?.name || "Customer",
      last_name: "",
      email: mainPatient?.email || "",
      phone: mainPatient?.phone || "",
      address: mainPatient?.deliveryAddress || "",
      city: mainPatient?.district || "",
      country: "Sri Lanka",
      delivery_address: mainPatient?.deliveryAddress || "",
      delivery_city: mainPatient?.district || "",
      delivery_country: "Sri Lanka"
    };

    // ✅ SAVE PATIENT SNAPSHOT BEFORE PAYMENT
const patientSnapshot = {
  name: customPatientName || mainPatient?.name || "",
  phone: mainPatient?.phone || "",
  altContact: mainPatient?.altContact || "",
  deliveryAddress: mainPatient?.deliveryAddress || "",
  district: mainPatient?.district || "",
  province: mainPatient?.province || "",
  postalCode: mainPatient?.postalCode || "",
  email: mainPatient?.email || ""
};

sessionStorage.setItem("tempPatientInfo", JSON.stringify(patientSnapshot));

    window.payhere.startPayment(payment);
  };

  const handlePrescriptionUpload = (e) => setPrescriptionFile(e.target.files[0]);

  const handleUrgencyChange = (e) => {
    const urgent = e.target.value === "yes";
    setIsUrgent(urgent);

    const now = new Date();
    now.setHours(now.getHours() + (urgent ? 1 : 4));

    const day = now.getDate().toString().padStart(2, "0");
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");

    setSuggestedDeliveryTime(`${day}/${month}/${year} --:${hours}:${minutes}`);
  };

 

const handlePlaceOrder = async (e, skipPrescriptionCheck = false) => {
  if (e && e.preventDefault) e.preventDefault();

  try {
    const user = auth.currentUser;
    if (!user) return alert("Please login");

    setIsProcessing(true);

    let prescriptionUrl = sessionStorage.getItem("tempPrescriptionUrl") || "";

    let patientInfo = sessionStorage.getItem("tempPatientInfo")
      ? JSON.parse(sessionStorage.getItem("tempPatientInfo"))
      : {
          name: customPatientName || mainPatient?.name || "",
          phone: mainPatient?.phone || "",
          altContact: mainPatient?.altContact || "",
          deliveryAddress: mainPatient?.deliveryAddress || "",
          district: mainPatient?.district || "",
          province: mainPatient?.province || "",
          postalCode: mainPatient?.postalCode || "",
          email: mainPatient?.email || ""
        };

    // Group items by pharmacy
    const groupedByPharmacy = {};
    cartItems.forEach((item) => {
      const pharmacyId = item.pharmacyUID;
      if (!pharmacyId) return;

      if (!groupedByPharmacy[pharmacyId]) groupedByPharmacy[pharmacyId] = {};
      groupedByPharmacy[pharmacyId][item.id] = {
        ...item,
        price: item.price,
        qty: item.qty,
        discountedPrice: item.discountedPrice,
        discountText: item.discountText,
        freeGiftText: item.freeGiftText,
        deliveryFee: item.deliveryFee
      };
    });

    // Save each pharmacy order directly under pharmacyId
    for (const pharmacyId in groupedByPharmacy) {
      const orderData = {
        ...groupedByPharmacy[pharmacyId],
        userId: user.uid,
        patient: patientInfo,
        status: "Pending",
        isUrgent,
        suggestedDeliveryTime,
        paymentMethod,
        paymentStatus:
          paymentMethod === "card" && skipPrescriptionCheck
            ? "Paid"
            : paymentMethod === "card"
            ? "Processing"
            : "Pending",
        prescriptionUrl: prescriptionUrl || null,
        createdAt: Date.now()
      };

      await push(ref(database, `pharmacyOrders/${pharmacyId}`), orderData);
    }

    setOrderPlaced(true);
    alert("Order placed successfully!");
    navigate("/pharmacy-store");

  } catch (err) {
    console.error(err);
    alert("Error placing order");
  } finally {
    setIsProcessing(false);
    sessionStorage.removeItem("tempPatientInfo");
    sessionStorage.removeItem("tempPrescriptionUrl");
  }
};

const saveOrderAfterPayment = async () => {
  await handlePlaceOrder(null, true);
};

  useEffect(() => {
  if (!window.payhere) return;
  

  window.payhere.onCompleted = async function(orderId) {
    console.log("✅ PayHere Payment Completed:", orderId);

    try {
      await saveOrderAfterPayment();
    } catch (err) {
      console.error("Order save failed after payment:", err);
      alert("Payment successful, but order saving failed. Please contact support.");
    }
  };

  window.payhere.onDismissed = function() {
    console.log("PayHere Payment Dismissed");
  };

  window.payhere.onError = function(error) {
    console.log("PayHere Payment Error:", error);
  };

}, []); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const snapshot = await get(ref(database, `patients/${user.uid}`));
        if (!snapshot.exists()) return;
        const data = snapshot.val();

        setMainPatient({
          name: data.basic?.name || "",
          phone: data.basic?.phone || "",
          altContact: data.basic?.altContact || "",
          deliveryAddress: data.profile?.deliveryAddress || "",
          district: data.profile?.district || "",
          province: data.profile?.province || "",
          postalCode: data.profile?.postalCode || "",
          email: user.email || ""
        });

        const mainName = data.basic?.name || "";
        setSelectedPatient(mainName);
        setCustomPatientName(mainName);

        const filteredFamily = (data.profile?.familyMembers || []).filter(member =>
          !["Patient 02", "Patient 03", "Patient 04"].includes(member.name)
        );
        setFamilyMembers(filteredFamily);

      } catch (error) {
        console.error("Error fetching patient data:", error);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="checkout-page">
      <header className="checkout-header">
        <div className="header-left">
          <img src={Logo} alt="MediCare" className="header-logo" />
          <button className="back-link" onClick={() => window.history.back()}>← Back to Store</button>
        </div>
        <h1 className="checkout-title">Secure Checkout</h1>
      </header>

      <div className="checkout-content">
        <form className="checkout-form" onSubmit={handlePlaceOrder}>
          {/* Delivery Info */}
          <section className="form-section">
            <h3>1. Delivery Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Enter Name</label>
                <input type="text" value={customPatientName} onChange={(e) => setCustomPatientName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Select Patient</label>
                <select value={selectedPatient} onChange={(e) => { setSelectedPatient(e.target.value); setCustomPatientName(e.target.value); }} required>
                  {mainPatient && <option value={mainPatient.name}>{mainPatient.name}</option>}
                  {familyMembers.map(member => (
                    <option key={member.id} value={member.name}>{member.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" value={mainPatient?.phone || ""} onChange={(e) => setMainPatient(prev => ({ ...prev, phone: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Alternative Contact</label>
                <input
  type="tel"
  value={mainPatient?.altContact || ""}
  onChange={(e) =>
    setMainPatient(prev => ({
      ...prev,
      altContact: e.target.value
    }))
  }
/>
              </div>
            </div>

            <div className="form-group">
              <label>Delivery Address</label>
              <textarea value={mainPatient?.deliveryAddress || ""} onChange={(e) => setMainPatient(prev => ({ ...prev, deliveryAddress: e.target.value }))} rows="3" required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>District</label>
                <input type="text" value={mainPatient?.district || ""} onChange={(e) => setMainPatient(prev => ({ ...prev, district: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Province</label>
                <input type="text" value={mainPatient?.province || ""} onChange={(e) => setMainPatient(prev => ({ ...prev, province: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Postal Code</label>
                <input type="text" value={mainPatient?.postalCode || ""} onChange={(e) => setMainPatient(prev => ({ ...prev, postalCode: e.target.value }))} required />
              </div>
            </div>
          </section>

          {/* Urgent Delivery */}
          <section className="form-section">
            <h3>2. Urgent Delivery</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Mark as Urgent Delivery</label>
                <select onChange={handleUrgencyChange} required>
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div className="form-group">
                <label>Preferred Delivery Time</label>
                <input type="text" value={suggestedDeliveryTime} onChange={(e) => setSuggestedDeliveryTime(e.target.value)} />
              </div>
            </div>
          </section>

          {/* Prescription Upload */}
          {requiresPrescription && (
            <section className="form-section">
              <h3>3. Upload Doctor Prescription (Required)</h3>
              <input type="file" accept="image/*,.pdf" onChange={handlePrescriptionUpload} required />
              <small>This is mandatory because one or more medicines require a valid prescription.</small>
            </section>
          )}

          {/* Payment Method */}
          <section className="form-section">
            <h3>4. Payment Method</h3>
            <div className="payment-options">
              <label className={`pay-card ${paymentMethod === 'card' ? 'selected' : ''}`}>
                <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                <span>💳 Credit / Debit Card</span>
              </label>

              <label className={`pay-card ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                <span>💵 Cash on Delivery</span>
              </label>
            </div>
          </section>

          <button
  type="button"
  className="place-order-btn"
  disabled={isProcessing}
  style={{
    opacity: isProcessing ? 0.7 : 1,
    cursor: isProcessing ? "not-allowed" : "pointer"
  }}
  onClick={async () => {
    const user = auth.currentUser;
    if (!user) { alert("Please login first"); return; }
    if (requiresPrescription && !prescriptionFile) {
      alert("Prescription is required before proceeding.");
      return;
    }

    if (!mainPatient) {
  alert("Patient data still loading. Please wait.");
  return;
}

if (paymentMethod === "card") handleSandboxPayment();
    else handlePlaceOrder(new Event("submit"));
  }}
>
  {isProcessing
    ? "Completing..."
    : paymentMethod === "cod"
      ? `Place Order - Rs. ${total.toLocaleString()}`
      : `Pay Rs. ${total.toLocaleString()}`
  }
</button>
        </form>

        <aside className="order-summary">
          <div className="summary-card">
            <h3>Order Summary</h3>
            <div className="summary-items">
              {cartItems.map(item => (
                <div className="summary-item" key={item.id}>
                  <div className="item-main">
                    <strong>{item.name} x {item.qty}</strong>
                    <small>Pharmacy: {item.pharmacyname}</small>
                    {item.discountText && <span className="item-discount">{item.discountText}</span>}
                    {item.freeGiftText && <span className="item-free">{item.freeGiftText}</span>}
                  </div>
                  <span className="item-price">
                    Rs. {(item.discountedPrice * item.qty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>

            <hr />
            <div className="price-breakdown">
              <div className="price-row">
                <span>Subtotal</span>
                <span>Rs. {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="price-row">
                <span>Delivery Fee</span>
                <span>Rs. {deliveryFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="price-row discount">
                <span>Offer Discount</span>
                <span>-Rs. {discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="price-row total">
                <span>Total Amount</span>
                <span>Rs. {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className="safety-note">🛡️ Your medical data is encrypted and secure.</div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CheckoutPage;