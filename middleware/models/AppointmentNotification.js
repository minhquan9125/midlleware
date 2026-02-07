import mongoose from 'mongoose';

// Appointment Notification Schema
const appointmentNotificationSchema = new mongoose.Schema({
    scheduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HealthCheckSchedule',
        required: true,
        index: true
    },
    employeeId: {
        type: String,
        required: true,
        index: true
    },
    employeeEmail: {
        type: String,
        required: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    employeeName: {
        type: String,
        required: true
    },
    notificationType: {
        type: String,
        required: true,
        enum: ['reminder', 'confirmation', 'reschedule', 'cancellation', 'result_ready'],
        index: true
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    doctorName: {
        type: String,
        required: true
    },
    message: {
        subject: {
            type: String,
            required: true
        },
        body: {
            type: String,
            required: true
        },
        priority: {
            type: String,
            enum: ['low', 'normal', 'high', 'urgent'],
            default: 'normal'
        }
    },
    sentAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date,
        required: false
    },
    deliveryMethod: {
        type: String,
        enum: ['email', 'sms', 'push', 'in_app'],
        default: 'email'
    },
    deliveryStatus: {
        type: String,
        enum: ['sent', 'delivered', 'failed', 'pending'],
        default: 'pending',
        index: true
    },
    deliveryAttempts: [{
        attemptAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['sent', 'delivered', 'failed'],
            required: true
        },
        errorMessage: {
            type: String,
            required: false
        },
        provider: {
            type: String,
            required: false
        }
    }],
    retryCount: {
        type: Number,
        default: 0,
        max: 5
    },
    maxRetries: {
        type: Number,
        default: 3
    },
    nextRetryAt: {
        type: Date,
        required: false
    },
    expiresAt: {
        type: Date,
        required: false,
        index: { expireAfterSeconds: 0 }
    },
    metadata: {
        source: {
            type: String,
            default: 'health_check_system'
        },
        templateId: {
            type: String,
            required: false
        },
        variables: {
            type: mongoose.Schema.Types.Mixed,
            required: false
        }
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

// Compound indexes
appointmentNotificationSchema.index({ employeeId: 1, sentAt: -1 });
appointmentNotificationSchema.index({ scheduleId: 1, notificationType: 1 });
appointmentNotificationSchema.index({ deliveryStatus: 1, nextRetryAt: 1 });

// Pre-save middleware
appointmentNotificationSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    
    // Set expiration if not set (default 30 days)
    if (!this.expiresAt) {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);
        this.expiresAt = expiry;
    }
    
    // Mark as read when readAt is set
    if (this.readAt && !this.isRead) {
        this.isRead = true;
    }
    
    next();
});

// Static method to create notification
appointmentNotificationSchema.statics.createNotification = function(data) {
    const notification = new this(data);
    
    // Auto-generate message if not provided
    if (!notification.message.subject || !notification.message.body) {
        const messages = {
            reminder: {
                subject: `Nhắc nhở: Lịch khám sức khỏe ngày ${notification.scheduledDate.toLocaleDateString('vi-VN')}`,
                body: `Xin chào ${notification.employeeName},\n\nBạn có lịch khám sức khỏe với ${notification.doctorName} vào ngày ${notification.scheduledDate.toLocaleDateString('vi-VN')}.\n\nVui lòng đến đúng giờ.`
            },
            confirmation: {
                subject: `Xác nhận: Lịch khám sức khỏe đã được đặt`,
                body: `Xin chào ${notification.employeeName},\n\nLịch khám sức khỏe của bạn với ${notification.doctorName} đã được xác nhận cho ngày ${notification.scheduledDate.toLocaleDateString('vi-VN')}.\n\nCảm ơn bạn!`
            },
            reschedule: {
                subject: `Thông báo: Lịch khám sức khỏe đã được dời lại`,
                body: `Xin chào ${notification.employeeName},\n\nLịch khám sức khỏe của bạn đã được dời sang ngày ${notification.scheduledDate.toLocaleDateString('vi-VN')}.\n\nXin lỗi vì sự bất tiện này.`
            },
            cancellation: {
                subject: `Thông báo: Lịch khám sức khỏe đã bị hủy`,
                body: `Xin chào ${notification.employeeName},\n\nLịch khám sức khỏe với ${notification.doctorName} đã bị hủy.\n\nVui lòng liên hệ để đặt lịch mới.`
            },
            result_ready: {
                subject: `Kết quả khám sức khỏe đã sẵn sàng`,
                body: `Xin chào ${notification.employeeName},\n\nKết quả khám sức khỏe của bạn đã sẵn sàng.\n\nVui lòng đăng nhập hệ thống để xem chi tiết.`
            }
        };
        
        const template = messages[notification.notificationType];
        if (template) {
            notification.message.subject = notification.message.subject || template.subject;
            notification.message.body = notification.message.body || template.body;
        }
    }
    
    return notification;
};

// Instance method to mark as delivered
appointmentNotificationSchema.methods.markDelivered = function(provider = 'system') {
    this.deliveryStatus = 'delivered';
    this.deliveryAttempts.push({
        status: 'delivered',
        provider: provider
    });
    return this.save();
};

// Instance method to mark as failed
appointmentNotificationSchema.methods.markFailed = function(errorMessage, provider = 'system') {
    this.deliveryStatus = 'failed';
    this.retryCount += 1;
    this.deliveryAttempts.push({
        status: 'failed',
        errorMessage: errorMessage,
        provider: provider
    });
    
    // Schedule retry if under max retries
    if (this.retryCount < this.maxRetries) {
        const retryDelay = Math.pow(2, this.retryCount) * 60 * 1000; // Exponential backoff
        this.nextRetryAt = new Date(Date.now() + retryDelay);
    }
    
    return this.save();
};

export const AppointmentNotification = appointmentNotificationSchema;