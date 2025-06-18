import { apiClient } from './client'
import { DashboardStats, AttendanceTrend, BrigadeComparison, SessionAnalysis } from '@/types'

export const analyticsApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    return apiClient.get('/analytics/dashboard')
  },

  getAttendanceTrends: async (days: number = 7, brigadeId?: string): Promise<AttendanceTrend[]> => {
    const params = new URLSearchParams({ days: days.toString() })
    if (brigadeId) params.append('brigadeId', brigadeId)
    return apiClient.get(`/analytics/attendance-trends?${params}`)
  },

  getBrigadeComparison: async (): Promise<BrigadeComparison[]> => {
    return apiClient.get('/analytics/brigade-comparison')
  },

  getSessionAnalysis: async (): Promise<SessionAnalysis> => {
    return apiClient.get('/analytics/session-analysis')
  },
}