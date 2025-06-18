import { apiClient } from './client'
import { User, PaginatedResponse } from '@/types'

export interface UsersQuery {
  page?: number
  limit?: number
  role?: 'ADMIN' | 'BRIGADE_LEAD' | 'STUDENT'
  search?: string
}

export interface CreateUserData {
  email: string
  password: string
  firstName: string
  lastName: string
  role: 'ADMIN' | 'BRIGADE_LEAD' | 'STUDENT'
}

export const usersApi = {
  getUsers: async (params: UsersQuery = {}): Promise<PaginatedResponse<User>> => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })
    
    const response = await apiClient.get<{ users: User[]; pagination: any }>(`/users?${searchParams}`)
    return {
      data: response.users,
      pagination: response.pagination
    }
  },

  createUser: async (data: CreateUserData): Promise<User> => {
    return apiClient.post('/users', data)
  },

  updateUser: async (id: string, data: Partial<Omit<CreateUserData, 'password'>>): Promise<User> => {
    return apiClient.put(`/users/${id}`, data)
  },

  resetPassword: async (id: string, newPassword: string): Promise<{ message: string }> => {
    return apiClient.put(`/users/${id}/reset-password`, { newPassword })
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    return apiClient.put('/users/change-password', { currentPassword, newPassword })
  },

  deleteUser: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete(`/users/${id}`)
  },
}