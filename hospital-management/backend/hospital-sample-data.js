// ==================================================
// HOSPITAL SYSTEM - DỮ LIỆU MẪU (SAMPLE DATA)  
// ==================================================
// Script tạo dữ liệu mẫu cho hệ thống bệnh viện MongoDB
// Chạy: node hospital-sample-data.js

import mongoose from 'mongoose';

// Kết nối MongoDB (thay đổi connection string nếu cần)
const MONGO_URI = 'mongodb+srv://nhathuyphan21_db_user:123@cluster0.tke6n1k.mongodb.net/hospital?retryWrites=true&w=majority&appName=Cluster0';

// Schema definitions (giống như trong models)  
const doctorSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, sparse: true },
    specialization: { type: String, required: true },
    department: { type: String, default: "General" },
    Experience: { type: String, required: true },
    availability: { type: String, default: "Available" },
    phone: { type: String },
    address: { type: String },
    qualification: { type: String, default: "MBBS" },
    consultationFee: { type: Number, default: 500 },
    rating: { type: Number, default: 4.0, min: 0, max: 5 }
});

const checkupSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    patientName: { type: String, required: true },
    patientId: { type: String, required: true },
    doctorId: { type: Number, required: true },
    doctorName: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    type: { type: String, required: true },
    status: { type: String, default: "Scheduled" },
    notes: { type: String },
    department: { type: String, required: true }
});

const healthCheckScheduleSchema = new mongoose.Schema({
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    email: { type: String, required: true },
    department: { type: String, required: true },
    doctorId: { type: Number, required: true },
    doctorName: { type: String, required: true },
    scheduledDate: { type: Date, required: true },
    scheduledTime: { type: String, required: true },
    checkupType: { type: String, default: "Health Checkup" },
    status: { type: String, default: "Scheduled" },
    notes: { type: String },
    createdBy: { type: String, default: "System" },
    createdAt: { type: Date, default: Date.now }
});

// Tạo models
const Doctor = mongoose.model('Doctor', doctorSchema);
const Checkup = mongoose.model('Checkup', checkupSchema); 
const HealthCheckSchedule = mongoose.model('HealthCheckSchedule', healthCheckScheduleSchema);

async function createSampleData() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Xóa dữ liệu cũ
        console.log('🗑️ Clearing old data...');
        await Doctor.deleteMany({});
        await Checkup.deleteMany({});
        await HealthCheckSchedule.deleteMany({});
        console.log('✅ Old data cleared');

        // ==================================================
        // 1. TẠO DANH SÁCH BÁC SĨ
        // ==================================================
        console.log('👨‍⚕️ Creating doctors...');
        const doctors = [
            {
                id: 1,
                name: "BS. Nguyễn Văn Hùng", 
                email: "bs.nguyenvanhung@hospital.com",
                specialization: "Nội khoa",
                department: "Khoa Nội",
                Experience: "8 năm",
                availability: "Available", 
                phone: "0901234567",
                qualification: "Thạc sĩ Y học",
                consultationFee: 300000,
                rating: 4.8
            },
            {
                id: 2,
                name: "BS. Trần Thị Lan",
                email: "bs.tranthilan@hospital.com", 
                specialization: "Ngoại khoa",
                department: "Khoa Ngoại",
                Experience: "10 năm",
                availability: "Available",
                phone: "0901234568", 
                qualification: "Tiến sĩ Y học",
                consultationFee: 400000,
                rating: 4.9
            },
            {
                id: 3,
                name: "BS. Lê Minh Tuấn",
                email: "bs.leminhtuan@hospital.com",
                specialization: "Tim mạch", 
                department: "Khoa Tim mạch",
                Experience: "12 năm",
                availability: "Available",
                phone: "0901234569",
                qualification: "Chuyên khoa II Tim mạch",
                consultationFee: 500000,
                rating: 4.7
            },
            {
                id: 4, 
                name: "BS. Phạm Thị Hoa",
                email: "bs.phamthihoa@hospital.com",
                specialization: "Sản phụ khoa",
                department: "Khoa Sản", 
                Experience: "9 năm",
                availability: "Available",
                phone: "0901234570",
                qualification: "Thạc sĩ Sản phụ khoa", 
                consultationFee: 350000,
                rating: 4.6
            },
            {
                id: 5,
                name: "BS. Hoàng Văn Nam",
                email: "bs.hoangvannam@hospital.com",
                specialization: "Nhi khoa",
                department: "Khoa Nhi", 
                Experience: "7 năm", 
                availability: "Available",
                phone: "0901234571",
                qualification: "Chuyên khoa I Nhi khoa",
                consultationFee: 250000,
                rating: 4.5
            },
            {
                id: 6,
                name: "BS. Vũ Thị Mai",
                email: "bs.vuthimai@hospital.com",
                specialization: "Da liễu", 
                department: "Khoa Da liễu",
                Experience: "6 năm",
                availability: "Available", 
                phone: "0901234572",
                qualification: "Thạc sĩ Da liễu",
                consultationFee: 280000,
                rating: 4.4
            }
        ];

        await Doctor.insertMany(doctors);
        console.log(`✅ Created ${doctors.length} doctors`);

        // ==================================================
        // 2. TẠO CÁC LỊCH KHÁM MẪU  
        // ==================================================
        console.log('📅 Creating sample checkups...');
        const checkups = [
            {
                id: 1,
                patientName: "Nguyễn Văn An",
                patientId: "EMP001", 
                doctorId: 1,
                doctorName: "BS. Nguyễn Văn Hùng",
                date: new Date('2024-03-15'),
                time: "09:00",
                type: "Khám tổng quát",
                status: "Scheduled", 
                department: "Khoa Nội",
                notes: "Khám sức khỏe định kỳ"
            },
            {
                id: 2,
                patientName: "Trần Thị Bích", 
                patientId: "EMP002",
                doctorId: 4,
                doctorName: "BS. Phạm Thị Hoa", 
                date: new Date('2024-03-16'),
                time: "10:30", 
                type: "Khám sản phụ khoa",
                status: "Scheduled",
                department: "Khoa Sản",
                notes: "Khám định kỳ cho nữ nhân viên"
            },
            {
                id: 3,
                patientName: "Ngô Thanh Hải",
                patientId: "EMP008",
                doctorId: 3, 
                doctorName: "BS. Lê Minh Tuấn",
                date: new Date('2024-03-17'), 
                time: "14:00",
                type: "Khám tim mạch", 
                status: "Completed",
                department: "Khoa Tim mạch",
                notes: "Khám do có triệu chứng đau ngực"
            }
        ];

        await Checkup.insertMany(checkups);
        console.log(`✅ Created ${checkups.length} checkups`);

        // ==================================================
        // 3. TẠO LỊCH KHÁM SỨC KHỎE ĐỊNH KỲ
        // ==================================================
        console.log('🏥 Creating health check schedules...');
        const schedules = [
            {
                employeeId: "1",
                employeeName: "Nguyễn Văn An", 
                email: "nguyen.van.an@company.com",
                department: "Phòng Nhân sự",
                doctorId: 1,
                doctorName: "BS. Nguyễn Văn Hùng",
                scheduledDate: new Date('2024-04-01'), 
                scheduledTime: "09:00",
                checkupType: "Health Checkup",
                status: "Scheduled",
                notes: "Lịch khám định kỳ tự động từ HR system"
            },
            {
                employeeId: "4", 
                employeeName: "Phạm Thị Linh",
                email: "pham.thi.linh@company.com", 
                department: "Phòng Tài chính",
                doctorId: 2,
                doctorName: "BS. Trần Thị Lan",
                scheduledDate: new Date('2024-04-02'),
                scheduledTime: "10:30", 
                checkupType: "Health Checkup",
                status: "Scheduled", 
                notes: "Lịch khám định kỳ tự động từ HR system"
            }
        ];

        await HealthCheckSchedule.insertMany(schedules); 
        console.log(`✅ Created ${schedules.length} health check schedules`);

        // ==================================================
        // 4. THỐNG KÊ DỮ LIỆU VỪA TẠO
        // ==================================================  
        console.log('\n📊 === THỐNG KÊ DỮ LIỆU MẪU ===');
        const doctorCount = await Doctor.countDocuments();
        const checkupCount = await Checkup.countDocuments();
        const scheduleCount = await HealthCheckSchedule.countDocuments();
        
        console.log(`👨‍⚕️ Bác sĩ: ${doctorCount}`);
        console.log(`📅 Lịch khám: ${checkupCount}`);  
        console.log(`🏥 Lịch khám định kỳ: ${scheduleCount}`);
        
        console.log('\n📋 === DANH SÁCH BÁC SĨ ==='); 
        const doctorList = await Doctor.find({}, 'name specialization department').sort({ id: 1 });
        doctorList.forEach(doc => {
            console.log(`${doc.name} - ${doc.specialization} (${doc.department})`);
        });

        console.log('\n🎉 === TẠO DỮ LIỆU THÀNH CÔNG ===');
        console.log('Hệ thống Hospital đã có dữ liệu mẫu đầy đủ!');
        console.log('Có thể test API tại: http://localhost:5000');

    } catch (error) {
        console.error('❌ Lỗi tạo dữ liệu:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Chạy script
createSampleData();