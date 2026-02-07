import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to Hospital Database and Create Collections
const createHealthCollections = async () => {
    try {
        console.log('🚀 Connecting to hospital database...');
        
        const MONGO_URI = process.env.MONGO_URI;
        if (!MONGO_URI) {
            throw new Error('MONGO_URI not configured in .env');
        }
        
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to', mongoose.connection.db.databaseName);
        
        const db = mongoose.connection.db;
        
        // Check existing collections
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(col => col.name);
        console.log('📋 Existing collections:', collectionNames);
        
        // Create health_check_schedules collection
        if (!collectionNames.includes('health_check_schedules')) {
            await db.createCollection('health_check_schedules', {
                validator: {
                    $jsonSchema: {
                        bsonType: "object",
                        required: ["employeeId", "doctorId", "scheduledDate", "status"],
                        properties: {
                            employeeId: { bsonType: "string" },
                            doctorId: { bsonType: "string" },
                            scheduledDate: { bsonType: "date" },
                            scheduledTime: { bsonType: "string" },
                            status: { 
                                bsonType: "string",
                                enum: ["scheduled", "completed", "cancelled", "rescheduled"]
                            },
                            employeeName: { bsonType: "string" },
                            employeeEmail: { bsonType: "string" },
                            employeeDepartment: { bsonType: "string" },
                            doctorName: { bsonType: "string" }
                        }
                    }
                }
            });
            console.log('✅ Created health_check_schedules collection');
        } else {
            console.log('⚠️  health_check_schedules already exists');
        }
        
        // Create employees_health_history collection
        if (!collectionNames.includes('employees_health_history')) {
            await db.createCollection('employees_health_history', {
                validator: {
                    $jsonSchema: {
                        bsonType: "object",
                        required: ["employeeId", "checkupDate"],
                        properties: {
                            employeeId: { bsonType: "string" },
                            employeeName: { bsonType: "string" },
                            employeeEmail: { bsonType: "string" },
                            checkupDate: { bsonType: "date" },
                            doctorId: { bsonType: "string" },
                            doctorName: { bsonType: "string" },
                            healthStatus: {
                                bsonType: "string",
                                enum: ["excellent", "good", "fair", "poor", "pending"]
                            }
                        }
                    }
                }
            });
            console.log('✅ Created employees_health_history collection');
        } else {
            console.log('⚠️  employees_health_history already exists');
        }
        
        // Create appointment_notifications collection
        if (!collectionNames.includes('appointment_notifications')) {
            await db.createCollection('appointment_notifications', {
                validator: {
                    $jsonSchema: {
                        bsonType: "object",
                        required: ["employeeId", "scheduleId", "notificationType"],
                        properties: {
                            scheduleId: { bsonType: "objectId" },
                            employeeId: { bsonType: "string" },
                            employeeEmail: { bsonType: "string" },
                            employeeName: { bsonType: "string" },
                            notificationType: {
                                bsonType: "string",
                                enum: ["reminder", "confirmation", "reschedule", "cancellation", "result_ready"]
                            },
                            scheduledDate: { bsonType: "date" },
                            doctorName: { bsonType: "string" }
                        }
                    }
                }
            });
            console.log('✅ Created appointment_notifications collection');
        } else {
            console.log('⚠️  appointment_notifications already exists');
        }
        
        // Create indexes for performance
        console.log('🔍 Creating indexes...');
        
        const healthSchedules = db.collection('health_check_schedules');
        await healthSchedules.createIndex({ "employeeId": 1 });
        await healthSchedules.createIndex({ "doctorId": 1 });
        await healthSchedules.createIndex({ "scheduledDate": 1 });
        await healthSchedules.createIndex({ "status": 1 });
        
        const healthHistory = db.collection('employees_health_history');
        await healthHistory.createIndex({ "employeeId": 1 });
        await healthHistory.createIndex({ "checkupDate": -1 });
        await healthHistory.createIndex({ "employeeId": 1, "checkupDate": -1 });
        
        const notifications = db.collection('appointment_notifications');
        await notifications.createIndex({ "employeeId": 1 });
        await notifications.createIndex({ "scheduleId": 1 });
        await notifications.createIndex({ "sentAt": -1 });
        
        console.log('✅ Indexes created successfully');
        
        // Final collection list
        const finalCollections = await db.listCollections().toArray();
        console.log('\\n🎉 Health Check System setup completed!');
        console.log('📊 Database:', mongoose.connection.db.databaseName);
        console.log('📋 Total Collections:', finalCollections.length);
        console.log('🔍 Health Collections:');
        console.log('   - health_check_schedules (Lịch khám sức khỏe)');
        console.log('   - employees_health_history (Lịch sử khám sức khỏe)');
        console.log('   - appointment_notifications (Thông báo lịch hẹn)');
        
        await mongoose.disconnect();
        console.log('📤 Database connection closed');
        
    } catch (error) {
        console.error('❌ Error creating health collections:', error);
        process.exit(1);
    }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    createHealthCollections()
        .then(() => {
            console.log('✅ Health collections setup completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Setup failed:', error);
            process.exit(1);
        });
}

export default createHealthCollections;