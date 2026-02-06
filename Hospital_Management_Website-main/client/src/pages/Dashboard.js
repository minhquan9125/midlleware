import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Users, Hospital, BarChart3, Loader } from 'lucide-react';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, services, logout, isAuthenticated } = useAuth();
  const [activeService, setActiveService] = useState('overview');
  const [syncStatus, setSyncStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleServiceClick = (service) => {
    if (!services.includes(service)) {
      return;
    }

    // Open services in new windows
    if (service === 'hr') {
      window.open('http://localhost:3001', '_blank');
      return;
    }

    if (service === 'hospital') {
      window.open('http://localhost:3000', '_blank');
      return;
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      // In production, call sync API
      // const response = await syncAPI.syncHRToHospital();
      setSyncStatus({
        message: 'Sync completed successfully',
        type: 'success',
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (error) {
      setSyncStatus({
        message: 'Sync failed',
        type: 'error',
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="portal-title">🏥 Unified Portal</h1>
          </div>

          <div className="user-section">
            <div className="user-info">
              <p className="user-name">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="user-email">{user?.email}</p>
              <p className="user-role">{user?.role || 'Employee'}</p>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Sidebar Navigation */}
        <aside className="sidebar">
          <nav className="nav-menu">
            <button
              className={`nav-item ${activeService === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveService('overview')}
            >
              <BarChart3 size={20} />
              <span>Overview</span>
            </button>

            {services.includes('hr') && (
              <button
                className={`nav-item ${activeService === 'hr' ? 'active' : ''}`}
                onClick={() => handleServiceClick('hr')}
              >
                <Users size={20} />
                <span>HR Management</span>
              </button>
            )}

            {services.includes('hospital') && (
              <button
                className={`nav-item ${activeService === 'hospital' ? 'active' : ''}`}
                onClick={() => handleServiceClick('hospital')}
              >
                <Hospital size={20} />
                <span>Hospital</span>
              </button>
            )}

          </nav>
        </aside>

        {/* Main Content Section */}
        <section className="content-area">
          {/* Overview Section */}
          {activeService === 'overview' && (
            <div className="overview">
              <h2>Welcome, {user?.firstName}! 👋</h2>
              <p className="subtitle">Select a service to get started</p>

              {/* Service Cards */}
              <div className="services-grid">
                {/* HR Card */}
                {services.includes('hr') && (
                  <div 
                    className="service-card hr-card"
                    onClick={() => handleServiceClick('hr')}
                  >
                    <div className="card-header">
                      <Users size={40} />
                      <h3>HR Management</h3>
                    </div>
                    <div className="card-content">
                      <p>Manage your profile, view employees, and manage departments</p>
                      <ul className="features-list">
                        <li>👤 Manage Profile</li>
                        <li>👥 View Employees</li>
                        <li>🏢 Department Info</li>
                      </ul>
                    </div>
                    <button className="card-button" type="button">Access HR →</button>
                  </div>
                )}

                {/* Hospital Card */}
                {services.includes('hospital') && (
                  <div 
                    className="service-card hospital-card"
                    onClick={() => handleServiceClick('hospital')}
                  >
                    <div className="card-header">
                      <Hospital size={40} />
                      <h3>Hospital</h3>
                    </div>
                    <div className="card-content">
                      <p>Manage health checkups, book appointments, and view medical records</p>
                      <ul className="features-list">
                        <li>🏥 Book Health Checkup</li>
                        <li>📅 View Schedule</li>
                        <li>📋 Medical Records</li>
                      </ul>
                    </div>
                    <button className="card-button" type="button">Access Hospital →</button>
                  </div>
                )}
              </div>

              {/* Sync Section */}
              <div className="sync-section">
                <h3>📊 Integrated Dashboard</h3>
                <p>View comprehensive HIS-HRM health check analytics</p>
                
                <button 
                  className="sync-button"
                  onClick={() => navigate('/integrated-dashboard')}
                  style={{ marginTop: '1rem' }}
                >
                  📊 Open Integrated Dashboard
                </button>
              </div>

              <div className="sync-section">
                <h3>Data Sync</h3>
                <p>Synchronize HR data with Hospital system</p>
                
                {syncStatus && (
                  <div className={`sync-status ${syncStatus.type}`}>
                    <p>{syncStatus.message}</p>
                    <small>{syncStatus.timestamp}</small>
                  </div>
                )}

                <button 
                  className="sync-button"
                  onClick={handleSync}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader size={20} className="spinner-small" />
                      Syncing...
                    </>
                  ) : (
                    '🔄 Sync HR to Hospital'
                  )}
                </button>
              </div>

              {/* Stats */}
              <div className="stats-section">
                <h3>Quick Stats</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <h4>Department</h4>
                    <p className="stat-value">{user?.department || 'N/A'}</p>
                  </div>
                  <div className="stat-card">
                    <h4>Role</h4>
                    <p className="stat-value">{user?.role || 'Employee'}</p>
                  </div>
                  <div className="stat-card">
                    <h4>Active Services</h4>
                    <p className="stat-value">{services.length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* HR Service */}
          {activeService === 'hr' && services.includes('hr') && (
            <div className="service-content">
              <h2>HR Management</h2>
              <p>HR functionality coming soon...</p>
              <p>Department: {user?.department}</p>
            </div>
          )}
            <div className="service-content">
              <h2>Hospital - Employee Health Management</h2>
              <p>Manage health checkups and medical records for employees.</p>
              <p>Integrated with HR system for health check scheduling.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
