import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { analyticsApi } from '@/api/analytics'
import { DashboardStats } from '@/types'
import { User, BookOpen, Calendar, TrendingUp } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

export default function StudentDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const data = await analyticsApi.getDashboardStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
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

  const studentStats = stats?.student

  if (!studentStats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No data available</p>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Sessions',
      value: studentStats.totalSessions,
      icon: BookOpen,
      color: 'bg-blue-500',
      description: 'Sessions attended'
    },
    {
      title: 'Present Sessions',
      value: studentStats.presentSessions,
      icon: Calendar,
      color: 'bg-green-500',
      description: 'Successfully attended'
    },
    {
      title: 'Today\'s Sessions',
      value: studentStats.todaySessions,
      icon: Calendar,
      color: 'bg-purple-500',
      description: 'Sessions today'
    },
    {
      title: 'Attendance Rate',
      
      value: `${studentStats.attendancePercentage}%`,
      icon: TrendingUp,
      color: 'bg-orange-500',
      description: 'Overall performance'
    }
  ]

  const attendanceData = [
    { name: 'Present', value: studentStats.presentSessions, color: '#10B981' },
    { name: 'Absent', value: studentStats.totalSessions - studentStats.presentSessions, color: '#EF4444' }
  ]

  const todayData = [
    { name: 'Present', value: studentStats.todayPresent },
    { name: 'Total', value: studentStats.todaySessions }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {studentStats.studentInfo.name}!
        </p>
      </div>

      {/* Student Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{studentStats.studentInfo.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Roll Number</p>
                <p className="font-medium font-mono">{studentStats.studentInfo.tempRollNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Brigade</p>
                <p className="font-medium">{studentStats.studentInfo.brigade}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overall Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Attendance</CardTitle>
            <CardDescription>
              Your attendance performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {attendanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-4">
              <p className="text-2xl font-bold text-green-600">
                {studentStats.attendancePercentage}%
              </p>
              <p className="text-sm text-gray-500">Attendance Rate</p>
            </div>
          </CardContent>
        </Card>

        {/* Today's Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Performance</CardTitle>
            <CardDescription>
              Sessions attended today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={todayData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-4">
              <p className="text-lg">
                <span className="text-2xl font-bold text-blue-600">
                  {studentStats.todayPresent}
                </span>
                <span className="text-gray-500"> / {studentStats.todaySessions}</span>
              </p>
              <p className="text-sm text-gray-500">Sessions Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>
            Your attendance statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium text-green-900">Sessions Attended</span>
                <span className="text-green-600 font-bold">{studentStats.presentSessions}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="font-medium text-red-900">Sessions Missed</span>
                <span className="text-red-600 font-bold">
                  {studentStats.totalSessions - studentStats.presentSessions}
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Attendance Goal</h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Target: 90%</span>
                  <span className="text-sm font-medium">
                    Current: {studentStats.attendancePercentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      parseFloat(studentStats.attendancePercentage) >= 90 
                        ? 'bg-green-500' 
                        : parseFloat(studentStats.attendancePercentage) >= 75 
                        ? 'bg-yellow-500' 
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(parseFloat(studentStats.attendancePercentage), 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}