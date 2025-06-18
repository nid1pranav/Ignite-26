import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { attendanceApi } from '@/api/attendance'
import { AttendanceRecord } from '@/types'
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatDateTime, formatDate } from '@/lib/utils'

export default function StudentAttendance() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  })

  useEffect(() => {
    fetchAttendanceRecords()
  }, [pagination.currentPage])

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true)
      const response = await attendanceApi.getAttendanceRecords({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage
      })
      setAttendanceRecords(response.data)
      setPagination(response.pagination)
    } catch (error) {
      console.error('Failed to fetch attendance records:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'ABSENT':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'LATE':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'default'
      case 'ABSENT': return 'destructive'
      case 'LATE': return 'secondary'
      default: return 'outline'
    }
  }

  const getSessionBadgeVariant = (session: string) => {
    return session === 'FN' ? 'default' : 'secondary'
  }

  // Calculate statistics
  const totalRecords = attendanceRecords.length
  const presentCount = attendanceRecords.filter(r => r.status === 'PRESENT').length
  const absentCount = attendanceRecords.filter(r => r.status === 'ABSENT').length
  const lateCount = attendanceRecords.filter(r => r.status === 'LATE').length
  const attendancePercentage = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Attendance</h1>
        <p className="text-gray-600 mt-2">View your attendance history and statistics</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-3xl font-bold text-gray-900">{totalRecords}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Present</p>
                <p className="text-3xl font-bold text-green-600">{presentCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Absent</p>
                <p className="text-3xl font-bold text-red-600">{absentCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Attendance %</p>
                <p className="text-3xl font-bold text-blue-600">{attendancePercentage}%</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>
            Your complete attendance record
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No attendance records found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {attendanceRecords.map((record) => (
                <div key={record.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(record.status)}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">
                            {record.eventDay?.event?.name || 'Event'}
                          </h3>
                          <Badge variant={getSessionBadgeVariant(record.session)}>
                            {record.session}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {formatDate(record.eventDay?.date || record.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge variant={getStatusBadgeVariant(record.status)}>
                          {record.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDateTime(record.markedAt)}
                        </p>
                      </div>
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
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>
            Your attendance performance breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{presentCount}</p>
              <p className="text-sm text-green-700">Sessions Present</p>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-600">{absentCount}</p>
              <p className="text-sm text-red-700">Sessions Absent</p>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-600">{lateCount}</p>
              <p className="text-sm text-yellow-700">Late Arrivals</p>
            </div>
          </div>

          <div className="mt-6 p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Attendance Rate</span>
              <span className="text-sm font-bold">{attendancePercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  parseFloat(attendancePercentage) >= 90 
                    ? 'bg-green-500' 
                    : parseFloat(attendancePercentage) >= 75 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
                }`}
                style={{ width: `${attendancePercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {parseFloat(attendancePercentage) >= 90 
                ? 'Excellent attendance!' 
                : parseFloat(attendancePercentage) >= 75 
                ? 'Good attendance, keep it up!' 
                : 'Attendance needs improvement'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}