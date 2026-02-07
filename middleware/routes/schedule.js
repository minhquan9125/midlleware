import express from 'express';
import axios from 'axios';
import SYSTEMS from '../config/systems.js';

const router = express.Router();

const parseScheduledDate = (value) => {
    if (!value || typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    // ISO datetime-local (YYYY-MM-DDTHH:mm) or ISO date (YYYY-MM-DD)
    if (trimmed.includes('T') || trimmed.includes('-')) {
        const dt = new Date(trimmed);
        return Number.isNaN(dt.getTime()) ? null : dt;
    }

    // Fallback for dd/MM/yyyy [HH:mm] [AM/PM or SA/CH]
    const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?(?:\s*(AM|PM|SA|CH))?$/i);
    if (!match) {
        return null;
    }

    const day = Number(match[1]);
    const month = Number(match[2]) - 1;
    const year = Number(match[3]);
    let hour = match[4] ? Number(match[4]) : 8;
    const minute = match[5] ? Number(match[5]) : 0;
    const meridiem = match[6] ? match[6].toUpperCase() : null;

    if (meridiem === 'PM' || meridiem === 'CH') {
        if (hour < 12) hour += 12;
    }
    if (meridiem === 'AM' || meridiem === 'SA') {
        if (hour === 12) hour = 0;
    }

    const dt = new Date(year, month, day, hour, minute, 0, 0);
    return Number.isNaN(dt.getTime()) ? null : dt;
};

/**
 * POST /api/gateway/schedule/auto-create-checkups
 * Tự động tạo lịch khám cho nhân sự từ HR System
 */
router.post('/auto-create-checkups', async (req, res) => {
    try {
        const { 
            doctorId, 
            checkupType = 'Khám sức khỏe định kỳ', 
            scheduledDate,
            department = 'all'
        } = req.body;

        if (!doctorId || !scheduledDate) {
            return res.status(400).json({
                code: 1,
                message: 'Thiếu thông tin bác sĩ hoặc ngày khám',
                success: false
            });
        }

        const baseDate = parseScheduledDate(scheduledDate);
        if (!baseDate) {
            return res.status(400).json({
                code: 1,
                message: 'Ngày khám không hợp lệ. Dùng định dạng YYYY-MM-DDTHH:mm',
                success: false,
                received: scheduledDate
            });
        }

        // 1. Lấy danh sách nhân viên từ Hospital System
        const employeesResponse = await axios.get(
            `${SYSTEMS.hospital.baseUrl}/api/employees/third-party/all`,
            {
                params: { token: SYSTEMS.hospital.auth.token },
                timeout: 10000
            }
        );

        const employees = employeesResponse.data.data || employeesResponse.data;
        let filteredEmployees = employees;

        // Lọc theo phòng ban nếu được chỉ định
        if (department !== 'all') {
            filteredEmployees = employees.filter(emp => 
                emp.department && emp.department.toLowerCase().includes(department.toLowerCase())
            );
        }

        console.log(`Tạo lịch khám cho ${filteredEmployees.length} nhân viên`);

        // 2. Tạo lịch khám cho từng nhân viên
        const createdAppointments = [];
        const failedAppointments = [];

        for (const employee of filteredEmployees) {
            try {
                // Tính toán thời gian khám (mỗi người cách nhau 30 phút)
                const appointmentTime = new Date(baseDate);
                appointmentTime.setMinutes(appointmentTime.getMinutes() + (createdAppointments.length * 30));

                const appointmentData = {
                    patientName: employee.name || employee.fullName || `${employee.firstName} ${employee.lastName}`,
                    email: employee.email,
                    phone: employee.phone || employee.phoneNumber || '',
                    date: appointmentTime.toISOString().split('T')[0], // YYYY-MM-DD
                    time: appointmentTime.toTimeString().split(' ')[0].substring(0, 5), // HH:MM
                    doctorId: doctorId,
                    department: employee.department || 'Khám tổng quát',
                    reason: `${checkupType} cho nhân viên ${employee.employeeId || employee.id}`,
                    employeeId: employee.employeeId || employee.id,
                    notes: `Tự động tạo từ Hospital System - Phòng ban: ${employee.department || 'N/A'}`
                };

                // Gửi request tạo lịch khám đến Hospital System
                const bookingResponse = await axios.post(
                    `${SYSTEMS.hospital.baseUrl}/api/checkup/book`,
                    appointmentData,
                    {
                        timeout: 5000,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                createdAppointments.push({
                    employee: employee.name || `${employee.firstName} ${employee.lastName}`,
                    employeeId: employee.employeeId || employee.id,
                    appointmentTime: appointmentTime,
                    status: 'success'
                });

                // Delay để tránh quá tải server
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (bookingError) {
                console.error(`Lỗi tạo lịch cho ${employee.name}:`, bookingError.message);
                failedAppointments.push({
                    employee: employee.name || `${employee.firstName} ${employee.lastName}`,
                    employeeId: employee.employeeId || employee.id,
                    error: bookingError.message,
                    status: 'failed'
                });
            }
        }

        // 3. Gửi thông báo đến bác sĩ (có thể mở rộng sau)
        const doctorNotification = {
            doctorId: doctorId,
            message: `Đã tự động tạo ${createdAppointments.length} lịch khám sức khỏe định kỳ cho nhân viên`,
            date: new Date().toISOString(),
            type: 'schedule_created'
        };

        res.json({
            code: 0,
            message: 'Đã tự động tạo lịch khám thành công',
            success: true,
            data: {
                summary: {
                    totalEmployees: filteredEmployees.length,
                    successCount: createdAppointments.length,
                    failedCount: failedAppointments.length,
                    doctorId: doctorId,
                    scheduledDate: scheduledDate,
                    checkupType: checkupType
                },
                createdAppointments: createdAppointments,
                failedAppointments: failedAppointments,
                doctorNotification: doctorNotification
            }
        });

    } catch (error) {
        const errorMessage = error?.message || 'Unknown error';
        console.error('Lỗi auto-create-checkups:', errorMessage);
        res.status(500).json({
            code: 5,
            message: `Lỗi hệ thống: ${errorMessage}`,
            success: false,
            error: errorMessage,
            details: error?.stack?.split('\n')[0]
        });
    }
});

/**
 * POST /api/gateway/schedule/schedule-health-checkup
 * Lên lịch khám sức khỏe định kỳ theo cron job
 */
router.post('/schedule-health-checkup', async (req, res) => {
    try {
        const {
            doctorId,
            frequency = 'monthly', // weekly, monthly, quarterly, yearly
            dayOfWeek = 1, // 1 = Monday, 2 = Tuesday, etc.
            timeSlot = '08:00',
            department = 'all',
            enabled = true
        } = req.body;

        // Tính toán ngày khám tiếp theo
        const nextDate = calculateNextCheckupDate(frequency, dayOfWeek);
        const scheduledDateTime = new Date(`${nextDate}T${timeSlot}:00`);

        // Lưu lịch trình vào database (có thể mở rộng với MongoDB)
        const scheduleConfig = {
            id: `schedule_${Date.now()}`,
            doctorId,
            frequency,
            dayOfWeek,
            timeSlot,
            department,
            enabled,
            nextScheduledDate: scheduledDateTime,
            createdAt: new Date(),
            lastExecuted: null
        };

        res.json({
            code: 0,
            message: 'Đã thiết lập lịch khám sức khỏe định kỳ',
            success: true,
            data: {
                schedule: scheduleConfig,
                nextExecution: scheduledDateTime,
                description: getScheduleDescription(frequency, dayOfWeek, timeSlot)
            }
        });

    } catch (error) {
        console.error('Lỗi schedule-health-checkup:', error.message);
        res.status(500).json({
            code: 5,
            message: `Lỗi hệ thống: ${error.message}`,
            success: false
        });
    }
});

/**
 * GET /api/gateway/schedule/upcoming-checkups
 * Lấy danh sách lịch khám sắp tới
 */
router.get('/upcoming-checkups/:doctorId', async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { days = 7 } = req.query; // Lấy lịch trong 7 ngày tới

        // Lấy lịch khám từ Hospital System (cần mở rộng API)
        // Hiện tại trả về mock data
        const upcomingCheckups = [
            {
                date: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0],
                time: '08:00',
                patientCount: 5,
                type: 'Khám sức khỏe định kỳ',
                department: 'IT Department'
            }
        ];

        res.json({
            code: 0,
            message: 'Danh sách lịch khám sắp tới',
            success: true,
            data: {
                doctorId,
                days,
                upcomingCheckups
            }
        });

    } catch (error) {
        res.status(500).json({
            code: 5,
            message: `Lỗi hệ thống: ${error.message}`,
            success: false
        });
    }
});

// Helper functions
function calculateNextCheckupDate(frequency, dayOfWeek) {
    const now = new Date();
    const today = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    let daysUntilTarget = (dayOfWeek - today + 7) % 7;
    if (daysUntilTarget === 0) daysUntilTarget = 7; // Next week if today is the target day
    
    const nextDate = new Date(now);
    
    switch (frequency) {
        case 'weekly':
            nextDate.setDate(now.getDate() + daysUntilTarget);
            break;
        case 'monthly':
            nextDate.setMonth(now.getMonth() + 1);
            nextDate.setDate(1); // First of next month
            nextDate.setDate(nextDate.getDate() + daysUntilTarget - 1);
            break;
        case 'quarterly':
            nextDate.setMonth(now.getMonth() + 3);
            nextDate.setDate(1);
            nextDate.setDate(nextDate.getDate() + daysUntilTarget - 1);
            break;
        case 'yearly':
            nextDate.setFullYear(now.getFullYear() + 1);
            nextDate.setMonth(0, 1); // January 1st
            nextDate.setDate(nextDate.getDate() + daysUntilTarget - 1);
            break;
        default:
            nextDate.setDate(now.getDate() + 7); // Default to weekly
    }
    
    return nextDate.toISOString().split('T')[0];
}

function getScheduleDescription(frequency, dayOfWeek, timeSlot) {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = days[dayOfWeek];
    
    const frequencyText = {
        'weekly': 'hàng tuần',
        'monthly': 'hàng tháng', 
        'quarterly': 'hàng quý',
        'yearly': 'hàng năm'
    };
    
    return `Khám sức khỏe ${frequencyText[frequency]} vào ${dayName} lúc ${timeSlot}`;
}

/**
 * POST /api/gateway/schedule/auto-checkup-overdue
 * Tự động tạo lịch khám cho nhân viên chưa khám trong 6 tháng
 */
router.post('/auto-checkup-overdue', async (req, res) => {
    try {
        console.log('🏥 === BẮT ĐẦU KIỂM TRA NHÂN VIÊN CẦN KHÁM ===');
        
        // 1. Lấy danh sách tất cả nhân viên từ Hospital system (thay vì HR)
        console.log('📋 Đang lấy danh sách nhân viên từ Hospital...');
        let allEmployees = [];
        try {
            const employeesResponse = await axios.get(`${SYSTEMS.hospital.baseUrl}/api/employees/third-party/all`, {
                params: { token: SYSTEMS.hospital.auth.token },
                timeout: 10000
            });
            allEmployees = employeesResponse.data.data || employeesResponse.data || [];
        } catch (hospitalError) {
            console.warn('⚠️ Cảnh báo: Không thể kết nối Hospital System:', hospitalError.message);
            return res.status(503).json({
                code: 9,
                message: 'Không thể kết nối đến Hospital System',
                success: false,
                error: hospitalError.message,
                hint: 'Vui lòng kiểm tra Hospital System đang chạy trên ' + SYSTEMS.hospital.baseUrl
            });
        }
        
        console.log(`👥 Tìm thấy ${allEmployees.length} nhân viên`);
        
        // 2. Lấy danh sách bác sĩ từ Hospital system  
        console.log('👨‍⚕️ Đang lấy danh sách bác sĩ...');
        let availableDoctors = [];
        try {
            const doctorsResponse = await axios.get(`${SYSTEMS.hospital.baseUrl}/api/doctors`, {
                params: { token: SYSTEMS.hospital.auth.token },
                timeout: 10000
            });
            
            const apiResponse = doctorsResponse.data;
            availableDoctors = apiResponse.data || apiResponse || []; // Handle both wrapped and unwrapped responses
        } catch (hospitalError) {
            console.warn('⚠️ Cảnh báo: Không thể lấy bác sĩ từ Hospital System:', hospitalError.message);
            return res.status(503).json({
                code: 9,
                message: 'Không thể lấy danh sách bác sĩ từ Hospital System',
                success: false,
                error: hospitalError.message,
                hint: 'Vui lòng kiểm tra Hospital System đang chạy trên ' + SYSTEMS.hospital.baseUrl
            });
        }
        
        console.log(`🏥 Tìm thấy ${availableDoctors.length} bác sĩ`);
        
        // 3. Tính toán ngày 6 tháng trước
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        console.log(`📅 Kiểm tra nhân viên chưa khám từ: ${sixMonthsAgo.toLocaleDateString('vi-VN')}`);
        
        // 4. Lọc nhân viên cần khám (chưa khám trong 6 tháng)
        const employeesNeedingCheckup = allEmployees.filter(employee => {
            if (!employee.lastHealthCheckDate) {
                return true; // Chưa khám lần nào
            }
            
            const lastCheckDate = new Date(employee.lastHealthCheckDate);
            return lastCheckDate < sixMonthsAgo; // Khám lần cuối > 6 tháng trước
        });
        
        console.log(`⚠️ ${employeesNeedingCheckup.length} nhân viên cần khám sức khỏe:`);
        employeesNeedingCheckup.forEach((emp, index) => {
            const lastCheck = emp.lastHealthCheckDate ? new Date(emp.lastHealthCheckDate).toLocaleDateString('vi-VN') : 'Chưa từng khám';
            console.log(`   ${index + 1}. ${emp.firstName} ${emp.lastName} - Khám cuối: ${lastCheck}`);
        });
        
        if (employeesNeedingCheckup.length === 0) {
            return res.json({
                code: 0,
                message: 'Tất cả nhân viên đều đã khám sức khỏe trong 6 tháng gần đây',
                success: true,
                data: {
                    totalEmployees: allEmployees.length,
                    employeesNeedingCheckup: 0,
                    schedulesCreated: 0,
                    checkDate: sixMonthsAgo.toLocaleDateString('vi-VN')
                }
            });
        }
        
        if (availableDoctors.length === 0) {
            return res.status(400).json({
                code: 1,
                message: 'Không có bác sĩ nào trong hệ thống để đặt lịch',
                success: false
            });
        }
        
        // 5. Tự động phân bổ lịch khám
        const createdSchedules = [];
        const failedSchedules = [];
        let doctorIndex = 0;
        
        for (let i = 0; i < employeesNeedingCheckup.length; i++) {
            const employee = employeesNeedingCheckup[i];
            
            // Chọn bác sĩ theo vòng tròn để phân bổ đều
            const assignedDoctor = availableDoctors[doctorIndex % availableDoctors.length];
            doctorIndex++;
            
            // Tính ngày khám (từ ngày mai, mỗi ngày 1 người)
            const scheduleDate = new Date();
            scheduleDate.setDate(scheduleDate.getDate() + i + 1);
            
            // Tính giờ khám (8:00 - 16:00, mỗi tiếng 1 lượt)  
            const scheduleHour = 8 + (i % 9); // 8:00, 9:00, ..., 16:00
            const scheduleTime = `${scheduleHour.toString().padStart(2, '0')}:00`;
            
            try {
                // 6. Tạo lịch hẹn trong Hospital system
                const appointmentData = {
                    patientName: `${employee.firstName} ${employee.lastName}`,
                    patientId: `EMP${employee.id}`,
                    email: employee.email,
                    phone: employee.phone || '',
                    date: scheduleDate.toISOString().split('T')[0], // YYYY-MM-DD
                    time: scheduleTime,
                    doctorId: assignedDoctor.id,
                    department: assignedDoctor.department || "Khoa Khám tổng quát",
                    reason: "Khám sức khỏe định kỳ - Tự động từ hệ thống",
                    notes: `Lý do: Nhân viên chưa khám trong 6 tháng. Lần khám cuối: ${employee.lastHealthCheckDate || 'Chưa từng khám'}`
                };
                
                const appointmentResponse = await axios.post(`${SYSTEMS.hospital.baseUrl}/api/checkup/book`, appointmentData, {
                    timeout: 10000,
                    headers: { 'Content-Type': 'application/json' }
                });
                
                console.log(`✅ [${i + 1}/${employeesNeedingCheckup.length}] ${employee.firstName} ${employee.lastName} → ${assignedDoctor.name} (${scheduleDate.toLocaleDateString('vi-VN')} ${scheduleTime})`);
                
                createdSchedules.push({
                    employee: `${employee.firstName} ${employee.lastName}`,
                    employeeId: employee.id,
                    email: employee.email,
                    lastHealthCheck: employee.lastHealthCheckDate || 'Chưa từng khám',
                    monthsOverdue: employee.lastHealthCheckDate ? 
                        Math.floor((new Date() - new Date(employee.lastHealthCheckDate)) / (1000 * 60 * 60 * 24 * 30)) : '>12',
                    doctorName: assignedDoctor.name,
                    department: assignedDoctor.department,
                    scheduledDate: scheduleDate.toLocaleDateString('vi-VN'),
                    scheduledTime: scheduleTime,
                    appointmentId: appointmentResponse.data?.id || 'Generated'
                });
                
            } catch (error) {
                console.error(`❌ [${i + 1}/${employeesNeedingCheckup.length}] Lỗi tạo lịch cho ${employee.firstName} ${employee.lastName}:`, error.message);
                
                failedSchedules.push({
                    employee: `${employee.firstName} ${employee.lastName}`,
                    employeeId: employee.id,  
                    error: error.message,
                    lastHealthCheck: employee.lastHealthCheckDate || 'Chưa từng khám'
                });
            }
            
            // Nghỉ nhỏ để tránh quá tải server
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // 7. Tổng hợp kết quả
        const successCount = createdSchedules.length;
        const failedCount = failedSchedules.length;
        
        console.log(`🎉 === KẾT QUẢ TẠO LỊCH KHÁM ===`);
        console.log(`✅ Thành công: ${successCount}/${employeesNeedingCheckup.length}`);
        console.log(`❌ Thất bại: ${failedCount}/${employeesNeedingCheckup.length}`);
        
        res.json({
            code: 0,
            message: `Đã tự động tạo lịch khám cho ${successCount} nhân viên cần khám sức khỏe`,
            success: true,
            data: {
                summary: {
                    totalEmployees: allEmployees.length,
                    employeesNeedingCheckup: employeesNeedingCheckup.length,
                    schedulesCreated: successCount,
                    schedulesFailed: failedCount,
                    availableDoctors: availableDoctors.length,
                    checkFromDate: sixMonthsAgo.toLocaleDateString('vi-VN')
                },
                createdSchedules: createdSchedules,
                failedSchedules: failedSchedules,
                doctorsList: availableDoctors.map(doc => ({
                    id: doc.id,
                    name: doc.name,
                    specialization: doc.specialization,
                    department: doc.department
                }))
            }
        });
        
    } catch (error) {
        console.error('❌ Lỗi kiểm tra và tạo lịch khám tự động:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({
            code: 5,
            message: 'Lỗi khi kiểm tra và tạo lịch khám cho nhân viên cần khám',
            success: false,
            error: error.message,
            details: error.stack.split('\n').slice(0, 3).join(' | ')
        });
    }
});

/**
 * GET /api/gateway/schedule/doctors
 * Lấy danh sách bác sĩ từ Hospital System
 */
router.get('/doctors', async (req, res) => {
    try {
        console.log('🏥 Đang lấy danh sách bác sĩ từ Hospital System...');
        
        // Lấy danh sách bác sĩ từ Hospital System với JWT token
        const doctorsResponse = await axios.get(
            `${SYSTEMS.hospital.baseUrl}/api/doctors`,
            {
                params: { token: process.env.HOSPITAL_JWT_TOKEN },
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        const doctorsData = doctorsResponse.data;
        
        if (doctorsData.success && doctorsData.data) {
            console.log(`✅ Lấy thành công ${doctorsData.data.length} bác sĩ`);
            
            res.json({
                code: 0,
                message: 'Lấy danh sách bác sĩ thành công',
                success: true,
                data: {
                    count: doctorsData.data.length,
                    doctors: doctorsData.data.map(doctor => ({
                        id: doctor._id,
                        name: doctor.name,
                        specialization: doctor.specialization,
                        department: doctor.department,
                        phone: doctor.phone,
                        email: doctor.email,
                        consultationFee: doctor.consultationFee,
                        rating: doctor.rating,
                        experience: doctor.experience
                    }))
                }
            });
        } else {
            console.log('⚠️ Hospital System trả về dữ liệu không hợp lệ');
            res.status(400).json({
                code: 1,
                message: 'Không thể lấy danh sách bác sĩ',
                success: false
            });
        }

    } catch (error) {
        console.error('❌ Lỗi khi lấy danh sách bác sĩ:', error.message);
        res.status(500).json({
            code: 5,
            message: 'Lỗi khi kết nối Hospital System để lấy danh sách bác sĩ',
            success: false,
            error: error.message
        });
    }
});

export default router;