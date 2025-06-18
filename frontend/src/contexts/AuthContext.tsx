import React, { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '@/api/auth'
import { User } from '@/types'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  studentLogin: (tempRollNumber: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      refreshUser()
    } else {
      setLoading(false)
    }
  }, [])

  const refreshUser = async () => {
    try {
      const userData = await authApi.getCurrentUser()
      setUser(userData)
    } catch (error) {
      localStorage.removeItem('token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password)
      localStorage.setItem('token', response.token)
      setUser(response.user)
      toast.success('Login successful!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed')
      throw error
    }
  }

  const studentLogin = async (tempRollNumber: string, password: string) => {
    try {
      const response = await authApi.studentLogin(tempRollNumber, password)
      localStorage.setItem('token', response.token)
      setUser(response.user)
      toast.success('Login successful!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed')
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    toast.success('Logged out successfully')
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      studentLogin,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}