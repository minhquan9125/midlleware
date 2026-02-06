/**
 * HR Health Check Campaign Management
 * HR creates and manages health check campaigns for employees
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  PlusCircle,
  Send,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  Download,
  RefreshCw
} from 'lucide-react';

const HRHealthCheckPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('campaigns');
  const [campaigns, setCampaigns] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCampaignId) {
      fetchEmployees(selectedCampaignId);
      fetchResults(selectedCampaignId);
    }
  }, [selectedCampaignId]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/gateway/health-check/campaigns', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      const data = await response.json();
      if (data.success) {
        const mapped = (data.campaigns || []).map((c) => ({
          id: c.id,
          name: c.campaign_name,
          start_date: c.start_date ? new Date(c.start_date).toISOString().split('T')[0] : '',
          end_date: c.end_date ? new Date(c.end_date).toISOString().split('T')[0] : '',
          total_employees: c.total_employees || 0,
          completed: c.checked_count || 0,
          status: c.status || 'pending'
        }));
        setCampaigns(mapped);
        if (!selectedCampaignId && mapped.length > 0) {
          const active = mapped.find((c) => c.status === 'in_progress' || c.status === 'scheduled') || mapped[0];
          setSelectedCampaignId(active.id);
        }
      } else {
        setCampaigns([]);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async (campaignId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/gateway/health-check/due-employees?campaign_id=${campaignId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      const data = await response.json();
      if (data.success) {
        setEmployees((data.due_employees || []).map((e) => ({
          id: e.id,
          name: e.name,
          department: e.department,
          position: e.position || '-',
          last_check: e.last_check_date,
          status: 'due'
        })));
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async (campaignId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/gateway/health-check/results?campaign_id=${campaignId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      const data = await response.json();
      if (data.success) {
        setResults((data.results || []).map((r, idx) => ({
          id: `${r.employee_id}-${idx}`,
          employee_name: r.employee_name,
          department: r.department || '-',
          check_date: r.check_date ? new Date(r.check_date).toISOString().split('T')[0] : '-',
          health_status: r.health_status,
          restrictions: r.restrictions || [],
          doctor_conclusion: r.doctor_conclusion
        })));
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (formData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/gateway/health-check/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          campaign_name: formData.name,
          campaign_type: 'Annual',
          start_date: formData.start_date,
          end_date: formData.end_date,
          description: `Departments: ${(formData.departments || []).join(', ')}`
        })
      });
      const data = await response.json();
      if (data.success) {
        alert('✅ Campaign created successfully!');
      } else {
        alert(`Error creating campaign: ${data.message}`);
      }
      setShowCreateModal(false);
      fetchCampaigns();
    } catch (error) {
      alert('Error creating campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToHIS = async (campaignId) => {
    setLoading(true);
    try {
      const response = await fetch('/api/gateway/health-check/sync-to-his', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          campaign_id: campaignId,
          employees: employees.map((e) => ({
            id: e.id,
            name: e.name,
            department: e.department
          }))
        })
      });
      const data = await response.json();
      if (data.success) {
        alert('✅ Employees synced to Hospital system!');
        fetchCampaigns();
      } else {
        alert(`Error syncing to HIS: ${data.message}`);
      }
    } catch (error) {
      alert('Error syncing to HIS');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async (campaignId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/gateway/health-check/report?campaign_id=${campaignId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      const data = await response.json();
      if (data.success) {
        const report = data.report;
        alert(
          `Report: ${report.campaign_name}\n` +
          `Total: ${report.total_employees}\n` +
          `Checked: ${report.checked_count}\n` +
          `Pending: ${report.pending_count}\n` +
          `Completion: ${report.completion_rate}`
        );
      } else {
        alert(`Error loading report: ${data.message}`);
      }
    } catch (error) {
      alert('Error loading report');
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatusBadge = (status) => {
    const badges = {
      Type_1: { label: 'Loại 1', color: '#2ecc71', icon: '✅' },
      Type_2: { label: 'Loại 2', color: '#f39c12', icon: '⚠️' },
      Type_3: { label: 'Loại 3', color: '#e67e22', icon: '🔔' },
      Type_4: { label: 'Loại 4', color: '#e74c3c', icon: '❌' }
    };
    const badge = badges[status] || badges.Type_1;
    return (
      <span style={{ 
        background: badge.color, 
        color: 'white', 
        padding: '4px 12px', 
        borderRadius: '20px',
        fontSize: '0.85rem',
        fontWeight: '600'
      }}>
        {badge.icon} {badge.label}
      </span>
    );
  };

  return (
    <div className="health-check-container">
      <button className="btn-back" onClick={() => navigate('/portal/hr')}>
        <ArrowLeft size={20} /> Back to HR Portal
      </button>

      <div className="health-check-header">
        <h1>👥 HR Health Check Management</h1>
        <p>Manage employee health screening campaigns</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'campaigns' ? 'active' : ''}`}
          onClick={() => setActiveTab('campaigns')}
        >
          <Calendar size={18} /> Campaigns
        </button>
        <button
          className={`tab ${activeTab === 'employees' ? 'active' : ''}`}
          onClick={() => setActiveTab('employees')}
        >
          <Users size={18} /> Employees
        </button>
        <button
          className={`tab ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          <FileText size={18} /> Results
        </button>
      </div>

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="tab-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <h2>Health Check Campaigns</h2>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              <PlusCircle size={20} /> Create Campaign
            </button>
          </div>

          <div className="schedule-grid">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="schedule-card" style={{ borderLeft: `5px solid ${campaign.status === 'active' ? '#3498db' : '#95a5a6'}` }}>
                <div className="card-header">
                  <h3>{campaign.name}</h3>
                  <span className={`status-badge status-${campaign.status}`}>
                    {campaign.status}
                  </span>
                </div>
                <div className="card-body">
                  <p><Calendar size={16} /> {campaign.start_date} → {campaign.end_date}</p>
                  <p><Users size={16} /> {campaign.completed}/{campaign.total_employees} completed</p>
                  
                  <div style={{ width: '100%', background: '#ecf0f1', borderRadius: '10px', height: '8px', marginTop: '1rem' }}>
                    <div style={{ 
                      width: `${(campaign.completed / campaign.total_employees) * 100}%`, 
                      background: '#3498db', 
                      height: '100%', 
                      borderRadius: '10px',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button 
                    className="btn-check" 
                    onClick={() => handleSyncToHIS(campaign.id)}
                    disabled={campaign.status === 'completed'}
                  >
                    <Send size={16} /> Sync to Hospital
                  </button>
                  <button className="btn-secondary" onClick={() => handleViewReport(campaign.id)}>
                    <FileText size={16} /> View Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <div className="tab-content">
          <h2>Employees Due for Health Check</h2>
          <div className="health-check-results">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Last Check</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td>{emp.name}</td>
                    <td>{emp.department}</td>
                    <td>{emp.position}</td>
                    <td>{emp.last_check || 'Never'}</td>
                    <td>
                      <span className={`status-badge status-${emp.status}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn-check" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                        Schedule
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <div className="tab-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <h2>Health Check Results</h2>
            <button className="btn-secondary">
              <Download size={18} /> Export Report
            </button>
          </div>

          <div className="health-check-results">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Check Date</th>
                  <th>Health Status</th>
                  <th>Restrictions</th>
                  <th>Doctor's Conclusion</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.id}>
                    <td>{result.employee_name}</td>
                    <td>{result.department}</td>
                    <td>{result.check_date}</td>
                    <td>{getHealthStatusBadge(result.health_status)}</td>
                    <td>
                      {result.restrictions.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                          {result.restrictions.map((r, i) => (
                            <li key={i} style={{ fontSize: '0.85rem' }}>
                              {r.replace(/_/g, ' ')}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span style={{ color: '#95a5a6' }}>None</span>
                      )}
                    </td>
                    <td>{result.doctor_conclusion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <CreateCampaignModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateCampaign}
          loading={loading}
        />
      )}
    </div>
  );
};

/**
 * Create Campaign Modal
 */
const CreateCampaignModal = ({ onClose, onCreate, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    departments: []
  });

  const departments = ['Engineering', 'HR', 'Marketing', 'Sales', 'Finance', 'Operations'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.start_date || !formData.end_date) {
      alert('Please fill all required fields');
      return;
    }
    onCreate(formData);
  };

  const toggleDepartment = (dept) => {
    const updated = formData.departments.includes(dept)
      ? formData.departments.filter(d => d !== dept)
      : [...formData.departments, dept];
    setFormData({ ...formData, departments: updated });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div>
            <h2>Create Health Check Campaign</h2>
            <p className="modal-subtitle">Schedule health screening for employees</p>
          </div>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Campaign Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Q1 2026 Health Check"
                required
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Date *</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Select Departments</label>
              <div className="restrictions-grid">
                {departments.map((dept) => (
                  <label key={dept} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.departments.includes(dept)}
                      onChange={() => toggleDepartment(dept)}
                    />
                    <span>{dept}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : '✅ Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HRHealthCheckPage;
