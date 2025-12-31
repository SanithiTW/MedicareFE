import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LandingPage from './LandingPage/LandingPage';
import PatientRegistrationPage from './RegistrationPage/PatientRegistrationPage';
import PharmacyRegistrationPage from './RegistrationPage/PharmacyRegistrationPage';
import PatientDetailCollection from './DetailsCollection/PatientDetailsCollection';
import PharmacyDetailCollection from './DetailsCollection/PharmacyDetailsCollection';
import PatientProfile from './patientProfile/PatientProfile';

import PatientDashboard from './Components/Dashboard/PatientDashboard';
import PharmacyDashboard from './Components/Dashboard/PharmacyDashboard';
import AdminDashboard from './Components/Dashboard/AdminDashboard';
import DoctorDashboard from './Components/Dashboard/DoctorDashboard';

import VerifyEmail from './VerifyEmail/VerifyEmail';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/register-patient" element={<PatientRegistrationPage />} />
        <Route path="/register-pharmacy" element={<PharmacyRegistrationPage />} />

        <Route path="/patient-details" element={<PatientDetailCollection />} />
        <Route path="/pharmacy-details" element={<PharmacyDetailCollection />} />

        <Route path="/PatientDashboard" element={<PatientDashboard />} />
        <Route path="/PharmacyDashboard" element={<PharmacyDashboard />} />
        <Route path="/AdminDashboard" element={<AdminDashboard />} />
        <Route path="/DoctorDashboard" element={<DoctorDashboard />} />

        <Route path="/VerifyEmail" element={<VerifyEmail />} />
        <Route path="/patientProfile" element={<PatientProfile />} />
      </Routes>
    </Router>
  );
};

export default App;
