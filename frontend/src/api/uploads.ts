import { apiClient } from './client'

export interface UploadStudentsData {
  file: File
  brigadeId?: string
  createUserAccounts?: boolean
}

export const uploadsApi = {
  uploadStudents: async (data: UploadStudentsData) => {
    const formData = new FormData()
    formData.append('file', data.file)
    if (data.brigadeId) formData.append('brigadeId', data.brigadeId)
    if (data.createUserAccounts) formData.append('createUserAccounts', 'true')
    
    return apiClient.upload('/uploads/students', formData)
  },

  downloadStudentsTemplate: async (): Promise<Blob> => {
    return apiClient.download('/uploads/template/students')
  },
}