import mongoose from 'mongoose';

// Employee Health History Schema
const employeeHealthHistorySchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true,
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
    checkupDate: {
        type: Date,
        required: true,
        index: true
    },
    doctorId: {
        type: String,
        required: true
    },
    doctorName: {
        type: String,
        required: true
    },
    healthStatus: {
        type: String,
        required: true,
        enum: ['excellent', 'good', 'fair', 'poor', 'pending'],
        default: 'pending'
    },
    vitalSigns: {
        bmi: {
            type: Number,
            min: 10,
            max: 50
        },
        bloodPressure: {
            systolic: {
                type: Number,
                min: 70,
                max: 250
            },
            diastolic: {
                type: Number,
                min: 40,
                max: 150
            }
        },
        heartRate: {
            type: Number,
            min: 30,
            max: 220
        },
        temperature: {
            type: Number,
            min: 35,
            max: 42
        },
        weight: {
            type: Number,
            min: 30,
            max: 300
        },
        height: {
            type: Number,
            min: 100,
            max: 250
        }
    },
    testResults: {
        bloodTest: {
            completed: { type: Boolean, default: false },
            results: { type: String, default: '' },
            date: { type: Date }
        },
        urinalysis: {
            completed: { type: Boolean, default: false },
            results: { type: String, default: '' },
            date: { type: Date }
        },
        xray: {
            completed: { type: Boolean, default: false },
            results: { type: String, default: '' },
            date: { type: Date }
        },
        ecg: {
            completed: { type: Boolean, default: false },
            results: { type: String, default: '' },
            date: { type: Date }
        }
    },
    recommendations: [{
        type: String,
        required: false
    }],
    nextCheckupRequired: {
        type: Boolean,
        default: true
    },
    nextCheckupDate: {
        type: Date,
        required: false
    },
    medicalHistory: {
        allergies: [String],
        currentMedications: [String],
        chronicConditions: [String],
        pastSurgeries: [String]
    },
    attachments: [{
        fileName: {
            type: String,
            required: true
        },
        fileUrl: {
            type: String,
            required: true
        },
        fileSize: {
            type: Number,
            required: false
        },
        mimeType: {
            type: String,
            required: false
        },
        uploadDate: {
            type: Date,
            default: Date.now
        }
    }],
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
employeeHealthHistorySchema.index({ employeeId: 1, checkupDate: -1 });
employeeHealthHistorySchema.index({ nextCheckupDate: 1 });
employeeHealthHistorySchema.index({ healthStatus: 1 });

// Pre-save middleware to update updatedAt and calculate next checkup
employeeHealthHistorySchema.pre('save', function(next) {
    this.updatedAt = new Date();
    
    // Auto-calculate next checkup date if not set
    if (!this.nextCheckupDate && this.nextCheckupRequired) {
        const nextCheckup = new Date(this.checkupDate);
        nextCheckup.setMonth(nextCheckup.getMonth() + 6); // 6 months from checkup date
        this.nextCheckupDate = nextCheckup;
    }
    
    next();
});

// Virtual for months since last checkup
employeeHealthHistorySchema.virtual('monthsSinceCheckup').get(function() {
    const now = new Date();
    const checkupDate = this.checkupDate;
    const diffTime = Math.abs(now - checkupDate);
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Average days per month
    return diffMonths;
});

// Virtual for overdue status
employeeHealthHistorySchema.virtual('isOverdue').get(function() {
    if (!this.nextCheckupDate) return false;
    return new Date() > this.nextCheckupDate;
});

export const EmployeeHealthHistory = employeeHealthHistorySchema;