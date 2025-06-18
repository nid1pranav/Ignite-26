import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { studentsApi, CreateStudentData } from '@/api/students'
import { Student, Brigade } from '@/types'
import { toast } from 'sonner'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface StudentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student?: Student | null
  brigades: Brigade[]
  onSaved: () => void
}

export default function StudentModal({ open, onOpenChange, student, brigades, onSaved }: StudentModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreateStudentData>({
    tempRollNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    brigadeId: '',
    createUserAccount: false
  })

  useEffect(() => {
    if (student) {
      setFormData({
        tempRollNumber: student.tempRollNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email || '',
        phone: student.phone || '',
        brigadeId: student.brigadeId || '',
        createUserAccount: false
      })
    } else {
      setFormData({
        tempRollNumber: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        brigadeId: '',
        createUserAccount: false
      })
    }
  }, [student, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.tempRollNumber || !formData.firstName || !formData.lastName) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      
      if (student) {
        await studentsApi.updateStudent(student.id, formData)
        toast.success('Student updated successfully')
      } else {
        await studentsApi.createStudent(formData)
        toast.success('Student created successfully')
      }
      
      onSaved()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save student')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {student ? 'Edit Student' : 'Add New Student'}
          </DialogTitle>
          <DialogDescription>
            {student ? 'Update student information' : 'Create a new student record'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tempRollNumber">Temporary Roll Number *</Label>
            <Input
              id="tempRollNumber"
              value={formData.tempRollNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, tempRollNumber: e.target.value }))}
              placeholder="IG2026001"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="student@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+91 9876543210"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brigadeId">Brigade</Label>
            <select
              id="brigadeId"
              value={formData.brigadeId}
              onChange={(e) => setFormData(prev => ({ ...prev, brigadeId: e.target.value }))}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">Select Brigade</option>
              {brigades.map((brigade) => (
                <option key={brigade.id} value={brigade.id}>
                  {brigade.name}
                </option>
              ))}
            </select>
          </div>

          {!student && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="createUserAccount"
                checked={formData.createUserAccount}
                onChange={(e) => setFormData(prev => ({ ...prev, createUserAccount: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="createUserAccount" className="text-sm">
                Create user account for login
              </Label>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                student ? 'Update' : 'Create'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}