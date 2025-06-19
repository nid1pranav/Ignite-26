-- Insert admin user
INSERT INTO users (id, email, password, firstName, lastName, role, createdAt, updatedAt) 
VALUES ('admin1', 'admin@ignite2026.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System', 'Administrator', 'ADMIN', datetime('now'), datetime('now'));

-- Insert brigade leads
INSERT INTO users (id, email, password, firstName, lastName, role, createdAt, updatedAt) VALUES
('lead1', 'lead1@ignite2026.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Brigade', 'Lead 1', 'BRIGADE_LEAD', datetime('now'), datetime('now')),
('lead2', 'lead2@ignite2026.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Brigade', 'Lead 2', 'BRIGADE_LEAD', datetime('now'), datetime('now')),
('lead3', 'lead3@ignite2026.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Brigade', 'Lead 3', 'BRIGADE_LEAD', datetime('now'), datetime('now'));

-- Insert brigades
INSERT INTO brigades (id, name, leaderId, createdAt, updatedAt) VALUES
('brigade1', 'Brigade Alpha', 'lead1', datetime('now'), datetime('now')),
('brigade2', 'Brigade Beta', 'lead2', datetime('now'), datetime('now')),
('brigade3', 'Brigade Gamma', 'lead3', datetime('now'), datetime('now'));

-- Insert student users
INSERT INTO users (id, email, password, firstName, lastName, role, createdAt, updatedAt) VALUES
('student1', 'student1@ignite2026.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Student', '1', 'STUDENT', datetime('now'), datetime('now')),
('student2', 'student2@ignite2026.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Student', '2', 'STUDENT', datetime('now'), datetime('now')),
('student3', 'student3@ignite2026.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Student', '3', 'STUDENT', datetime('now'), datetime('now'));

-- Insert students
INSERT INTO students (id, tempRollNumber, firstName, lastName, email, phone, brigadeId, userId, createdAt, updatedAt) VALUES
('stud1', 'IG2026001', 'Student', '1', 'student1@ignite2026.com', '+919876543210', 'brigade1', 'student1', datetime('now'), datetime('now')),
('stud2', 'IG2026002', 'Student', '2', 'student2@ignite2026.com', '+919876543211', 'brigade2', 'student2', datetime('now'), datetime('now')),
('stud3', 'IG2026003', 'Student', '3', 'student3@ignite2026.com', '+919876543212', 'brigade3', 'student3', datetime('now'), datetime('now'));

-- Insert sample event
INSERT INTO events (id, name, description, startDate, endDate, createdAt, updatedAt) VALUES
('event1', 'Ignite 2026', 'Annual technical fest at Kumaraguru Institutions', '2026-03-15 00:00:00', '2026-03-17 23:59:59', datetime('now'), datetime('now'));

-- Insert event days
INSERT INTO event_days (id, eventId, date, fnEnabled, anEnabled, fnStartTime, fnEndTime, anStartTime, anEndTime, createdAt, updatedAt) VALUES
('day1', 'event1', '2026-03-15 00:00:00', 1, 1, '09:00', '09:30', '14:00', '14:30', datetime('now'), datetime('now')),
('day2', 'event1', '2026-03-16 00:00:00', 1, 1, '09:00', '09:30', '14:00', '14:30', datetime('now'), datetime('now')),
('day3', 'event1', '2026-03-17 00:00:00', 1, 1, '09:00', '09:30', '14:00', '14:30', datetime('now'), datetime('now'));

-- Insert sample notifications
INSERT INTO notifications (id, title, message, type, isGlobal, createdAt, updatedAt) VALUES
('notif1', 'Welcome to Ignite 2026', 'Welcome to the Ignite 2026 Attendance Management System. Please ensure you mark attendance on time.', 'INFO', 1, datetime('now'), datetime('now')),
('notif2', 'Attendance Reminder', 'Reminder: FN session attendance should be marked between 9:00 AM - 9:30 AM', 'WARNING', 0, datetime('now'), datetime('now'));

-- Insert user notifications for all users
INSERT INTO user_notifications (id, userId, notificationId, createdAt) VALUES
('un1', 'admin1', 'notif1', datetime('now')),
('un2', 'lead1', 'notif1', datetime('now')),
('un3', 'lead2', 'notif1', datetime('now')),
('un4', 'lead3', 'notif1', datetime('now')),
('un5', 'student1', 'notif1', datetime('now')),
('un6', 'student2', 'notif1', datetime('now')),
('un7', 'student3', 'notif1', datetime('now'));