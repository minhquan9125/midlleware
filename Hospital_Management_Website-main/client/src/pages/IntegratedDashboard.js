/**
 * Integrated Dashboard Overview
 * Shows statistics and quick access for both HIS and HRM
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Hospital,
  Calendar,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  Clock,
  FileText,
  BarChart3
} from 'lucide-react';
import '../styles/integrated-dashboard.css';

const IntegratedDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    hr: {
      total_employees: 150,
      active_campaigns: 2,
      pending_checks: 33,
      completed_this_month: 12
    },
    hospital: {
      total_appointments: 45,
      completed_today: 5,
      pending_today: 3,
      total_doctors: 12
    },
    health_status: {
      type_1: 85,
      type_2: 10,
      type_3: 3,
      type_4: 2
    }
  });

  const [recentActivities, setRecentActivities] = useState([
    {
      id: 1,
      type: 'health_check',
      message: 'Nguyễn Văn A completed health check - Type 1',
      timestamp: '2 hours ago',
      icon: CheckCircle,
      color: '#2ecc71'
    },
    {
      id: 2,
      type: 'campaign',
      message: 'New campaign "Q1 2026 Health Check" created',
      timestamp: '5 hours ago',
      icon: Calendar,
      color: '#3498db'
    },
    {
      id: 3,
      type: 'sync',
      message: 'Synced 15 employees to Hospital system',
      timestamp: '1 day ago',
      icon: Activity,
      color: '#9b59b6'
    },
    {
      id: 4,
      type: 'alert',
      message: 'Trần Thị B requires work restrictions',
      timestamp: '1 day ago',
      icon: AlertCircle,
      color: '#f39c12'
    }
  ]);

  return (
    <div className="integrated-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>📊 Integrated Dashboard</h1>
          <p>HIS-HRM Health Check Management Overview</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => navigate('/hr/health-check')}>
            HR Management
          </button>
          <button className="btn-primary" onClick={() => navigate('/doctor/health-check')}>
            Doctor Portal
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {/* HR Stats */}
        <div className="stat-card hr-card">
          <div className="stat-icon">
            <Users size={32} />
          </div>
          <div className="stat-content">
            <h3>Total Employees</h3>
            <p className="stat-value">{stats.hr.total_employees}</p>
            <span className="stat-change positive">
              <TrendingUp size={16} /> +5 this month
            </span>
          </div>
        </div>

        <div className="stat-card campaign-card">
          <div className="stat-icon">
            <Calendar size={32} />
          </div>
          <div className="stat-content">
            <h3>Active Campaigns</h3>
            <p className="stat-value">{stats.hr.active_campaigns}</p>
            <span className="stat-label">{stats.hr.pending_checks} employees pending</span>
          </div>
        </div>

        <div className="stat-card hospital-card">
          <div className="stat-icon">
            <Hospital size={32} />
          </div>
          <div className="stat-content">
            <h3>Total Appointments</h3>
            <p className="stat-value">{stats.hospital.total_appointments}</p>
            <span className="stat-label">{stats.hospital.pending_today} pending today</span>
          </div>
        </div>

        <div className="stat-card success-card">
          <div className="stat-icon">
            <CheckCircle size={32} />
          </div>
          <div className="stat-content">
            <h3>Completed This Month</h3>
            <p className="stat-value">{stats.hr.completed_this_month}</p>
            <span className="stat-change positive">
              <TrendingUp size={16} /> +40% vs last month
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="content-grid">
        {/* Health Status Distribution */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>🏥 Health Status Distribution</h2>
            <button className="btn-link">View All</button>
          </div>
          <div className="health-status-chart">
            <div className="status-item">
              <div className="status-bar" style={{ width: `${(stats.health_status.type_1 / 100) * 100}%`, background: '#2ecc71' }}></div>
              <div className="status-info">
                <span className="status-label">✅ Type 1 - Healthy</span>
                <span className="status-value">{stats.health_status.type_1}%</span>
              </div>
            </div>
            <div className="status-item">
              <div className="status-bar" style={{ width: `${(stats.health_status.type_2 / 100) * 100}%`, background: '#f39c12' }}></div>
              <div className="status-info">
                <span className="status-label">⚠️ Type 2 - Minor Issues</span>
                <span className="status-value">{stats.health_status.type_2}%</span>
              </div>
            </div>
            <div className="status-item">
              <div className="status-bar" style={{ width: `${(stats.health_status.type_3 / 100) * 100}%`, background: '#e67e22' }}></div>
              <div className="status-info">
                <span className="status-label">🔔 Type 3 - Monitoring</span>
                <span className="status-value">{stats.health_status.type_3}%</span>
              </div>
            </div>
            <div className="status-item">
              <div className="status-bar" style={{ width: `${(stats.health_status.type_4 / 100) * 100}%`, background: '#e74c3c' }}></div>
              <div className="status-info">
                <span className="status-label">❌ Type 4 - Restricted</span>
                <span className="status-value">{stats.health_status.type_4}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>⏱️ Recent Activities</h2>
            <button className="btn-link">View All</button>
          </div>
          <div className="activity-list">
            {recentActivities.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="activity-item">
                  <div className="activity-icon" style={{ background: `${activity.color}20`, color: activity.color }}>
                    <Icon size={20} />
                  </div>
                  <div className="activity-content">
                    <p className="activity-message">{activity.message}</p>
                    <span className="activity-time">
                      <Clock size={14} /> {activity.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-card">
        <div className="card-header">
          <h2>🚀 Quick Actions</h2>
        </div>
        <div className="quick-actions-grid">
          <button className="action-card" onClick={() => navigate('/hr/health-check')}>
            <Calendar size={24} />
            <h3>Create Campaign</h3>
            <p>Schedule new health check</p>
          </button>
          <button className="action-card" onClick={() => navigate('/doctor/health-check')}>
            <Activity size={24} />
            <h3>View Schedule</h3>
            <p>Today's appointments</p>
          </button>
          <button className="action-card" onClick={() => navigate('/hr/health-check')}>
            <FileText size={24} />
            <h3>View Results</h3>
            <p>Employee health reports</p>
          </button>
          <button className="action-card" onClick={() => navigate('/hr/health-check')}>
            <BarChart3 size={24} />
            <h3>Analytics</h3>
            <p>Health trends & insights</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntegratedDashboard;
