import express from "express";
import Employee from "../models/employee.js";

const router = express.Router();

// POST /api/employees/seed must come BEFORE other routes to bypass any middleware
/**
 * POST /api/employees/seed
 * Tạo sample employee data (chỉ dùng cho dev/test)
 * Public endpoint - không yêu cầu token - MUST BE REGISTERED FIRST
 */
router.post("/seed", async (req, res) => {
  try {
    // Xóa employees cũ
    await Employee.deleteMany({});

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

    return res.status(201).json({
      code: 0,
      message: "Sample employees created successfully",
      success: true,
      count: createdEmployees.length,
      data: createdEmployees
    });
  } catch (error) {
    console.error("Error seeding employees:", error);
    return res.status(500).json({
      code: 5,
      message: "Error seeding employees",
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/employees/third-party/all
 * Lấy danh sách tất cả nhân viên
 * Public endpoint - không yêu cầu token
 */
router.get("/third-party/all", async (req, res) => {
  try {
    const employees = await Employee.find({})
      .select("-__v")
      .sort({ firstName: 1, lastName: 1 });

    return res.json({
      code: 0,
      message: "Employees retrieved successfully",
      success: true,
      data: employees,
      count: employees.length
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return res.status(500).json({
      code: 5,
      message: "Error fetching employees",
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/employees/:id
 * Lấy thông tin nhân viên theo ID
 */
router.get("/:id", async (req, res) => {
  try {
    const employee = await Employee.findOne({ id: req.params.id });

    if (!employee) {
      return res.status(404).json({
        code: 2,
        message: "Employee not found",
        success: false
      });
    }

    return res.json({
      code: 0,
      message: "Employee retrieved successfully",
      success: true,
      data: employee
    });
  } catch (error) {
    console.error("Error fetching employee:", error);
    return res.status(500).json({
      code: 5,
      message: "Error fetching employee",
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/employees/seed
 * Tạo sample employee data (chỉ dùng cho dev/test)
 * Public endpoint - không yêu cầu token
 * NOTE: This endpoint is now at the top of the file to be registered first
 */
// REMOVED - moved to top of file

export default router;
