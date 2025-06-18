import { apiClient } from './client'
import { UserNotification, Notification, PaginatedResponse } from '@/types'

export interface NotificationsQuery {
  page?: number
  limit?: number
  unreadOnly?: boolean
}

export interface CreateNotificationData {
  title: string
  message: string
  type?: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'
  targetRole?: 'ADMIN' | 'BRIGADE_LEAD' | 'STUDENT'
  isGlobal?: boolean
  expiresAt?: string
}

export const notificationsApi = {
  getNotifications: async (params: NotificationsQuery = {}): Promise<PaginatedResponse<UserNotification>> => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })
    
    const response = await apiClient.get<{ notifications: UserNotification[]; pagination: any }>(`/notifications?${searchParams}`)
    return {
      data: response.notifications,
      pagination: response.pagination
    }
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    return apiClient.get('/notifications/unread-count')
  },

  markAsRead: async (id: string): Promise<UserNotification> => {
    return apiClient.put(`/notifications/${id}/read`)
  },

  markAllAsRead: async (): Promise<{ message: string }> => {
    return apiClient.put('/notifications/mark-all-read')
  },

  createNotification: async (data: CreateNotificationData): Promise<Notification> => {
    return apiClient.post('/notifications', data)
  },

  getAllNotifications: async (params: NotificationsQuery = {}): Promise<PaginatedResponse<Notification>> => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })
    
    const response = await apiClient.get<{ notifications: Notification[]; pagination: any }>(`/notifications/admin/all?${searchParams}`)
    return {
      data: response.notifications,
      pagination: response.pagination
    }
  },

  deleteNotification: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete(`/notifications/${id}`)
  },
}