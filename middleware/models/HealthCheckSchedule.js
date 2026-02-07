import mongoose from 'mongoose';

// Health Check Schedule Schema
const healthCheckScheduleSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true,
        index: true
    },
    doctorId: {
        type: String,
        required: true,
        index: true
    },
    scheduledDate: {
        type: Date,
        required: true,
        index: true
    },
    scheduledTime: {
        type: String,
        required: true,
        match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
    },
    status: {
        type: String,
        required: true,
        enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
        default: 'scheduled',
        index: true
    },
    employeeName: {
        type: String,
        required: true
    },
    employeeEmail: {
        type: String,
        required: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    employeeDepartment: {
        type: String,
        required: true
    },
    doctorName: {
        type: String,
        required: true
    },
    checkupType: {
        type: String,
        default: 'Khám sức khỏe định kỳ'
    },
    notes: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound indexes for better performance
healthCheckScheduleSchema.index({ employeeId: 1, scheduledDate: 1 });
healthCheckScheduleSchema.index({ doctorId: 1, scheduledDate: 1 });

// Pre-save middleware to update updatedAt
healthCheckScheduleSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

export const HealthCheckSchedule = healthCheckScheduleSchema;