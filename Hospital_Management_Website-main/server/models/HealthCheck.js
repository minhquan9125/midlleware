/**
 * Health Check Database Models
 * MongoDB schemas cho HIS (Hospital Information System)
 */

import mongoose from 'mongoose';

/**
 * ============================================================================
 * Health Check Schedule - Lịch khám sức khỏe
 * ============================================================================
 */
const healthCheckScheduleSchema = new mongoose.Schema(
  {
    campaign_id: {
      type: Number,
      required: true,
      description: 'ID từ HRM'
    },
    hrm_campaign_name: String,
    hrm_campaign_type: {
      type: String,
      enum: ['Annual', 'Quarterly', 'Special'],
      default: 'Annual'
    },

    // Lịch hẹn chi tiết
    appointments: [
      {
        appointment_id: mongoose.Schema.Types.ObjectId,
        employee_id: Number,
        employee_name: String,
        department: String,

        doctor_id: String,
        doctor_name: String,

        scheduled_date: Date,
        scheduled_time: String, // "09:00 AM"

        status: {
          type: String,
          enum: ['pending', 'confirmed', 'checked', 'missed', 'cancelled'],
          default: 'pending'
        },

        // Sync status
        sent_to_hrm: Boolean,
        hrm_sync_date: Date,

        // Health check result (nếu đã khám)
        health_status: {
          type: String,
          enum: ['Type_1', 'Type_2', 'Type_3', 'Type_4'],
          description: 'Type_1: Healthy, Type_2: Healthy with notes, Type_3: Needs monitoring, Type_4: Not fit for work'
        },
        restrictions: [String], // ["no_height_work", "sit_8h_max"]
        doctor_conclusion: String
      }
    ],

    // Statistics
    total_employees: Number,
    scheduled_count: { type: Number, default: 0 },
    pending_count: { type: Number, default: 0 },
    checked_count: { type: Number, default: 0 },
    missed_count: { type: Number, default: 0 },

    // Campaign dates
    campaign_start_date: Date,
    campaign_end_date: Date,

    status: {
      type: String,
      enum: ['pending', 'scheduled', 'in_progress', 'completed', 'archived'],
      default: 'pending'
    },

    created_at: {
      type: Date,
      default: Date.now
    },
    updated_at: {
      type: Date,
      default: Date.now
    }
  },
  {
    collection: 'health_check_schedules',
    timestamps: true
  }
);

healthCheckScheduleSchema.index({ campaign_id: 1 });
healthCheckScheduleSchema.index({ status: 1 });

const HealthCheckSchedule = mongoose.model('HealthCheckSchedule', healthCheckScheduleSchema);

/**
 * ============================================================================
 * Health Check Record - Chi tiết khám sức khỏe (LƯU TẠI HIS)
 * ============================================================================
 * IMPORTANT: Chỉ bác sĩ và nhân viên y tế mới được truy cập chi tiết này.
 * HRM chỉ được nhìn: health_status, restrictions, doctor_conclusion
 */
const healthCheckRecordSchema = new mongoose.Schema(
  {
    // Link to appointment
    appointment_id: mongoose.Schema.Types.ObjectId,
    campaign_id: Number,

    // Employee info (from HRM)
    employee_id: Number,
    employee_name: String,
    department: String,

    // Doctor info
    doctor_id: String,
    doctor_name: String,

    // Check schedule
    check_date: Date,
    check_time: String,

    // ===== VITAL SIGNS (BẢNG CHỈ SỐ SINH HỌC) =====
    vitals: {
      height: Number, // cm
      weight: Number, // kg
      blood_pressure: String, // "120/80"
      heart_rate: Number, // bpm
      temperature: Number, // °C
      respiratory_rate: Number, // breaths/min
      oxygen_saturation: Number // %
    },

    // ===== LAB RESULTS (KẾT QUẢ XÉT NGHIỆM) =====
    lab_results: {
      blood_test: {
        RBC: Number, // Red Blood Cell
        WBC: Number, // White Blood Cell
        Hb: Number, // Hemoglobin
        Ht: Number, // Hematocrit
        MCV: Number,
        MCH: Number,
        MCHC: Number,
        platelets: Number,
        // ...thêm các chỉ số khác
        notes: String
      },
      urine_test: {
        color: String,
        clarity: String,
        specific_gravity: Number,
        pH: Number,
        glucose: String,
        protein: String,
        blood: String,
        nitrites: String,
        leukocyte_esterase: String,
        notes: String
      },
      chemistry: {
        glucose: Number,
        BUN: Number,
        creatinine: Number,
        sodium: Number,
        potassium: Number,
        chloride: Number,
        calcium: Number,
        phosphorus: Number,
        magnesium: Number,
        albumin: Number,
        globulin: Number,
        // ...thêm các chỉ số khác
        notes: String
      }
    },

    // ===== IMAGING (CHẨN ĐOÁN HÌNH ẢNH) =====
    imaging: [
      {
        type_of_imaging: {
          type: String,
          enum: ['XRay', 'Ultrasound', 'CT', 'MRI', 'Mammography'],
          description: 'Loại chẩn đoán hình ảnh'
        },
        body_part: String, // "Chest", "Abdomen"
        result: String, // "Normal", "Abnormal"
        findings: String, // Chi tiết kết quả
        images_url: [String], // URLs to stored images
        date: Date
      }
    ],

    // ===== DOCTOR'S EXAMINATION & DIAGNOSIS =====
    physical_examination: {
      general_appearance: String,
      cardiovascular: String,
      respiratory: String,
      abdomen: String,
      neurological: String,
      musculoskeletal: String,
      skin: String,
      other_findings: String
    },

    // ===== DIAGNOSIS (CHẨN ĐOÁN CHI TIẾT - CHỈ HIS BIẾT) =====
    detailed_diagnosis: {
      primary_diagnosis: String, // "Tăng huyết áp stage 1"
      secondary_diagnosis: [String],
      icd_code: [String], // ICD-10 codes
      severity: {
        type: String,
        enum: ['Mild', 'Moderate', 'Severe', 'Critical']
      }
    },

    // ===== TREATMENT & FOLLOW-UP (CHỈ HIS BIẾT) =====
    recommended_treatment: {
      medications: [
        {
          drug_name: String,
          dosage: String,
          frequency: String,
          duration: String,
          notes: String
        }
      ],
      lifestyle_modifications: [String],
      follow_up_schedule: String, // "3 months", "6 months"
      referral_to_specialist: String
    },

    // ===== CONCLUSION SENT TO HRM (GỬI SANG HR) =====
    health_status: {
      type: String,
      enum: ['Type_1', 'Type_2', 'Type_3', 'Type_4'],
      description: `
        Type_1: Sức khỏe bình thường, không có vấn đề
        Type_2: Sức khỏe bình thường, có lưu ý nhỏ
        Type_3: Có vấn đề sức khỏe, cần theo dõi
        Type_4: Không đủ sức khỏe để làm việc bình thường
      `
    },

    // Work-related restrictions
    restrictions: {
      type: [String],
      example: [
        'no_height_work', // Không làm việc trên cao
        'avoid_heavy_lifting', // Tránh nâng vật nặng
        'sit_8h_max', // Ngồi tối đa 8h
        'avoid_extreme_temperature', // Tránh nhiệt độ cực đoan
        'limited_physical_activity', // Hoạt động thể chất hạn chế
        'no_chemical_exposure' // Tránh tiếp xúc hóa chất
      ]
    },

    // Doctor's conclusion for HRM (tóm tắt, không chi tiết bệnh lý)
    doctor_conclusion: String, // "Huyết áp hơi cao, cần theo dõi"
    summary_for_hr: String, // Tóm tắt cho phòng HR

    // ===== PRIVATE NOTES (CHỈ BÁCH SĨ & Y TẾ BIẾT) =====
    doctor_private_notes: String,
    follow_up_notes: String,

    // Status
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'reviewed', 'archived'],
      default: 'pending'
    },

    // HRM sync status
    synced_to_hrm: {
      type: Boolean,
      default: false
    },
    hrm_sync_date: Date,
    hrm_record_id: Number, // ID của record lưu tại HRM

    // Quality control
    reviewed_by_doctor_id: String,
    reviewed_date: Date,
    is_final: {
      type: Boolean,
      default: false
    },

    created_at: {
      type: Date,
      default: Date.now
    },
    updated_at: {
      type: Date,
      default: Date.now
    }
  },
  {
    collection: 'health_check_records',
    timestamps: true
  }
);

// Indexes for performance
healthCheckRecordSchema.index({ employee_id: 1 });
healthCheckRecordSchema.index({ campaign_id: 1 });
healthCheckRecordSchema.index({ check_date: 1 });
healthCheckRecordSchema.index({ status: 1 });
healthCheckRecordSchema.index({ doctor_id: 1 });
healthCheckRecordSchema.index({ appointment_id: 1 });

const HealthCheckRecord = mongoose.model('HealthCheckRecord', healthCheckRecordSchema);

/**
 * ============================================================================
 * Sync Log - Lịch sử sync giữa HIS và HRM
 * ============================================================================
 */
const syncLogSchema = new mongoose.Schema(
  {
    campaign_id: {
      type: Number,
      required: true
    },

    sync_type: {
      type: String,
      enum: ['HRM_to_HIS', 'HIS_to_HRM', 'auto_sync'],
      description: 'Loại sync'
    },

    direction: {
      type: String,
      enum: ['inbound', 'outbound']
    },

    records_count: Number,
    successful_count: Number,
    failed_count: Number,

    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed'],
      default: 'pending'
    },

    error_message: String,
    details: mongoose.Schema.Types.Mixed, // Chi tiết sync

    initiated_by: String, // "system" hoặc user ID
    initiated_at: {
      type: Date,
      default: Date.now
    },
    completed_at: Date,
    duration_ms: Number // Thời gian thực hiện (ms)
  },
  {
    collection: 'sync_logs',
    timestamps: true
  }
);

syncLogSchema.index({ campaign_id: 1 });
syncLogSchema.index({ status: 1 });
syncLogSchema.index({ initiated_at: -1 });

const SyncLog = mongoose.model('SyncLog', syncLogSchema);

/**
 * ============================================================================
 * Health Check Configuration
 * ============================================================================
 */
const healthCheckConfigSchema = new mongoose.Schema(
  {
    config_key: {
      type: String,
      unique: true,
      required: true
    },

    // Health status definitions
    health_status_types: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        Type_1: {
          label: 'Sức khỏe bình thường',
          description: 'Không có vấn đề sức khỏe',
          restrictions: []
        },
        Type_2: {
          label: 'Sức khỏe bình thường, có lưu ý',
          description: 'Có lưu ý nhỏ về sức khỏe',
          restrictions: ['follow_up_required']
        },
        Type_3: {
          label: 'Cần theo dõi',
          description: 'Có vấn đề sức khỏe, cần quản lý',
          restrictions: ['avoid_heavy_lifting', 'follow_up_monthly']
        },
        Type_4: {
          label: 'Không đủ sức khỏe',
          description: 'Không đủ sức khỏe để làm việc bình thường',
          restrictions: ['not_fit_for_duty', 'requires_medical_leave']
        }
      }
    },

    // Check frequency definitions
    check_frequency: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        Annual: 12, // months
        Quarterly: 3,
        Monthly: 1
      }
    },

    // Restriction types
    available_restrictions: {
      type: [String],
      default: [
        'no_height_work',
        'avoid_heavy_lifting',
        'sit_8h_max',
        'avoid_extreme_temperature',
        'limited_physical_activity',
        'no_chemical_exposure',
        'follow_up_required',
        'follow_up_monthly',
        'follow_up_quarterly'
      ]
    },

    // Work restrictions policies
    work_restrictions_policy: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        Type_3: {
          max_overtime_hours: 20, // per month
          max_daily_hours: 8,
          requires_medical_supervision: false
        },
        Type_4: {
          max_overtime_hours: 0,
          max_daily_hours: 0,
          requires_medical_leave: true
        }
      }
    }
  },
  {
    collection: 'health_check_config',
    timestamps: true
  }
);

const HealthCheckConfig = mongoose.model('HealthCheckConfig', healthCheckConfigSchema);

// Export models
export {
  HealthCheckSchedule,
  HealthCheckRecord,
  SyncLog,
  HealthCheckConfig
};
