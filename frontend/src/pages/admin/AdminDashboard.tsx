import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { analyticsApi } from '@/api/analytics'
import { DashboardStats } from '@/types'
import { Users, Shield, GraduationCap, Calendar, TrendingUp, Clock } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function AdminDashboard() {
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

  const adminStats = stats?.admin

  if (!adminStats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No data available</p>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Students',
      value: adminStats.totalStudents,
      icon: GraduationCap,
      color: 'bg-blue-500',
      description: 'Registered students'
    },
    {
      title: 'Total Brigades',
      value: adminStats.totalBrigades,
      icon: Shield,
      color: 'bg-green-500',
      description: 'Active brigades'
    },
    {
      title: 'Brigade Leads',
      value: adminStats.totalBrigadeLeads,
      icon: Users,
      color: 'bg-purple-500',
      description: 'Active leaders'
    },
    {
      title: 'Today\'s Attendance',
      value: adminStats.todayAttendance,
      icon: Clock,
      color: 'bg-orange-500',
      description: 'Present today'
    }
  ]

  const attendanceData = [
    { name: 'Present', value: parseFloat(adminStats.overallAttendancePercentage), color: '#10B981' },
    { name: 'Absent', value: 100 - parseFloat(adminStats.overallAttendancePercentage), color: '#EF4444' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back! Here's an overview of the attendance system.
        </p>
      </div>

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
              System-wide attendance percentage
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
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-4">
              <p className="text-2xl font-bold text-green-600">
                {adminStats.overallAttendancePercentage}%
              </p>
              <p className="text-sm text-gray-500">Overall Attendance Rate</p>
            </div>
          </CardContent>
        </Card>

        {/* Current Event Info */}
        <Card>
          <CardHeader>
            <CardTitle>Current Event</CardTitle>
            <CardDescription>
              Active event information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {adminStats.currentEvent ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold text-lg">
                      {adminStats.currentEvent.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {adminStats.currentEvent.totalDays} days event
                    </p>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">
                      Event Progress
                    </span>
                    <span className="text-sm text-blue-700">
                      Active
                    </span>
                  </div>
                  <div className="mt-2 bg-blue-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full w-1/3"></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {adminStats.todayAttendance}
                    </p>
                    <p className="text-sm text-gray-500">Today's Present</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {adminStats.totalStudents}
                    </p>
                    <p className="text-sm text-gray-500">Total Students</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No active event</p>
                <p className="text-sm text-gray-400 mt-1">
                  Create an event to start tracking attendance
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <GraduationCap className="h-8 w-8 text-blue-500 mb-2" />
              <h3 className="font-medium">Manage Students</h3>
              <p className="text-sm text-gray-500">Add, edit, or view student records</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <Shield className="h-8 w-8 text-green-500 mb-2" />
              <h3 className="font-medium">Manage Brigades</h3>
              <p className="text-sm text-gray-500">Create and organize brigades</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <TrendingUp className="h-8 w-8 text-purple-500 mb-2" />
              <h3 className="font-medium">View Analytics</h3>
              <p className="text-sm text-gray-500">Detailed attendance reports</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}