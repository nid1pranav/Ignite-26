import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { analyticsApi } from '@/api/analytics'
import { DashboardStats } from '@/types'
import { Users, Shield, UserCheck, TrendingUp } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

export default function BrigadeLeadDashboard() {
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

  const brigadeStats = stats?.brigadeLead

  if (!brigadeStats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No data available</p>
      </div>
    )
  }

  const statCards = [
    {
      title: 'My Brigades',
      value: brigadeStats.totalBrigades,
      icon: Shield,
      color: 'bg-blue-500',
      description: 'Brigades under leadership'
    },
    {
      title: 'Total Students',
      value: brigadeStats.totalStudents,
      icon: Users,
      color: 'bg-green-500',
      description: 'Students in my brigades'
    },
    {
      title: 'Today\'s Attendance',
      value: brigadeStats.todayAttendance,
      icon: UserCheck,
      color: 'bg-purple-500',
      description: 'Present today'
    },
    {
      title: 'Attendance Rate',
      value: `${brigadeStats.brigadeAttendancePercentage}%`,
      icon: TrendingUp,
      color: 'bg-orange-500',
      description: 'Overall performance'
    }
  ]

  const attendanceData = [
    { name: 'Present', value: parseFloat(brigadeStats.brigadeAttendancePercentage), color: '#10B981' },
    { name: 'Absent', value: 100 - parseFloat(brigadeStats.brigadeAttendancePercentage), color: '#EF4444' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Brigade Lead Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Manage your brigades and monitor attendance performance.
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
        {/* Attendance Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Brigade Attendance</CardTitle>
            <CardDescription>
              Overall attendance rate for your brigades
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
                {brigadeStats.brigadeAttendancePercentage}%
              </p>
              <p className="text-sm text-gray-500">Overall Attendance Rate</p>
            </div>
          </CardContent>
        </Card>

        {/* Brigade Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Brigade Performance</CardTitle>
            <CardDescription>
              Student count by brigade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={brigadeStats.brigades}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="studentCount" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Brigade Details */}
      <Card>
        <CardHeader>
          <CardTitle>My Brigades</CardTitle>
          <CardDescription>
            Detailed view of brigades under your leadership
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brigadeStats.brigades.map((brigade) => (
              <div key={brigade.id} className="p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{brigade.name}</h3>
                  <Shield className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-sm text-gray-600">
                  <p>{brigade.studentCount} students</p>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span>Performance</span>
                    <span className="font-medium text-green-600">Good</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks for brigade management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <Users className="h-8 w-8 text-blue-500 mb-2" />
              <h3 className="font-medium">Manage Students</h3>
              <p className="text-sm text-gray-500">View and manage brigade students</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <UserCheck className="h-8 w-8 text-green-500 mb-2" />
              <h3 className="font-medium">Mark Attendance</h3>
              <p className="text-sm text-gray-500">Record student attendance</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <TrendingUp className="h-8 w-8 text-purple-500 mb-2" />
              <h3 className="font-medium">View Reports</h3>
              <p className="text-sm text-gray-500">Attendance analytics and reports</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}