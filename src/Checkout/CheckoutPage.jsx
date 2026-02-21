import React, { useState } from 'react';
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

    console.log("Passed Items:", passedItems);

    // ✅ Patient Data
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
        bloodGroup: "B+",
        gender: "male",
        dob: "2006-06-15"
    };

    // ✅ Family Members
    const familyMembers = [
        { id: 1, name: "Patient 02" },
        { id: 2, name: "Patient 03" },
        { id: 3, name: "Patient 04" }
    ];

    // ✅ Use items from previous page
    const [cartItems, setCartItems] = useState(
        passedItems.map(item => {
            // Price parsing
            let price = 0;
            if (item.price) {
                const cleanedPrice = item.price.toString().replace(/[^0-9.]/g, "").trim();
                price = parseFloat(cleanedPrice) || 0;
            }

            // Quantity
            const qty = item.quantity || item.qty || 1;

            // Delivery fee parsing
            let deliveryFee = 250; // default
            if (item.deliveryFee) {
                const cleanedFee = item.deliveryFee.toString().replace(/[^0-9.]/g, "").trim();
                deliveryFee = parseFloat(cleanedFee) || 250;
            }

            // Pharmacy name fallback
            const pharmacyname = item.pharmacyname || item.pharmacy || "Unknown Pharmacy";

            return { ...item, price, qty, deliveryFee, pharmacyname };
        })
    );

    // ✅ Dynamic Calculations
    // Subtotal
    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

    // Discount calculation (handles percentage discounts)
    const discount = cartItems.reduce((acc, item) => {
        if (item.discount && item.discount.includes("%")) {
            const percent = parseFloat(item.discount.replace(/[^0-9.]/g, "")) || 0;
            return acc + (item.price * item.qty * percent) / 100;
        } else if (item.discount) {
            // fallback for fixed discount values
            const numericDiscount = parseFloat(item.discount.replace(/[^0-9.]/g, "")) || 0;
            return acc + numericDiscount;
        }
        return acc;
    }, 0);

    // Delivery fee = sum of all items
    const deliveryFee = cartItems.reduce((acc, item) => acc + (item.deliveryFee || 0), 0);

    // Total
    const total = subtotal + deliveryFee - discount;

    // Check if any cart item requires prescription
    const requiresPrescription = cartItems.some(item => item.prescriptionRequired === true);

    const [selectedPatient, setSelectedPatient] = useState(mainPatient.fullName);
    const [customPatientName, setCustomPatientName] = useState(mainPatient.fullName);

    const handleSandboxPayment = async () => {
    if (!window.payhere) {
        alert("PayHere SDK not loaded");
        return;
    }

    const orderId = "ORDER_" + new Date().getTime();
    const amountStr = total.toFixed(2);

    // 🔹 Fetch hash from Node server
    let hash = "";
    try {
        const res = await fetch(
            `http://localhost:3001/get-payhere-hash?order_id=${orderId}&amount=${amountStr}&currency=LKR`
        );
        const data = await res.json();
        hash = data.hash;
    } catch (err) {
        console.error("Error fetching hash:", err);
        alert("Could not generate payment hash");
        return;
    }
    

    const payment = {
    sandbox: true,
    merchant_id: SANDBOX_MERCHANT_ID, // now this works
    return_url: "http://localhost:3000/checkout-success",
    cancel_url: "http://localhost:3000/checkout-cancel",
    notify_url: "http://localhost:3000/notify",
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

    
    if (orderPlaced) {

        React.useEffect(() => {

    if (!window.payhere) return;

    window.payhere.onCompleted = function onCompleted(orderId) {
        console.log("Payment completed. OrderID:", orderId);
        setOrderPlaced(true);
    };

    window.payhere.onDismissed = function onDismissed() {
        console.log("Payment dismissed");
        alert("Payment was cancelled.");
    };

    window.payhere.onError = function onError(error) {
        console.log("Error:", error);
        alert("Payment error occurred.");
    };

}, []);
        return (
            <div className="success-container">
                <div className="success-card">
                    <div className="success-icon">✔</div>
                    <h2>Order Placed Successfully!</h2>
                    <p>Your medicine is being prepared. You will receive an SMS update shortly.</p>
                    <button className="back-to-store" onClick={() => window.location.href='/pharmacy'}>
                        Return to Store
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            {/* Header */}
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
                {/* Left Side: Form */}
                <form className="checkout-form" onSubmit={handlePlaceOrder}>
                    {/* Delivery Information */}
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
                                        <option key={member.id} value={member.name}>{member.name}</option>
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

                    {/* Mark as Urgent & Delivery Time */}
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

                    {/* Prescription Upload */}
                    {requiresPrescription && (
                        <section className="form-section">
                            <h3>3. Upload Doctor Prescription (Required)</h3>
                            <input type="file" accept="image/*,.pdf" onChange={handlePrescriptionUpload} required />
                            <small>This is mandatory because one or more medicines require a valid prescription.</small>
                        </section>
                    )}

                    {/* Payment */}
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

                        {paymentMethod === 'card' && (
                            <div className="card-details-grid">
                                <div className="form-group full">
                                    <label>Card Number</label>
                                    <input type="text" placeholder="0000 0000 0000 0000" />
                                </div>
                                <div className="form-group">
                                    <label>Expiry</label>
                                    <input type="text" placeholder="MM/YY" />
                                </div>
                                <div className="form-group">
                                    <label>CVC</label>
                                    <input type="text" placeholder="123" />
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Confirm Button */}
                    <button
    type="button"
    className="place-order-btn"
    onClick={() => {
        if (paymentMethod === "card") {
            handleSandboxPayment();
        } else {
            setOrderPlaced(true); // COD
        }
    }}
>
    Pay Rs. {total.toLocaleString()}
</button>
                </form>

                {/* Right Side: Order Summary */}
                <aside className="order-summary">
                    <div className="summary-card">
                        <h3>Order Summary</h3>
                        <div className="summary-items">
                            {cartItems.map(item => (
                                <div className="summary-item" key={item.id}>
                                    <div className="item-main">
                                        <strong>{item.name} x {item.qty}</strong>
                                        <small>Pharmacy: {item.pharmacyname}</small>
                                        {item.offer && <span className="item-discount">{item.offer}</span>}
                                    </div>
                                    <span className="item-price">Rs. {(item.price * item.qty).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>

                        <hr />

                        <div className="price-breakdown">
                            <div className="price-row">
                                <span>Subtotal</span>
                                <span>Rs. {subtotal.toLocaleString()}</span>
                            </div>
                            <div className="price-row">
                                <span>Delivery Fee</span>
                                <span>Rs. {deliveryFee.toLocaleString()}</span>
                            </div>
                            <div className="price-row discount">
                                <span>Offer Discount</span>
                                <span>-Rs. {discount.toLocaleString()}</span>
                            </div>
                            <div className="price-row total">
                                <span>Total Amount</span>
                                <span>Rs. {total.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="safety-note">
                            🛡️ Your medical data is encrypted and secure.
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default CheckoutPage;