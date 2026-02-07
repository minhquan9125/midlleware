import mongoose from "mongoose";

const checkupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  date: { type: String, required: true },
  doctor: { type: String, required: true },
  time: { type: String },
  phone: { type: String },
  department: { type: String },
  reason: { type: String },
  notes: { type: String },
  patientId: { type: String },
  doctorId: { type: String }
}, { timestamps: true });

export default mongoose.model("CheckupAppointment", checkupSchema);