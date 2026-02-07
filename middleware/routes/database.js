import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Route để kiểm tra database và collections
router.get('/status', async (req, res) => {
    try {
        const connection = mongoose.connection;
        const db = connection.db;
        
        // Lấy thông tin database
        const dbName = db.databaseName;
        const collections = await db.listCollections().toArray();
        
        // Kiểm tra collections health check
        const healthCollections = collections.filter(col => 
            col.name.includes('health_check') || 
            col.name.includes('employees_health') || 
            col.name.includes('appointment_notifications')
        );
        
        // Đếm documents trong mỗi collection
        const collectionStats = {};
        for (const col of healthCollections) {
            try {
                const count = await db.collection(col.name).countDocuments();
                collectionStats[col.name] = count;
            } catch (err) {
                collectionStats[col.name] = 'Error: ' + err.message;
            }
        }
        
        res.json({
            code: 0,
            message: 'Database status retrieved successfully',
            success: true,
            data: {
                database: dbName,
                connectionState: connection.readyState,
                totalCollections: collections.length,
                healthCollections: healthCollections.length,
                collectionsData: collectionStats,
                collections: healthCollections.map(col => ({
                    name: col.name,
                    type: col.type
                }))
            }
        });
        
    } catch (error) {
        console.error('❌ Lỗi khi kiểm tra database status:', error);
        res.status(500).json({
            code: 5,
            message: 'Lỗi khi kiểm tra trạng thái database',
            success: false,
            error: error.message
        });
    }
});

// Route để lấy dữ liệu health check schedules
router.get('/schedules', async (req, res) => {
    try {
        const connection = mongoose.connection;
        const db = connection.db;
        
        const schedules = await db.collection('health_check_schedules').find({}).limit(20).toArray();
        
        res.json({
            code: 0,
            message: 'Health check schedules retrieved successfully',
            success: true,
            data: {
                count: schedules.length,
                schedules: schedules
            }
        });
        
    } catch (error) {
        console.error('❌ Lỗi khi lấy schedules:', error);
        res.status(500).json({
            code: 5,
            message: 'Lỗi khi lấy danh sách lịch khám',
            success: false,
            error: error.message
        });
    }
});

// Route để lấy dữ liệu health history
router.get('/history', async (req, res) => {
    try {
        const connection = mongoose.connection;
        const db = connection.db;
        
        const history = await db.collection('employees_health_history').find({}).limit(20).toArray();
        
        res.json({
            code: 0,
            message: 'Employee health history retrieved successfully',
            success: true,
            data: {
                count: history.length,
                history: history
            }
        });
        
    } catch (error) {
        console.error('❌ Lỗi khi lấy health history:', error);
        res.status(500).json({
            code: 5,
            message: 'Lỗi khi lấy lịch sử khám sức khỏe',
            success: false,
            error: error.message
        });
    }
});

// Route để lấy dữ liệu notifications
router.get('/notifications', async (req, res) => {
    try {
        const connection = mongoose.connection;
        const db = connection.db;
        
        const notifications = await db.collection('appointment_notifications').find({}).limit(20).toArray();
        
        res.json({
            code: 0,
            message: 'Appointment notifications retrieved successfully',
            success: true,
            data: {
                count: notifications.length,
                notifications: notifications
            }
        });
        
    } catch (error) {
        console.error('❌ Lỗi khi lấy notifications:', error);
        res.status(500).json({
            code: 5,
            message: 'Lỗi khi lấy thông báo lịch hẹn',
            success: false,
            error: error.message
        });
    }
});

export default router;