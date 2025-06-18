import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import BrigadeLeadDashboard from './pages/brigade-lead/BrigadeLeadDashboard'
import StudentDashboard from './pages/student/StudentDashboard'
import Layout from './components/Layout'
import LoadingSpinner from './components/ui/LoadingSpinner'

// Admin Pages
import AdminStudents from './pages/admin/AdminStudents'
import AdminBrigades from './pages/admin/AdminBrigades'
import AdminUsers from './pages/admin/AdminUsers'
import AdminEvents from './pages/admin/AdminEvents'
import AdminAttendance from './pages/admin/AdminAttendance'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminNotifications from './pages/admin/AdminNotifications'

// Brigade Lead Pages
import BrigadeStudents from './pages/brigade-lead/BrigadeStudents'
import BrigadeAttendance from './pages/brigade-lead/BrigadeAttendance'
import BrigadeAnalytics from './pages/brigade-lead/BrigadeAnalytics'

// Student Pages
import StudentProfile from './pages/student/StudentProfile'
import StudentAttendance from './pages/student/StudentAttendance'

// Shared Pages
import NotFound from './pages/NotFound'
import Unauthorized from './pages/Unauthorized'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Layout>
      <Routes>
        {/* Admin Routes */}
        {user.role === 'ADMIN' && (
          <>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/students" element={<AdminStudents />} />
            <Route path="/admin/brigades" element={<AdminBrigades />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/events" element={<AdminEvents />} />
            <Route path="/admin/attendance" element={<AdminAttendance />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/notifications" element={<AdminNotifications />} />
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          </>
        )}

        {/* Brigade Lead Routes */}
        {user.role === 'BRIGADE_LEAD' && (
          <>
            <Route path="/brigade/dashboard" element={<BrigadeLeadDashboard />} />
            <Route path="/brigade/students" element={<BrigadeStudents />} />
            <Route path="/brigade/attendance" element={<BrigadeAttendance />} />
            <Route path="/brigade/analytics" element={<BrigadeAnalytics />} />
            <Route path="/" element={<Navigate to="/brigade/dashboard" replace />} />
          </>
        )}

        {/* Student Routes */}
        {user.role === 'STUDENT' && (
          <>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/profile" element={<StudentProfile />} />
            <Route path="/student/attendance" element={<StudentAttendance />} />
            <Route path="/" element={<Navigate to="/student/dashboard" replace />} />
          </>
        )}

        {/* Common Routes */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Layout>
  )
}

export default App