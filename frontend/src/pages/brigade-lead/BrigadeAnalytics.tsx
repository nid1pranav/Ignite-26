import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { analyticsApi } from '@/api/analytics'
import { AttendanceTrend, SessionAnalysis } from '@/types'
import { TrendingUp, Users, Clock, BarChart3 } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

export default function BrigadeAnalytics() {
  const [attendanceTrends, setAttendanceTrends] = useState<AttendanceTrend[]>([])
  const [sessionAnalysis, setSessionAnalysis] = useState<SessionAnalysis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const [trends, sessions] = await Promise.all([
        analyticsApi.getAttendanceTrends(7),
        analyticsApi.getSessionAnalysis()
      ])
      
      setAttendanceTrends(trends)
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

  const overallStats = sessionAnalysis ? {
    totalSessions: sessionAnalysis.forenoon.total + sessionAnalysis.afternoon.total,
    totalPresent: sessionAnalysis.forenoon.present + sessionAnalysis.afternoon.present,
    overallPercentage: sessionAnalysis.forenoon.total + sessionAnalysis.afternoon.total > 0 
      ? (((sessionAnalysis.forenoon.present + sessionAnalysis.afternoon.present) / 
          (sessionAnalysis.forenoon.total + sessionAnalysis.afternoon.total)) * 100).toFixed(2)
      : '0'
  } : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Brigade Analytics</h1>
        <p className="text-gray-600 mt-2">Attendance analytics for your brigades</p>
      </div>

      {/* Overview Stats */}
      {overallStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                  <p className="text-3xl font-bold text-gray-900">{overallStats.totalSessions}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Present</p>
                  <p className="text-3xl font-bold text-green-600">{overallStats.totalPresent}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overall Rate</p>
                  <p className="text-3xl font-bold text-purple-600">{overallStats.overallPercentage}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Session Analysis */}
      {sessionAnalysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <CardTitle>Session Performance</CardTitle>
              <CardDescription>
                Attendance percentage by session
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
                  <div className="mt-2 bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${sessionAnalysis.forenoon.percentage}%` }}
                    />
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
                  <div className="mt-2 bg-green-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${sessionAnalysis.afternoon.percentage}%` }}
                    />
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
            Daily attendance trends for your brigades over the last 7 days
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

      {/* Daily Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Session Breakdown</CardTitle>
          <CardDescription>
            FN vs AN session attendance by day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Bar dataKey="fnPresent" fill="#3B82F6" name="FN Present" />
                <Bar dataKey="anPresent" fill="#10B981" name="AN Present" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}