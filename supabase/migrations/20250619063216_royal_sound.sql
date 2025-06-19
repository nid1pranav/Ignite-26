-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLogin" DATETIME
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tempRollNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "brigadeId" TEXT,
    "userId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "students_brigadeId_fkey" FOREIGN KEY ("brigadeId") REFERENCES "brigades" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "brigades" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "leaderId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "brigades_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "event_days" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "fnEnabled" BOOLEAN NOT NULL DEFAULT true,
    "anEnabled" BOOLEAN NOT NULL DEFAULT true,
    "fnStartTime" TEXT NOT NULL DEFAULT '09:00',
    "fnEndTime" TEXT NOT NULL DEFAULT '09:30',
    "anStartTime" TEXT NOT NULL DEFAULT '14:00',
    "anEndTime" TEXT NOT NULL DEFAULT '14:30',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "event_days_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "eventDayId" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "markedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "markedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "attendance_records_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "attendance_records_eventDayId_fkey" FOREIGN KEY ("eventDayId") REFERENCES "event_days" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "attendance_records_markedBy_fkey" FOREIGN KEY ("markedBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "targetRole" TEXT,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_notifications_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_tempRollNumber_key" ON "students"("tempRollNumber");

-- CreateIndex
CREATE UNIQUE INDEX "students_userId_key" ON "students"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "brigades_name_key" ON "brigades"("name");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_studentId_eventDayId_session_key" ON "attendance_records"("studentId", "eventDayId", "session");

-- CreateIndex
CREATE UNIQUE INDEX "user_notifications_userId_notificationId_key" ON "user_notifications"("userId", "notificationId");