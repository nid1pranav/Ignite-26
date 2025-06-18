import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { notificationsApi } from '@/api/notifications'
import { Notification, PaginatedResponse } from '@/types'
import { Search, Plus, Trash2, Bell } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  })
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'INFO' as 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS',
    targetRole: '' as '' | 'ADMIN' | 'BRIGADE_LEAD' | 'STUDENT',
    isGlobal: false,
    expiresAt: ''
  })

  useEffect(() => {
    fetchNotifications()
  }, [pagination.currentPage, searchTerm])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await notificationsApi.getAllNotifications({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage
      })
      setNotifications(response.data)
      setPagination(response.pagination)
    } catch (error) {
      toast.error('Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.message) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      await notificationsApi.createNotification({
        title: formData.title,
        message: formData.message,
        type: formData.type,
        targetRole: formData.targetRole || undefined,
        isGlobal: formData.isGlobal,
        expiresAt: formData.expiresAt || undefined
      })
      
      toast.success('Notification created successfully')
      fetchNotifications()
      setShowModal(false)
      resetForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create notification')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return

    try {
      await notificationsApi.deleteNotification(id)
      toast.success('Notification deleted successfully')
      fetchNotifications()
    } catch (error) {
      toast.error('Failed to delete notification')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'INFO',
      targetRole: '',
      isGlobal: false,
      expiresAt: ''
    })
  }

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'SUCCESS': return 'default'
      case 'WARNING': return 'secondary'
      case 'ERROR': return 'destructive'
      case 'INFO': return 'outline'
      default: return 'outline'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return '✅'
      case 'WARNING': return '⚠️'
      case 'ERROR': return '❌'
      case 'INFO': return 'ℹ️'
      default: return 'ℹ️'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-2">Manage system notifications and announcements</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Notification
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            {pagination.totalItems} total notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No notifications found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg">{getTypeIcon(notification.type)}</span>
                        <h3 className="font-medium text-lg">{notification.title}</h3>
                        <Badge variant={getTypeBadgeVariant(notification.type)}>
                          {notification.type}
                        </Badge>
                        {notification.isGlobal && (
                          <Badge variant="outline">Global</Badge>
                        )}
                        {notification.targetRole && (
                          <Badge variant="secondary">
                            {notification.targetRole.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">{notification.message}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Created: {formatDateTime(notification.createdAt)}</span>
                        {notification.expiresAt && (
                          <span>Expires: {formatDateTime(notification.expiresAt)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={notification.isActive ? "default" : "secondary"}>
                        {notification.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(notification.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-500">
                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                {pagination.totalItems} results
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  disabled={pagination.currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Notification Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Notification</DialogTitle>
            <DialogDescription>
              Send a notification to users
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Notification title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Notification message"
                className="w-full h-24 px-3 py-2 rounded-md border border-input bg-background text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="INFO">Info</option>
                  <option value="SUCCESS">Success</option>
                  <option value="WARNING">Warning</option>
                  <option value="ERROR">Error</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetRole">Target Role</Label>
                <select
                  id="targetRole"
                  value={formData.targetRole}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetRole: e.target.value as any }))}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  disabled={formData.isGlobal}
                >
                  <option value="">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="BRIGADE_LEAD">Brigade Lead</option>
                  <option value="STUDENT">Student</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isGlobal"
                checked={formData.isGlobal}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  isGlobal: e.target.checked,
                  targetRole: e.target.checked ? '' : prev.targetRole
                }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isGlobal" className="text-sm">
                Send to all users (Global notification)
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expires At (Optional)</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Create Notification
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}