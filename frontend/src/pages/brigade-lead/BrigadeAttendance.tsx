import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { attendanceApi } from '@/api/attendance'
import { eventsApi } from '@/api/events'
import { studentsApi } from '@/api/students'
import { AttendanceRecord, Event, EventDay, Student } from '@/types'
import { UserCheck, Clock, Users, Calendar, CheckCircle } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { toast } from 'sonner'
import { formatDateTime, formatTime, getSessionStatus } from '@/lib/utils'

export default function BrigadeAttendance() {
  const [currentEvent, setCurrentEvent] = useState<{ event: Event; currentDay: EventDay | null } | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAttendance, setMarkingAttendance] = useState(false)
  const [selectedSession, setSelectedSession] = useState<'FN' | 'AN'>('FN')
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchCurrentEvent()
    fetchStudents()
  }, [])

  useEffect(() => {
    if (currentEvent?.currentDay) {
      fetchAttendanceRecords()
    }
  }, [currentEvent, selectedSession])

  const fetchCurrentEvent = async () => {
    try {
      const data = await eventsApi.getCurrentEvent()
      setCurrentEvent(data)
    } catch (error) {
      console.error('Failed to fetch current event:', error)
    }
  }

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const response = await studentsApi.getStudents({ limit: 1000 })
      setStudents(response.data)
    } catch (error) {
      toast.error('Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendanceRecords = async () => {
    if (!currentEvent?.currentDay) return

    try {
      const response = await attendanceApi.getAttendanceRecords({
        eventDayId: currentEvent.currentDay.id,
        session: selectedSession,
        limit: 1000
      })
      setAttendanceRecords(response.data)
    } catch (error) {
      console.error('Failed to fetch attendance records:', error)
    }
  }

  const handleMarkAttendance = async (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' = 'PRESENT') => {
    if (!currentEvent?.currentDay) {
      toast.error('No active event day')
      return
    }

    try {
      await attendanceApi.markAttendance({
        studentId,
        eventDayId: currentEvent.currentDay.id,
        session: selectedSession,
        status
      })
      
      toast.success('Attendance marked successfully')
      fetchAttendanceRecords()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark attendance')
    }
  }

  const handleBulkMarkAttendance = async (status: 'PRESENT' | 'ABSENT' | 'LATE' = 'PRESENT') => {
    if (!currentEvent?.currentDay || selectedStudents.size === 0) {
      toast.error('Please select students first')
      return
    }

    try {
      setMarkingAttendance(true)
      await attendanceApi.bulkMarkAttendance({
        studentIds: Array.from(selectedStudents),
        eventDayId: currentEvent.currentDay.id,
        session: selectedSession,
        status
      })
      
      toast.success(`Attendance marked for ${selectedStudents.size} students`)
      setSelectedStudents(new Set())
      fetchAttendanceRecords()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark bulk attendance')
    } finally {
      setMarkingAttendance(false)
    }
  }

  const toggleStudentSelection = (studentId: string) => {
    const newSelection = new Set(selectedStudents)
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId)
    } else {
      newSelection.add(studentId)
    }
    setSelectedStudents(newSelection)
  }

  const selectAllStudents = () => {
    const unmarkedStudents = students.filter(student => 
      !attendanceRecords.some(record => record.studentId === student.id)
    )
    setSelectedStudents(new Set(unmarkedStudents.map(s => s.id)))
  }

  const clearSelection = () => {
    setSelectedStudents(new Set())
  }

  const getStudentAttendanceStatus = (studentId: string) => {
    return attendanceRecords.find(record => record.studentId === studentId)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'default'
      case 'ABSENT': return 'destructive'
      case 'LATE': return 'secondary'
      default: return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (!currentEvent) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No active event found</p>
      </div>
    )
  }

  const sessionStatus = currentEvent.currentDay ? 
    getSessionStatus(selectedSession, currentEvent.currentDay) : 'inactive'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mark Attendance</h1>
        <p className="text-gray-600 mt-2">Record attendance for your brigade students</p>
      </div>

      {/* Event Info */}
      <Card>
        <CardHeader>
          <CardTitle>{currentEvent.event.name}</CardTitle>
          <CardDescription>
            {currentEvent.currentDay ? (
              <>
                Today: {new Date(currentEvent.currentDay.date).toLocaleDateString()}
              </>
            ) : (
              'No active day'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <Button
                variant={selectedSession === 'FN' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSession('FN')}
                disabled={!currentEvent.currentDay?.fnEnabled}
              >
                Forenoon ({currentEvent.currentDay?.fnStartTime} - {currentEvent.currentDay?.fnEndTime})
              </Button>
              <Button
                variant={selectedSession === 'AN' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSession('AN')}
                disabled={!currentEvent.currentDay?.anEnabled}
              >
                Afternoon ({currentEvent.currentDay?.anStartTime} - {currentEvent.currentDay?.anEndTime})
              </Button>
            </div>
            <Badge variant={sessionStatus === 'active' ? 'default' : 'secondary'}>
              {sessionStatus === 'active' ? 'Active' : 
               sessionStatus === 'upcoming' ? 'Upcoming' : 
               sessionStatus === 'ended' ? 'Ended' : 'Inactive'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedStudents.size > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedStudents.size} students selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleBulkMarkAttendance('PRESENT')}
                  disabled={markingAttendance}
                >
                  Mark Present
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkMarkAttendance('ABSENT')}
                  disabled={markingAttendance}
                >
                  Mark Absent
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearSelection}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Students</CardTitle>
              <CardDescription>
                {students.length} students in your brigades
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={selectAllStudents}
            >
              Select All Unmarked
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {students.map((student) => {
              const attendanceStatus = getStudentAttendanceStatus(student.id)
              const isSelected = selectedStudents.has(student.id)
              
              return (
                <div
                  key={student.id}
                  className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                    isSelected ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleStudentSelection(student.id)}
                        disabled={!!attendanceStatus}
                        className="rounded border-gray-300"
                      />
                      <div>
                        <p className="font-medium">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {student.tempRollNumber} • {student.brigade?.name || 'No Brigade'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {attendanceStatus ? (
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadgeVariant(attendanceStatus.status)}>
                            {attendanceStatus.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatDateTime(attendanceStatus.markedAt)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleMarkAttendance(student.id, 'PRESENT')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Present
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAttendance(student.id, 'ABSENT')}
                          >
                            Absent
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAttendance(student.id, 'LATE')}
                          >
                            Late
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}