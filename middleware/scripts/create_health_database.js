// Switch to hospital database safely
db = db.getSiblingDB("hospital");

/* ================================
   health_check_schedules
================================ */
db.createCollection("health_check_schedules", {
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
        doctorName: { bsonType: "string" },
        checkupType: { bsonType: "string" },
        notes: { bsonType: "string" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  },
  validationAction: "error",
  validationLevel: "strict"
});

/* ================================
   employees_health_history
================================ */
db.createCollection("employees_health_history", {
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
        },
        bmi: { bsonType: "number" },
        bloodPressure: { bsonType: "string" },
        heartRate: { bsonType: "number" },
        temperature: { bsonType: "number" },
        recommendations: {
          bsonType: "array",
          items: { bsonType: "string" }
        },
        nextCheckupRequired: { bsonType: "bool" },
        nextCheckupDate: { bsonType: "date" },
        attachments: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              fileName: { bsonType: "string" },
              fileUrl: { bsonType: "string" },
              uploadDate: { bsonType: "date" }
            }
          }
        },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  },
  validationAction: "error",
  validationLevel: "strict"
});

/* ================================
   appointment_notifications
================================ */
db.createCollection("appointment_notifications", {
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
        doctorName: { bsonType: "string" },
        message: { bsonType: "string" },
        sentAt: { bsonType: "date" },
        isRead: { bsonType: "bool" },
        deliveryMethod: {
          bsonType: "string",
          enum: ["email", "sms", "push", "in_app"]
        },
        deliveryStatus: {
          bsonType: "string",
          enum: ["sent", "delivered", "failed", "pending"]
        },
        retryCount: { bsonType: "int" },
        expiresAt: { bsonType: "date" },
        createdAt: { bsonType: "date" }
      }
    }
  },
  validationAction: "error",
  validationLevel: "strict"
});

/* ================================
   INDEXES
================================ */
db.health_check_schedules.createIndex({ employeeId: 1 });
db.health_check_schedules.createIndex({ doctorId: 1 });
db.health_check_schedules.createIndex({ scheduledDate: 1 });
db.health_check_schedules.createIndex({ status: 1 });
db.health_check_schedules.createIndex({ employeeId: 1, scheduledDate: 1 });

db.employees_health_history.createIndex({ employeeId: 1 });
db.employees_health_history.createIndex({ checkupDate: -1 });
db.employees_health_history.createIndex({ employeeId: 1, checkupDate: -1 });
db.employees_health_history.createIndex({ nextCheckupDate: 1 });

db.appointment_notifications.createIndex({ employeeId: 1 });
db.appointment_notifications.createIndex({ scheduleId: 1 });
db.appointment_notifications.createIndex({ sentAt: -1 });
db.appointment_notifications.createIndex({ notificationType: 1 });
db.appointment_notifications.createIndex({ deliveryStatus: 1 });
db.appointment_notifications.createIndex(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

print("✅ Collections created successfully in 'hospital' database");
