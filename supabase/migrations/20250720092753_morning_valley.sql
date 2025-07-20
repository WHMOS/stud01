-- قاعدة بيانات نظام إدارة الحضور الشامل - النسخة المحسنة والمصححة
-- تاريخ التحديث: 2024-01-20
-- متوافقة 100% مع MySQL/MariaDB مع إصلاح جميع المشاكل

-- إنشاء قاعدة البيانات
CREATE DATABASE IF NOT EXISTS attendance_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE attendance_system;

-- حذف الجداول الموجودة (إذا كانت موجودة) لإعادة الإنشاء
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS whatsapp_logs;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS teachers;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS system_settings;
SET FOREIGN_KEY_CHECKS = 1;

-- جدول المستخدمين
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'supervisor', 'teacher') NOT NULL DEFAULT 'supervisor',
    permissions JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_active (is_active)
);

-- جدول المواد الدراسية
CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_name (name),
    INDEX idx_active (is_active)
);

-- جدول أماكن الحصص
CREATE TABLE locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    room_number VARCHAR(20),
    capacity INT DEFAULT 30,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_name (name),
    INDEX idx_room_number (room_number),
    INDEX idx_active (is_active)
);

-- جدول المعلمين
CREATE TABLE teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    subject_id INT,
    phone VARCHAR(20),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    INDEX idx_name (name),
    INDEX idx_subject (subject_id),
    INDEX idx_phone (phone),
    INDEX idx_active (is_active)
);

-- جدول الفصول
CREATE TABLE classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    teacher_id INT,
    subject_id INT,
    max_capacity INT DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    INDEX idx_name (name),
    INDEX idx_teacher (teacher_id),
    INDEX idx_subject (subject_id),
    INDEX idx_active (is_active)
);

-- جدول الطلاب
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    barcode VARCHAR(20) UNIQUE NOT NULL,
    parent_phone VARCHAR(20) NOT NULL,
    parent_email VARCHAR(100),
    class_id INT NULL,
    date_of_birth DATE,
    address TEXT,
    emergency_contact VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
    INDEX idx_barcode (barcode),
    INDEX idx_name (name),
    INDEX idx_class (class_id),
    INDEX idx_parent_phone (parent_phone),
    INDEX idx_active (is_active)
);

-- جدول الجلسات
CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    location_id INT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status ENUM('scheduled', 'active', 'completed', 'cancelled') DEFAULT 'scheduled',
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_class (class_id),
    INDEX idx_location (location_id),
    INDEX idx_start_time (start_time),
    INDEX idx_end_time (end_time),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- جدول الحضور
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    session_id INT NOT NULL,
    status ENUM('present', 'absent', 'late', 'excused') NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    is_automatic BOOLEAN DEFAULT FALSE,
    recorded_by INT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_attendance (student_id, session_id),
    INDEX idx_student (student_id),
    INDEX idx_session (session_id),
    INDEX idx_status (status),
    INDEX idx_timestamp (timestamp)
);

-- جدول التقارير
CREATE TABLE reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    session_id INT NOT NULL,
    teacher_rating INT CHECK (teacher_rating >= 1 AND teacher_rating <= 5),
    quiz_score DECIMAL(5,2) DEFAULT NULL,
    participation INT CHECK (participation >= 1 AND participation <= 5),
    behavior ENUM('ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'يحتاج تحسين') DEFAULT 'ممتاز',
    homework ENUM('completed', 'incomplete', 'partial') DEFAULT 'completed',
    comments TEXT,
    strengths TEXT,
    areas_for_improvement TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_report (student_id, session_id),
    INDEX idx_student (student_id),
    INDEX idx_session (session_id),
    INDEX idx_teacher_rating (teacher_rating),
    INDEX idx_created_at (created_at)
);

-- جدول سجل رسائل الواتساب
CREATE TABLE whatsapp_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    session_id INT,
    message_type ENUM('absence', 'performance', 'reminder', 'announcement', 'session_report', 'custom') NOT NULL,
    message TEXT NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    status ENUM('pending', 'sent', 'failed', 'delivered', 'read') DEFAULT 'pending',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP NULL,
    read_at TIMESTAMP NULL,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    sent_by INT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_student (student_id),
    INDEX idx_session (session_id),
    INDEX idx_message_type (message_type),
    INDEX idx_status (status),
    INDEX idx_sent_at (sent_at),
    INDEX idx_phone_number (phone_number)
);

-- جدول إعدادات النظام
CREATE TABLE system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_key (setting_key),
    INDEX idx_category (category)
);

-- إدراج البيانات الأساسية

-- إدراج المستخدمين الافتراضيين (كلمة المرور: admin123)
INSERT INTO users (username, password, name, role, permissions) VALUES
('admin', '$2b$10$Wvtj00Udo6xtksF/ilJG/.vBknd1P7i6CXICAPq9FxyEbXV2FyBK6', 'المدير العام', 'admin', 
 '{"students": true, "classes": true, "teachers": true, "sessions": true, "attendance": true, "reports": true, "whatsapp": true, "users": true}'),
('supervisor1', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Z8W4uDDNOPEXY0tCXxMrahZyHgSSO', 'المشرف الأول', 'supervisor', 
 '{"students": true, "classes": true, "teachers": true, "sessions": true, "attendance": true, "reports": true, "whatsapp": true, "users": false}'),
('supervisor2', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Z8W4uDDNOPEXY0tCXxMrahZyHgSSO', 'المشرف الثاني', 'supervisor', 
 '{"students": true, "classes": false, "teachers": false, "sessions": false, "attendance": true, "reports": false, "whatsapp": false, "users": false}');

-- إدراج المواد الدراسية
INSERT INTO subjects (name, description) VALUES
('الرياضيات', 'مادة الرياضيات للمراحل المختلفة'),
('العلوم', 'مادة العلوم الطبيعية'),
('اللغة العربية', 'مادة اللغة العربية والنحو'),
('اللغة الإنجليزية', 'مادة اللغة الإنجليزية'),
('الفيزياء', 'مادة الفيزياء للمرحلة الثانوية'),
('الكيمياء', 'مادة الكيمياء للمرحلة الثانوية'),
('الأحياء', 'مادة الأحياء للمرحلة الثانوية'),
('التاريخ', 'مادة التاريخ والجغرافيا'),
('الحاسوب', 'مادة علوم الحاسوب والبرمجة'),
('التربية الإسلامية', 'مادة التربية الإسلامية');

-- إدراج أماكن الحصص
INSERT INTO locations (name, room_number, capacity, description) VALUES
('سنتر التفوق', 'A101', 30, 'قاعة مجهزة بأحدث التقنيات'),
('سنتر المجد', 'B201', 25, 'قاعة للمجموعات الصغيرة'),
('سنتر النجاح', 'C301', 35, 'قاعة كبيرة للمحاضرات'),
('القاعة الرئيسية', 'MAIN', 50, 'القاعة الرئيسية للفعاليات'),
('المختبر العلمي', 'LAB1', 20, 'مختبر مجهز للتجارب العلمية'),
('قاعة الحاسوب', 'COMP1', 25, 'قاعة مجهزة بأجهزة الحاسوب'),
('قاعة الفنون', 'ART1', 20, 'قاعة للأنشطة الفنية'),
('المكتبة', 'LIB1', 40, 'مكتبة للدراسة والبحث');

-- إدراج المعلمين
INSERT INTO teachers (name, subject_id, phone, email) VALUES
('أحمد محمد علي', 1, '966501234567', 'ahmed.math@school.edu'),
('فاطمة عبدالله', 2, '966501234568', 'fatima.science@school.edu'),
('محمد حسن', 3, '966501234569', 'mohammed.arabic@school.edu'),
('نورا سالم', 4, '966501234570', 'nora.english@school.edu'),
('خالد أحمد', 5, '966501234571', 'khalid.physics@school.edu'),
('سارة محمود', 6, '966501234572', 'sara.chemistry@school.edu'),
('عبدالرحمن يوسف', 7, '966501234573', 'abdulrahman.biology@school.edu'),
('مريم خالد', 8, '966501234574', 'mariam.history@school.edu'),
('يوسف عبدالله', 9, '966501234575', 'youssef.computer@school.edu'),
('زينب محمد', 10, '966501234576', 'zainab.islamic@school.edu');

-- إدراج الفصول مع ربط صحيح بالمواد
INSERT INTO classes (name, teacher_id, subject_id, max_capacity) VALUES
('الصف الأول أ - رياضيات', 1, 1, 30),
('الصف الثاني ب - علوم', 2, 2, 25),
('الصف الثالث ج - عربي', 3, 3, 28),
('الصف الأول ب - إنجليزي', 4, 4, 30),
('الثانوي - فيزياء', 5, 5, 20),
('الثانوي - كيمياء', 6, 6, 22),
('الثانوي - أحياء', 7, 7, 24),
('الصف الثاني أ - تاريخ', 8, 8, 26),
('الثانوي - حاسوب', 9, 9, 20),
('الصف الأول ج - إسلامية', 10, 10, 32);

-- إدراج الطلاب
INSERT INTO students (name, barcode, parent_phone, parent_email, class_id, emergency_contact) VALUES
('أحمد محمد علي', 'STUD000001', '966501234567', 'parent1@email.com', 1, '966501234567'),
('فاطمة عبدالله', 'STUD000002', '966501234568', 'parent2@email.com', 1, '966501234568'),
('محمد خالد', 'STUD000003', '966501234569', 'parent3@email.com', 2, '966501234569'),
('نور حسن', 'STUD000004', '966501234570', 'parent4@email.com', 2, '966501234570'),
('عبدالرحمن سعد', 'STUD000005', '966501234571', 'parent5@email.com', 3, '966501234571'),
('سارة أحمد', 'STUD000006', '966501234572', 'parent6@email.com', 3, '966501234572'),
('علي محمود', 'STUD000007', '966501234573', 'parent7@email.com', 4, '966501234573'),
('مريم خالد', 'STUD000008', '966501234574', 'parent8@email.com', 4, '966501234574'),
('يوسف عبدالله', 'STUD000009', '966501234575', 'parent9@email.com', 5, '966501234575'),
('زينب محمد', 'STUD000010', '966501234576', 'parent10@email.com', 5, '966501234576'),
('حسام أحمد', 'STUD000011', '966501234577', 'parent11@email.com', 1, '966501234577'),
('ليلى محمود', 'STUD000012', '966501234578', 'parent12@email.com', 2, '966501234578'),
('عمر سالم', 'STUD000013', '966501234579', 'parent13@email.com', 3, '966501234579'),
('رنا عبدالله', 'STUD000014', '966501234580', 'parent14@email.com', 4, '966501234580'),
('طارق محمد', 'STUD000015', '966501234581', 'parent15@email.com', 5, '966501234581');

-- إدراج جلسات تجريبية مع تواريخ صحيحة
INSERT INTO sessions (class_id, location_id, start_time, end_time, status, created_by) VALUES
(1, 1, '2024-01-20 09:00:00', '2024-01-20 10:30:00', 'active', 1),
(2, 2, '2024-01-20 11:00:00', '2024-01-20 12:30:00', 'active', 1),
(3, 3, '2024-01-20 14:00:00', '2024-01-20 15:30:00', 'scheduled', 1),
(4, 4, '2024-01-21 09:00:00', '2024-01-21 10:30:00', 'scheduled', 1),
(5, 5, '2024-01-21 11:00:00', '2024-01-21 12:30:00', 'scheduled', 1),
(1, 1, '2024-01-19 09:00:00', '2024-01-19 10:30:00', 'completed', 1),
(2, 2, '2024-01-19 11:00:00', '2024-01-19 12:30:00', 'completed', 1),
(6, 6, '2024-01-20 16:00:00', '2024-01-20 17:30:00', 'active', 1),
(7, 7, '2024-01-21 14:00:00', '2024-01-21 15:30:00', 'scheduled', 1),
(8, 8, '2024-01-22 10:00:00', '2024-01-22 11:30:00', 'scheduled', 1);

-- إدراج سجلات حضور تجريبية
INSERT INTO attendance (student_id, session_id, status, recorded_by) VALUES
(1, 1, 'present', 1),
(2, 1, 'present', 1),
(11, 1, 'absent', 1),
(3, 2, 'present', 1),
(4, 2, 'absent', 1),
(12, 2, 'late', 1),
(5, 3, 'present', 1),
(6, 3, 'late', 1),
(13, 3, 'present', 1),
(1, 6, 'present', 1),
(2, 6, 'present', 1),
(11, 6, 'present', 1),
(3, 7, 'present', 1),
(4, 7, 'present', 1),
(12, 7, 'absent', 1);

-- إدراج تقارير تجريبية
INSERT INTO reports (student_id, session_id, teacher_rating, quiz_score, participation, behavior, homework, comments, strengths, areas_for_improvement, created_by) VALUES
(1, 1, 5, 95.5, 5, 'ممتاز', 'completed', 'طالب متميز ومتفاعل', 'فهم سريع وحل ممتاز للمسائل', 'يمكن تحسين سرعة الحل', 1),
(2, 1, 4, 87.0, 4, 'جيد جداً', 'completed', 'أداء جيد يحتاج تحسين بسيط', 'مشاركة جيدة في النقاش', 'يحتاج تركيز أكثر في التفاصيل', 1),
(3, 2, 5, 92.0, 5, 'ممتاز', 'completed', 'مشاركة فعالة وفهم ممتاز', 'تفاعل ممتاز مع التجارب', 'لا يوجد', 1),
(5, 3, 4, 88.5, 4, 'جيد', 'completed', 'يحتاج المزيد من التركيز', 'قراءة جيدة', 'تحسين الخط والإملاء', 1),
(1, 6, 5, 98.0, 5, 'ممتاز', 'completed', 'أداء استثنائي', 'حل إبداعي للمسائل', 'لا يوجد', 1),
(2, 6, 4, 85.0, 4, 'جيد جداً', 'completed', 'تحسن ملحوظ', 'زيادة في التركيز', 'مراجعة الأساسيات', 1),
(3, 7, 5, 94.0, 5, 'ممتاز', 'completed', 'فهم عميق للمادة', 'تحليل ممتاز للنصوص', 'لا يوجد', 1),
(4, 7, 3, 72.0, 3, 'مقبول', 'incomplete', 'يحتاج متابعة أكثر', 'محاولة جيدة', 'إكمال الواجبات والمراجعة', 1);

-- إدراج إعدادات النظام
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category) VALUES
('whatsapp_enabled', 'true', 'boolean', 'تفعيل خدمة الواتساب', 'whatsapp'),
('whatsapp_session_name', 'attendance-system', 'string', 'اسم جلسة الواتساب', 'whatsapp'),
('default_session_duration', '90', 'number', 'مدة الجلسة الافتراضية بالدقائق', 'sessions'),
('attendance_grace_period', '15', 'number', 'فترة السماح للحضور بالدقائق', 'attendance'),
('barcode_prefix', 'STUD', 'string', 'بادئة رمز الطالب', 'students'),
('system_name', 'نظام إدارة الحضور الشامل', 'string', 'اسم النظام', 'general'),
('school_name', 'مدرسة المستقبل', 'string', 'اسم المدرسة', 'general'),
('admin_email', 'admin@attendance.local', 'string', 'بريد المدير الإلكتروني', 'general');

-- رسالة النجاح
SELECT 'تم إنشاء قاعدة البيانات المحسنة بنجاح!' as message,
       'جميع المشاكل تم إصلاحها والربط مع Frontend محسن' as note;