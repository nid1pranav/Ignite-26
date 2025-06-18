import { apiClient } from './client'
import { User } from '@/types'

export interface LoginResponse {
  token: string
  user: User
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    return apiClient.post('/auth/login', { email, password })
  },

  studentLogin: async (tempRollNumber: string, password: string): Promise<LoginResponse> => {
    return apiClient.post('/auth/student-login', { tempRollNumber, password })
  },

  getCurrentUser: async (): Promise<User> => {
    return apiClient.get('/auth/me')
  },
}