# ==================================================
# SCRIPT TẠO DỮ LIỆU MẪU TOÀN BỘ HỆ THỐNG  
# ==================================================
# Tạo dữ liệu mẫu cho cả HR System và Hospital System
# Chạy: .\create-sample-data.ps1

Write-Host "🚀 === BẮT ĐẦU TẠO DỮ LIỆU MẪU ===" -ForegroundColor Green
Write-Host "Thời gian bắt đầu: $(Get-Date)" -ForegroundColor Cyan

# Cấu hình API
$HR_BASE_URL = "http://localhost:8080"
$HOSPITAL_BASE_URL = "http://localhost:5000" 
$GATEWAY_BASE_URL = "http://localhost:6060"
$JWT_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0aGlyZF9wYXJ0eV91c2VyIiwiaWF0IjoxNzI4MDAwMDAwLCJleHAiOjMzMDgwMDAwMDB9.thirdpartyfixedtoken123456789"

$headers = @{ 'Content-Type' = 'application/json' }

# ==================================================
# 1. TẠO PHÒNG BAN (DEPARTMENTS) 
# ==================================================
Write-Host "`n🏢 === ĐANG TẠO PHÒNG BAN ===" -ForegroundColor Yellow

$departments = @(
    @{ name = "Phòng Nhân sự" },
    @{ name = "Phòng Tài chính" }, 
    @{ name = "Phòng Công nghệ thông tin" },
    @{ name = "Phòng Marketing" },
    @{ name = "Phòng Kinh doanh" },
    @{ name = "Phòng Hành chính" },
    @{ name = "Phòng Kế toán" },
    @{ name = "Phòng Thiết kế" }
)

$createdDepts = @()
foreach ($dept in $departments) {
    try {
        $deptJson = $dept | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$HR_BASE_URL/api/departments" -Method POST -Body $deptJson -Headers $headers -TimeoutSec 10
        $createdDepts += $response
        Write-Host "✅ Tạo phòng ban: $($dept.name)" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Phòng ban có thể đã tồn tại: $($dept.name)" -ForegroundColor Yellow
    }
}

# ==================================================  
# 2. TẠO NHÂN VIÊN (EMPLOYEES)
# ==================================================
Write-Host "`n👥 === ĐANG TẠO NHÂN VIÊN ===" -ForegroundColor Yellow

$employees = @(
    # Phòng Nhân sự  
    @{ firstName = "Nguyễn"; lastName = "Văn An"; email = "nguyen.van.an@company.com"; age = 28; departmentId = 1 },
    @{ firstName = "Trần"; lastName = "Thị Bích"; email = "tran.thi.bich@company.com"; age = 32; departmentId = 1 },
    @{ firstName = "Lê"; lastName = "Hoàng Nam"; email = "le.hoang.nam@company.com"; age = 29; departmentId = 1 },
    
    # Phòng Tài chính
    @{ firstName = "Phạm"; lastName = "Thị Linh"; email = "pham.thi.linh@company.com"; age = 35; departmentId = 2 },
    @{ firstName = "Vũ"; lastName = "Minh Đức"; email = "vu.minh.duc@company.com"; age = 31; departmentId = 2 },
    @{ firstName = "Đặng"; lastName = "Thu Hà"; email = "dang.thu.ha@company.com"; age = 27; departmentId = 2 },
    @{ firstName = "Hoàng"; lastName = "Văn Tùng"; email = "hoang.van.tung@company.com"; age = 33; departmentId = 2 },
    
    # Phòng IT
    @{ firstName = "Ngô"; lastName = "Thanh Hải"; email = "ngo.thanh.hai@company.com"; age = 26; departmentId = 3 },
    @{ firstName = "Bùi"; lastName = "Thị Mai"; email = "bui.thi.mai@company.com"; age = 24; departmentId = 3 },
    @{ firstName = "Đinh"; lastName = "Quang Huy"; email = "dinh.quang.huy@company.com"; age = 30; departmentId = 3 },
    @{ firstName = "Lý"; lastName = "Thị Lan"; email = "ly.thi.lan@company.com"; age = 28; departmentId = 3 },
    @{ firstName = "Trương"; lastName = "Văn Khoa"; email = "truong.van.khoa@company.com"; age = 25; departmentId = 3 },
    
    # Phòng Marketing
    @{ firstName = "Đỗ"; lastName = "Thị Nga"; email = "do.thi.nga@company.com"; age = 29; departmentId = 4 },
    @{ firstName = "Phan"; lastName = "Minh Tuấn"; email = "phan.minh.tuan@company.com"; age = 31; departmentId = 4 },
    @{ firstName = "Võ"; lastName = "Thị Hương"; email = "vo.thi.huong@company.com"; age = 26; departmentId = 4 },
    
    # Phòng Kinh doanh  
    @{ firstName = "Mai"; lastName = "Văn Long"; email = "mai.van.long@company.com"; age = 34; departmentId = 5 },
    @{ firstName = "Chu"; lastName = "Thị Oanh"; email = "chu.thi.oanh@company.com"; age = 28; departmentId = 5 },
    @{ firstName = "Dương"; lastName = "Minh Phú"; email = "duong.minh.phu@company.com"; age = 32; departmentId = 5 },
    @{ firstName = "Lâm"; lastName = "Thị Yến"; email = "lam.thi.yen@company.com"; age = 27; departmentId = 5 },
    
    # Phòng Hành chính
    @{ firstName = "Tô"; lastName = "Văn Đạt"; email = "to.van.dat@company.com"; age = 36; departmentId = 6 },
    @{ firstName = "Lưu"; lastName = "Thị Kim"; email = "luu.thi.kim@company.com"; age = 30; departmentId = 6 },
    
    # Phòng Kế toán
    @{ firstName = "Cao"; lastName = "Minh Hiếu"; email = "cao.minh.hieu@company.com"; age = 29; departmentId = 7 },
    @{ firstName = "Đào"; lastName = "Thị Xuân"; email = "dao.thi.xuan@company.com"; age = 33; departmentId = 7 },
    @{ firstName = "Hồ"; lastName = "Văn Thành"; email = "ho.van.thanh@company.com"; age = 31; departmentId = 7 },
    
    # Phòng Thiết kế
    @{ firstName = "Thái"; lastName = "Thị Loan"; email = "thai.thi.loan@company.com"; age = 25; departmentId = 8 },
    @{ firstName = "Ninh"; lastName = "Văn Bảo"; email = "ninh.van.bao@company.com"; age = 27; departmentId = 8 }
)

$createdEmployees = @()
$employeeCounter = 1

foreach ($emp in $employees) {
    try {
        # Tạo qua Gateway API
        $empJson = $emp | ConvertTo-Json  
        $response = Invoke-RestMethod -Uri "$GATEWAY_BASE_URL/api/gateway/hr/employees" -Method POST -Body $empJson -Headers $headers -TimeoutSec 10
        $createdEmployees += $response.data
        Write-Host "✅ [$employeeCounter/$($employees.Count)] Tạo nhân viên: $($emp.firstName) $($emp.lastName)" -ForegroundColor Green
        $employeeCounter++
    } catch {
        if ($_.Exception.Message -like "*409*" -or $_.Exception.Message -like "*duplicate*") {
            Write-Host "⚠️ [$employeeCounter/$($employees.Count)] Nhân viên đã tồn tại: $($emp.firstName) $($emp.lastName)" -ForegroundColor Yellow
        } else {
            Write-Host "❌ [$employeeCounter/$($employees.Count)] Lỗi tạo: $($emp.firstName) $($emp.lastName) - $($_.Exception.Message)" -ForegroundColor Red
        }
        $employeeCounter++
    }
    
    # Sleep ngắn để tránh quá tải  
    Start-Sleep -Milliseconds 200
}

# ==================================================
# 3. TẠO DỮ LIỆU HOSPITAL (DOCTORS)  
# ==================================================
Write-Host "`n🏥 === ĐANG TẠO DỮ LIỆU HOSPITAL ===" -ForegroundColor Yellow

# Chạy script tạo dữ liệu hospital
$hospitalScriptPath = "D:\midl\MidderwareIntegration\hospital-management\backend\hospital-sample-data.js"
if (Test-Path $hospitalScriptPath) {
    Write-Host "📋 Chạy script tạo dữ liệu Hospital..." -ForegroundColor Cyan
    try {
        cd "D:\midl\MidderwareIntegration\hospital-management\backend"
        node hospital-sample-data.js
        Write-Host "✅ Hoàn thành tạo dữ liệu Hospital" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Lỗi chạy script Hospital: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️ Không tìm thấy script Hospital sample data" -ForegroundColor Yellow
}

# ==================================================
# 4. KIỂM TRA VÀ THỐNG KÊ KẾT QUẢ
# ==================================================  
Write-Host "`n📊 === KIỂM TRA DỮ LIỆU VỪA TẠO ===" -ForegroundColor Yellow

try {
    # Kiểm tra HR data
    $hrEmployees = Invoke-RestMethod -Uri "$GATEWAY_BASE_URL/api/gateway/hr/employees" -TimeoutSec 10
    Write-Host "✅ HR System: $($hrEmployees.data.Count) nhân viên" -ForegroundColor Green
    
    # Kiểm tra Hospital data  
    $hospitalDoctors = Invoke-RestMethod -Uri "$HOSPITAL_BASE_URL/api/doctors" -TimeoutSec 10
    Write-Host "✅ Hospital System: $($hospitalDoctors.length) bác sĩ" -ForegroundColor Green
    
} catch {
    Write-Host "⚠️ Lỗi kiểm tra dữ liệu: $($_.Exception.Message)" -ForegroundColor Yellow
}

# ==================================================
# 5. TỔNG KẾT
# ==================================================
Write-Host "`n🎉 === HOÀN THÀNH TẠO DỮ LIỆU MẪU ===" -ForegroundColor Green
Write-Host "Thời gian kết thúc: $(Get-Date)" -ForegroundColor Cyan

Write-Host "`n📋 === HƯỚNG DẪN SỬ DỤNG ===" -ForegroundColor White
Write-Host "1. 🔗 HR System API: $HR_BASE_URL/swagger-ui.html" -ForegroundColor Cyan  
Write-Host "2. 🏥 Hospital API: $HOSPITAL_BASE_URL/api/doctors" -ForegroundColor Cyan
Write-Host "3. 🌐 Gateway API: $GATEWAY_BASE_URL/api/gateway/hr/employees" -ForegroundColor Cyan
Write-Host "4. 📅 Trang lịch khám: $GATEWAY_BASE_URL/schedule.html" -ForegroundColor Cyan
Write-Host "5. 📊 Dashboard: $GATEWAY_BASE_URL" -ForegroundColor Cyan

Write-Host "`n🔑 JWT Token (cho API trực tiếp):" -ForegroundColor White  
Write-Host "$JWT_TOKEN" -ForegroundColor Gray

Write-Host "`n✨ Hệ thống đã sẵn sàng để sử dụng!" -ForegroundColor Green