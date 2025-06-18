import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { analyticsApi } from '@/api/analytics'
import { AttendanceTrend, BrigadeComparison, SessionAnalysis } from '@/types'
import { TrendingUp, Users, Clock, BarChart3 } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

export default function AdminAnalytics() {
  const [attendanceTrends, setAttendanceTrends] = useState<AttendanceTrend[]>([])
  const [brigadeComparison, setBrigadeComparison] = useState<BrigadeComparison[]>([])
  const [sessionAnalysis, setSessionAnalysis] = useState<SessionAnalysis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const [trends, comparison, sessions] = await Promise.all([
        analyticsApi.getAttendanceTrends(7),
        analyticsApi.getBrigadeComparison(),
        analyticsApi.getSessionAnalysis()
      ])
      
      setAttendanceTrends(trends)
      setBrigadeComparison(comparison)
      setSessionAnalysis(sessions)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  const sessionData = sessionAnalysis ? [
    {
      name: 'Forenoon',
      total: sessionAnalysis.forenoon.total,
      present: sessionAnalysis.forenoon.present,
      percentage: parseFloat(sessionAnalysis.forenoon.percentage)
    },
    {
      name: 'Afternoon',
      total: sessionAnalysis.afternoon.total,
      present: sessionAnalysis.afternoon.present,
      percentage: parseFloat(sessionAnalysis.afternoon.percentage)
    }
  ] : []

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">Comprehensive attendance analytics and insights</p>
      </div>

      {/* Session Analysis */}
      {sessionAnalysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Session Comparison</CardTitle>
              <CardDescription>
                Forenoon vs Afternoon attendance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sessionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="present" fill="#3B82F6" name="Present" />
                    <Bar dataKey="total" fill="#E5E7EB" name="Total" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session Statistics</CardTitle>
              <CardDescription>
                Detailed session breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-blue-900">Forenoon Session</h3>
                      <p className="text-sm text-blue-700">
                        {sessionAnalysis.forenoon.present} / {sessionAnalysis.forenoon.total} present
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {sessionAnalysis.forenoon.percentage}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-green-900">Afternoon Session</h3>
                      <p className="text-sm text-green-700">
                        {sessionAnalysis.afternoon.present} / {sessionAnalysis.afternoon.total} present
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {sessionAnalysis.afternoon.percentage}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attendance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Trends</CardTitle>
          <CardDescription>
            Daily attendance trends over the last 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="present" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Present"
                />
                <Line 
                  type="monotone" 
                  dataKey="absent" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  name="Absent"
                />
                <Line 
                  type="monotone" 
                  dataKey="late" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  name="Late"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Brigade Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Brigade Performance</CardTitle>
          <CardDescription>
            Attendance comparison across brigades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={brigadeComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar 
                  dataKey="attendancePercentage" 
                  fill="#3B82F6"
                  name="Attendance %"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Brigade Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Brigade Details</CardTitle>
          <CardDescription>
            Detailed brigade statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Brigade</th>
                  <th className="text-left py-3 px-4 font-medium">Students</th>
                  <th className="text-left py-3 px-4 font-medium">Total Records</th>
                  <th className="text-left py-3 px-4 font-medium">Present</th>
                  <th className="text-left py-3 px-4 font-medium">Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {brigadeComparison.map((brigade) => (
                  <tr key={brigade.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{brigade.name}</td>
                    <td className="py-3 px-4">{brigade.totalStudents}</td>
                    <td className="py-3 px-4">{brigade.totalRecords}</td>
                    <td className="py-3 px-4">{brigade.presentRecords}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${brigade.attendancePercentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {brigade.attendancePercentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}