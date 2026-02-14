import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from '../assets/Logo.jpeg';
import UserIcon from '../assets/user.png'; 
import '../RegistrationFormsCommon.css';
import { supabase } from "../supabase";   
import API from "../api/api";

// Firebase imports
import { auth } from "../Firebase"; 
import { getAuth, onAuthStateChanged, sendEmailVerification } from "firebase/auth";


const PatientDetailsCollectionPage = () => {

    
  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("User logged in:", user.email);
    } else {
      console.log("No user logged in");
    }
  });

  return () => unsubscribe();
}, []);


    const navigate = useNavigate();
    const location = useLocation();
    const nameRef = useRef(null);
    const emailRef = useRef(null);

    const initialData = location.state?.userData || {}; 

    const [loading, setLoading] = useState(false);

    
    
    const [edit, setEdit] = useState({
        name: false,
        email: false,
    });
    
    const initialFamilyMember = { name: '', relation: '', dob: '' };

    const [details, setDetails] = useState({
        name: initialData.name || '',
        email: initialData.email || '',
        password: initialData.password || '', 
        phone: '',
        address: '',
        city: '',
        province: '',
        postalCode: '',
        dob: '',
        gender: '',
        nic: '',
        medicalConditions: '',
        allergies: '',
        chronicDiseases: '',
        currentMedications: '',
        bloodGroup: '',
        deliveryAddress: '',
        altContact: '',
        profilePhoto: null,           
        profilePhotoFile: null,       
        profilePhotoPreview: null,    

        description: '',
        
        familyMembers: [
            { ...initialFamilyMember, id: Date.now() + 1 }, 
        ]
    });

    const handleChange = (e) => {
        setDetails({ ...details, [e.target.name]: e.target.value });
    };

    const handleEditToggle = (field) => {
  setEdit(prev => ({ ...prev, [field]: !prev[field] }));
  setTimeout(() => {  // wait for render
    if(field === 'name') nameRef.current?.focus();
    if(field === 'email') emailRef.current?.focus();
  }, 0);
};

    const handlePasswordEdit = () => {
        alert("Password change functionality goes here! (New Password modal/fields)");
    };

    const handleFamilyChange = (id, field, value) => {
        setDetails(prev => ({
            ...prev,
            familyMembers: prev.familyMembers.map(member => 
                member.id === id ? { ...member, [field]: value } : member
            )
        }));
    };

    const addFamilyMember = () => {
        if (details.familyMembers.length < 3) {
            setDetails(prev => ({
                ...prev,
                familyMembers: [
                    ...prev.familyMembers,
                    { ...initialFamilyMember, id: Date.now() + Math.random() }
                ]
            }));
        }
    };

    const deleteFamilyMember = (id) => {
        setDetails(prev => ({
            ...prev,
            familyMembers: prev.familyMembers.filter(member => member.id !== id)
        }));
    };

   
const handlePhotoSelect = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Preview the image
  const previewUrl = URL.createObjectURL(file);

  setDetails(prev => ({
    ...prev,
    profilePhotoFile: file,       // Save file locally
    profilePhotoPreview: previewUrl
  }));
};


const handleFinalRegistration = async (e) => {
  e.preventDefault();

  setLoading(true);
  const finalData = { ...initialData, ...details };
  const uid = localStorage.getItem("patient_uid") || finalData.uid;
  if (!uid) {
    alert("Missing UID. Complete step 1 first.");
    return;
  }

  try {
    // 1️⃣ Upload profile photo if selected
    if (details.profilePhotoFile) {
      const file = details.profilePhotoFile;
      const fileName = `patient_${uid}_${Date.now()}.${file.name.split('.').pop()}`;

      const { data, error } = await supabase.storage
        .from("patient-profile-pics")
        .upload(fileName, file);

      if (error) {
        console.error(error);
        alert("Photo upload failed!");
        return;
      }

      const { data: urlData } = supabase.storage
        .from("patient-profile-pics")
        .getPublicUrl(fileName);

      finalData.profilePhoto = urlData.publicUrl; // Set uploaded URL
    }

    // 2️⃣ Update `basic` node if name/email changed
    const basicUpdates = {};
    if (details.name && details.name !== initialData.name) basicUpdates.name = details.name;
    if (details.email && details.email !== initialData.email) basicUpdates.email = details.email;

    if (Object.keys(basicUpdates).length > 0) {
      await API.patch(`/patient/${uid}/update-basic`, basicUpdates);
    }

    // 3️⃣ If email changed, update Firebase Auth email
    if (details.email && details.email !== initialData.email) {
      await API.patch(`/patient/${uid}/update-email`, { email: details.email });
    }

    // 4️⃣ Remove temporary file references
    delete finalData.profilePhotoFile;
    delete finalData.profilePhotoPreview;



// 5️⃣ Save complete profile
await API.post(`/patient/${uid}/complete`, finalData);

// 6️⃣ Send Firebase verification email
try {
  const auth = getAuth();
  const user = auth.currentUser;

  if (auth.currentUser) {
    await sendEmailVerification(user);
    alert("🎉 Registration Complete! Verification email sent.");
  } else {
    alert("Registration complete, but could not send verification email.");
  }
} catch (err) {
  console.error("Email verification error:", err);
}

// 7️⃣ Navigate to verify-email page
navigate('/VerifyEmail', { state: { email: details.email, uid } });




  } catch (err) {
    console.error("patient complete error:", err);
    const msg = err?.response?.data?.error || err.message;
    alert("Registration failed: " + msg);
  }

  finally {
    setLoading(false); // ✅ stop loading
  }
};

    const FamilyMemberInputs = ({ member, index }) => (
        <div key={member.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
            {details.familyMembers.length > 0 && (
                 <button 
                    type="button" 
                    className="delete-btn"
                    onClick={() => deleteFamilyMember(member.id)}
                >
                    Delete
                </button>
            )}
            <h4 style={{ color: '#0C6C1E', margin: '0 0 10px 0', fontSize: '1.1rem' }}>Family Member {index + 1}</h4>
            <div className="input-row">
                <label htmlFor={`family_name_${member.id}`}>Full Name</label>
                <input type="text" id={`family_name_${member.id}`} value={member.name} onChange={(e) => handleFamilyChange(member.id, 'name', e.target.value)} />
            </div>
            <div className="input-row">
                <label htmlFor={`family_relation_${member.id}`}>Relation</label>
                <input type="text" id={`family_relation_${member.id}`} value={member.relation} onChange={(e) => handleFamilyChange(member.id, 'relation', e.target.value)} />
            </div>
            <div className="input-row">
                <label htmlFor={`family_dob_${member.id}`}>Date of Birth</label>
                <input type="date" id={`family_dob_${member.id}`} value={member.dob} onChange={(e) => handleFamilyChange(member.id, 'dob', e.target.value)} />
            </div>
            <div style={{ clear: 'both' }}></div> {/* Clear float */}
        </div>
    );


    return (
        <div className="registration-page details-collection-page">
            <div className="form-wrapper center-wrapper">
                <div className="details-container patient-register-bg">
                    <div className="header-logo">
                        <img src={Logo} alt="MediCare Logo" className="logo-img"/>
                    </div>
                    
                    <h3>Patient Detail Collection</h3>

                    <form onSubmit={handleFinalRegistration}>

                        {/* Profile Photo Section (Optional) */}
                        <div className="profile-section">
                            <div className="profile-image-wrapper">
                                <img src={details.profilePhotoPreview || UserIcon} alt="Profile" 
                                />

                                <label htmlFor="profilePhotoInput" className="camera-icon-overlay">
                                    &#128247; 
                                </label>
                                <input 
                                    type="file" 
                                    id="profilePhotoInput" 
                                    name="profilePhoto" 
                                    accept="image/*" 
                                    style={{ display: 'none' }} 
                                    onChange={handlePhotoSelect}
                                />
                            </div>
                            <small>Profile Photo </small>
                        </div>
                        
                        {/* 1. Basic Information (Editable, Pre-filled, Not required for submission) */}
                        <h3 style={{ marginBottom: '15px' }}>✅ Basic Information</h3>
                        <div className="input-row">
                            <label htmlFor="name">Full Name</label>
                            <input 
                                ref={nameRef} 
                                type="text" 
                                id="name" 
                                name="name" 
                                value={details.name} 
                                onChange={handleChange} 
                                readOnly={!edit.name}
                                className={!edit.name ? 'display-input' : ''}
                            />
                            <span className="edit-icon" onClick={() => handleEditToggle('name')}>&#9998;</span> 
                        </div>

                        <div className="input-row">
                            <label htmlFor="email">Email Address</label>
                            <input
                                ref={nameRef}  
                                type="email" 
                                id="email" 
                                name="email" 
                                value={details.email} 
                                onChange={handleChange} 
                                readOnly={!edit.email}
                                className={!edit.email ? 'display-input' : ''}
                            />
                            <span className="edit-icon" onClick={() => handleEditToggle('email')}>&#9998;</span>
                            
                        </div>
                        
                        <div className="input-row">
                            <label>Password</label>
                            <input 
                                type="password" 
                                value="********" 
                                readOnly 
                                className="display-input"
                            />
                            <button type="button" className="password-edit-btn" onClick={handlePasswordEdit}>
                                Change Password
                            </button>
                        </div>
                        
                        <div className="input-row required-field">
                            <label htmlFor="phone">Phone Number</label>
                            <input type="text" id="phone" name="phone" value={details.phone} onChange={handleChange} placeholder="Contact Number (OTP/Verification)" required />
                        </div>
                        
                        <div className="input-row">
                            <label htmlFor="description">Description </label>
                            <textarea id="description" name="description" value={details.description} onChange={handleChange} placeholder="Tell us more about yourself..." rows="3" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
                        </div>

                        {/* 2. Address Details (Optional) */}
                        <h3>🏠 Address Details</h3>
                        <div className="input-row">
                            <label htmlFor="address">Street Address</label>
                            <input type="text" id="address" name="address" value={details.address} onChange={handleChange} />
                        </div>
                        <div className="input-row">
                            <label htmlFor="city">City</label>
                            <input type="text" id="city" name="city" value={details.city} onChange={handleChange} />
                        </div>
                        <div className="input-row">
                            <label htmlFor="province">District / Province</label>
                            <input type="text" id="province" name="province" value={details.province} onChange={handleChange} />
                        </div>
                        <div className="input-row">
                            <label htmlFor="postalCode">Postal Code</label>
                            <input type="text" id="postalCode" name="postalCode" value={details.postalCode} onChange={handleChange} />
                        </div>

                        {/* 3. Identity / DOB (Optional) */}
                        <h3>🆔 Identity / DOB</h3>
                        <div className="input-row">
                            <label htmlFor="dob">Date of Birth</label>
                            <input type="date" id="dob" name="dob" value={details.dob} onChange={handleChange} />
                        </div>
                        <div className="input-row">
                            <label htmlFor="gender">Gender</label>
                            <select id="gender" name="gender" value={details.gender} onChange={handleChange} style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '8px' }}>
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="input-row">
                            <label htmlFor="nic">NIC </label>
                            <input type="text" id="nic" name="nic" value={details.nic} onChange={handleChange} placeholder="National Identity Card" />
                        </div>
                        
                        {/* 4. Health Profile (Optional) */}
                        <h3>🩺 Health Profile</h3>
                        <div className="input-row">
                            <label htmlFor="medicalConditions">Existing Medical Conditions</label>
                            <input type="text" id="medicalConditions" name="medicalConditions" value={details.medicalConditions} onChange={handleChange} placeholder="e.g., Asthma, High BP" />
                        </div>
                        <div className="input-row">
                            <label htmlFor="allergies">Allergies (Drug/Food)</label>
                            <input type="text" id="allergies" name="allergies" value={details.allergies} onChange={handleChange} placeholder="e.g., Penicillin, Peanuts" />
                        </div>
                        <div className="input-row">
                            <label htmlFor="chronicDiseases">Chronic Diseases</label>
                            <input type="text" id="chronicDiseases" name="chronicDiseases" value={details.chronicDiseases} onChange={handleChange} placeholder="e.g., Diabetes, Chronic Kidney Disease" />
                        </div>
                        <div className="input-row">
                            <label htmlFor="currentMedications">Current Medications</label>
                            <input type="text" id="currentMedications" name="currentMedications" value={details.currentMedications} onChange={handleChange} placeholder="e.g., Metformin, Lisinopril" />
                        </div>
                        <div className="input-row">
                            <label htmlFor="bloodGroup">Blood Group</label>
                            <input type="text" id="bloodGroup" name="bloodGroup" value={details.bloodGroup} onChange={handleChange} placeholder="e.g., A+, O-" />
                        </div>

                        {/* 5. Family Members */}
                        <h3>👨‍👩‍👧‍👦 Family Members (Up to 3)</h3>
                        {details.familyMembers.map((member, index) => (
                            <FamilyMemberInputs member={member} index={index} key={member.id} />
                        ))}
                        
                        {details.familyMembers.length < 3 && (
                            <button 
                                type="button" 
                                onClick={addFamilyMember} 
                                className="password-edit-btn" 
                                style={{ marginTop: '0', marginBottom: '20px' }}>
                                + Add Family Member ({details.familyMembers.length}/3)
                            </button>
                        )}


                        {/* 6. Delivery Preferences (Optional) */}
                        <h3>📦 Delivery Preferences</h3>
                        <div className="input-row">
                            <label htmlFor="deliveryAddress">Default Delivery Address</label>
                            <input type="text" id="deliveryAddress" name="deliveryAddress" value={details.deliveryAddress} onChange={handleChange} placeholder="Same as permanent address or new address" />
                        </div>
                        <div className="input-row">
                            <label htmlFor="altContact">Alternative Contact Number</label>
                            <input type="text" id="altContact" name="altContact" value={details.altContact} onChange={handleChange} placeholder="Alternative Phone Number" />
                        </div>
                        
                        {/* FINAL REGISTER BUTTON */}
                        <button type="submit" className="register-btn primary-btn" disabled={loading}>
                            {loading ? "Registering..." : "Complete Registration"}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default PatientDetailsCollectionPage;