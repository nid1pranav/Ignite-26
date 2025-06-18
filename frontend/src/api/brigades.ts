import { apiClient } from './client'
import { Brigade } from '@/types'

export interface CreateBrigadeData {
  name: string
  leaderId?: string
}

export const brigadesApi = {
  getBrigades: async (): Promise<Brigade[]> => {
    return apiClient.get('/brigades')
  },

  getBrigade: async (id: string): Promise<Brigade> => {
    return apiClient.get(`/brigades/${id}`)
  },

  createBrigade: async (data: CreateBrigadeData): Promise<Brigade> => {
    return apiClient.post('/brigades', data)
  },

  updateBrigade: async (id: string, data: Partial<CreateBrigadeData>): Promise<Brigade> => {
    return apiClient.put(`/brigades/${id}`, data)
  },

  deleteBrigade: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete(`/brigades/${id}`)
  },

  getBrigadeStats: async (id: string) => {
    return apiClient.get(`/brigades/${id}/stats`)
  },
}