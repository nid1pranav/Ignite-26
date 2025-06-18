export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'ADMIN' | 'BRIGADE_LEAD' | 'STUDENT'
  isActive: boolean
  createdAt: string
  lastLogin?: string
  student?: Student
  brigades?: Brigade[]
}

export interface Student {
  id: string
  tempRollNumber: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  brigadeId?: string
  userId?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  brigade?: Brigade
  user?: User
  attendanceRecords?: AttendanceRecord[]
}

export interface Brigade {
  id: string
  name: string
  leaderId?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  leader?: User
  students?: Student[]
  _count?: {
    students: number
  }
}

export interface Event {
  id: string
  name: string
  description?: string
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  eventDays: EventDay[]
}

export interface EventDay {
  id: string
  eventId: string
  date: string
  fnEnabled: boolean
  anEnabled: boolean
  fnStartTime: string
  fnEndTime: string
  anStartTime: string
  anEndTime: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  event?: Event
  attendanceRecords?: AttendanceRecord[]
  _count?: {
    attendanceRecords: number
  }
}

export interface AttendanceRecord {
  id: string
  studentId: string
  eventDayId: string
  session: 'FN' | 'AN'
  status: 'PRESENT' | 'ABSENT' | 'LATE'
  markedAt: string
  markedBy?: string
  createdAt: string
  updatedAt: string
  student?: Student
  eventDay?: EventDay
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'
  targetRole?: 'ADMIN' | 'BRIGADE_LEAD' | 'STUDENT'
  isGlobal: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  expiresAt?: string
}

export interface UserNotification {
  id: string
  userId: string
  notificationId: string
  isRead: boolean
  readAt?: string
  createdAt: string
  notification: Notification
}

export interface DashboardStats {
  admin?: {
    totalStudents: number
    totalBrigades: number
    totalBrigadeLeads: number
    todayAttendance: number
    overallAttendancePercentage: string
    currentEvent?: {
      name: string
      totalDays: number
    }
  }
  brigadeLead?: {
    totalBrigades: number
    totalStudents: number
    todayAttendance: number
    brigadeAttendancePercentage: string
    brigades: Array<{
      id: string
      name: string
      studentCount: number
    }>
  }
  student?: {
    studentInfo: {
      tempRollNumber: string
      name: string
      brigade: string
    }
    attendancePercentage: string
    totalSessions: number
    presentSessions: number
    todaySessions: number
    todayPresent: number
  }
}

export interface AttendanceTrend {
  date: string
  total: number
  present: number
  absent: number
  late: number
  fnTotal: number
  fnPresent: number
  anTotal: number
  anPresent: number
}

export interface BrigadeComparison {
  id: string
  name: string
  totalStudents: number
  totalRecords: number
  presentRecords: number
  attendancePercentage: string
}

export interface SessionAnalysis {
  forenoon: {
    total: number
    present: number
    absent: number
    late: number
    percentage: string
  }
  afternoon: {
    total: number
    present: number
    absent: number
    late: number
    percentage: string
  }
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
  }
}