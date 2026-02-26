// src/PharmacyStore.jsx

import React, { useState, useEffect } from 'react';
import './PharmacyStore.css';
import Logo from '../assets/Logo.jpeg';
import { useNavigate, useLocation } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { database } from "../Firebase";

const PharmacyStore = () => {
    const location = useLocation();
    const preSelectedPharmacy = location.state?.selectedPharmacyFilter || null;

    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productsData, setProductsData] = useState([]);
    const [patientLocation, setPatientLocation] = useState(null);

    const [showPharmacySearch, setShowPharmacySearch] = useState(false);
    const [pharmacySearchTerm, setPharmacySearchTerm] = useState("");
    const [pharmaciesList, setPharmaciesList] = useState([]);
    const [selectedPharmacyFilter, setSelectedPharmacyFilter] = useState(preSelectedPharmacy);

    // ✅ Cart State
    const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem("cart");
    return saved 
        ? JSON.parse(saved).map(item => {

            let fixedPrice = Number(item.price);

            // 🔥 If price accidentally stored as cents like 0.45 instead of 45
            if (fixedPrice > 0 && fixedPrice < 1) {
                fixedPrice = fixedPrice * 100;
            }

            return {
                ...item,
                price: fixedPrice || 0,
                qty: Number(item.qty) || 1,
                deliveryFee: Number(item.deliveryFee) || 0
            };
        })
        : [];
});
    const [showCart, setShowCart] = useState(false);
    const navigate = useNavigate();

    // Get patient location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setPatientLocation({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
                });
            }, (err) => console.log("Geolocation error:", err));
        }
    }, []);

    // Calculate distance between two lat/lng points
    const getDistance = (lat1, lon1, lat2, lon2) => {
        const toRad = (x) => x * Math.PI / 180;
        const R = 6371; // km
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat/2)**2 +
                  Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                  Math.sin(dLon/2)**2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    // Load pharmacies
    useEffect(() => {
        const pharmaciesRef = ref(database, "pharmacies");
        onValue(pharmaciesRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            const list = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));

            setPharmaciesList(list);
        });
    }, []);

    // Load medicines filtered by selected pharmacy
   // Load medicines filtered by selected pharmacy
useEffect(() => {
    const medicinesRef = ref(database, "medicines");
    const pharmaciesRef = ref(database, "pharmacies");

    onValue(pharmaciesRef, (pharmacySnap) => {
        const pharmaciesData = pharmacySnap.val();
        if (!pharmaciesData || !patientLocation) return;

        const pharmacyList = Object.keys(pharmaciesData).map(key => ({
            id: key,
            ...pharmaciesData[key]
        }));

        onValue(medicinesRef, (medicineSnap) => {
            const data = medicineSnap.val();
            if (!data) return;

            const medGroups = {};

            // 🔥 Group medicines by name
            Object.keys(data).forEach(medId => {
                const med = data[medId];

                if (med.availability !== "Available") return;

                if (!medGroups[med.name]) {
                    medGroups[med.name] = [];
                }

                medGroups[med.name].push({
                    id: medId,
                    ...med
                });
            });

            const finalProducts = [];

            // 🔥 For each medicine name, find nearest available pharmacy
            Object.keys(medGroups).forEach(medName => {

                const availableVersions = medGroups[medName]
                    .filter(med =>
                        !selectedPharmacyFilter ||
                        med.pharmacyUID === selectedPharmacyFilter.id
                    );

                if (availableVersions.length === 0) return;

                // Sort by distance
                availableVersions.sort((a, b) => {
                    const phA = pharmacyList.find(p => p.id === a.pharmacyUID);
                    const phB = pharmacyList.find(p => p.id === b.pharmacyUID);

                    if (!phA || !phB) return 0;

                    const distA = getDistance(
                        patientLocation.latitude,
                        patientLocation.longitude,
                        parseFloat(phA.latitude),
                        parseFloat(phA.longitude)
                    );

                    const distB = getDistance(
                        patientLocation.latitude,
                        patientLocation.longitude,
                        parseFloat(phB.latitude),
                        parseFloat(phB.longitude)
                    );

                    return distA - distB;
                });

                const nearestMed = availableVersions[0];
                const nearestPharmacy = pharmacyList.find(p => p.id === nearestMed.pharmacyUID);

                if (!nearestPharmacy) return;

                finalProducts.push({
                    id: nearestMed.id,
                    name: nearestMed.name,
                    category: nearestMed.categories?.[0] || "General",
                    price: Number(nearestMed.price) || 0,
                    description: nearestMed.description,
                    offer: nearestMed.discount || null,
                    image: nearestMed.imageUrl || null,
                    dosage: nearestMed.dosage,
                    manufacturer: nearestMed.manufacturer,
                    expiryDate: nearestMed.expiryDate,
                    usageInstructions: nearestMed.usageInstructions,
                    warnings: nearestMed.warnings,
                    sideEffects: nearestMed.sideEffects,

                    pharmacyname: nearestPharmacy.pharmacyname,
                    pharmacyUID: nearestMed.pharmacyUID,

                    isAvailable: true,
                    prescriptionRequired: nearestMed.prescriptionRequired || false,
                    deliveryFee: Number(nearestMed.deliveryFee) || 0
                });
            });

            setProductsData(finalProducts);

            const uniqueCategories = [...new Set(finalProducts.map(p => p.category))];
            setCategories(uniqueCategories);
            if (uniqueCategories.length > 0) setSelectedCategory(uniqueCategories[0]);
        });
    });

}, [patientLocation, selectedPharmacyFilter]);

    const filteredProducts = productsData.filter(p =>
        p.category === selectedCategory &&
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ✅ Updated Buy Now: Pass proper object to CheckoutPage
    const buyNowSingle = (product) => {
    if (!product.isAvailable) {
        alert("This item is currently unavailable.");
        return;
    }

    const itemForCheckout = {
    id: product.id,
    name: product.name,
    price: Number(product.price) || 0,
    qty: 1,

    pharmacyname: product.pharmacyname || "Unknown Pharmacy",
    pharmacyUID: product.pharmacyUID,   // 🔥 ADD THIS

    offer: product.offer || null,
    prescriptionRequired: product.prescriptionRequired || false,
    deliveryFee: product.deliveryFee || 250,
    isAvailable: true
};

    navigate("/CheckoutPage", { state: { items: [itemForCheckout] } });
};

    // ✅ Updated Add to Cart: Standardize item structure
    const addToCart = (product) => {
        if (!product.isAvailable) {
            alert("This item is currently unavailable.");
            return;
        }

        const itemForCart = {
    id: product.id,
    name: product.name,
    price: Number(product.price) || 0,
    qty: 1,

    pharmacyname: product.pharmacyname || "Unknown Pharmacy",
    pharmacyUID: product.pharmacyUID,  // 🔥 ADD THIS

    offer: product.offer || null,
    prescriptionRequired: product.prescriptionRequired || false,
    deliveryFee: product.deliveryFee || 250,
    isAvailable: true
};

        setCartItems(prev => {
            const existing = prev.find(item => item.id === product.id);
            const updated = existing
                ? prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item)
                : [...prev, itemForCart];
            localStorage.setItem("cart", JSON.stringify(updated));
            return updated;
        });
    };

    const buyAllCart = () => {
        if (cartItems.length === 0) return;
        const unavailable = cartItems.some(item => !item.isAvailable);
        if (unavailable) {
            alert("Some items in your cart are unavailable. Please remove them.");
            return;
        }

        navigate("/CheckoutPage", { state: { items: cartItems } });
    };

    const removeFromCart = (productId) => {
        setCartItems(prev => {
            const updated = prev.filter(item => item.id !== productId);
            localStorage.setItem("cart", JSON.stringify(updated));
            return updated;
        });
    };

    const updateQuantity = (productId, qty) => {
        if (qty < 1) return;
        setCartItems(prev => {
            const updated = prev.map(item => item.id === productId ? { ...item, qty } : item);
            localStorage.setItem("cart", JSON.stringify(updated));
            return updated;
        });
    };

    const totalItems = cartItems.reduce((acc, item) => acc + item.qty, 0);

    const filteredPharmacies = pharmaciesList.filter(ph =>
        ph.pharmacyname?.toLowerCase().includes(pharmacySearchTerm.toLowerCase()) ||
        ph.city?.toLowerCase().includes(pharmacySearchTerm.toLowerCase()) ||
        ph.province?.toLowerCase().includes(pharmacySearchTerm.toLowerCase()) ||
        ph.address?.toLowerCase().includes(pharmacySearchTerm.toLowerCase())
    );

    return (
        <div className="pharmacy-page">
            {/* Header */}
            <header className="pharmacy-header">
                <div className="header-left">
                    <img src={Logo} alt="MediCare" className="header-logo" />
                    <button className="back-btn" onClick={() => window.history.back()}>← Back</button>
                </div>
                <div className="header-center">
                    <div className="search-container">
                        <input
                            type="text"
                            className="top-search-bar"
                            placeholder="Search for medicine name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {selectedPharmacyFilter && <h4 className="pharmacy-filter-label">Showing: {selectedPharmacyFilter.pharmacyname}</h4>}
                    </div>
                </div>
                <div className="header-right">
                    {!preSelectedPharmacy && (
                        <button className="search-pharmacy-btn" onClick={() => setShowPharmacySearch(true)}>Search Pharmacy</button>
                    )}
                    <button className="main-cart-btn" onClick={() => setShowCart(true)}>
                        🛒 Cart <span className="cart-count">{totalItems}</span>
                    </button>
                </div>
            </header>

            <div className="pharmacy-content">
                {/* Sidebar */}
                <aside className="sidebar">
                    <h3>Categories</h3>
                    <ul className="category-list">
                        {categories.map(cat => (
                            <li key={cat} className={selectedCategory === cat ? 'active' : ''} onClick={() => setSelectedCategory(cat)}>
                                {cat}
                            </li>
                        ))}
                    </ul>
                </aside>

                {/* Products */}
                <main className="product-display">
                    <div className="product-grid">
                        {filteredProducts.map(product => (
                            <div className="product-card" key={product.id} onClick={() => setSelectedProduct(product)}>
                                {product.offer && <div className="offer-tag">{product.offer}</div>}
                                <div className="card-image-wrapper">
                                    {product.image
                                        ? <img src={product.image} alt={product.name} />
                                        : <div className="placeholder-img">No Image</div>}
                                </div>
                                <div className="card-body">
                                    <h4 className="prod-name">{product.name}</h4>
                                    <p className="prod-pharmacies">📍 {product.pharmacyname}</p>
                                    <p className="prod-short-desc">{product.description?.substring(0, 45)}...</p>
                                    <h3 className="prod-price">
    Rs. {product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
</h3>
                                </div>
                                <div className="card-actions">
                                    <button className="btn-cart-sm" disabled={!product.isAvailable} onClick={(e) => { e.stopPropagation(); addToCart(product); }}>Add to Cart</button>
                                    <button className="btn-buy-sm" disabled={!product.isAvailable} onClick={(e) => { e.stopPropagation(); buyNowSingle(product); }}>Buy Now</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>

            {/* 🔎 Pharmacy Search Popup */}
{showPharmacySearch && (
    <div className="overlay" onClick={() => setShowPharmacySearch(false)}>
        <div className="popup-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Search Pharmacy</h2>

            <input
                type="text"
                placeholder="Search by pharmacy name, city, province..."
                value={pharmacySearchTerm}
                onChange={(e) => setPharmacySearchTerm(e.target.value)}
                className="top-search-bar"
                style={{ marginBottom: "15px" }}
            />

            {filteredPharmacies.length === 0 ? (
                <p>No pharmacies found</p>
            ) : (
                filteredPharmacies.map(ph => (
                    <div
                        key={ph.id}
                        className="cart-item"
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                            setSelectedPharmacyFilter(ph);
                            setShowPharmacySearch(false);
                        }}
                    >
                        <p><strong>{ph.pharmacyname}</strong></p>
                        <p>{ph.address}</p>
                        <p>{ph.city}, {ph.province}</p>
                    </div>
                ))
            )}

            <button
                className="cart-popup-close"
                onClick={() => {
                    setSelectedPharmacyFilter(null);
                    setShowPharmacySearch(false);
                }}
            >
                Show All Pharmacies
            </button>
        </div>
    </div>
)}

            {/* Cart Popup */}
            {showCart && (
                <div className="overlay" onClick={() => setShowCart(false)}>
                    <div className="popup-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>My Cart</h2>
                        {cartItems.length === 0 ? <p>Cart is empty</p> : cartItems.map(item => (
                            <div key={item.id} className="cart-item">
                                <p>{item.name} x {item.qty}</p>
                                <p>
  Rs. {item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
</p>
                                <button onClick={() => updateQuantity(item.id, item.qty - 1)}>-</button>
                                <button onClick={() => updateQuantity(item.id, item.qty + 1)}>+</button>
                                <button onClick={() => removeFromCart(item.id)}>Remove</button>
                                <button className="cart-buy-btn" disabled={!item.isAvailable} onClick={() => buyNowSingle(item)}>Buy</button>
                            </div>
                        ))}
                        <button onClick={() => setShowCart(false)} className='cart-popup-close'>Close</button>
                        {cartItems.length > 0 && <button className="buy-all-btn" onClick={buyAllCart}>Buy All Items</button>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PharmacyStore;