import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { usersApi } from '@/api/users'
import { User, Mail, Phone, Shield, Calendar, Key } from 'lucide-react'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function StudentProfile() {
  const { user } = useAuth()
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    try {
      await usersApi.changePassword(passwordData.currentPassword, passwordData.newPassword)
      toast.success('Password changed successfully')
      setShowPasswordModal(false)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to change password')
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-2">View and manage your profile information</p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Your personal and academic details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <Label className="text-sm text-gray-600">Full Name</Label>
                  <p className="font-medium">{user.firstName} {user.lastName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-500" />
                <div>
                  <Label className="text-sm text-gray-600">Email</Label>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-gray-500" />
                <div>
                  <Label className="text-sm text-gray-600">Role</Label>
                  <p className="font-medium capitalize">{user.role.toLowerCase().replace('_', ' ')}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {user.student && (
                <>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <Label className="text-sm text-gray-600">Roll Number</Label>
                      <p className="font-medium font-mono">{user.student.tempRollNumber}</p>
                    </div>
                  </div>

                  {user.student.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-500" />
                      <div>
                        <Label className="text-sm text-gray-600">Phone</Label>
                        <p className="font-medium">{user.student.phone}</p>
                      </div>
                    </div>
                  )}

                  {user.student.brigade && (
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-gray-500" />
                      <div>
                        <Label className="text-sm text-gray-600">Brigade</Label>
                        <p className="font-medium">{user.student.brigade.name}</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <Label className="text-sm text-gray-600">Last Login</Label>
                  <p className="font-medium">
                    {user.lastLogin ? formatDateTime(user.lastLogin) : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>
            Manage your account security and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-gray-500" />
                <div>
                  <h3 className="font-medium">Password</h3>
                  <p className="text-sm text-gray-600">Change your account password</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowPasswordModal(true)}
              >
                Change Password
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-gray-500" />
                <div>
                  <h3 className="font-medium">Account Status</h3>
                  <p className="text-sm text-gray-600">Your account is active and verified</p>
                </div>
              </div>
              <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Active
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Academic Information */}
      {user.student && (
        <Card>
          <CardHeader>
            <CardTitle>Academic Information</CardTitle>
            <CardDescription>
              Your academic details and enrollment information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-gray-600">Student ID</Label>
                  <p className="font-medium font-mono">{user.student.id}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Enrollment Status</Label>
                  <p className="font-medium">
                    {user.student.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-gray-600">Registration Date</Label>
                  <p className="font-medium">{formatDateTime(user.student.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Last Updated</Label>
                  <p className="font-medium">{formatDateTime(user.student.updatedAt)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Change Password Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password *</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password *</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="At least 6 characters"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPasswordModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Change Password
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}