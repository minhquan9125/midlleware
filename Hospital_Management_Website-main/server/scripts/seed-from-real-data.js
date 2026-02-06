import dotenv from 'dotenv';
import mongoose from 'mongoose';
import axios from 'axios';
import {
  HealthCheckSchedule,
  HealthCheckRecord,
  SyncLog
} from '../models/HealthCheck.js';

dotenv.config();

const mongoUri = process.env.GATEWAY_MONGO_URI || process.env.MONGO_URI;
const hrApiUrl = process.env.HR_API_URL || 'http://localhost:8080';
const hospitalApiUrl = process.env.HOSPITAL_API_URL || 'http://localhost:5000';
const hrToken = process.env.HR_THIRD_PARTY_TOKEN || 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0aGlyZF9wYXJ0eV91c2VyIiwiaWF0IjoxNzI4MDAwMDAwLCJleHAiOjMzMDgwMDAwMDB9.thirdpartyfixedtoken123456789';

if (!mongoUri) {
  console.error('❌ Missing GATEWAY_MONGO_URI/MONGO_URI in .env');
  process.exit(1);
}

const campaignId = 20260206;

const fetchHREmployees = async () => {
  try {
    console.log('📡 Fetching employees from HR system...');
    const response = await axios.get(
      `${hrApiUrl}/api/employees/third-party/all?token=${hrToken}`,
      { timeout: 10000 }
    );
    const employees = Array.isArray(response.data) ? response.data : response.data?.data || [];
    console.log(`✅ Found ${employees.length} employees from HR`);
    return employees;
  } catch (error) {
    console.warn('⚠️ Could not fetch HR employees:', error.message);
    console.log('📝 Using demo HR data');
    return [
      { id: 1, firstName: 'Nguyễn', lastName: 'Văn A', email: 'a@company.com', department: { name: 'Engineering' } },
      { id: 2, firstName: 'Trần', lastName: 'Thị B', email: 'b@company.com', department: { name: 'HR' } },
      { id: 3, firstName: 'Lê', lastName: 'Văn C', email: 'c@company.com', department: { name: 'Marketing' } },
      { id: 4, firstName: 'Phạm', lastName: 'Thị D', email: 'd@company.com', department: { name: 'Sales' } }
    ];
  }
};

const fetchHospitalDoctors = async () => {
  try {
    console.log('📡 Fetching doctors from Hospital system...');
    const response = await axios.get(`${hospitalApiUrl}/api/doctors`, { timeout: 10000 });
    const doctors = response.data?.data || response.data || [];
    console.log(`✅ Found ${doctors.length} doctors from Hospital`);
    return doctors;
  } catch (error) {
    console.warn('⚠️ Could not fetch Hospital doctors:', error.message);
    console.log('📝 Using demo doctor data');
    return [
      { id: 'doc_001', name: 'Dr. Trần Thị B', specialization: 'General Practice', department: 'Internal Medicine' }
    ];
  }
};

const run = async () => {
  console.log('🚀 Starting Health Check Database Seed...\n');

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  console.log('✅ Connected to MongoDB\n');

  // Fetch real data from both systems
  const hrEmployees = await fetchHREmployees();
  const hospitalDoctors = await fetchHospitalDoctors();

  if (hrEmployees.length === 0) {
    console.error('❌ No employees found. Cannot create campaign.');
    await mongoose.disconnect();
    process.exit(1);
  }

  // Map employees to appointments
  const doctor = hospitalDoctors[0] || { id: 'doc_001', name: 'Dr. Default' };
  
  const appointments = hrEmployees.slice(0, 10).map((emp, index) => {
    const firstName = emp.firstName || emp.first_name || '';
    const lastName = emp.lastName || emp.last_name || '';
    const fullName = emp.name || `${firstName} ${lastName}`.trim() || emp.email;
    const deptName = emp.department?.name || emp.department?.departmentName || emp.department || 'General';
    
    const scheduledDate = new Date('2026-02-06');
    scheduledDate.setHours(9 + index, 0, 0, 0);
    
    return {
      appointment_id: new mongoose.Types.ObjectId(),
      employee_id: emp.id || emp.employeeId || index + 1,
      employee_name: fullName,
      department: deptName,
      doctor_id: doctor.id || doctor._id || 'doc_001',
      doctor_name: doctor.name || 'Dr. Default',
      scheduled_date: scheduledDate,
      scheduled_time: `${String(9 + index).padStart(2, '0')}:00`,
      status: index % 3 === 0 ? 'checked' : 'pending',
      sent_to_hrm: false
    };
  });

  console.log(`\n📋 Creating campaign with ${appointments.length} appointments...\n`);

  // Check if campaign exists
  const existingSchedule = await HealthCheckSchedule.findOne({ campaign_id: campaignId });

  let schedule;
  if (existingSchedule) {
    console.log('⚠️ Campaign already exists. Updating...');
    existingSchedule.appointments = appointments;
    existingSchedule.total_employees = appointments.length;
    existingSchedule.scheduled_count = appointments.length;
    existingSchedule.pending_count = appointments.filter(a => a.status === 'pending').length;
    existingSchedule.checked_count = appointments.filter(a => a.status === 'checked').length;
    existingSchedule.status = 'in_progress';
    schedule = await existingSchedule.save();
  } else {
    schedule = await HealthCheckSchedule.create({
      campaign_id: campaignId,
      hrm_campaign_name: 'Annual Health Check 2026',
      hrm_campaign_type: 'Annual',
      campaign_start_date: new Date('2026-02-01'),
      campaign_end_date: new Date('2026-03-31'),
      status: 'in_progress',
      appointments,
      total_employees: appointments.length,
      scheduled_count: appointments.length,
      pending_count: appointments.filter(a => a.status === 'pending').length,
      checked_count: appointments.filter(a => a.status === 'checked').length,
      missed_count: 0
    });
  }

  console.log('✅ Campaign created/updated successfully!\n');

  // Create sample health check records for "checked" appointments
  const checkedAppointments = appointments.filter(a => a.status === 'checked');
  
  for (const apt of checkedAppointments) {
    const existingRecord = await HealthCheckRecord.findOne({
      campaign_id: campaignId,
      employee_id: apt.employee_id
    });

    if (!existingRecord) {
      await HealthCheckRecord.create({
        appointment_id: apt.appointment_id,
        campaign_id: campaignId,
        employee_id: apt.employee_id,
        employee_name: apt.employee_name,
        department: apt.department,
        doctor_id: apt.doctor_id,
        doctor_name: apt.doctor_name,
        check_date: apt.scheduled_date,
        check_time: apt.scheduled_time,
        vitals: {
          height: 165 + Math.floor(Math.random() * 20),
          weight: 55 + Math.floor(Math.random() * 30),
          blood_pressure: '120/80',
          heart_rate: 70 + Math.floor(Math.random() * 20),
          temperature: 36.5,
          respiratory_rate: 16,
          oxygen_saturation: 98
        },
        lab_results: {
          blood_test: {
            RBC: 4.5 + Math.random() * 0.5,
            WBC: 6.0 + Math.random() * 2,
            Hb: 13.0 + Math.random() * 2,
            notes: 'Normal'
          }
        },
        health_status: 'Type_1',
        restrictions: [],
        doctor_conclusion: 'Sức khỏe bình thường'
      });
      console.log(`  ✅ Created health record for ${apt.employee_name}`);
    }
  }

  // Log sync
  await SyncLog.create({
    campaign_id: campaignId,
    sync_type: 'auto_sync',
    total_records: appointments.length,
    status: 'completed',
    message: `Seeded ${appointments.length} appointments from HR employees`
  });

  console.log(`\n✅ Health Check Database Seed Completed!\n`);
  console.log('📊 Summary:');
  console.log(`   - Campaign ID: ${campaignId}`);
  console.log(`   - Total Employees: ${appointments.length}`);
  console.log(`   - Pending: ${appointments.filter(a => a.status === 'pending').length}`);
  console.log(`   - Checked: ${checkedAppointments.length}`);
  console.log(`   - Health Records Created: ${checkedAppointments.length}`);
  console.log('\n🔍 You can now view this data in MongoDB Compass at:');
  console.log(`   Database: hospital (or your GATEWAY_MONGO_URI database)`);
  console.log(`   Collections: health_check_schedules, health_check_records, sync_logs\n`);

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error('❌ Seed failed:', error.message);
  process.exit(1);
});
