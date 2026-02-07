import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Health System Database Connection
const connectHealthDB = async () => {
    const HEALTH_DB_URI = process.env.HEALTH_DB_URI || process.env.MONGO_URI;
    
    if (HEALTH_DB_URI) {
        try {
            const connection = await mongoose.createConnection(HEALTH_DB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            
            // Wait for connection to be ready
            await connection.asPromise();
            
            console.log('✅ Health Check Database Connected (hospital)');
            const dbName = connection.db ? connection.db.databaseName : connection.name || 'hospital';
            console.log(`🔗 Database: ${dbName}`);
            
            return connection;
        } catch (err) {
            console.error('❌ Health Database Connection Error:', err);
            throw err;
        }
    } else {
        console.warn('⚠️ HEALTH_DB_URI not set. Using default MONGO_URI.');
        throw new Error('Health database URI not configured');
    }
};

// Import models for health system
import { HealthCheckSchedule } from '../models/HealthCheckSchedule.js';
import { EmployeeHealthHistory } from '../models/EmployeeHealthHistory.js';
import { AppointmentNotification } from '../models/AppointmentNotification.js';

// Create health database connection and models
let healthConnection = null;
let HealthModels = null;

const initializeHealthModels = async () => {
    try {
        // If already initialized, return existing models
        if (HealthModels) {
            console.log('✅ Health models already initialized');
            return HealthModels;
        }
        
        healthConnection = await connectHealthDB();
        
        // Register models with health database connection
        // Use modelNames() to check if model already exists
        const modelNames = healthConnection.modelNames();
        
        HealthModels = {
            HealthCheckSchedule: modelNames.includes('HealthCheckSchedule') 
                ? healthConnection.model('HealthCheckSchedule')
                : healthConnection.model('HealthCheckSchedule', HealthCheckSchedule, 'health_check_schedules'),
            EmployeeHealthHistory: modelNames.includes('EmployeeHealthHistory')
                ? healthConnection.model('EmployeeHealthHistory')
                : healthConnection.model('EmployeeHealthHistory', EmployeeHealthHistory, 'employees_health_history'),
            AppointmentNotification: modelNames.includes('AppointmentNotification')
                ? healthConnection.model('AppointmentNotification')
                : healthConnection.model('AppointmentNotification', AppointmentNotification, 'appointment_notifications')
        };
        
        console.log('✅ Health system models initialized');
        return HealthModels;
        
    } catch (error) {
        console.error('❌ Failed to initialize health models:', error);
        throw error;
    }
};

// Export health database utilities
export { connectHealthDB, initializeHealthModels };

export const getHealthModels = () => {
    if (!HealthModels) {
        throw new Error('Health models not initialized. Call initializeHealthModels() first.');
    }
    return HealthModels;
};

export const getHealthConnection = () => {
    if (!healthConnection) {
        throw new Error('Health database not connected. Call connectHealthDB() first.');
    }
    return healthConnection;
};

// Health database status check
export const checkHealthDBStatus = async () => {
    try {
        if (!healthConnection) {
            return { connected: false, error: 'Not connected' };
        }
        
        if (healthConnection.db && typeof healthConnection.db.admin === 'function') {
            const adminDb = healthConnection.db.admin();
            const result = await adminDb.ping();
            
            return {
                connected: true,
                database: healthConnection.db.databaseName || healthConnection.name || 'hospital',
                host: healthConnection.host || 'localhost',
                port: healthConnection.port || 27017,
                readyState: healthConnection.readyState,
                ping: result
            };
        } else {
            return {
                connected: true,
                database: healthConnection.name || 'hospital',
                readyState: healthConnection.readyState
            };
        }
    } catch (error) {
        return {
            connected: false,
            error: error.message
        };
    }
};

export default { connectHealthDB, initializeHealthModels, getHealthModels, getHealthConnection, checkHealthDBStatus };