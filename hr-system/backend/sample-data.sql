-- ==================================================
-- HR SYSTEM - DỮ LIỆU MẪU (SAMPLE DATA)
-- ==================================================
-- Tạo dữ liệu mẫu cho hệ thống quản lý nhân sự
-- Bao gồm: Departments (Phòng ban) và Employees (Nhân viên)

-- Xóa dữ liệu cũ (nếu có)
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM employees WHERE id > 0;
DELETE FROM departments WHERE id > 0;
SET FOREIGN_KEY_CHECKS = 1;

-- Reset Auto Increment
ALTER TABLE departments AUTO_INCREMENT = 1;
ALTER TABLE employees AUTO_INCREMENT = 1;

-- ==================================================
-- 1. TẠO PHÒNG BAN (DEPARTMENTS)
-- ==================================================
INSERT INTO departments (id, name) VALUES 
(1, 'Phòng Nhân sự'), 
(2, 'Phòng Tài chính'), 
(3, 'Phòng Công nghệ thông tin'),
(4, 'Phòng Marketing'),
(5, 'Phòng Kinh doanh'),
(6, 'Phòng Hành chính'),
(7, 'Phòng Kế toán'),
(8, 'Phòng Thiết kế');

-- ==================================================  
-- 2. TẠO NHÂN VIÊN (EMPLOYEES)
-- ==================================================

-- Phòng Nhân sự (ID: 1)
INSERT INTO employees (first_name, last_name, email, age, department_id, last_health_check_date) VALUES
('Nguyễn', 'Văn An', 'nguyen.van.an@company.com', 28, 1, '2024-01-15'),
('Trần', 'Thị Bích', 'tran.thi.bich@company.com', 32, 1, '2024-02-01'),
('Lê', 'Hoàng Nam', 'le.hoang.nam@company.com', 29, 1, NULL);

-- Phòng Tài chính (ID: 2)  
INSERT INTO employees (first_name, last_name, email, age, department_id, last_health_check_date) VALUES
('Phạm', 'Thị Linh', 'pham.thi.linh@company.com', 35, 2, '2024-01-20'),
('Vũ', 'Minh Đức', 'vu.minh.duc@company.com', 31, 2, '2024-01-25'),
('Đặng', 'Thu Hà', 'dang.thu.ha@company.com', 27, 2, NULL),
('Hoàng', 'Văn Tùng', 'hoang.van.tung@company.com', 33, 2, '2024-02-05');

-- Phòng IT (ID: 3)
INSERT INTO employees (first_name, last_name, email, age, department_id, last_health_check_date) VALUES
('Ngô', 'Thanh Hải', 'ngo.thanh.hai@company.com', 26, 3, '2024-01-10'),
('Bùi', 'Thị Mai', 'bui.thi.mai@company.com', 24, 3, NULL),
('Đinh', 'Quang Huy', 'dinh.quang.huy@company.com', 30, 3, '2024-01-18'),
('Lý', 'Thị Lan', 'ly.thi.lan@company.com', 28, 3, '2024-02-02'),
('Trương', 'Văn Khoa', 'truong.van.khoa@company.com', 25, 3, NULL);

-- Phòng Marketing (ID: 4)
INSERT INTO employees (first_name, last_name, email, age, department_id, last_health_check_date) VALUES
('Đỗ', 'Thị Nga', 'do.thi.nga@company.com', 29, 4, '2024-01-22'),
('Phan', 'Minh Tuấn', 'phan.minh.tuan@company.com', 31, 4, '2024-01-28'),
('Võ', 'Thị Hương', 'vo.thi.huong@company.com', 26, 4, NULL);

-- Phòng Kinh doanh (ID: 5)
INSERT INTO employees (first_name, last_name, email, age, department_id, last_health_check_date) VALUES  
('Mai', 'Văn Long', 'mai.van.long@company.com', 34, 5, '2024-01-12'),
('Chu', 'Thị Oanh', 'chu.thi.oanh@company.com', 28, 5, '2024-02-08'),
('Dương', 'Minh Phú', 'duong.minh.phu@company.com', 32, 5, '2024-01-30'),
('Lâm', 'Thị Yến', 'lam.thi.yen@company.com', 27, 5, NULL);

-- Phòng Hành chính (ID: 6)
INSERT INTO employees (first_name, last_name, email, age, department_id, last_health_check_date) VALUES
('Tô', 'Văn Đạt', 'to.van.dat@company.com', 36, 6, '2024-01-14'),
('Lưu', 'Thị Kim', 'luu.thi.kim@company.com', 30, 6, '2024-02-03');

-- Phòng Kế toán (ID: 7) 
INSERT INTO employees (first_name, last_name, email, age, department_id, last_health_check_date) VALUES
('Cao', 'Minh Hiếu', 'cao.minh.hieu@company.com', 29, 7, '2024-01-16'),
('Đào', 'Thị Xuân', 'dao.thi.xuan@company.com', 33, 7, '2024-01-26'),
('Hồ', 'Văn Thành', 'ho.van.thanh@company.com', 31, 7, NULL);

-- Phòng Thiết kế (ID: 8)
INSERT INTO employees (first_name, last_name, email, age, department_id, last_health_check_date) VALUES
('Thái', 'Thị Loan', 'thai.thi.loan@company.com', 25, 8, NULL),  
('Ninh', 'Văn Bảo', 'ninh.van.bao@company.com', 27, 8, '2024-02-01');

-- ==================================================
-- 3. KIỂM TRA DỮ LIỆU VỪA TẠO
-- ==================================================

-- Kiểm tra số lượng phòng ban
SELECT 'Departments' as Table_Name, COUNT(*) as Count FROM departments
UNION ALL
-- Kiểm tra số lượng nhân viên  
SELECT 'Employees' as Table_Name, COUNT(*) as Count FROM employees;

-- Chi tiết nhân viên theo phòng ban
SELECT 
    d.name as 'Phòng ban',
    COUNT(e.id) as 'Số nhân viên',
    GROUP_CONCAT(CONCAT(e.first_name, ' ', e.last_name) SEPARATOR ', ') as 'Danh sách'
FROM departments d 
LEFT JOIN employees e ON d.id = e.department_id
GROUP BY d.id, d.name
ORDER BY d.id;

-- ==================================================
-- 4. THỐNG KÊ TỔNG QUAN
-- ==================================================
SELECT 
    'TỔNG QUAN HỆ THỐNG HR' as 'Mục',
    CONCAT(
        (SELECT COUNT(*) FROM departments), ' phòng ban, ',
        (SELECT COUNT(*) FROM employees), ' nhân viên, ',
        (SELECT COUNT(*) FROM employees WHERE last_health_check_date IS NOT NULL), ' đã khám sức khỏe'
    ) as 'Thông tin';