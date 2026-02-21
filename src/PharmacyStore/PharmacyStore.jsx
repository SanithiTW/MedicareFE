import React, { useState, useEffect } from 'react';
import './PharmacyStore.css';
import Logo from '../assets/Logo.jpeg';
import { useNavigate } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { database } from "../Firebase";

const PharmacyStore = () => {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productsData, setProductsData] = useState([]);
    const [patientLocation, setPatientLocation] = useState(null);

    const [showPharmacySearch, setShowPharmacySearch] = useState(false);
const [pharmacySearchTerm, setPharmacySearchTerm] = useState("");
const [pharmaciesList, setPharmaciesList] = useState([]);
const [selectedPharmacyFilter, setSelectedPharmacyFilter] = useState(null);

    // ✅ Cart State
    const [cartItems, setCartItems] = useState(() => {
        const saved = localStorage.getItem("cart");
        return saved ? JSON.parse(saved) : [];
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

    useEffect(() => {
    const medicinesRef = ref(database, "medicines");
    const pharmaciesRef = ref(database, "pharmacies");

    onValue(pharmaciesRef, (pharmacySnap) => {
        const pharmaciesData = pharmacySnap.val();
        if (!pharmaciesData || !patientLocation) return;

        onValue(medicinesRef, (medicineSnap) => {
            const data = medicineSnap.val();
            if (!data) return;

            // Group medicines by name
            const medMap = {};

            Object.keys(data).forEach(medId => {
                const med = data[medId];
                const medName = med.name;

                // Find all pharmacies that have this medicine available
                const availablePharmacies = Object.values(pharmaciesData)
                    .filter(ph => {
    if (med.availability !== "Available") return false;

    // ✅ If user selected a pharmacy → filter by it
    if (selectedPharmacyFilter) {
        return ph.id === selectedPharmacyFilter.id && ph.id === med.pharmacyUID;
    }

    // ✅ Default behaviour (nearest pharmacy)
    return ph.id === med.pharmacyUID;
});

                if (availablePharmacies.length === 0) return; // Skip if no pharmacy has it

                // Find nearest pharmacy
                let nearestPharmacy = availablePharmacies.reduce((prev, curr) => {
                    const prevDist = getDistance(
                        patientLocation.latitude,
                        patientLocation.longitude,
                        parseFloat(prev.latitude),
                        parseFloat(prev.longitude)
                    );
                    const currDist = getDistance(
                        patientLocation.latitude,
                        patientLocation.longitude,
                        parseFloat(curr.latitude),
                        parseFloat(curr.longitude)
                    );
                    return currDist < prevDist ? curr : prev;
                });

                // Save only one entry per medicine
                medMap[medName] = {
                    id: medId,
                    name: med.name,
                    category: med.categories?.[0] || "General",
                    price: `Rs. ${med.price}`,
                    description: med.description,
                    offer: med.discount || null,
                    image: med.imageUrl || null,
                    dosage: med.dosage,
                    manufacturer: med.manufacturer,
                    expiryDate: med.expiryDate,
                    usageInstructions: med.usageInstructions,
                    warnings: med.warnings,
                    sideEffects: med.sideEffects,
                    batchNumber: med.batchNumber || "",
                    form: med.form || "",
                    pharmacies: nearestPharmacy.pharmacyname, // ✅ Pharmacy name
                    isAvailable: true
                };
            });

            const loadedProducts = Object.values(medMap);
            setProductsData(loadedProducts);

            const uniqueCategories = [...new Set(
                loadedProducts.map(p => p.category)
            )];
            setCategories(uniqueCategories);
            if (uniqueCategories.length > 0) setSelectedCategory(uniqueCategories[0]);
        });
    });
}, [patientLocation, selectedPharmacyFilter]);

    const filteredProducts = productsData.filter(p =>
        p.category === selectedCategory &&
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const buyNowSingle = (product) => {
        if (!product.isAvailable) {
            alert("This item is currently unavailable.");
            return;
        }
        navigate("/CheckoutPage", {
            state: { items: [{ ...product, quantity: 1 }] }
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

    const addToCart = (product) => {
        if (!product.isAvailable) {
            alert("This item is currently unavailable.");
            return;
        }
        setCartItems(prev => {
            const existing = prev.find(item => item.id === product.id);
            let updated;
            if (existing) {
                updated = prev.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            } else {
                updated = [...prev, { ...product, quantity: 1 }];
            }
            localStorage.setItem("cart", JSON.stringify(updated));
            return updated;
        });
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
            const updated = prev.map(item =>
                item.id === productId ? { ...item, quantity: qty } : item
            );
            localStorage.setItem("cart", JSON.stringify(updated));
            return updated;
        });
    };

    const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

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
                    </div>
                </div>
                <div className="header-right">
                    <button
    className="search-pharmacy-btn"
    onClick={() => setShowPharmacySearch(true)}
>
    Search Pharmacy
</button>
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
                            <div
                                className="product-card"
                                key={product.id}
                                onClick={() => setSelectedProduct(product)}
                            >
                                {product.offer && <div className="offer-tag">{product.offer}</div>}
                                <div className="card-image-wrapper">
                                    {product.image
                                        ? <img src={product.image} alt={product.name} />
                                        : <div className="placeholder-img">No Image Available</div>}
                                </div>
                                <div className="card-body">
                                    <h4 className="prod-name">{product.name}</h4>
                                    <p className="prod-pharmacies">📍 {product.pharmacies}</p>
                                    <p className="prod-short-desc">{product.description?.substring(0, 45)}...</p>
                                    <h3 className="prod-price">{product.price}</h3>
                                </div>
                                <div className="card-actions">
                                    <button
                                        className="btn-cart-sm"
                                        disabled={!product.isAvailable}
                                        onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                                    >Add to Cart</button>
                                    <button
                                        className="btn-buy-sm"
                                        disabled={!product.isAvailable}
                                        onClick={(e) => { e.stopPropagation(); buyNowSingle(product); }}
                                    >Buy Now</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>

            {/* Popup Modal */}
            {selectedProduct && (
                <div className="overlay" onClick={() => setSelectedProduct(null)}>
                    <div className="popup-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setSelectedProduct(null)}>&times;</button>
                        <div className="modal-content-flex">
                            <div className="modal-img-container">
                                {selectedProduct.image
                                    ? <img src={selectedProduct.image} alt={selectedProduct.name} />
                                    : <div className="placeholder-img">No Image</div>}
                            </div>
                            <div className="modal-info">
                                <h2>{selectedProduct.name}</h2>
                                <p><strong>Category:</strong> {selectedProduct.category}</p>
                                <p><strong>Available at:</strong> {selectedProduct.pharmacies}</p>
                                <p><strong>Manufacturer:</strong> {selectedProduct.manufacturer}</p>
                                <p><strong>Dosage:</strong> {selectedProduct.dosage}</p>
                                <p><strong>Expiry Date:</strong> {selectedProduct.expiryDate}</p>
                                <div className="modal-description"><strong>Description:</strong><p>{selectedProduct.description}</p></div>
                                <p><strong>Usage:</strong> {selectedProduct.usageInstructions}</p>
                                <p><strong>Warnings:</strong> {selectedProduct.warnings}</p>
                                <p><strong>Side Effects:</strong> {selectedProduct.sideEffects}</p>
                                <h2 className="modal-price-tag">{selectedProduct.price}</h2>
                                <div className="modal-buttons">
                                    <button
                                        className="modal-btn-cart"
                                        disabled={!selectedProduct.isAvailable}
                                        onClick={() => addToCart(selectedProduct)}
                                    >Add to Cart</button>
                                    <button
                                        className="modal-btn-buy"
                                        disabled={!selectedProduct.isAvailable}
                                        onClick={() => buyNowSingle(selectedProduct)}
                                    >Buy Now</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/*Search pharmacy form popup*/}

            {showPharmacySearch && (
    <div className="overlay" onClick={() => setShowPharmacySearch(false)}>
        <div className="popup-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Search Pharmacy</h2>

            <input
                type="text"
                placeholder="Search by name, city, province, address..."
                className="top-search-bar"
                value={pharmacySearchTerm}
                onChange={(e) => setPharmacySearchTerm(e.target.value)}
            />

            <div style={{ maxHeight: "300px", overflowY: "auto", marginTop: "10px" }}>
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
                            <strong>{ph.pharmacyname}</strong>
                            <p>{ph.city}, {ph.province}</p>
                            {ph.address && <p>{ph.address}</p>}
                        </div>
                    ))
                )}
            </div>

            {/* ✅ Clear filter */}
            {selectedPharmacyFilter && (
                <button
                    className="cart-popup-close"
                    onClick={() => {
                        setSelectedPharmacyFilter(null);
                        setShowPharmacySearch(false);
                    }}
                >
                    Clear Pharmacy Filter
                </button>
            )}

            <button
                className="cart-popup-close"
                onClick={() => setShowPharmacySearch(false)}
            >
                Close
            </button>
        </div>
    </div>
)}

            {/* ✅ Cart Popup */}
            {showCart && (
                <div className="overlay" onClick={() => setShowCart(false)}>
                    <div className="popup-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>My Cart</h2>
                        {cartItems.length === 0 ? (
                            <p>Cart is empty</p>
                        ) : (
                            cartItems.map(item => (
                                <div key={item.id} className="cart-item">
                                    <p>{item.name} x {item.quantity}</p>
                                    <p>{item.price}</p>
                                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                                    <button onClick={() => removeFromCart(item.id)}>Remove</button>
                                    <button
                                        className="cart-buy-btn"
                                        disabled={!item.isAvailable}
                                        onClick={() => buyNowSingle(item)}
                                    >Buy</button>
                                </div>
                            ))
                        )}
                        <button onClick={() => setShowCart(false)} className='cart-popup-close'>Close</button>
                        {cartItems.length > 0 && (
                            <button className="buy-all-btn" onClick={buyAllCart}>Buy All Items</button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PharmacyStore;