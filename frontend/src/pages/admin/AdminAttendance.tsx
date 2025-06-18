import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { attendanceApi } from '@/api/attendance'
import { eventsApi } from '@/api/events'
import { brigadesApi } from '@/api/brigades'
import { AttendanceRecord, Event, EventDay, Brigade } from '@/types'
import { UserCheck, Clock, Users, Calendar } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { toast } from 'sonner'
import { formatDateTime, formatTime } from '@/lib/utils'

export default function AdminAttendance() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [brigades, setBrigades] = useState<Brigade[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState('')
  const [selectedEventDay, setSelectedEventDay] = useState('')
  const [selectedBrigade, setSelectedBrigade] = useState('')
  const [selectedSession, setSelectedSession] = useState<'FN' | 'AN' | ''>('')
  const [summary, setSummary] = useState<any>(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  })

  useEffect(() => {
    fetchEvents()
    fetchBrigades()
  }, [])

  useEffect(() => {
    if (selectedEventDay) {
      fetchAttendanceRecords()
      fetchAttendanceSummary()
    }
  }, [selectedEventDay, selectedBrigade, selectedSession, pagination.currentPage])

  const fetchEvents = async () => {
    try {
      const data = await eventsApi.getEvents()
      setEvents(data)
      if (data.length > 0) {
        setSelectedEvent(data[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
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

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true)
      const response = await attendanceApi.getAttendanceRecords({
        eventDayId: selectedEventDay,
        brigadeId: selectedBrigade || undefined,
        session: selectedSession || undefined,
        page: pagination.currentPage,
        limit: pagination.itemsPerPage
      })
      setAttendanceRecords(response.data)
      setPagination(response.pagination)
    } catch (error) {
      toast.error('Failed to fetch attendance records')
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendanceSummary = async () => {
    if (!selectedEventDay) return

    try {
      const data = await attendanceApi.getAttendanceSummary(
        selectedEventDay,
        selectedSession || undefined
      )
      setSummary(data)
    } catch (error) {
      console.error('Failed to fetch attendance summary:', error)
    }
  }

  const getSelectedEvent = () => {
    return events.find(e => e.id === selectedEvent)
  }

  const getEventDays = () => {
    const event = getSelectedEvent()
    return event ? event.eventDays : []
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'default'
      case 'ABSENT': return 'destructive'
      case 'LATE': return 'secondary'
      default: return 'secondary'
    }
  }

  const getSessionBadgeVariant = (session: string) => {
    return session === 'FN' ? 'default' : 'secondary'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance Records</h1>
        <p className="text-gray-600 mt-2">View and manage attendance records</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Event</label>
              <select
                value={selectedEvent}
                onChange={(e) => {
                  setSelectedEvent(e.target.value)
                  setSelectedEventDay('')
                }}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Select Event</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Event Day</label>
              <select
                value={selectedEventDay}
                onChange={(e) => setSelectedEventDay(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                disabled={!selectedEvent}
              >
                <option value="">Select Day</option>
                {getEventDays().map((day) => (
                  <option key={day.id} value={day.id}>
                    {new Date(day.date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Brigade</label>
              <select
                value={selectedBrigade}
                onChange={(e) => setSelectedBrigade(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">All Brigades</option>
                {brigades.map((brigade) => (
                  <option key={brigade.id} value={brigade.id}>
                    {brigade.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Session</label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value as any)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">All Sessions</option>
                <option value="FN">Forenoon</option>
                <option value="AN">Afternoon</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Records</p>
                  <p className="text-3xl font-bold text-gray-900">{summary.summary.totalRecords}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Present</p>
                  <p className="text-3xl font-bold text-green-600">{summary.summary.presentCount}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Absent</p>
                  <p className="text-3xl font-bold text-red-600">{summary.summary.absentCount}</p>
                </div>
                <Clock className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Attendance %</p>
                  <p className="text-3xl font-bold text-blue-600">{summary.summary.presentPercentage}%</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>
            {selectedEventDay ? `${pagination.totalItems} records found` : 'Select an event day to view records'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedEventDay ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Please select an event and day to view attendance records</p>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No attendance records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Student</th>
                    <th className="text-left py-3 px-4 font-medium">Roll Number</th>
                    <th className="text-left py-3 px-4 font-medium">Brigade</th>
                    <th className="text-left py-3 px-4 font-medium">Session</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Marked At</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">
                            {record.student?.firstName} {record.student?.lastName}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-sm">
                        {record.student?.tempRollNumber}
                      </td>
                      <td className="py-3 px-4">
                        {record.student?.brigade ? (
                          <Badge variant="secondary">
                            {record.student.brigade.name}
                          </Badge>
                        ) : (
                          <span className="text-gray-500">No Brigade</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getSessionBadgeVariant(record.session)}>
                          {record.session}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusBadgeVariant(record.status)}>
                          {record.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {formatDateTime(record.markedAt)}
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
    </div>
  )
}