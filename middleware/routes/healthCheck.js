import express from 'express';
import axios from 'axios';
import mongoose from 'mongoose';
import SYSTEMS from '../config/systems.js';
import {
    HealthCheckSchedule,
    HealthCheckRecord,
    SyncLog
} from '../models/HealthCheck.js';

const router = express.Router();

// Helper
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
// OLD Health Check Logic (Local DB driven)
// ============================================

/**
 * GET /api/gateway/health-check/schedule?date=YYYY-MM-DD&campaign_id=1
 */
router.get('/schedule', async (req, res) => {
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
router.post('/campaigns', async (req, res) => {
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
 */
router.get('/campaigns', async (req, res) => {
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
 */
router.get('/due-employees', async (req, res) => {
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
 */
router.post('/sync-to-his', async (req, res) => {
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
 */
router.get('/results', async (req, res) => {
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
 */
router.post('/his/submit-result', async (req, res) => {
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
 */
router.get('/report', async (req, res) => {
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
// NEW SYNC ENDPOINTS (Antigravity)
// ============================================

/**
 * POST /api/gateway/health-check/sync/init
 */
router.post('/sync/init', async (req, res) => {
    const campaign_id = req.body.campaign_id || `campaign_${Date.now()}`;
    const campaign_name = req.body.campaign_name || `Health Check Campaign ${new Date().toISOString()}`;
    
    const log = new SyncLog({
        campaign_id: campaign_id,
        sync_type: 'HRM_to_HIS',
        direction: 'outbound',
        status: 'in_progress',
        initiated_by: 'system'
    });

    try {
        await log.save();

        // 1. Get Due Employees
        console.log('Fetching due employees from HR...');
        const hrUrl = `${SYSTEMS.hr.baseUrl}/api/hrm/health-check/due-employees`;
        const hrResponse = await axios.get(hrUrl, { timeout: 5000 });
        const employees = hrResponse.data;

        if (!employees || employees.length === 0) {
            log.status = 'completed';
            log.details = { message: 'No employees due' };
            log.completed_at = new Date();
            await log.save();
            return res.json({ success: true, message: 'No employees due for health check' });
        }

        // 2. Create Schedule in Hospital
        console.log(`Creating schedule for ${employees.length} employees in Hospital...`);
        const hospitalUrl = `${SYSTEMS.hospital.baseUrl}/api/his/health-check/schedule`;

        const payload = {
            hrm_campaign_id: campaign_id,
            campaign_name: campaign_name,
            employees: employees.map(e => ({
                id: e.id,
                name: (e.firstName || '') + ' ' + (e.lastName || ''),
                department: e.department ? e.department.name : 'Unknown'
            }))
        };

        const hospitalResponse = await axios.post(hospitalUrl, payload, { timeout: 5000 });

        // Update Log
        log.status = 'completed';
        log.records_count = employees.length;
        log.successful_count = employees.length;
        log.completed_at = new Date();
        log.details = { hospital_response: hospitalResponse.data };
        await log.save();

        res.json({
            success: true,
            message: 'Sync Init Completed',
            synced_count: employees.length,
            hospital_response: hospitalResponse.data
        });

    } catch (error) {
        console.error('Sync Init Error:', error.message);
        log.status = 'failed';
        log.error_message = error.message;
        log.completed_at = new Date();
        await log.save();
        res.status(500).json({ success: false, message: error.message, stack: error.stack });
    }
});

/**
 * POST /api/gateway/health-check/sync/results
 */
router.post('/sync/results', async (req, res) => {
    const log = new SyncLog({
        campaign_id: req.body.campaign_id || 'general_sync',
        sync_type: 'HIS_to_HRM',
        direction: 'outbound',
        status: 'in_progress',
        initiated_by: 'system'
    });

    try {
        await log.save();
        // 1. Get Completed from Hospital
        const hospitalUrl = `${SYSTEMS.hospital.baseUrl}/api/his/health-check/schedule`;
        const hospitalResponse = await axios.get(hospitalUrl, { timeout: 5000 });

        const allAppointments = hospitalResponse.data.data || [];
        const completed = allAppointments.filter(a => a.status === 'completed' && a.result);

        if (completed.length === 0) {
            log.status = 'completed';
            log.details = { message: 'No new results' };
            log.completed_at = new Date();
            await log.save();
            return res.json({ success: true, message: 'No new completed results to sync' });
        }

        // 2. Send to HR
        let syncedCount = 0;
        const hrResultUrl = `${SYSTEMS.hr.baseUrl}/api/hrm/health-check/results`;

        for (const apt of completed) {
            const resultPayload = {
                employeeId: apt.employee_id,
                checkDate: apt.result.check_date || new Date().toISOString().split('T')[0],
                healthStatus: apt.result.health_status,
                doctorConclusion: apt.result.doctor_conclusion
            };

            try {
                await axios.post(hrResultUrl, resultPayload, { timeout: 3000 });
                syncedCount++;
            } catch (err) {
                console.error(`Failed to sync result for emp ${apt.employee_id}:`, err.message);
            }
        }

        log.status = 'completed';
        log.records_count = completed.length;
        log.successful_count = syncedCount;
        log.failed_count = completed.length - syncedCount;
        log.completed_at = new Date();
        await log.save();

        res.json({
            success: true,
            message: 'Sync Results Completed',
            total_found: completed.length,
            synced_success: syncedCount
        });

    } catch (error) {
        console.error('Sync Results Error:', error.message);
        log.status = 'failed';
        log.error_message = error.message;
        log.completed_at = new Date();
        await log.save();
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
