import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from '../assets/Logo.jpeg';
import '../RegistrationFormsCommon.css'; 

const PharmacyDetailsCollectionPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const initialData = location.state?.userData || {}; 
    
    const [details, setDetails] = useState({
        pharmacyname: initialData.pharmacyname || '',
        name: initialData.name || '',
        
        // Business Details
        businessRegNo: '',
        licenseNo: '',
        licenseExpiryDate: '',
        taxId: '',
        
        // Address Details
        address: '',
        city: '',
        province: '',
        postalCode: '',
        
        // Contact Details
        officialEmail: '',
        phone: '',
        hotline: '',
        whatsapp: '',
        
        // Business Operation Details
        openingTime: '09:00',
        closingTime: '17:00',
        operatingDays: [], 
        deliverySupport: 'No',
        deliveryRange: '',
        
        // ⭐ ADDED — Location Fields
        latitude: '',
        longitude: '',
        
        // Payment Setup
        bankAccountName: '',
        bankAccountNumber: '',
        bankName: '',
        branch: '',
        paymentFrequency: 'Weekly',

        // Document Uploads
        regCertificate: null,
        pharmacistLicenseCopy: null,
        frontPhoto: null,
        ownerID: null,
        
        // Service Options
        services: {
            medicineDelivery: false,
            prescriptionUpload: false,
            emergencyOrders: false,
            wholesaleSupply: false,
            otcSale: false,
            doctorChanneling: false,
        }
    });

    const [edit, setEdit] = useState({
        pharmacyname: false,
        name: false,
    });
    
    const operationDaysOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const serviceOptionsList = [
        { key: 'medicineDelivery', label: 'Medicine Delivery' },
        { key: 'prescriptionUpload', label: 'Prescription Upload Handling' },
        { key: 'emergencyOrders', label: 'Emergency Orders' },
        { key: 'wholesaleSupply', label: 'Wholesale Supply' },
        { key: 'otcSale', label: 'OTC Medicine Sale' },
        { key: 'doctorChanneling', label: 'Doctor Channeling (If partnered)' },
    ];

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        
        if (type === 'file') {
            setDetails({ ...details, [name]: files[0] });
        } else {
            setDetails({ ...details, [name]: value });
        }
    };

    const handleServiceChange = (key) => {
        setDetails(prev => ({
            ...prev,
            services: {
                ...prev.services,
                [key]: !prev.services[key]
            }
        }));
    };
    
    const handleDayToggle = (day) => {
        setDetails(prev => {
            const currentDays = prev.operatingDays;
            if (currentDays.includes(day)) {
                return { ...prev, operatingDays: currentDays.filter(d => d !== day) };
            } else {
                return { ...prev, operatingDays: [...currentDays, day] };
            }
        });
    };

    const handleEditToggle = (field) => {
        setEdit(prev => ({ ...prev, [field]: !prev[field] }));
    };

    // ⭐ ADDED — Auto Detect Location
    const detectMyLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            pos => {
                setDetails(prev => ({
                    ...prev,
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
                }));
            },
            err => {
                alert("Unable to fetch location. Please enable GPS.");
            }
        );
    };

    // ⭐ FIXED — Correct file handler
    const handleFileUpload = (e) => {
        setDetails((prev) => ({
            ...prev,
            [e.target.name]: e.target.files[0],
        }));
    };

    
    const handleFinalRegistration = (e) => {
        e.preventDefault();
        
        const finalData = { ...details };

        console.log("Final Pharmacy Registration Data:", finalData);

        navigate('/registration-success', { state: { role: 'Pharmacy' } });
    };

    // ⭐ UPDATED — use handleFileUpload instead of handleChange
    const FileUploadRow = ({ name, label }) => (
        <div className="input-row">
            <label htmlFor={name}>{label}</label>
            <input 
                type="file" 
                id={name} 
                name={name} 
                onChange={handleFileUpload} 
                required 
            />
            {details[name] && <small style={{ color: '#18D23A', display: 'block' }}>File selected: {details[name].name}</small>}
        </div>
    );

    return (
        <div className="registration-page details-collection-page">
            <div className="form-wrapper center-wrapper">
                <div className="details-container pharmacy-register-bg">
                    <div className="header-logo">
                        <img src={Logo} alt="MediCare Logo" className="logo-img"/>
                    </div>
                    
                    <h3>Pharmacy Detail Collection</h3>

                    <form onSubmit={handleFinalRegistration}>
                        {/* ✔ 1. Identity */}
                        <h3 style={{ marginBottom: '15px' }}>✅ Business Identity</h3>
                        
                        <div className="input-row">
                            <label>Pharmacy Name (from Step 1)</label>
                            <input 
                                type="text" 
                                value={details.pharmacyname} 
                                readOnly={!edit.pharmacyname}
                                onChange={handleChange}
                                name="pharmacyname"
                                className={!edit.pharmacyname ? 'display-input' : ''}
                                required
                            />
                            <span className="edit-icon" onClick={() => handleEditToggle('pharmacyname')}>&#9998;</span>
                        </div>
                        
                        <div className="input-row">
                            <label>Owner/Manager Name (from Step 1)</label>
                            <input 
                                type="text" 
                                value={details.name} 
                                readOnly={!edit.name}
                                onChange={handleChange}
                                name="name"
                                className={!edit.name ? 'display-input' : ''}
                                required
                            />
                            <span className="edit-icon" onClick={() => handleEditToggle('name')}>&#9998;</span>
                        </div>

                        {/* 🏥 Business Details */}
                        <h3>🏥 Pharmacy Business Details</h3>
                        <div className="input-row required-field">
                            <label htmlFor="businessRegNo">Business Registration No.</label>
                            <input type="text" id="businessRegNo" name="businessRegNo" value={details.businessRegNo} onChange={handleChange} required />
                        </div>
                        <div className="input-row required-field">
                            <label htmlFor="licenseNo">Pharmacist License Number</label>
                            <input type="text" id="licenseNo" name="licenseNo" value={details.licenseNo} onChange={handleChange} required />
                        </div>
                        <div className="input-row required-field">
                            <label htmlFor="licenseExpiryDate">License Expiry Date</label>
                            <input type="date" id="licenseExpiryDate" name="licenseExpiryDate" value={details.licenseExpiryDate} onChange={handleChange} required />
                        </div>
                        <div className="input-row">
                            <label htmlFor="taxId">Tax ID (if applicable)</label>
                            <input type="text" id="taxId" name="taxId" value={details.taxId} onChange={handleChange} />
                        </div>

                        {/* 🏢 Pharmacy Address */}
                        <h3>🏢 Pharmacy Address</h3>
                        <div className="input-row required-field">
                            <label htmlFor="address">Street Address</label>
                            <input type="text" id="address" name="address" value={details.address} onChange={handleChange} required />
                        </div>
                        <div className="input-row required-field">
                            <label htmlFor="city">City</label>
                            <input type="text" id="city" name="city" value={details.city} onChange={handleChange} required />
                        </div>
                        <div className="input-row required-field">
                            <label htmlFor="province">District / Province</label>
                            <input type="text" id="province" name="province" value={details.province} onChange={handleChange} required />
                        </div>
                        <div className="input-row required-field">
                            <label htmlFor="postalCode">Postal Code</label>
                            <input type="text" id="postalCode" name="postalCode" value={details.postalCode} onChange={handleChange} required />
                        </div>

                        {/* 📞 Contact Details */}
                        <h3>📞 Contact Details</h3>
                        <div className="input-row required-field">
                            <label htmlFor="officialEmail">Official Email (for notifications)</label>
                            <input type="email" id="officialEmail" name="officialEmail" value={details.officialEmail} onChange={handleChange} required placeholder="Official Email" />
                        </div>
                        <div className="input-row required-field">
                            <label htmlFor="phone">Phone Number / Hotline</label>
                            <input type="text" id="phone" name="phone" value={details.phone} onChange={handleChange} required />
                        </div>
                        <div className="input-row">
                            <label htmlFor="whatsapp">WhatsApp (optional)</label>
                            <input type="text" id="whatsapp" name="whatsapp" value={details.whatsapp} onChange={handleChange} />
                        </div>

                        {/* 🕒 Business Operation Details */}
                        <h3>🕒 Business Operation Details</h3>
                        <div className="input-row required-field" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div style={{ flex: 1, marginRight: '10px' }}>
                                <label htmlFor="openingTime">Opening Time</label>
                                <input type="time" id="openingTime" name="openingTime" value={details.openingTime} onChange={handleChange} required />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label htmlFor="closingTime">Closing Time</label>
                                <input type="time" id="closingTime" name="closingTime" value={details.closingTime} onChange={handleChange} required />
                            </div>
                        </div>
                        
                        <div className="input-row required-field">
                            <label>Operating Days</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                {operationDaysOptions.map(day => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => handleDayToggle(day)}
                                        style={{
                                            padding: '8px 12px',
                                            border: `1px solid ${details.operatingDays.includes(day) ? '#18D23A' : '#ccc'}`,
                                            borderRadius: '5px',
                                            backgroundColor: details.operatingDays.includes(day) ? '#e0ffe0' : 'white',
                                            cursor: 'pointer',
                                            color: '#333'
                                        }}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="input-row required-field" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <label htmlFor="deliverySupport" style={{ flex: 1 }}>Delivery Support</label>
                            <select id="deliverySupport" name="deliverySupport" value={details.deliverySupport} onChange={handleChange} style={{ flex: 1, padding: '10px', borderRadius: '8px' }} required>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                        
                        {details.deliverySupport === 'Yes' && (
                            <div className="input-row required-field">
                                <label htmlFor="deliveryRange">Delivery Range (km)</label>
                                <input type="number" id="deliveryRange" name="deliveryRange" value={details.deliveryRange} onChange={handleChange} placeholder="Maximum delivery distance in km" required />
                            </div>
                        )}

                        {/* ⭐⭐⭐ ADDED — LOCATION SECTION ⭐⭐⭐ */}
                        <h3>📍 Pharmacy Location</h3>

                        <div className="input-row required-field">
                            <label htmlFor="latitude">Latitude</label>
                            <input
                                type="text"
                                id="latitude"
                                name="latitude"
                                value={details.latitude}
                                onChange={handleChange}
                                required
                                placeholder="Enter or auto-detect latitude"
                            />
                        </div>

                        <div className="input-row required-field">
                            <label htmlFor="longitude">Longitude</label>
                            <input
                                type="text"
                                id="longitude"
                                name="longitude"
                                value={details.longitude}
                                onChange={handleChange}
                                required
                                placeholder="Enter or auto-detect longitude"
                            />
                        </div>

                        <button
                            type="button"
                            style={{
                                padding: "10px",
                                width: "100%",
                                borderRadius: "8px",
                                backgroundColor: "#0d6efd",
                                color: "white",
                                cursor: "pointer",
                                marginBottom: "15px",
                                fontWeight: "bold"
                            }}
                            onClick={detectMyLocation}
                        >
                            📌 Detect My Current Location
                        </button>

                        {/* 💳 Payment Setup */}
                        <h3>💳 Payment Setup (Partner Pharmacies)</h3>
                        <div className="input-row">
                            <label htmlFor="bankAccountName">Bank Account Name</label>
                            <input type="text" id="bankAccountName" name="bankAccountName" value={details.bankAccountName} onChange={handleChange} />
                        </div>
                        <div className="input-row">
                            <label htmlFor="bankAccountNumber">Bank Account Number</label>
                            <input type="text" id="bankAccountNumber" name="bankAccountNumber" value={details.bankAccountNumber} onChange={handleChange} />
                        </div>
                        <div className="input-row">
                            <label htmlFor="bankName">Bank Name</label>
                            <input type="text" id="bankName" name="bankName" value={details.bankName} onChange={handleChange} />
                        </div>
                        <div className="input-row">
                            <label htmlFor="branch">Branch</label>
                            <input type="text" id="branch" name="branch" value={details.branch} onChange={handleChange} />
                        </div>
                        <div className="input-row">
                            <label htmlFor="paymentFrequency">Payment Frequency</label>
                            <select id="paymentFrequency" name="paymentFrequency" value={details.paymentFrequency} onChange={handleChange} style={{ width: '100%', padding: '12px', borderRadius: '8px' }}>
                                <option value="Daily">Daily</option>
                                <option value="Weekly">Weekly</option>
                                <option value="Monthly">Monthly</option>
                            </select>
                        </div>

                        {/* 📸 Document Uploads */}
                        <h3>📸 Document Uploads</h3>
                        <FileUploadRow name="regCertificate" label="Pharmacy Registration Certificate (PDF/JPG)" />
                        <FileUploadRow name="pharmacistLicenseCopy" label="Pharmacist License Copy (PDF/JPG)" />
                        <FileUploadRow name="frontPhoto" label="Front Photo of Pharmacy (JPG)" />
                        <FileUploadRow name="ownerID" label="Owner ID / NIC (PDF/JPG)" />
                        
                        {/* 🔍 Service Options */}
                        <h3>🔍 Pharmacy Service Options</h3>
                        <div className="service-options">
                            {serviceOptionsList.map(service => (
                                <div key={service.key} className="service-item">
                                    <input 
                                        type="checkbox" 
                                        id={service.key} 
                                        checked={details.services[service.key]} 
                                        onChange={() => handleServiceChange(service.key)} 
                                    />
                                    <label htmlFor={service.key}>{service.label}</label>
                                </div>
                            ))}
                        </div>

                        {/* SUBMIT */}
                        <button type="submit" className="register-btn primary-btn">
                            Complete Registration
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PharmacyDetailsCollectionPage;
