    // src/App.jsx

    import React from 'react';
    import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

    // Import all required components
    import LandingPage from './LandingPage/LandingPage';
    import PatientRegistrationPage from './RegistrationPage/PatientRegistrationPage';
    import PharmacyRegistrationPage from './RegistrationPage/PharmacyRegistrationPage';
    import PatientDetailCollection from './DetailsCollection/PatientDetailsCollection';
    import PharmacyDetailCollection from './DetailsCollection/PharmacyDetailsCollection';

    // Import dashboard pages
    import PatientDashboard from './Components/Dashboard/PatientDashboard';
    import PharmacyDashboard from './Components/Dashboard/PharmacyDashboard';
    import AdminDashboard from './Components/Dashboard/AdminDashboard';
    import DoctorDashboard from './Components/Dashboard/DoctorDashboard';

    const App = () => {
        return (
            <Router>
                <Routes>
                    {/* 1. Landing Page (Role Selection) */}
                    <Route path="/" element={<LandingPage />} />
                    
                    {/* 2. Registration Pages */}
                    <Route path="/register-patient" element={<PatientRegistrationPage />} />
                    <Route path="/register-pharmacy" element={<PharmacyRegistrationPage />} />

                    {/* 3. Detail Collection Pages */}
                    <Route path="/patient-details" element={<PatientDetailCollection />} />
                    <Route path="/pharmacy-details" element={<PharmacyDetailCollection />} />

                    {/* 4. Dashboard Pages */}
                    <Route path="/PatientDashboard" element={<PatientDashboard />} />
                    <Route path="/PharmacyDashboard" element={<PharmacyDashboard />} />
                    <Route path="/AdminDashboard" element={<AdminDashboard />} />
                    <Route path="/DoctorDashboard" element={<DoctorDashboard />} />
                </Routes>
            </Router>
        );
    };

    export default App;
