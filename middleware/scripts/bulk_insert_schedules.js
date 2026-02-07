import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const bulkInsertSchedules = async () => {
    try {
        console.log('🚀 Inserting sample health check schedules...\n');
        
        const MONGO_URI = process.env.MONGO_URI;
        await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        
        const db = mongoose.connection.db;
        const collection = db.collection('health_check_schedules');
        
        // Sample schedules data
        const schedules = [];
        const doctors = [
            { id: "6986b5f0d77af0666666e482", name: "BS. Nguyễn Văn Hùng", spec: "Nội khoa" },
            { id: "6986b5f0d77af0666666e483", name: "BS. Trần Thị Lan", spec: "Ngoại khoa" },
            { id: "6986b5f0d77af0666666e484", name: "BS. Lê Minh Tuấn", spec: "Tim mạch" },
            { id: "6986b5f0d77af0666666e485", name: "BS. Phạm Thị Hoa", spec: "Sản phụ khoa" },
            { id: "6986b5f0d77af0666666e486", name: "BS. Hoàng Văn Nam", spec: "Nhi khoa" },
            { id: "6986b5f0d77af0666666e487", name: "BS. Vũ Thị Mai", spec: "Da liễu" }
        ];
        
        const employees = [
            { id: "1522", name: "John Doe", email: "john.doe@company.com", dept: "IT" },
            { id: "1523", name: "Jane Smith", email: "jane.smith@company.com", dept: "Marketing" },
            { id: "1524", name: "Michael Johnson", email: "michael.johnson@company.com", dept: "Finance" },
            { id: "1525", name: "Emily Williams", email: "emily.williams@company.com", dept: "HR" },
            { id: "1526", name: "David Brown", email: "david.brown@company.com", dept: "Operations" },
            { id: "1527", name: "Sarah Davis", email: "sarah.davis@company.com", dept: "Sales" },
            { id: "1528", name: "James Miller", email: "james.miller@company.com", dept: "IT" },
            { id: "1529", name: "Jennifer Wilson", email: "jennifer.wilson@company.com", dept: "Marketing" },
            { id: "1530", name: "Robert Moore", email: "robert.moore@company.com", dept: "Finance" },
            { id: "1531", name: "Lisa Taylor", email: "lisa.taylor@company.com", dept: "HR" }
        ];
        
        // Create diverse schedules
        let scheduleCount = 0;
        for (let i = 0; i < employees.length; i++) {
            const emp = employees[i];
            const doc = doctors[i % doctors.length];
            
            for (let j = 0; j < 2; j++) { // 2 schedules per employee
                const schedDate = new Date('2026-02-10');
                schedDate.setDate(schedDate.getDate() + (scheduleCount * 2) + j);
                
                const schedule = {
                    employeeId: emp.id,
                    doctorId: doc.id,
                    scheduledDate: schedDate,
                    scheduledTime: `0${8 + (scheduleCount % 8)}:00`,
                    status: scheduleCount % 3 === 0 ? 'completed' : 'scheduled',
                    employeeName: emp.name,
                    employeeEmail: emp.email,
                    employeeDepartment: emp.dept,
                    doctorName: doc.name,
                    checkupType: 'Khám sức khỏe định kỳ',
                    notes: `Lịch khám tự động tạo cho ${emp.name}`,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                
                schedules.push(schedule);
                scheduleCount++;
                
                if (scheduleCount % 5 === 0) {
                    console.log(`   ✓ Prepared ${scheduleCount} schedules...`);
                }
            }
        }
        
        // Insert all at once
        if (schedules.length > 0) {
            const result = await collection.insertMany(schedules);
            console.log(`\n✅ Successfully inserted ${result.insertedIds.length} health check schedules!`);
            console.log(`\n📊 Summary:`);
            console.log(`   - Total schedules: ${result.insertedIds.length}`);
            console.log(`   - Employees covered: ${employees.length}`);
            console.log(`   - Doctors assigned: ${doctors.length}`);
        }
        
        // Show count
        const count = await collection.countDocuments();
        console.log(`\n🔍 Total documents in health_check_schedules: ${count}`);
        
        await mongoose.disconnect();
        console.log('\n✨ Done!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

bulkInsertSchedules();