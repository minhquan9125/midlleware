import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Import Employee model
import Employee from '../models/employee.js';

dotenv.config({ path: path.join(projectRoot, '.env') });

const mongoURI = process.env.MONGO_URI;

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB Connected");
    seedEmployees();
  })
  .catch((err) => {
    console.error("❌ MongoDB Error:", err);
    process.exit(1);
  });

const seedEmployees = async () => {
  try {
    // Xóa employees cũ
    await Employee.deleteMany({});
    console.log("🗑️  Cleared existing employees");

    // Tạo 10 sample employees
    const sampleEmployees = [
      {
        id: "EMP001",
        firstName: "Nguyễn",
        lastName: "Văn A",
        email: "nguyen.van.a@company.com",
        phone: "0912345678",
        department: "IT",
        departmentName: "Information Technology",
        position: "Software Engineer",
        lastHealthCheckDate: new Date("2025-08-15")
      },
      {
        id: "EMP002",
        firstName: "Trần",
        lastName: "Thị B",
        email: "tran.thi.b@company.com",
        phone: "0923456789",
        department: "HR",
        departmentName: "Human Resources",
        position: "HR Manager",
        lastHealthCheckDate: new Date("2025-09-20")
      },
      {
        id: "EMP003",
        firstName: "Lê",
        lastName: "Văn C",
        email: "le.van.c@company.com",
        phone: "0934567890",
        department: "Finance",
        departmentName: "Finance Department",
        position: "Accountant",
        lastHealthCheckDate: null
      },
      {
        id: "EMP004",
        firstName: "Phạm",
        lastName: "Thị D",
        email: "pham.thi.d@company.com",
        phone: "0945678901",
        department: "Sales",
        departmentName: "Sales Department",
        position: "Sales Executive",
        lastHealthCheckDate: new Date("2025-06-10")
      },
      {
        id: "EMP005",
        firstName: "Hoàng",
        lastName: "Văn E",
        email: "hoang.van.e@company.com",
        phone: "0956789012",
        department: "IT",
        departmentName: "Information Technology",
        position: "DevOps Engineer",
        lastHealthCheckDate: new Date("2025-10-01")
      },
      {
        id: "EMP006",
        firstName: "Vũ",
        lastName: "Thị F",
        email: "vu.thi.f@company.com",
        phone: "0967890123",
        department: "Marketing",
        departmentName: "Marketing Department",
        position: "Marketing Manager",
        lastHealthCheckDate: new Date("2025-07-22")
      },
      {
        id: "EMP007",
        firstName: "Bùi",
        lastName: "Văn G",
        email: "bui.van.g@company.com",
        phone: "0978901234",
        department: "Operations",
        departmentName: "Operations Department",
        position: "Operations Supervisor",
        lastHealthCheckDate: null
      },
      {
        id: "EMP008",
        firstName: "Đặng",
        lastName: "Thị H",
        email: "dang.thi.h@company.com",
        phone: "0989012345",
        department: "Finance",
        departmentName: "Finance Department",
        position: "Financial Analyst",
        lastHealthCheckDate: new Date("2025-09-05")
      },
      {
        id: "EMP009",
        firstName: "Tô",
        lastName: "Văn I",
        email: "to.van.i@company.com",
        phone: "0990123456",
        department: "IT",
        departmentName: "Information Technology",
        position: "QA Engineer",
        lastHealthCheckDate: new Date("2025-10-15")
      },
      {
        id: "EMP010",
        firstName: "Lương",
        lastName: "Thị K",
        email: "luong.thi.k@company.com",
        phone: "0991234567",
        department: "HR",
        departmentName: "Human Resources",
        position: "Recruiter",
        lastHealthCheckDate: new Date("2025-08-30")
      }
    ];

    const createdEmployees = await Employee.insertMany(sampleEmployees);
    console.log(`✅ Created ${createdEmployees.length} employees:`);
    createdEmployees.forEach(emp => {
      console.log(`   - ${emp.firstName} ${emp.lastName} (${emp.id}) - ${emp.email}`);
    });

    console.log("\n✅ Seed completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding employees:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("📌 Database connection closed");
    process.exit(0);
  }
};
