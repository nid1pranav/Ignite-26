import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { brigadesApi } from '@/api/brigades'
import { usersApi } from '@/api/users'
import { Brigade, User } from '@/types'
import { Search, Plus, Edit, Trash2, Users } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export default function AdminBrigades() {
  const [brigades, setBrigades] = useState<Brigade[]>([])
  const [brigadeLeads, setBrigadeLeads] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedBrigade, setSelectedBrigade] = useState<Brigade | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    leaderId: ''
  })

  useEffect(() => {
    fetchBrigades()
    fetchBrigadeLeads()
  }, [])

  const fetchBrigades = async () => {
    try {
      setLoading(true)
      const data = await brigadesApi.getBrigades()
      setBrigades(data)
    } catch (error) {
      toast.error('Failed to fetch brigades')
    } finally {
      setLoading(false)
    }
  }

  const fetchBrigadeLeads = async () => {
    try {
      const response = await usersApi.getUsers({ role: 'BRIGADE_LEAD' })
      setBrigadeLeads(response.data)
    } catch (error) {
      console.error('Failed to fetch brigade leads:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name) {
      toast.error('Brigade name is required')
      return
    }

    try {
      if (selectedBrigade) {
        await brigadesApi.updateBrigade(selectedBrigade.id, formData)
        toast.success('Brigade updated successfully')
      } else {
        await brigadesApi.createBrigade(formData)
        toast.success('Brigade created successfully')
      }
      
      fetchBrigades()
      setShowModal(false)
      resetForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save brigade')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brigade?')) return

    try {
      await brigadesApi.deleteBrigade(id)
      toast.success('Brigade deleted successfully')
      fetchBrigades()
    } catch (error) {
      toast.error('Failed to delete brigade')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', leaderId: '' })
    setSelectedBrigade(null)
  }

  const openModal = (brigade?: Brigade) => {
    if (brigade) {
      setSelectedBrigade(brigade)
      setFormData({
        name: brigade.name,
        leaderId: brigade.leaderId || ''
      })
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const filteredBrigades = brigades.filter(brigade =>
    brigade.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Brigades</h1>
          <p className="text-gray-600 mt-2">Manage brigades and assign leaders</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Brigade
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search brigades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Brigades Grid */}
      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBrigades.map((brigade) => (
            <Card key={brigade.id} className="card-hover">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{brigade.name}</CardTitle>
                    <CardDescription>
                      {brigade.leader ? (
                        `Led by ${brigade.leader.firstName} ${brigade.leader.lastName}`
                      ) : (
                        'No leader assigned'
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openModal(brigade)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(brigade.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {brigade._count?.students || 0} students
                    </span>
                  </div>
                  <Badge variant={brigade.isActive ? "default" : "secondary"}>
                    {brigade.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedBrigade ? 'Edit Brigade' : 'Add New Brigade'}
            </DialogTitle>
            <DialogDescription>
              {selectedBrigade ? 'Update brigade information' : 'Create a new brigade'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Brigade Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Brigade Alpha"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="leaderId">Brigade Leader</Label>
              <select
                id="leaderId"
                value={formData.leaderId}
                onChange={(e) => setFormData(prev => ({ ...prev, leaderId: e.target.value }))}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Select Leader</option>
                {brigadeLeads.map((leader) => (
                  <option key={leader.id} value={leader.id}>
                    {leader.firstName} {leader.lastName} ({leader.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {selectedBrigade ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}