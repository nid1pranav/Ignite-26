import { apiClient } from './client'
import { Student, PaginatedResponse } from '@/types'

export interface StudentsQuery {
  page?: number
  limit?: number
  search?: string
  brigadeId?: string
}

export interface CreateStudentData {
  tempRollNumber: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  brigadeId?: string
  createUserAccount?: boolean
}

export const studentsApi = {
  getStudents: async (params: StudentsQuery = {}): Promise<PaginatedResponse<Student>> => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })
    
    const response = await apiClient.get<{ students: Student[]; pagination: any }>(`/students?${searchParams}`)
    return {
      data: response.students,
      pagination: response.pagination
    }
  },

  getStudent: async (id: string): Promise<Student> => {
    return apiClient.get(`/students/${id}`)
  },

  createStudent: async (data: CreateStudentData): Promise<Student> => {
    return apiClient.post('/students', data)
  },

  updateStudent: async (id: string, data: Partial<CreateStudentData>): Promise<Student> => {
    return apiClient.put(`/students/${id}`, data)
  },

  deleteStudent: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete(`/students/${id}`)
  },

  getStudentAttendance: async (id: string) => {
    return apiClient.get(`/students/${id}/attendance`)
  },
}