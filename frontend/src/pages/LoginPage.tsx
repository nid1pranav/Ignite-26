import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GraduationCap, Shield, User } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function LoginPage() {
  const { login, studentLogin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('admin')

  const [adminForm, setAdminForm] = useState({
    email: '',
    password: ''
  })

  const [studentForm, setStudentForm] = useState({
    tempRollNumber: '',
    password: ''
  })

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminForm.email || !adminForm.password) return

    try {
      setLoading(true)
      await login(adminForm.email, adminForm.password)
    } catch (error) {
      // Error is handled in the context
    } finally {
      setLoading(false)
    }
  }

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentForm.tempRollNumber || !studentForm.password) return

    try {
      setLoading(true)
      await studentLogin(studentForm.tempRollNumber, studentForm.password)
    } catch (error) {
      // Error is handled in the context
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">I26</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Ignite 2026</h1>
          <p className="text-gray-600 mt-2">Attendance Management System</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Admin/Lead
                </TabsTrigger>
                <TabsTrigger value="student" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Student
                </TabsTrigger>
              </TabsList>

              <TabsContent value="admin" className="space-y-4">
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={adminForm.email}
                      onChange={(e) => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={adminForm.password}
                      onChange={(e) => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="student" className="space-y-4">
                <form onSubmit={handleStudentLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="rollNumber">Temporary Roll Number</Label>
                    <Input
                      id="rollNumber"
                      type="text"
                      placeholder="Enter your roll number"
                      value={studentForm.tempRollNumber}
                      onChange={(e) => setStudentForm(prev => ({ ...prev, tempRollNumber: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studentPassword">Password</Label>
                    <Input
                      id="studentPassword"
                      type="password"
                      placeholder="Enter your password"
                      value={studentForm.password}
                      onChange={(e) => setStudentForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-sm mb-2">Demo Credentials:</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Admin:</strong> admin@ignite2026.com / admin123</p>
                <p><strong>Brigade Lead:</strong> lead1@ignite2026.com / lead123</p>
                <p><strong>Student:</strong> IG2026001 / student123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}