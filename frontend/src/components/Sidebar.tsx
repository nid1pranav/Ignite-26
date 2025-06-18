import { useAuth } from '@/contexts/AuthContext'
import { useLocation, Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  BarChart3,
  Bell,
  Settings,
  X,
  GraduationCap,
  Shield,
  BookOpen
} from 'lucide-react'

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

const adminNavItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Students', href: '/admin/students', icon: GraduationCap },
  { name: 'Brigades', href: '/admin/brigades', icon: Shield },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Events', href: '/admin/events', icon: Calendar },
  { name: 'Attendance', href: '/admin/attendance', icon: UserCheck },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Notifications', href: '/admin/notifications', icon: Bell },
]

const brigadeLeadNavItems = [
  { name: 'Dashboard', href: '/brigade/dashboard', icon: LayoutDashboard },
  { name: 'Students', href: '/brigade/students', icon: GraduationCap },
  { name: 'Attendance', href: '/brigade/attendance', icon: UserCheck },
  { name: 'Analytics', href: '/brigade/analytics', icon: BarChart3 },
]

const studentNavItems = [
  { name: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
  { name: 'Profile', href: '/student/profile', icon: Users },
  { name: 'Attendance', href: '/student/attendance', icon: BookOpen },
]

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) return null

  const getNavItems = () => {
    switch (user.role) {
      case 'ADMIN':
        return adminNavItems
      case 'BRIGADE_LEAD':
        return brigadeLeadNavItems
      case 'STUDENT':
        return studentNavItems
      default:
        return []
    }
  }

  const navItems = getNavItems()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">I26</span>
            </div>
            <span className="font-semibold text-gray-900">Ignite 2026</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Logged in as</p>
            <p className="text-sm font-medium text-gray-900">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user.role.toLowerCase().replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}