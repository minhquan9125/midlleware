import dotenv from 'dotenv';
import mongoose from 'mongoose';
import {
  HealthCheckSchedule,
  HealthCheckRecord,
  SyncLog
} from '../models/HealthCheck.js';

dotenv.config();

const mongoUri = process.env.GATEWAY_MONGO_URI || process.env.MONGO_URI;

if (!mongoUri) {
  console.error('Missing GATEWAY_MONGO_URI/MONGO_URI in .env');
  process.exit(1);
}

const campaignId = 20260206;

const run = async () => {
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  const existingSchedule = await HealthCheckSchedule.findOne({ campaign_id: campaignId });

  let schedule = existingSchedule;
  if (!schedule) {
    schedule = await HealthCheckSchedule.create({
      campaign_id: campaignId,
      hrm_campaign_name: 'Annual Health Check 2026',
      hrm_campaign_type: 'Annual',
      campaign_start_date: new Date('2026-02-01'),
      campaign_end_date: new Date('2026-03-31'),
      status: 'scheduled',
      appointments: [
        {
          appointment_id: new mongoose.Types.ObjectId(),
          employee_id: 1,
          employee_name: 'Nguyễn Văn A',
          department: 'Engineering',
          doctor_id: 'doc_001',
          doctor_name: 'Dr. Trần Thị B',
          scheduled_date: new Date('2026-02-06'),
          scheduled_time: '09:00',
          status: 'pending',
          sent_to_hrm: false
        },
        {
          appointment_id: new mongoose.Types.ObjectId(),
          employee_id: 2,
          employee_name: 'Trần Thị C',
          department: 'HR',
          doctor_id: 'doc_001',
          doctor_name: 'Dr. Trần Thị B',
          scheduled_date: new Date('2026-02-06'),
          scheduled_time: '10:00',
          status: 'pending',
          sent_to_hrm: false
        }
      ],
      total_employees: 2,
      scheduled_count: 2,
      pending_count: 2,
      checked_count: 0,
      missed_count: 0
    });
  }

  const recordExists = await HealthCheckRecord.findOne({
    campaign_id: campaignId,
    employee_id: 1
  });

  if (!recordExists) {
    await HealthCheckRecord.create({
      appointment_id: schedule.appointments[0]?.appointment_id,
      campaign_id: campaignId,
      employee_id: 1,
      employee_name: 'Nguyễn Văn A',
      department: 'Engineering',
      doctor_id: 'doc_001',
      doctor_name: 'Dr. Trần Thị B',
      check_date: new Date('2026-02-06'),
      check_time: '09:20',
      vitals: {
        height: 170,
        weight: 65,
        blood_pressure: '120/80',
        heart_rate: 72,
        temperature: 36.6,
        respiratory_rate: 16,
        oxygen_saturation: 98
      },
      lab_results: {
        blood_test: { RBC: 4.7, WBC: 6.8, Hb: 14.2, notes: 'Normal' }
      },
      health_status: 'Type_1',
      restrictions: [],
      doctor_conclusion: 'Sức khỏe bình thường'
    });
  }

  await SyncLog.create({
    campaign_id: campaignId,
    sync_type: 'auto_sync',
    total_records: 2,
    status: 'completed',
    message: 'Seeded health check data'
  });

  await mongoose.disconnect();
  console.log('✅ Seed completed');
};

run().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
