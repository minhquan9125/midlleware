import React, { useState, useEffect } from "react";
import "./components/styles.css";
import "./styles/health-check.css";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";

// Import pages
import HomePage from "./pages/HomePage";
import PharmacyPage from "./pages/PharmacyPage";
import LabsPage from "./pages/LabsPage";
import CheckupPage from "./pages/CheckupPage";
import SurgeryPage from "./pages/SurgeryPage";
import NotFoundPage from "./pages/NotFoundPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import HRPortalPage from "./pages/HRPortalPage";
import HospitalPortalPage from "./pages/HospitalPortalPage";
import HotelPortalPage from "./pages/HotelPortalPage";
import HealthCheckPage from "./pages/HealthCheckPage";
import HRHealthCheckPage from "./pages/HRHealthCheckPage";
import IntegratedDashboard from "./pages/IntegratedDashboard";
import EmergencyPanel from "./components/EmergencyPanel";
import ForgotPassword from "./pages/ForgotPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import MedicineListing from "./pages/Medicine";

// Protected Route Component for Unified Portal
const PortalProtectedRoute = ({ children }) => {
  const { isAuthenticated } = React.useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
  }, [darkMode]);

  const toggleEmergencyPanel = () => {
    setIsEmergencyOpen(!isEmergencyOpen);
  };

  return (
    <AuthProvider>
      <Routes>
        {/* Unified Portal Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/portal/hr" element={<HRPortalPage />} />
        <Route path="/portal/hospital" element={<HospitalPortalPage />} />
        <Route path="/portal/hotel" element={<HotelPortalPage />} />
        <Route path="/doctor/health-check" element={<HealthCheckPage />} />
        <Route path="/hr/health-check" element={<HRHealthCheckPage />} />
        <Route path="/integrated-dashboard" element={<IntegratedDashboard />} />
        
        {/* Hospital Routes (existing) */}
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/services/pharmacy" element={<PharmacyPage />} />
        <Route path="/services/pharmacy/medicines" element={<MedicineListing />} />
        <Route path="/services/labs-diagnostics" element={<LabsPage />} />
        <Route path="/services/checkup" element={<CheckupPage />} />
        <Route path="/services/surgery" element={<SurgeryPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* Fixed Emergency Button */}
      <button
        className="fixed-emergency-btn"
        onClick={toggleEmergencyPanel}
        aria-label="Emergency contacts"
      >
        🚨 Emergency
      </button>

      <EmergencyPanel
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />
    </AuthProvider>
  );
}

export default App;
