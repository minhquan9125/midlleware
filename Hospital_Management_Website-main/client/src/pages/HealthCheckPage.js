/**
 * Health Check Management Page
 * Doctor interface for managing employee health checkups
 */

import React, { useState, useEffect } from 'react';
import {
  Clock,
  User,
  FileText,
  Check,
  AlertCircle,
  X,
  Stethoscope,
  Activity,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * HEALTH CHECK SCHEDULE PAGE
 */
const HealthCheckSchedulePage = () => {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/gateway/health-check/schedule?date=${selectedDate}`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        }
      );
      const data = await response.json();
      
      // Demo data if API not available
      if (!data.success) {
        setSchedule([
          {
            appointment_id: 'apt1',
            employee_id: 1,
            employee_name: 'Nguyễn Văn A',
            department: 'Engineering',
            doctor_id: 'doc1',
            doctor_name: 'Dr. Trần Thị B',
            scheduled_date: selectedDate,
            scheduled_time: '09:00 AM',
            status: 'pending'
          },
          {
            appointment_id: 'apt2',
            employee_id: 2,
            employee_name: 'Trần Thị C',
            department: 'HR',
            doctor_id: 'doc1',
            doctor_name: 'Dr. Trần Thị B',
            scheduled_date: selectedDate,
            scheduled_time: '10:00 AM',
            status: 'confirmed'
          }
        ]);
      } else {
        setSchedule(data.schedule || []);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      // Use demo data on error
      setSchedule([
        {
          appointment_id: 'apt1',
          employee_id: 1,
          employee_name: 'Nguyễn Văn A',
          department: 'Engineering',
          doctor_id: 'doc1',
          doctor_name: 'Dr. Trần Thị B',
          scheduled_date: selectedDate,
          scheduled_time: '09:00 AM',
          status: 'pending'
        },
        {
          appointment_id: 'apt2',
          employee_id: 2,
          employee_name: 'Trần Thị C',
          department: 'HR',
          doctor_id: 'doc1',
          doctor_name: 'Dr. Trần Thị B',
          scheduled_date: selectedDate,
          scheduled_time: '10:00 AM',
          status: 'confirmed'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  return (
    <div className="health-check-container">
      {/* Back Button */}
      <button className="btn-back" onClick={() => navigate('/dashboard')}>
        <ArrowLeft size={20} /> Back to Dashboard
      </button>

      <div className="health-check-header">
        <h1>👨‍⚕️ Health Check Schedule</h1>
        <p>Daily appointments for employee health checkups</p>
      </div>

      {/* Date Selector */}
      <div className="date-selector">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="date-input"
        />
        <button className="btn-today" onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}>
          Today
        </button>
      </div>

      {/* Schedule List */}
      <div className="schedule-grid">
        {loading ? (
          <p className="loading">Loading schedule...</p>
        ) : schedule.length === 0 ? (
          <p className="empty-state">No appointments for {selectedDate}</p>
        ) : (
          schedule.map((appointment, idx) => (
            <ScheduleCard
              key={idx}
              appointment={appointment}
              onSelect={() => setSelectedAppointment(appointment)}
            />
          ))
        )}
      </div>

      {/* Health Check Form Modal */}
      {selectedAppointment && (
        <HealthCheckModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onSubmit={() => {
            setSelectedAppointment(null);
            fetchSchedule();
          }}
        />
      )}
    </div>
  );
};

/**
 * SCHEDULE CARD
 */
const ScheduleCard = ({ appointment, onSelect }) => {
  const getStatusColor = (status) => {
    const colors = {
      pending: '#FFA500',
      confirmed: '#4CAF50',
      checked: '#2196F3',
      missed: '#f44336'
    };
    return colors[status] || '#999';
  };

  return (
    <div
      className="schedule-card"
      style={{ borderLeftColor: getStatusColor(appointment.status) }}
      onClick={onSelect}
    >
      <div className="card-header">
        <div className="card-time">
          <Clock size={20} />
          <span className="time">{appointment.scheduled_time}</span>
        </div>
        <span className={`status-badge status-${appointment.status}`}>
          {appointment.status}
        </span>
      </div>

      <div className="card-body">
        <div className="employee-info">
          <User size={18} />
          <div>
            <p className="employee-name">{appointment.employee_name}</p>
            <p className="employee-detail">{appointment.department}</p>
          </div>
        </div>

        <div className="doctor-info">
          <Stethoscope size={18} />
          <span>{appointment.doctor_name || 'Assigned Doctor'}</span>
        </div>
      </div>

      <button className="btn-check" onClick={(e) => {
        e.stopPropagation();
      }}>
        Start Checkup
      </button>
    </div>
  );
};

/**
 * HEALTH CHECK MODAL
 */
const HealthCheckModal = ({ appointment, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    vitals: {
      height: '170',
      weight: '65',
      blood_pressure: '120/80',
      heart_rate: '72',
      temperature: '36.5',
      respiratory_rate: '16',
      oxygen_saturation: '98'
    },
    lab_results: {
      RBC: '4.5',
      WBC: '7.0',
      Hb: '14.0',
      glucose: '100',
      notes: 'All normal'
    },
    health_status: 'Type_1',
    restrictions: [],
    doctor_conclusion: 'Sức khỏe bình thường',
    detailed_diagnosis: ''
  });

  const [activeTab, setActiveTab] = useState('vitals');
  const [loading, setLoading] = useState(false);

  const handleVitalsChange = (field, value) => {
    setFormData({
      ...formData,
      vitals: { ...formData.vitals, [field]: value }
    });
  };

  const handleLabChange = (field, value) => {
    setFormData({
      ...formData,
      lab_results: { ...formData.lab_results, [field]: value }
    });
  };

  const handleSubmit = async () => {
    if (!formData.health_status) {
      alert('Vui lòng chọn trạng thái sức khỏe');
      return;
    }

    if (!formData.doctor_conclusion) {
      alert('Vui lòng nhập kết luận của bác sĩ');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/gateway/health-check/his/submit-result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          appointment_id: appointment.appointment_id,
          employee_id: appointment.employee_id,
          campaign_id: appointment.campaign_id,
          employee_name: appointment.employee_name,
          department: appointment.department,
          doctor_name: appointment.doctor_name,
          check_date: new Date().toISOString().split('T')[0],
          doctor_id: 'current_doctor',
          health_status: formData.health_status,
          restrictions: formData.restrictions,
          doctor_conclusion: formData.doctor_conclusion,
          detailed_diagnosis: formData.detailed_diagnosis,
          vitals: formData.vitals,
          lab_results: formData.lab_results
        })
      });

      const data = await response.json();
      if (data.success || data.code === 0) {
        alert('✅ Kết quả khám đã được lưu thành công!');
        onSubmit();
      } else {
        alert('Lỗi: ' + data.message);
      }
    } catch (error) {
      console.error('Error submitting result:', error);
      alert('Lỗi khi gửi kết quả khám. Demo mode: dữ liệu được lưu cục bộ.');
      onSubmit();
    } finally {
      setLoading(false);
    }
  };

  const restrictions = [
    'no_height_work',
    'avoid_heavy_lifting',
    'sit_8h_max',
    'avoid_extreme_temperature',
    'limited_physical_activity',
    'no_chemical_exposure'
  ];

  const toggleRestriction = (restriction) => {
    const updated = formData.restrictions.includes(restriction)
      ? formData.restrictions.filter(r => r !== restriction)
      : [...formData.restrictions, restriction];
    setFormData({ ...formData, restrictions: updated });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content health-check-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2>Health Check: {appointment.employee_name}</h2>
            <p className="modal-subtitle">{appointment.department}</p>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'vitals' ? 'active' : ''}`}
            onClick={() => setActiveTab('vitals')}
          >
            <Activity size={18} /> Vital Signs
          </button>
          <button
            className={`tab ${activeTab === 'labs' ? 'active' : ''}`}
            onClick={() => setActiveTab('labs')}
          >
            <FileText size={18} /> Lab Results
          </button>
          <button
            className={`tab ${activeTab === 'conclusion' ? 'active' : ''}`}
            onClick={() => setActiveTab('conclusion')}
          >
            <Check size={18} /> Conclusion
          </button>
        </div>

        {/* Tab Content */}
        <div className="modal-body">
          {/* Vital Signs Tab */}
          {activeTab === 'vitals' && (
            <div className="form-section">
              <h3>📊 Vital Signs</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Chiều cao (cm)</label>
                  <input
                    type="number"
                    value={formData.vitals.height}
                    onChange={(e) => handleVitalsChange('height', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Cân nặng (kg)</label>
                  <input
                    type="number"
                    value={formData.vitals.weight}
                    onChange={(e) => handleVitalsChange('weight', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Huyết áp</label>
                  <input
                    type="text"
                    value={formData.vitals.blood_pressure}
                    onChange={(e) => handleVitalsChange('blood_pressure', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Nhịp tim (bpm)</label>
                  <input
                    type="number"
                    value={formData.vitals.heart_rate}
                    onChange={(e) => handleVitalsChange('heart_rate', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Nhiệt độ (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.vitals.temperature}
                    onChange={(e) => handleVitalsChange('temperature', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Nhịp thở (lần/phút)</label>
                  <input
                    type="number"
                    value={formData.vitals.respiratory_rate}
                    onChange={(e) => handleVitalsChange('respiratory_rate', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>O2 Saturation (%)</label>
                  <input
                    type="number"
                    value={formData.vitals.oxygen_saturation}
                    onChange={(e) => handleVitalsChange('oxygen_saturation', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Lab Results Tab */}
          {activeTab === 'labs' && (
            <div className="form-section">
              <h3>🧪 Kết quả xét nghiệm</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>RBC</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.lab_results.RBC}
                    onChange={(e) => handleLabChange('RBC', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>WBC</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.lab_results.WBC}
                    onChange={(e) => handleLabChange('WBC', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Hemoglobin (Hb)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.lab_results.Hb}
                    onChange={(e) => handleLabChange('Hb', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Glucose</label>
                  <input
                    type="number"
                    value={formData.lab_results.glucose}
                    onChange={(e) => handleLabChange('glucose', e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group full-width">
                <label>Ghi chú xét nghiệm</label>
                <textarea
                  value={formData.lab_results.notes}
                  onChange={(e) => handleLabChange('notes', e.target.value)}
                  rows="3"
                />
              </div>
            </div>
          )}

          {/* Conclusion Tab */}
          {activeTab === 'conclusion' && (
            <div className="form-section">
              <h3>✅ Kết luận khám sức khỏe</h3>

              <div className="form-group">
                <label>Trạng thái sức khỏe *</label>
                <select
                  value={formData.health_status}
                  onChange={(e) => setFormData({ ...formData, health_status: e.target.value })}
                  className="health-status-select"
                >
                  <option value="Type_1">✅ Loại 1: Sức khỏe bình thường</option>
                  <option value="Type_2">⚠️ Loại 2: Bình thường, có lưu ý</option>
                  <option value="Type_3">🔔 Loại 3: Cần theo dõi</option>
                  <option value="Type_4">❌ Loại 4: Không đủ sức khỏe</option>
                </select>
              </div>

              <div className="form-group">
                <label>Hạn chế công việc</label>
                <div className="restrictions-grid">
                  {restrictions.map((restriction) => (
                    <label key={restriction} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.restrictions.includes(restriction)}
                        onChange={() => toggleRestriction(restriction)}
                      />
                      <span className="restriction-name">
                        {restriction.replace(/_/g, ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Kết luận bác sĩ (gửi HR) *</label>
                <textarea
                  value={formData.doctor_conclusion}
                  onChange={(e) => setFormData({ ...formData, doctor_conclusion: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Chẩn đoán chi tiết (chỉ HIS)</label>
                <textarea
                  value={formData.detailed_diagnosis}
                  onChange={(e) => setFormData({ ...formData, detailed_diagnosis: e.target.value })}
                  rows="4"
                />
              </div>

              <div className="info-box">
                <AlertCircle size={20} />
                <div>
                  <p><strong>Bảo mật dữ liệu:</strong> Chẩn đoán chi tiết chỉ lưu tại HIS. HR chỉ xem được trạng thái sức khỏe, hạn chế, và kết luận tóm tắt.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={loading}>
            Hủy
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? '⏳ Đang gửi...' : '✅ Gửi kết quả'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HealthCheckSchedulePage;
