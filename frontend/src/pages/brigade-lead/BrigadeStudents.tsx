import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { studentsApi } from '@/api/students'
import { brigadesApi } from '@/api/brigades'
import { Student, Brigade, PaginatedResponse } from '@/types'
import { Search, Plus, Edit, Eye } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import StudentModal from '@/components/modals/StudentModal'

export default function BrigadeStudents() {
  const [students, setStudents] = useState<Student[]>([])
  const [brigades, setBrigades] = useState<Brigade[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBrigade, setSelectedBrigade] = useState('')
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  })
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  useEffect(() => {
    fetchStudents()
    fetchBrigades()
  }, [pagination.currentPage, searchTerm, selectedBrigade])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const response = await studentsApi.getStudents({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        search: searchTerm || undefined,
        brigadeId: selectedBrigade || undefined
      })
      setStudents(response.data)
      setPagination(response.pagination)
    } catch (error) {
      toast.error('Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }

  const fetchBrigades = async () => {
    try {
      const data = await brigadesApi.getBrigades()
      setBrigades(data)
    } catch (error) {
      console.error('Failed to fetch brigades:', error)
    }
  }

  const handleStudentSaved = () => {
    fetchStudents()
    setShowStudentModal(false)
    setSelectedStudent(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Students</h1>
          <p className="text-gray-600 mt-2">Manage students in your brigades</p>
        </div>
        <Button onClick={() => setShowStudentModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <select
                value={selectedBrigade}
                onChange={(e) => setSelectedBrigade(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">All My Brigades</option>
                {brigades.map((brigade) => (
                  <option key={brigade.id} value={brigade.id}>
                    {brigade.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Students List</CardTitle>
          <CardDescription>
            {pagination.totalItems} total students
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No students found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Roll Number</th>
                    <th className="text-left py-3 px-4 font-medium">Name</th>
                    <th className="text-left py-3 px-4 font-medium">Email</th>
                    <th className="text-left py-3 px-4 font-medium">Brigade</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm">
                        {student.tempRollNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">
                            {student.firstName} {student.lastName}
                          </p>
                          {student.phone && (
                            <p className="text-sm text-gray-500">{student.phone}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {student.email || '-'}
                      </td>
                      <td className="py-3 px-4">
                        {student.brigade ? (
                          <Badge variant="secondary">
                            {student.brigade.name}
                          </Badge>
                        ) : (
                          <span className="text-gray-500">No Brigade</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={student.isActive ? "default" : "secondary"}>
                          {student.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedStudent(student)
                              setShowStudentModal(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // View student details
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

      {/* Student Modal */}
      <StudentModal
        open={showStudentModal}
        onOpenChange={setShowStudentModal}
        student={selectedStudent}
        brigades={brigades}
        onSaved={handleStudentSaved}
      />
    </div>
  )
}