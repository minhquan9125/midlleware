import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String
  },
  department: {
    type: String,
    default: "General"
  },
  departmentName: {
    type: String
  },
  position: {
    type: String
  },
  lastHealthCheckDate: {
    type: Date,
    default: null
  },
  healthStatus: {
    type: String,
    enum: ["Type_1", "Type_2", "Type_3", "Type_4"],
    default: null
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

// Auto update timestamp
employeeSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Employee", employeeSchema);
