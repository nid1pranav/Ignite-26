import { apiClient } from './client'
import { AttendanceRecord, PaginatedResponse } from '@/types'

export interface AttendanceQuery {
  eventDayId?: string
  brigadeId?: string
  session?: 'FN' | 'AN'
  page?: number
  limit?: number
}

export interface MarkAttendanceData {
  studentId: string
  eventDayId: string
  session: 'FN' | 'AN'
  status?: 'PRESENT' | 'ABSENT' | 'LATE'
}

export interface BulkMarkAttendanceData {
  studentIds: string[]
  eventDayId: string
  session: 'FN' | 'AN'
  status?: 'PRESENT' | 'ABSENT' | 'LATE'
}

export const attendanceApi = {
  getAttendanceRecords: async (params: AttendanceQuery = {}): Promise<PaginatedResponse<AttendanceRecord>> => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })
    
    const response = await apiClient.get<{ records: AttendanceRecord[]; pagination: any }>(`/attendance?${searchParams}`)
    return {
      data: response.records,
      pagination: response.pagination
    }
  },

  markAttendance: async (data: MarkAttendanceData): Promise<AttendanceRecord> => {
    return apiClient.post('/attendance/mark', data)
  },

  bulkMarkAttendance: async (data: BulkMarkAttendanceData): Promise<{ message: string; records: AttendanceRecord[] }> => {
    return apiClient.post('/attendance/bulk-mark', data)
  },

  getAttendanceSummary: async (eventDayId: string, session?: 'FN' | 'AN') => {
    const params = session ? `?session=${session}` : ''
    return apiClient.get(`/attendance/summary/${eventDayId}${params}`)
  },
}