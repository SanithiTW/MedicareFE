import React, { useState, useEffect } from 'react';
import './PharmacyStore.css';
import Logo from '../assets/Logo.jpeg';

import { ref, onValue } from "firebase/database";
import { database } from "../Firebase";

const PharmacyStore = () => {

    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productsData, setProductsData] = useState([]);

    useEffect(() => {
        const medicinesRef = ref(database, "medicines");
        const pharmaciesRef = ref(database, "pharmacies");

        let pharmaciesMap = {};

        onValue(pharmaciesRef, (pharmacySnap) => {
            const pharmaciesData = pharmacySnap.val();

            if (pharmaciesData) {
                Object.keys(pharmaciesData).forEach((key) => {
                    pharmaciesMap[key] = pharmaciesData[key].pharmacyname;
                });
            }

            onValue(medicinesRef, (medicineSnap) => {
                const data = medicineSnap.val();

                if (data) {
                    const loadedProducts = Object.keys(data).map((key) => {
                        const med = data[key];
                        return {
                            id: key,
                            category: med.categories?.[0] || "General",
                            name: med.name,
                            pharmacies: pharmaciesMap[med.pharmacyUID] || "Unknown Pharmacy",
                            price: `Rs. ${med.price}`,
                            description: med.description,
                            offer: med.discount || null,
                            image: med.imageUrl || null,
                            dosage: med.dosage,
                            manufacturer: med.manufacturer,
                            expiryDate: med.expiryDate,
                            usageInstructions: med.usageInstructions,
                            warnings: med.warnings,
                            sideEffects: med.sideEffects
                        };
                    });

                    setProductsData(loadedProducts);

                    const uniqueCategories = [...new Set(
                        loadedProducts.map(p => p.category)
                    )];
                    setCategories(uniqueCategories);
                    if (uniqueCategories.length > 0) setSelectedCategory(uniqueCategories[0]);
                }
            });
        });

    }, []);

    const filteredProducts = productsData.filter(p =>
        p.category === selectedCategory &&
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                    <input
                        type="text"
                        className="top-search-bar"
                        placeholder="Search for medicine name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="search-pharmacy-btn">Search Pharmacy</button>
                </div>

                <div className="header-right">
                    <button className="main-cart-btn">
                        🛒 Cart <span className="cart-count">2</span>
                    </button>
                </div>
            </header>

            <div className="pharmacy-content">

                {/* Sidebar */}
                <aside className="sidebar">
                    <h3>Categories</h3>
                    <ul className="category-list">
                        {categories.map(cat => (
                            <li
                                key={cat}
                                className={selectedCategory === cat ? 'active' : ''}
                                onClick={() => setSelectedCategory(cat)}
                            >
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
                                    <p className="prod-short-desc">
                                        {product.description?.substring(0, 45)}...
                                    </p>
                                    <h3 className="prod-price">{product.price}</h3>
                                </div>

                                <div className="card-actions">
                                    <button className="btn-cart-sm" onClick={(e) => e.stopPropagation()}>Add to Cart</button>
                                    <button className="btn-buy-sm" onClick={(e) => e.stopPropagation()}>Buy Now</button>
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
                        <button
                            className="close-btn"
                            onClick={() => setSelectedProduct(null)}
                        >
                            &times;
                        </button>

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

                                <div className="modal-description">
                                    <strong>Description:</strong>
                                    <p>{selectedProduct.description}</p>
                                </div>

                                <p><strong>Usage:</strong> {selectedProduct.usageInstructions}</p>
                                <p><strong>Warnings:</strong> {selectedProduct.warnings}</p>
                                <p><strong>Side Effects:</strong> {selectedProduct.sideEffects}</p>

                                <h2 className="modal-price-tag">{selectedProduct.price}</h2>

                                {/* ✅ Action Buttons in Popup */}
                                <div className="modal-buttons">
                                    <button className="modal-btn-cart">Add to Cart</button>
                                    <button className="modal-btn-buy">Buy Now</button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default PharmacyStore;
