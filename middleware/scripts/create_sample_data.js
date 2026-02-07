import mongoose from 'mongoose';
import { initializeHealthModels } from '../config/healthDb.js';

// Sample Data Creation for Health Check System
const createSampleData = async () => {
    try {
        console.log('🚀 Starting sample data creation for Health Check System...');
        
        // Initialize health database models
        const models = await initializeHealthModels();
        const { HealthCheckSchedule, EmployeeHealthHistory, AppointmentNotification } = models;
        
        // Clear existing data (optional - uncomment if needed)
        // await HealthCheckSchedule.deleteMany({});
        // await EmployeeHealthHistory.deleteMany({});
        // await AppointmentNotification.deleteMany({});
        
        // Sample Doctors Data (from Hospital System)
        const sampleDoctors = [
            {
                id: "6986b5f0d77af0666666e482",
                name: "BS. Nguyễn Văn Hùng",
                specialization: "Nội khoa"
            },
            {
                id: "6986b5f0d77af0666666e483", 
                name: "BS. Trần Thị Lan",
                specialization: "Ngoại khoa"
            },
            {
                id: "6986b5f0d77af0666666e484",
                name: "BS. Lê Minh Tuấn", 
                specialization: "Tim mạch"
            },
            {
                id: "6986b5f0d77af0666666e485",
                name: "BS. Phạm Thị Hoa",
                specialization: "Sản phụ khoa"
            },
            {
                id: "6986b5f0d77af0666666e486",
                name: "BS. Hoàng Văn Nam",
                specialization: "Nhi khoa"
            },
            {
                id: "6986b5f0d77af0666666e487",
                name: "BS. Vũ Thị Mai",
                specialization: "Da liễu"
            }
        ];
        
        // Sample Employees Data (from HR System)
        const sampleEmployees = [
            {
                employeeId: "1522",
                name: "John Doe",
                email: "john.doe@company.com",
                department: "IT Department"
            },
            {
                employeeId: "1523", 
                name: "Jane Smith",
                email: "jane.smith@company.com",
                department: "Marketing Department"
            },
            {
                employeeId: "1524",
                name: "Michael Johnson", 
                email: "michael.johnson@company.com",
                department: "Finance Department"
            },
            {
                employeeId: "1525",
                name: "Emily Williams",
                email: "emily.williams@company.com", 
                department: "HR Department"
            },
            {
                employeeId: "1526",
                name: "David Brown",
                email: "david.brown@company.com",
                department: "Operations Department"
            }
        ];
        
        // 1. Create Health Check Schedules
        console.log('📅 Creating health check schedules...');
        const schedules = [];
        for (let i = 0; i < sampleEmployees.length; i++) {
            const employee = sampleEmployees[i];
            const doctor = sampleDoctors[i % sampleDoctors.length];
            
            const scheduleDate = new Date();
            scheduleDate.setDate(scheduleDate.getDate() + (i + 1) * 7); // Weekly intervals
            
            const schedule = new HealthCheckSchedule({
                employeeId: employee.employeeId,
                doctorId: doctor.id,
                scheduledDate: scheduleDate,
                scheduledTime: `0${8 + i}:00`,
                status: i < 2 ? 'completed' : 'scheduled',
                employeeName: employee.name,
                employeeEmail: employee.email,
                employeeDepartment: employee.department,
                doctorName: doctor.name,
                checkupType: 'Khám sức khỏe định kỳ',
                notes: `Tự động tạo lịch khám cho nhân viên ${employee.employeeId}`
            });
            
            const savedSchedule = await schedule.save();
            schedules.push(savedSchedule);
        }
        console.log(`✅ Created ${schedules.length} health check schedules`);
        
        // 2. Create Employee Health History (for completed checkups)
        console.log('📋 Creating employee health history...');
        const healthHistories = [];
        for (let i = 0; i < 2; i++) { // Only for completed schedules
            const schedule = schedules[i];
            const employee = sampleEmployees[i];
            const doctor = sampleDoctors[i];
            
            const healthHistory = new EmployeeHealthHistory({
                employeeId: employee.employeeId,
                employeeName: employee.name,
                employeeEmail: employee.email,
                checkupDate: schedule.scheduledDate,
                doctorId: doctor.id,
                doctorName: doctor.name,
                healthStatus: i === 0 ? 'excellent' : 'good',
                vitalSigns: {
                    bmi: 22.5 + (i * 0.5),
                    bloodPressure: {
                        systolic: 120 + (i * 5),
                        diastolic: 80 + (i * 2)
                    },
                    heartRate: 70 + (i * 5),
                    temperature: 36.5 + (i * 0.1),
                    weight: 65 + (i * 5),
                    height: 170 + (i * 5)
                },
                testResults: {
                    bloodTest: {
                        completed: true,
                        results: i === 0 ? 'Bình thường' : 'Cholesterol hơi cao',
                        date: schedule.scheduledDate
                    },
                    urinalysis: {
                        completed: true,
                        results: 'Bình thường',
                        date: schedule.scheduledDate
                    },
                    xray: {
                        completed: i === 0,
                        results: i === 0 ? 'Phổi bình thường' : '',
                        date: i === 0 ? schedule.scheduledDate : null
                    }
                },
                recommendations: i === 0 ? 
                    ['Duy trì chế độ ăn uống lành mạnh', 'Tập thể dục thường xuyên'] :
                    ['Giảm cholesterol trong chế độ ăn', 'Tăng cường vận động', 'Tái khám sau 3 tháng'],
                nextCheckupRequired: true,
                medicalHistory: {
                    allergies: i === 1 ? ['Penicillin'] : [],
                    currentMedications: [],
                    chronicConditions: [],
                    pastSurgeries: []
                }
            });
            
            const savedHistory = await healthHistory.save();
            healthHistories.push(savedHistory);
        }
        console.log(`✅ Created ${healthHistories.length} health history records`);
        
        // 3. Create Appointment Notifications
        console.log('🔔 Creating appointment notifications...');
        const notifications = [];
        for (let i = 0; i < schedules.length; i++) {
            const schedule = schedules[i];
            const employee = sampleEmployees[i];
            
            // Create confirmation notification for each schedule
            const confirmNotification = new AppointmentNotification({
                scheduleId: schedule._id,
                employeeId: employee.employeeId,
                employeeEmail: employee.email,
                employeeName: employee.name,
                notificationType: 'confirmation',
                scheduledDate: schedule.scheduledDate,
                doctorName: schedule.doctorName,
                message: {
                    subject: `Xác nhận: Lịch khám sức khỏe đã được đặt`,
                    body: `Xin chào ${employee.name},\n\nLịch khám sức khỏe của bạn với ${schedule.doctorName} đã được xác nhận cho ngày ${schedule.scheduledDate.toLocaleDateString('vi-VN')} lúc ${schedule.scheduledTime}.\n\nCảm ơn bạn!`
                },
                deliveryStatus: 'delivered',
                isRead: i < 3
            });
            
            const savedConfirm = await confirmNotification.save();
            notifications.push(savedConfirm);
            
            // Create reminder for future appointments
            if (schedule.status === 'scheduled') {
                const reminderNotification = new AppointmentNotification({
                    scheduleId: schedule._id,
                    employeeId: employee.employeeId,
                    employeeEmail: employee.email,
                    employeeName: employee.name,
                    notificationType: 'reminder',
                    scheduledDate: schedule.scheduledDate,
                    doctorName: schedule.doctorName,
                    message: {
                        subject: `Nhắc nhở: Lịch khám sức khỏe ngày ${schedule.scheduledDate.toLocaleDateString('vi-VN')}`,
                        body: `Xin chào ${employee.name},\n\nBạn có lịch khám sức khỏe với ${schedule.doctorName} vào ngày ${schedule.scheduledDate.toLocaleDateString('vi-VN')} lúc ${schedule.scheduledTime}.\n\nVui lòng đến đúng giờ.`,
                        priority: 'high'
                    },
                    deliveryStatus: 'pending'
                });
                
                const savedReminder = await reminderNotification.save();
                notifications.push(savedReminder);
            }
        }
        console.log(`✅ Created ${notifications.length} notifications`);
        
        // Summary
        console.log('\n🎉 Sample data creation completed successfully!');
        console.log('📊 Summary:');
        console.log(`   - Health Check Schedules: ${schedules.length}`);
        console.log(`   - Health History Records: ${healthHistories.length}`);
        console.log(`   - Notifications: ${notifications.length}`);
        console.log('\n🗄️ Database Collections:');
        console.log('   - health_check_schedules');
        console.log('   - employees_health_history');
        console.log('   - appointment_notifications');
        
        return {
            schedules: schedules.length,
            histories: healthHistories.length,
            notifications: notifications.length
        };
        
    } catch (error) {
        console.error('❌ Error creating sample data:', error);
        throw error;
    }
};

// Run sample data creation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    createSampleData()
        .then(() => {
            console.log('✅ Sample data creation completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Sample data creation failed:', error);
            process.exit(1);
        });
}

export { createSampleData };
export default createSampleData;