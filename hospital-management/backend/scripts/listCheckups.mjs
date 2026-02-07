import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";

import CheckupAppointment from "../models/checkup.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(projectRoot, ".env") });

const mongoURI = process.env.MONGO_URI;

const run = async () => {
  try {
    await mongoose.connect(mongoURI);

    const limit = Number(process.env.LIMIT || 10);

    const checkups = await CheckupAppointment.find({})
      .select("name email date doctor time phone department reason notes patientId doctorId")
      .sort({ createdAt: -1 })
      .limit(Number.isNaN(limit) ? 10 : limit)
      .lean();

    console.log(JSON.stringify({ count: checkups.length, data: checkups }, null, 2));
  } catch (error) {
    console.error("Failed to list checkups:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();
