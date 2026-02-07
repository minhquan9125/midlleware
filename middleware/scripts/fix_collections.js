import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const fixCollections = async () => {
    try {
        console.log('🔧 Starting collection fix...');
        
        const MONGO_URI = process.env.MONGO_URI;
        if (!MONGO_URI) {
            throw new Error('MONGO_URI not configured');
        }
        
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB');
        
        const db = mongoose.connection.db;
        
        // Get existing collections
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(col => col.name);
        
        console.log('📋 Existing collections:', collectionNames);
        
        // List of old collection names to delete
        const oldCollections = ['healthcheckschedules', 'employeeshealthhistory', 'appointmentnotifications'];
        
        // Delete old collections
        for (const oldName of oldCollections) {
            if (collectionNames.includes(oldName)) {
                console.log(`🗑️  Deleting old collection: ${oldName}...`);
                await db.dropCollection(oldName);
                console.log(`✅ Deleted: ${oldName}`);
            }
        }
        
        // Insert sample document to create new collections with correct names
        console.log('\n📝 Creating new collections with correct names...');
        
        // Insert into health_check_schedules
        const scheduleDoc = {
            employeeId: 'EMP001',
            doctorId: 'DOC001',
            scheduledDate: new Date('2026-02-15'),
            scheduledTime: '09:00',
            status: 'scheduled',
            employeeName: 'Sample Employee',
            employeeEmail: 'employee@company.com',
            employeeDepartment: 'IT',
            doctorName: 'BS. Sample Doctor',
            checkupType: 'Khám sức khỏe định kỳ',
            notes: 'Sample schedule',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const scheduleResult = await db.collection('health_check_schedules').insertOne(scheduleDoc);
        console.log('✅ Inserted sample into health_check_schedules');
        
        // Insert into employees_health_history
        const historyDoc = {
            employeeId: 'EMP001',
            employeeName: 'Sample Employee',
            employeeEmail: 'employee@company.com',
            checkupDate: new Date('2025-08-15'),
            doctorId: 'DOC001',
            doctorName: 'BS. Sample Doctor',
            healthStatus: 'good',
            vitalSigns: {
                bmi: 22.5,
                bloodPressure: { systolic: 120, diastolic: 80 },
                heartRate: 72,
                temperature: 36.5,
                weight: 70,
                height: 175
            },
            testResults: {
                bloodTest: { completed: true, results: 'Bình thường', date: new Date('2025-08-15') }
            },
            recommendations: ['Duy trì chế độ ăn uống lành mạnh'],
            nextCheckupRequired: true,
            nextCheckupDate: new Date('2026-02-15'),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const historyResult = await db.collection('employees_health_history').insertOne(historyDoc);
        console.log('✅ Inserted sample into employees_health_history');
        
        // Insert into appointment_notifications
        const notificationDoc = {
            scheduleId: scheduleResult.insertedId,
            employeeId: 'EMP001',
            employeeEmail: 'employee@company.com',
            employeeName: 'Sample Employee',
            notificationType: 'confirmation',
            scheduledDate: new Date('2026-02-15'),
            doctorName: 'BS. Sample Doctor',
            message: {
                subject: 'Xác nhận lịch khám sức khỏe',
                body: 'Lịch khám của bạn đã được xác nhận',
                priority: 'normal'
            },
            sentAt: new Date(),
            isRead: false,
            deliveryMethod: 'email',
            deliveryStatus: 'delivered',
            retryCount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const notificationResult = await db.collection('appointment_notifications').insertOne(notificationDoc);
        console.log('✅ Inserted sample into appointment_notifications');
        
        // Verify collections exist
        const finalCollections = await db.listCollections().toArray();
        const finalNames = finalCollections.map(col => col.name);
        
        console.log('\n🎉 Collection fix completed!');
        console.log('📊 Final collections in hospital database:');
        finalNames.filter(name => name.includes('health') || name.includes('employee') || name.includes('appointment')).forEach(name => {
            console.log(`   ✅ ${name}`);
        });
        
        await mongoose.disconnect();
        console.log('\n✅ Database connection closed');
        console.log('🚀 Refresh MongoDB Atlas now to see the collections!');
        
    } catch (error) {
        console.error('❌ Error fixing collections:', error);
        process.exit(1);
    }
};

fixCollections()
    .then(() => {
        console.log('\n✨ All done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Failed:', error);
        process.exit(1);
    });