import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Home, Shield } from 'lucide-react'

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <Shield className="h-24 w-24 text-red-500 mx-auto mb-4" />
          <h1 className="text-6xl font-bold text-gray-900">403</h1>
          <h2 className="text-3xl font-bold text-gray-900 mt-4">Access Denied</h2>
          <p className="text-gray-600 mt-2 max-w-md mx-auto">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}