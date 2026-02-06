import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/PortalPages.css';

const HRPortalPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="portal-page">
      <div className="portal-hero">
        <div className="title">HR Management</div>
        <div className="subtitle">Manage employees, departments, and profiles</div>
      </div>

      <div className="portal-content">
        <div className="portal-card">
          <h3>Quick Actions</h3>
          <div className="portal-actions">
            <button className="portal-btn" type="button">View Employees</button>
            <button className="portal-btn" type="button">Departments</button>
            <button className="portal-btn" type="button" onClick={() => navigate('/hr/health-check')}>🏥 Health Check Management</button>
            <button className="portal-btn secondary" type="button" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
          </div>
        </div>

        <div className="portal-card">
          <h3>Overview</h3>
          <div className="portal-grid">
            <div className="portal-tile">
              <div className="tile-title">Employee Directory</div>
              <div>Browse all HR employees and roles.</div>
            </div>
            <div className="portal-tile">
              <div className="tile-title">Departments</div>
              <div>View department details and assignments.</div>
            </div>
            <div className="portal-tile">
              <div className="tile-title">HR Requests</div>
              <div>Manage leave requests and approvals.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="portal-footer">© 2026 Unified Portal</div>
    </div>
  );
};

export default HRPortalPage;
