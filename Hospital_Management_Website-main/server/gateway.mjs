import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
  HealthCheckSchedule,
  HealthCheckRecord,
  SyncLog
} from './models/HealthCheck.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.GATEWAY_PORT || 6000;

// Middleware
app.use(express.json());

// MongoDB connection for health check integration
const GATEWAY_MONGO_URI = process.env.GATEWAY_MONGO_URI || process.env.MONGO_URI;
if (GATEWAY_MONGO_URI) {
  mongoose
    .connect(GATEWAY_MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    .then(() => console.log('✅ Gateway MongoDB Connected'))
    .catch((err) => console.error('❌ Gateway MongoDB Error:', err));
} else {
  console.warn('⚠️ GATEWAY_MONGO_URI/MONGO_URI not set. Health check APIs will fail.');
}

// ============================================
// 1. CONFIGURATION - CẤU HÌNH 3 HỆ THỐNG
// ============================================

const SYSTEMS = {
  hospital: {
    name: 'Hospital Management',
    baseUrl: process.env.HOSPITAL_API_URL || 'http://localhost:5000',
    port: 5000,
    type: 'node',
    auth: {
      type: 'jwt-bearer'
    }
  },
  hr: {
    name: 'HR Management (Java Spring Boot)',
    baseUrl: process.env.HR_API_URL || 'http://localhost:8080',
    port: 8080,
    type: 'java',
    auth: {
      type: 'jwt-query',
      token: process.env.HR_THIRD_PARTY_TOKEN || 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0aGlyZF9wYXJ0eV91c2VyIiwiaWF0IjoxNzI4MDAwMDAwLCJleHAiOjMzMDgwMDAwMDB9.thirdpartyfixedtoken123456789'
    }
  },
  hotel: {
    name: 'Hotel Management',
    baseUrl: process.env.HOTEL_API_URL || 'http://localhost:3000',
    port: 3000,
    type: 'unknown',
    status: 'pending' // Chờ nhóm Hotel
  }
};

// ============================================
// Helper functions
// ============================================

const mapHrEmployee = (employee) => {
  const firstName = employee.firstName || employee.first_name || '';
  const lastName = employee.lastName || employee.last_name || '';
  const fullName = employee.name || `${firstName} ${lastName}`.trim() || employee.email;

  return {
    id: employee.id || employee.employeeId || employee.employee_id,
    name: fullName,
    email: employee.email,
    department: employee.department || employee.departmentName || 'General',
    last_check_date: employee.last_check_date || null
  };
};

const fetchHrEmployees = async () => {
  const url = `${SYSTEMS.hr.baseUrl}/api/employees/third-party/all?token=${SYSTEMS.hr.auth.token}`;
  const response = await axios.get(url, { timeout: 8000 });
  const list = Array.isArray(response.data) ? response.data : response.data?.data || [];
  return list.map(mapHrEmployee).filter((e) => e.id);
};

const updateScheduleStats = (schedule) => {
  const total = schedule.appointments.length;
  const checked = schedule.appointments.filter((a) => a.status === 'checked').length;
  const pending = schedule.appointments.filter((a) => a.status === 'pending' || a.status === 'confirmed').length;
  const missed = schedule.appointments.filter((a) => a.status === 'missed' || a.status === 'cancelled').length;

  schedule.total_employees = total;
  schedule.checked_count = checked;
  schedule.pending_count = pending;
  schedule.missed_count = missed;
  schedule.scheduled_count = total;
};

// ============================================
// 2. HEALTH CHECK ENDPOINTS
// ============================================

// Gateway health
app.get('/api/gateway/health', (req, res) => {
  res.json({
    code: 0,
    message: 'API Gateway is running',
    success: true,
    timestamp: new Date(),
    systems: SYSTEMS
  });
});

// Check health của tất cả systems
app.get('/api/gateway/systems', async (req, res) => {
  const systemsStatus = {};
  
  for (const [key, system] of Object.entries(SYSTEMS)) {
    try {
      const response = await axios.get(`${system.baseUrl}/api/health`, {
        timeout: 3000
      });
      systemsStatus[key] = {
        name: system.name,
        status: 'online',
        type: system.type,
        response: response.data
      };
    } catch (error) {
      systemsStatus[key] = {
        name: system.name,
        status: 'offline',
        type: system.type,
        error: error.message
      };
    }
  }
  
  res.json({
    code: 0,
    message: 'Systems status',
    success: true,
    systems: systemsStatus
  });
});

// ============================================
// 3. AUTHENTICATION ENDPOINTS
// ============================================

/**
 * POST /api/gateway/auth/login
 * Login with HR system credentials
 * Returns JWT token for accessing all 3 services
 */
app.post('/api/gateway/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        code: 3,
        message: 'Missing email or password',
        success: false
      });
    }

    // Call HR login endpoint
    const hrResponse = await axios.post(
      `${SYSTEMS.hr.baseUrl}/api/auth/login`,
      { email, password },
      { timeout: 5000 }
    );

    const { token, user, services } = hrResponse.data;

    // Add gateway info to response
    res.json({
      code: 0,
      message: 'Login successful',
      success: true,
      data: {
        token,
        user: {
          ...user,
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          department: user.department,
          role: user.role || 'EMPLOYEE'
        },
        services: services || ['hr', 'hospital', 'hotel'],
        gateway: {
          hospital: SYSTEMS.hospital.baseUrl,
          hr: SYSTEMS.hr.baseUrl,
          hotel: SYSTEMS.hotel.baseUrl
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(401).json({
      code: 1,
      message: 'Login failed',
      success: false,
      error: error.response?.data?.message || error.message
    });
  }
});

/**
 * GET /api/gateway/auth/verify
 * Verify JWT token
 */
app.get('/api/gateway/auth/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 1,
        message: 'No token provided',
        success: false
      });
    }

    const token = authHeader.substring(7);

    // Verify with HR system
    const hrResponse = await axios.get(
      `${SYSTEMS.hr.baseUrl}/api/auth/verify`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 5000
      }
    );

    res.json({
      code: 0,
      message: 'Token is valid',
      success: true,
      data: hrResponse.data
    });
  } catch (error) {
    res.status(401).json({
      code: 1,
      message: 'Token verification failed',
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 4. HOSPITAL ENDPOINTS (Local Proxy)
// ============================================

// Get all doctors
app.get('/api/gateway/hospital/doctors', async (req, res) => {
  try {
    const token = req.headers.authorization;
    
    const response = await axios.get(
      `${SYSTEMS.hospital.baseUrl}/api/doctors`,
      {
        headers: token ? { 'Authorization': token } : {},
        timeout: 5000
      }
    );
    res.json({
      code: 0,
      message: 'Doctors from Hospital system',
      success: true,
      source: 'Hospital Management',
      data: response.data.data || response.data
    });
  } catch (error) {
    res.status(500).json({
      code: 5,
      message: 'Error fetching doctors from Hospital',
      success: false,
      error: error.message
    });
  }
});

// Get doctors with filters
app.get('/api/gateway/hospital/doctors/department/:dept', async (req, res) => {
  try {
    const token = req.headers.authorization;
    
    const response = await axios.get(
      `${SYSTEMS.hospital.baseUrl}/api/doctors/department/${req.params.dept}`,
      {
        headers: token ? { 'Authorization': token } : {},
        timeout: 5000
      }
    );
    res.json({
      code: 0,
      message: `Doctors in ${req.params.dept}`,
      success: true,
      source: 'Hospital Management',
      data: response.data.data || response.data
    });
  } catch (error) {
    res.status(500).json({
      code: 5,
      message: 'Error fetching doctors from Hospital',
      success: false,
      error: error.message
    });
  }
});

// Get all doctors via HR integration endpoint (with HR token verification)
app.get('/api/gateway/hospital/hr/doctors', async (req, res) => {
  try {
    const token = req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({
        code: 1,
        message: 'Token required',
        success: false
      });
    }

    const response = await axios.get(
      `${SYSTEMS.hospital.baseUrl}/api/hr/doctors`,
      {
        headers: { 'Authorization': token },
        timeout: 5000
      }
    );
    
    res.json({
      code: 0,
      message: 'Doctors from Hospital (HR integration)',
      success: true,
      source: 'Hospital Management - HR Integration',
      data: response.data.data || response.data
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      code: 5,
      message: 'Error fetching doctors from Hospital HR endpoint',
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 5. HR ENDPOINTS (Proxy → Java API)
// ============================================


// ============================================
// 5. HR ENDPOINTS (Proxy → Java API)
// ============================================

/**
 * GET /api/gateway/hr/employees
 * Get all employees from HR system
 */
app.get('/api/gateway/hr/employees', async (req, res) => {
  try {
    const response = await axios.get(
      `${SYSTEMS.hr.baseUrl}/api/employees/third-party/all`,
      {
        params: { token: SYSTEMS.hr.auth.token },
        timeout: 5000
      }
    );
    
    res.json({
      code: 0,
      message: 'Employees from HR system',
      success: true,
      source: 'HR Management (Java Spring Boot)',
      data: response.data
    });
  } catch (error) {
    console.error('Error fetching HR employees:', error.message);
    res.status(500).json({
      code: 5,
      message: 'Error fetching employees from HR',
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/gateway/hr/employees/:id
 * Get employee by ID from HR system
 */
app.get('/api/gateway/hr/employees/:id', async (req, res) => {
  try {
    const response = await axios.get(
      `${SYSTEMS.hr.baseUrl}/api/employees/${req.params.id}`,
      { timeout: 5000 }
    );
    
    res.json({
      code: 0,
      message: 'Employee from HR system',
      success: true,
      source: 'HR Management',
      data: response.data
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      code: 5,
      message: 'Error fetching employee from HR',
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/gateway/hr/employees
 * Create new employee (requires HR token in query)
 */
app.post('/api/gateway/hr/employees', async (req, res) => {
  try {
    const response = await axios.post(
      `${SYSTEMS.hr.baseUrl}/api/employees/third-party`,
      req.body,
      {
        params: { token: SYSTEMS.hr.auth.token },
        timeout: 5000
      }
    );
    
    res.status(201).json({
      code: 0,
      message: 'Employee created in HR system',
      success: true,
      source: 'HR Management',
      data: response.data
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      code: 5,
      message: 'Error creating employee in HR',
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/gateway/hr/departments
 * Get all departments from HR system
 */
app.get('/api/gateway/hr/departments', async (req, res) => {
  try {
    const response = await axios.get(
      `${SYSTEMS.hr.baseUrl}/api/departments`,
      { timeout: 5000 }
    );
    
    res.json({
      code: 0,
      message: 'Departments from HR system',
      success: true,
      source: 'HR Management',
      data: response.data
    });
  } catch (error) {
    res.status(500).json({
      code: 5,
      message: 'Error fetching departments from HR',
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 7. HOTEL ENDPOINTS (Ready when Hotel team finishes)
// ============================================

app.get('/api/gateway/hotel/rooms', async (req, res) => {
  try {
    const token = req.headers.authorization;
    
    const response = await axios.get(
      `${SYSTEMS.hotel.baseUrl}/api/rooms`,
      {
        headers: token ? { 'Authorization': token } : {},
        timeout: 5000
      }
    );
    
    res.json({
      code: 0,
      message: 'Rooms from Hotel system',
      success: true,
      source: 'Hotel Management',
      data: response.data
    });
  } catch (error) {
    res.status(503).json({
      code: 5,
      message: 'Hotel system is not ready or unavailable',
      success: false,
      status: SYSTEMS.hotel.status,
      error: error.message
    });
  }
});

// ============================================
// 8. SYNC ENDPOINTS
// ============================================

/**
 * POST /api/gateway/sync/hr-to-hospital
 * Sync HR employees → Hospital doctors
 */
app.post('/api/gateway/sync/hr-to-hospital', async (req, res) => {
  try {
    // 1. Fetch employees from HR
    const hrResponse = await axios.get(
      `${SYSTEMS.hr.baseUrl}/api/employees/third-party/all`,
      {
        params: { token: SYSTEMS.hr.auth.token },
        timeout: 5000
      }
    );
    
    const employees = hrResponse.data;
    const syncData = {
      employees: employees.map(emp => ({
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        department: emp.department,
        age: emp.age,
        specialization: 'General Physician',
        photoUrl: 'https://via.placeholder.com/150'
      }))
    };

    // 2. Call Hospital sync endpoint
    const hospitalResponse = await axios.post(
      `${SYSTEMS.hospital.baseUrl}/api/hr/sync/doctors`,
      syncData,
      {
        headers: { 'Authorization': `Bearer ${SYSTEMS.hr.auth.token}` },
        timeout: 5000
      }
    );
    
    res.json({
      code: 0,
      message: 'Sync HR employees to Hospital doctors completed',
      success: true,
      timestamp: new Date(),
      data: {
        employees_count: employees.length,
        sync_results: hospitalResponse.data
      }
    });
  } catch (error) {
    console.error('Sync error:', error.message);
    res.status(500).json({
      code: 5,
      message: 'Error syncing HR to Hospital',
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/gateway/sync/status
 * Get sync status overview
 */
app.get('/api/gateway/sync/status', async (req, res) => {
  try {
    // Get Hospital sync status
    const hospitalResponse = await axios.get(
      `${SYSTEMS.hospital.baseUrl}/api/hr/sync/status`,
      {
        headers: { 'Authorization': `Bearer ${SYSTEMS.hr.auth.token}` },
        timeout: 5000
      }
    );

    res.json({
      code: 0,
      message: 'Sync status',
      success: true,
      data: {
        hospital: hospitalResponse.data.data,
        lastCheck: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      code: 5,
      message: 'Error fetching sync status',
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 7. UNIFIED REPORTS
// ============================================

app.get('/api/gateway/reports/system-overview', async (req, res) => {
  try {
    // Fetch stats from all systems
    const [hospitalDocs, hrEmps, hotelRooms] = await Promise.allSettled([
      axios.get(`${SYSTEMS.hospital.baseUrl}/api/doctors`),
      axios.get(`${SYSTEMS.hr.baseUrl}/api/employees`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${SYSTEMS.hr.auth.username}:${SYSTEMS.hr.auth.password}`).toString('base64')}`
        }
      }),
      axios.get(`${SYSTEMS.hotel.baseUrl}/api/rooms`).catch(() => ({ data: [] }))
    ]);
    
    res.json({
      code: 0,
      message: 'System Overview Report',
      success: true,
      report: {
        hospital: {
          doctors_count: hospitalDocs.status === 'fulfilled' ? hospitalDocs.value.data.data?.length || 0 : 'N/A',
          status: hospitalDocs.status
        },
        hr: {
          employees_count: hrEmps.status === 'fulfilled' ? hrEmps.value.data?.length || 0 : 'N/A',
          status: hrEmps.status
        },
        hotel: {
          rooms_count: hotelRooms.status === 'fulfilled' ? hotelRooms.value.data?.length || 0 : 'N/A',
          status: hotelRooms.status
        }
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      code: 5,
      message: 'Error generating report',
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 8. HEALTH CHECK - HIS-HRM INTEGRATION
// ============================================

/**
 * GET /api/gateway/health-check/schedule?date=YYYY-MM-DD&campaign_id=1
 * Bác sĩ xem lịch khám theo ngày
 */
app.get('/api/gateway/health-check/schedule', async (req, res) => {
  try {
    const { date, campaign_id } = req.query;

    if (!date) {
      return res.status(400).json({
        code: 3,
        message: 'date is required (YYYY-MM-DD)',
        success: false
      });
    }

    const targetDate = new Date(date);
    if (Number.isNaN(targetDate.getTime())) {
      return res.status(400).json({
        code: 3,
        message: 'Invalid date format',
        success: false
      });
    }

    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    let schedules = [];
    if (campaign_id) {
      const schedule = await HealthCheckSchedule.findOne({ campaign_id: Number(campaign_id) });
      if (schedule) {
        schedules = [schedule];
      }
    } else {
      schedules = await HealthCheckSchedule.find({});
    }

    const appointments = schedules.flatMap((schedule) =>
      (schedule.appointments || [])
        .filter((a) => a.scheduled_date && a.scheduled_date >= dayStart && a.scheduled_date <= dayEnd)
        .map((a) => ({
          appointment_id: a.appointment_id,
          employee_id: a.employee_id,
          employee_name: a.employee_name,
          department: a.department,
          doctor_id: a.doctor_id,
          doctor_name: a.doctor_name,
          scheduled_date: a.scheduled_date,
          scheduled_time: a.scheduled_time,
          status: a.status,
          campaign_id: schedule.campaign_id
        }))
    );

    res.json({
      code: 0,
      message: 'Health check schedule',
      success: true,
      schedule: appointments
    });
  } catch (error) {
    res.status(500).json({
      code: 5,
      message: 'Failed to fetch schedule',
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/gateway/health-check/campaigns
 * HR tạo đợt khám sức khỏe
 */
app.post('/api/gateway/health-check/campaigns', async (req, res) => {
  try {
    const { campaign_id, campaign_name, campaign_type, start_date, end_date, description, employees } = req.body;

    if (!campaign_name || !campaign_type || !start_date || !end_date) {
      return res.status(400).json({
        code: 3,
        message: 'Missing required fields: campaign_name, campaign_type, start_date, end_date',
        success: false
      });
    }

    const resolvedCampaignId = campaign_id || Date.now();

    const existing = await HealthCheckSchedule.findOne({ campaign_id: resolvedCampaignId });
    if (existing) {
      return res.status(409).json({
        code: 4,
        message: 'Campaign already exists',
        success: false,
        campaign_id: resolvedCampaignId
      });
    }

    const schedule = new HealthCheckSchedule({
      campaign_id: resolvedCampaignId,
      hrm_campaign_name: campaign_name,
      hrm_campaign_type: campaign_type,
      campaign_start_date: new Date(start_date),
      campaign_end_date: new Date(end_date),
      status: 'pending',
      appointments: []
    });

    if (Array.isArray(employees) && employees.length > 0) {
      schedule.appointments = employees.map((emp) => ({
        appointment_id: new mongoose.Types.ObjectId(),
        employee_id: emp.id || emp.employee_id,
        employee_name: emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
        department: emp.department || 'General',
        scheduled_date: new Date(start_date),
        scheduled_time: emp.scheduled_time || '09:00',
        status: 'pending',
        sent_to_hrm: false
      }));
      schedule.status = 'scheduled';
      updateScheduleStats(schedule);
    }

    await schedule.save();

    res.status(201).json({
      code: 0,
      message: 'Health check campaign created successfully',
      success: true,
      campaign_id: resolvedCampaignId
    });
  } catch (error) {
    res.status(500).json({
      code: 5,
      message: 'Failed to create campaign',
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/gateway/health-check/campaigns
 * HR xem danh sách các đợt khám
 */
app.get('/api/gateway/health-check/campaigns', async (req, res) => {
  try {
    const campaigns = await HealthCheckSchedule.find({}).sort({ createdAt: -1 }).lean();

    res.json({
      code: 0,
      message: 'Health check campaigns',
      success: true,
      campaigns: campaigns.map((c) => ({
        id: c.campaign_id,
        campaign_name: c.hrm_campaign_name,
        campaign_type: c.hrm_campaign_type,
        start_date: c.campaign_start_date,
        end_date: c.campaign_end_date,
        status: c.status,
        total_employees: c.total_employees || 0,
        checked_count: c.checked_count || 0,
        pending_count: c.pending_count || 0
      }))
    });
  } catch (error) {
    res.status(500).json({
      code: 5,
      message: 'Failed to fetch campaigns',
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/gateway/health-check/due-employees?campaign_id=1
 * Lấy danh sách nhân viên cần khám
 */
app.get('/api/gateway/health-check/due-employees', async (req, res) => {
  try {
    const { campaign_id } = req.query;

    if (!campaign_id) {
      return res.status(400).json({
        code: 3,
        message: 'campaign_id is required',
        success: false
      });
    }

    const schedule = await HealthCheckSchedule.findOne({ campaign_id: Number(campaign_id) });
    if (!schedule) {
      return res.status(404).json({
        code: 2,
        message: 'Campaign not found',
        success: false
      });
    }

    if (!schedule.appointments || schedule.appointments.length === 0) {
      const employees = await fetchHrEmployees();
      schedule.appointments = employees.map((emp) => ({
        appointment_id: new mongoose.Types.ObjectId(),
        employee_id: emp.id,
        employee_name: emp.name,
        department: emp.department,
        scheduled_date: schedule.campaign_start_date || new Date(),
        scheduled_time: '09:00',
        status: 'pending',
        sent_to_hrm: false
      }));
      schedule.status = 'scheduled';
      updateScheduleStats(schedule);
      await schedule.save();
    }

    const dueEmployees = schedule.appointments
      .filter((a) => a.status !== 'checked')
      .map((a) => ({
        id: a.employee_id,
        name: a.employee_name,
        department: a.department,
        last_check_date: null,
        due_date: schedule.campaign_start_date || a.scheduled_date
      }));

    res.json({
      code: 0,
      message: 'Employees due for health check',
      success: true,
      total: dueEmployees.length,
      due_employees: dueEmployees
    });
  } catch (error) {
    res.status(500).json({
      code: 5,
      message: 'Failed to fetch due employees',
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/gateway/health-check/sync-to-his
 * HRM gửi danh sách sang HIS
 */
app.post('/api/gateway/health-check/sync-to-his', async (req, res) => {
  try {
    const { campaign_id, employees } = req.body;

    if (!campaign_id || !employees || !Array.isArray(employees)) {
      return res.status(400).json({
        code: 3,
        message: 'Invalid request: campaign_id and employees array required',
        success: false
      });
    }

    let schedule = await HealthCheckSchedule.findOne({ campaign_id: Number(campaign_id) });
    if (!schedule) {
      schedule = new HealthCheckSchedule({
        campaign_id: Number(campaign_id),
        hrm_campaign_name: `Campaign ${campaign_id}`,
        hrm_campaign_type: 'Annual',
        status: 'scheduled',
        appointments: []
      });
    }

    const existingEmployeeIds = new Set(schedule.appointments.map((a) => a.employee_id));
    const newAppointments = employees
      .filter((emp) => !existingEmployeeIds.has(emp.id || emp.employee_id))
      .map((emp) => ({
        appointment_id: new mongoose.Types.ObjectId(),
        employee_id: emp.id || emp.employee_id,
        employee_name: emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
        department: emp.department || 'General',
        scheduled_date: schedule.campaign_start_date || new Date(),
        scheduled_time: emp.scheduled_time || '09:00',
        status: 'pending',
        sent_to_hrm: false
      }));

    schedule.appointments.push(...newAppointments);
    updateScheduleStats(schedule);
    schedule.status = 'in_progress';
    await schedule.save();

    await SyncLog.create({
      campaign_id: Number(campaign_id),
      sync_type: 'HRM_to_HIS',
      total_records: employees.length,
      status: 'completed',
      message: 'Employees sent to HIS'
    });

    res.json({
      code: 0,
      message: 'Health check requests sent to HIS successfully',
      success: true,
      his_campaign_id: `his_${campaign_id}_${Date.now()}`,
      total_sent: employees.length
    });
  } catch (error) {
    res.status(500).json({
      code: 5,
      message: 'Failed to sync with HIS',
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/gateway/health-check/results?campaign_id=1
 * HR xem kết quả khám
 */
app.get('/api/gateway/health-check/results', async (req, res) => {
  try {
    const { campaign_id, employee_id } = req.query;

    if (!campaign_id) {
      return res.status(400).json({
        code: 3,
        message: 'campaign_id is required',
        success: false
      });
    }

    const filter = {
      campaign_id: Number(campaign_id)
    };
    if (employee_id) {
      filter.employee_id = Number(employee_id);
    }

    const records = await HealthCheckRecord.find(filter).sort({ check_date: -1 }).lean();

    res.json({
      code: 0,
      message: 'Health check results',
      success: true,
      results: records.map((r) => ({
        employee_id: r.employee_id,
        employee_name: r.employee_name,
        check_date: r.check_date,
        health_status: r.health_status,
        restrictions: r.restrictions || [],
        doctor_conclusion: r.doctor_conclusion
      }))
    });
  } catch (error) {
    res.status(500).json({
      code: 5,
      message: 'Failed to fetch results',
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/gateway/health-check/his/submit-result
 * Bác sĩ submit kết quả khám
 */
app.post('/api/gateway/health-check/his/submit-result', async (req, res) => {
  try {
    const {
      appointment_id,
      employee_id,
      campaign_id,
      employee_name,
      department,
      doctor_id,
      doctor_name,
      check_date,
      check_time,
      vitals,
      lab_results,
      imaging,
      physical_examination,
      detailed_diagnosis,
      recommended_treatment,
      health_status,
      restrictions,
      doctor_conclusion
    } = req.body;

    if (!appointment_id || !employee_id || !health_status) {
      return res.status(400).json({
        code: 3,
        message: 'Missing required fields: appointment_id, employee_id, health_status',
        success: false
      });
    }

    const validStatuses = ['Type_1', 'Type_2', 'Type_3', 'Type_4'];
    if (!validStatuses.includes(health_status)) {
      return res.status(400).json({
        code: 3,
        message: `Invalid health_status. Must be one of: ${validStatuses.join(', ')}`,
        success: false
      });
    }

    const record = await HealthCheckRecord.create({
      appointment_id,
      campaign_id: Number(campaign_id),
      employee_id: Number(employee_id),
      employee_name,
      department,
      doctor_id,
      doctor_name,
      check_date: check_date ? new Date(check_date) : new Date(),
      check_time,
      vitals,
      lab_results,
      imaging,
      physical_examination,
      detailed_diagnosis,
      recommended_treatment,
      health_status,
      restrictions,
      doctor_conclusion
    });

    if (campaign_id) {
      const schedule = await HealthCheckSchedule.findOne({ campaign_id: Number(campaign_id) });
      if (schedule) {
        const appointment = schedule.appointments.find((a) => String(a.appointment_id) === String(appointment_id));
        if (appointment) {
          appointment.status = 'checked';
          appointment.health_status = health_status;
          appointment.restrictions = restrictions || [];
          appointment.doctor_conclusion = doctor_conclusion;
          appointment.sent_to_hrm = true;
          appointment.hrm_sync_date = new Date();
        }
        updateScheduleStats(schedule);
        schedule.status = schedule.pending_count === 0 ? 'completed' : 'in_progress';
        await schedule.save();
      }
    }

    await SyncLog.create({
      campaign_id: Number(campaign_id),
      sync_type: 'HIS_to_HRM',
      total_records: 1,
      status: 'completed',
      message: 'Health check result submitted'
    });

    res.json({
      code: 0,
      message: 'Health check result submitted successfully',
      success: true,
      his_record_id: record._id
    });
  } catch (error) {
    res.status(500).json({
      code: 5,
      message: 'Failed to submit health check result',
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/gateway/health-check/report?campaign_id=1
 * HR xem báo cáo tổng hợp
 */
app.get('/api/gateway/health-check/report', async (req, res) => {
  try {
    const { campaign_id } = req.query;

    if (!campaign_id) {
      return res.status(400).json({
        code: 3,
        message: 'campaign_id is required',
        success: false
      });
    }

    const schedule = await HealthCheckSchedule.findOne({ campaign_id: Number(campaign_id) }).lean();
    const records = await HealthCheckRecord.find({ campaign_id: Number(campaign_id) }).lean();

    const counts = {
      Type_1: 0,
      Type_2: 0,
      Type_3: 0,
      Type_4: 0
    };

    records.forEach((r) => {
      if (counts[r.health_status] !== undefined) {
        counts[r.health_status] += 1;
      }
    });

    const totalEmployees = schedule?.total_employees || records.length;
    const checkedCount = schedule?.checked_count || records.length;
    const pendingCount = schedule?.pending_count || Math.max(totalEmployees - checkedCount, 0);
    const completionRate = totalEmployees === 0 ? '0%' : `${Math.round((checkedCount / totalEmployees) * 100)}%`;

    res.json({
      code: 0,
      message: 'Health check report',
      success: true,
      report: {
        campaign_id: Number(campaign_id),
        campaign_name: schedule?.hrm_campaign_name || `Campaign ${campaign_id}`,
        total_employees: totalEmployees,
        checked_count: checkedCount,
        pending_count: pendingCount,
        type_1_count: counts.Type_1,
        type_2_count: counts.Type_2,
        type_3_count: counts.Type_3,
        type_4_count: counts.Type_4,
        completion_rate: completionRate
      }
    });
  } catch (error) {
    res.status(500).json({
      code: 5,
      message: 'Failed to fetch report',
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 9. ERROR HANDLING & START SERVER
// ============================================

app.use((req, res) => {
  res.status(404).json({
    code: 2,
    message: 'Endpoint not found',
    success: false,
    path: req.path
  });
});

app.listen(PORT, () => {
  console.log(`\n🌐 API GATEWAY RUNNING`);
  console.log(`📌 Port: ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/gateway/health\n`);
  console.log(`📊 Connected Systems:`);
  Object.entries(SYSTEMS).forEach(([key, system]) => {
    console.log(`   ${system.name}: ${system.baseUrl} (${system.type})`);
  });
  console.log(`✅ Health Check Integration: /api/gateway/health-check/*`);
  console.log(`\n`);
});

export default app;
