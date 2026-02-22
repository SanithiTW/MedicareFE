import React, { useState, useEffect } from 'react';
import './CheckoutPage.css';
import Logo from '../assets/Logo.jpeg';
import { useLocation } from "react-router-dom";

// Sandbox Merchant ID for PayHere (replace with your actual sandbox ID)
const SANDBOX_MERCHANT_ID = "1234122";

const CheckoutPage = () => {
  const location = useLocation();
  const passedItems = location.state?.items || [];

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [suggestedDeliveryTime, setSuggestedDeliveryTime] = useState("");

  // Patient Data
  const mainPatient = {
    fullName: "Patient 02",
    phone: "0758579317",
    altContact: "0758579318",
    email: "P02@gmail.com",
    deliveryAddress: "Pahaligewatta",
    city: "",
    district: "cxghgyuky",
    postalCode: "80092",
    province: "",
  };

  const familyMembers = [
    { id: 1, name: "Patient 02" },
    { id: 2, name: "Patient 03" },
    { id: 3, name: "Patient 04" }
  ];

  // ✅ FIXED NUMBER STANDARDIZATION
  const [cartItems, setCartItems] = useState(
    passedItems.map(item => {
      const price = Number(parseFloat(String(item.price).replace(/[^0-9.]/g, ""))) || 0;
      const qty = Number(item.qty || item.quantity || 1);
      const deliveryFee = Number(parseFloat(String(item.deliveryFee).replace(/[^0-9.]/g, ""))) || 250;
      const pharmacyname = item.pharmacyname || item.pharmacy || "Unknown Pharmacy";
      const discountRaw = item.offer || item.discount || null;

      let discountedPrice = price;
      let discountText = "";
      let freeGiftText = "";

      if (discountRaw) {
        const discountStr = String(discountRaw).trim();

        if (discountStr.match(/\d+%/)) {
          // % discount
          const percent = parseFloat(discountStr) || 0;
          discountedPrice = price - (price * percent / 100);
          discountText = discountStr;

        } else if (discountStr.match(/\d+/)) {
          // numeric discount (Rs)
          const numericDiscount = parseFloat(discountStr.replace(/[^0-9.]/g, "")) || 0;
          discountedPrice = price - numericDiscount;
          discountText = "Rs. " + numericDiscount.toFixed(2) + " off";

        } else {
          // free gift or text discount
          discountedPrice = price; // price not changed
          freeGiftText = discountStr;
        }
      }

      discountedPrice = Math.max(discountedPrice, 0);

      return {
        ...item,
        price,
        qty,
        deliveryFee,
        pharmacyname,
        discountedPrice,
        discountText,
        freeGiftText
      };
    })
  );

  // ✅ FIXED CALCULATIONS
  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.discountedPrice * item.qty),
    0
  );

  const discount = cartItems.reduce(
    (acc, item) => acc + ((item.price - item.discountedPrice) * item.qty),
    0
  );

  // ✅ DELIVERY ONLY ONCE
  const deliveryFee = cartItems.length > 0 ? cartItems[0].deliveryFee : 0;
  const total = Math.max(subtotal + deliveryFee, 0);

  const requiresPrescription = cartItems.some(
    item => item.prescriptionRequired === true
  );

  const [selectedPatient, setSelectedPatient] = useState(mainPatient.fullName);
  const [customPatientName, setCustomPatientName] = useState(mainPatient.fullName);

  const handleSandboxPayment = async () => {
    if (!window.payhere) {
        alert("PayHere SDK not loaded");
        return;
    }

    const orderId = "ORDER_" + new Date().getTime();
    const amountStr = total.toFixed(2);

    // fetch hash from backend
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
        merchant_id: 1234122,
        return_url: "http://localhost:3000/checkout-success",
        cancel_url: "http://localhost:3000/checkout-cancel",
        notify_url: "http://localhost:3000/api/payhere-notify", // public backend endpoint
        order_id: orderId,
        items: "Medicine Order",
        amount: amountStr,
        currency: "LKR",
        hash,
        first_name: customPatientName,
        last_name: "",
        email: mainPatient.email,
        phone: mainPatient.phone,
        address: mainPatient.deliveryAddress,
        city: mainPatient.district,
        country: "Sri Lanka",
        delivery_address: mainPatient.deliveryAddress,
        delivery_city: mainPatient.district,
        delivery_country: "Sri Lanka"
    };

    window.payhere.startPayment(payment);
};

  const handlePrescriptionUpload = (e) => {
    console.log("Prescription Uploaded:", e.target.files[0]);
  };

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

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    setOrderPlaced(true);
  };

  useEffect(() => {
    if (!window.payhere) return;

    window.payhere.onCompleted = function(orderId) {
      console.log("Payment completed. OrderID:", orderId);
      setOrderPlaced(true);
    };

    window.payhere.onDismissed = function() {
      console.log("Payment dismissed");
      alert("Payment was cancelled.");
    };

    window.payhere.onError = function(error) {
      console.log("Error:", error);
      alert("Payment error occurred.");
    };
  }, []);

  return (
    <div className="checkout-page">
      <header className="checkout-header">
        <div className="header-left">
          <img src={Logo} alt="MediCare" className="header-logo" />
          <button className="back-link" onClick={() => window.history.back()}>
            ← Back to Store
          </button>
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
                <input
                  type="text"
                  value={customPatientName}
                  onChange={(e) => setCustomPatientName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Select Patient</label>
                <select
                  value={selectedPatient}
                  onChange={(e) => {
                    setSelectedPatient(e.target.value);
                    setCustomPatientName(e.target.value);
                  }}
                  required
                >
                  {familyMembers.map(member => (
                    <option key={member.id} value={member.name}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" defaultValue={mainPatient.phone} required />
              </div>

              <div className="form-group">
                <label>Alternative Contact</label>
                <input type="tel" defaultValue={mainPatient.altContact} />
              </div>
            </div>

            <div className="form-group">
              <label>Delivery Address</label>
              <textarea defaultValue={mainPatient.deliveryAddress} rows="3" required></textarea>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>District</label>
                <input type="text" defaultValue={mainPatient.district} required />
              </div>
              <div className="form-group">
                <label>Province</label>
                <input type="text" defaultValue={mainPatient.province} />
              </div>
              <div className="form-group">
                <label>Postal Code</label>
                <input type="text" defaultValue={mainPatient.postalCode} required />
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

              {suggestedDeliveryTime && (
                <div className="form-group">
                  <label>Preferred Delivery Time</label>
                  <input type="text" value={suggestedDeliveryTime} readOnly />
                </div>
              )}
            </div>
          </section>

          {requiresPrescription && (
            <section className="form-section">
              <h3>3. Upload Doctor Prescription (Required)</h3>
              <input type="file" accept="image/*,.pdf" onChange={handlePrescriptionUpload} required />
              <small>
                This is mandatory because one or more medicines require a valid prescription.
              </small>
            </section>
          )}

          {/* Payment Method */}
          <section className="form-section">
            <h3>4. Payment Method</h3>

            <div className="payment-options">
              <label className={`pay-card ${paymentMethod === 'card' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                />
                <span>💳 Credit / Debit Card</span>
              </label>

              <label className={`pay-card ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                />
                <span>💵 Cash on Delivery</span>
              </label>
            </div>
          </section>

          <button type="button" className="place-order-btn" onClick={()=>{
    if(paymentMethod==="card"){handleSandboxPayment();} else {setOrderPlaced(true);}
}}>
    Pay Rs. {total.toLocaleString()}
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
                    Rs. {(item.price * item.qty).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
              ))}
            </div>

            <hr />

            <div className="price-breakdown">
              <div className="price-row">
                <span>Subtotal</span>
                <span>
                  Rs. {subtotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>

              <div className="price-row">
                <span>Delivery Fee</span>
                <span>
                  Rs. {deliveryFee.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>

              <div className="price-row discount">
                <span>Offer Discount</span>
                <span>
                  -Rs. {discount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>

              <div className="price-row total">
                <span>Total Amount</span>
                <span>
                  Rs. {total.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
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