import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { eventsApi } from '@/api/events'
import { Event, EventDay } from '@/types'
import { Search, Plus, Edit, Trash2, Calendar, Clock } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { toast } from 'sonner'
import { formatDate, formatTime } from '@/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export default function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    eventDays: [] as Array<{
      date: string
      fnEnabled: boolean
      anEnabled: boolean
      fnStartTime: string
      fnEndTime: string
      anStartTime: string
      anEndTime: string
    }>
  })

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const data = await eventsApi.getEvents()
      setEvents(data)
    } catch (error) {
      toast.error('Failed to fetch events')
    } finally {
      setLoading(false)
    }
  }

  const generateEventDays = () => {
    if (!formData.startDate || !formData.endDate) return

    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    const days = []

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push({
        date: d.toISOString().split('T')[0],
        fnEnabled: true,
        anEnabled: true,
        fnStartTime: '09:00',
        fnEndTime: '09:30',
        anStartTime: '14:00',
        anEndTime: '14:30'
      })
    }

    setFormData(prev => ({ ...prev, eventDays: days }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.eventDays.length === 0) {
      toast.error('Please generate event days')
      return
    }

    try {
      if (selectedEvent) {
        await eventsApi.updateEvent(selectedEvent.id, {
          name: formData.name,
          description: formData.description,
          startDate: formData.startDate,
          endDate: formData.endDate
        })
        toast.success('Event updated successfully')
      } else {
        await eventsApi.createEvent(formData)
        toast.success('Event created successfully')
      }
      
      fetchEvents()
      setShowModal(false)
      resetForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save event')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      await eventsApi.deleteEvent(id)
      toast.success('Event deleted successfully')
      fetchEvents()
    } catch (error) {
      toast.error('Failed to delete event')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      eventDays: []
    })
    setSelectedEvent(null)
  }

  const openModal = (event?: Event) => {
    if (event) {
      setSelectedEvent(event)
      setFormData({
        name: event.name,
        description: event.description || '',
        startDate: event.startDate.split('T')[0],
        endDate: event.endDate.split('T')[0],
        eventDays: event.eventDays.map(day => ({
          date: day.date.split('T')[0],
          fnEnabled: day.fnEnabled,
          anEnabled: day.anEnabled,
          fnStartTime: day.fnStartTime,
          fnEndTime: day.fnEndTime,
          anStartTime: day.anStartTime,
          anEndTime: day.anEndTime
        }))
      })
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-2">Manage events and attendance sessions</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="card-hover">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{event.name}</CardTitle>
                    <CardDescription className="mt-2">
                      {event.description}
                    </CardDescription>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(event.startDate)} - {formatDate(event.endDate)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {event.eventDays.length} days
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={event.isActive ? "default" : "secondary"}>
                      {event.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openModal(event)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(event.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Event Days:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {event.eventDays.map((day, index) => (
                      <div key={day.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                        <div className="font-medium">{formatDate(day.date)}</div>
                        <div className="text-gray-600 mt-1">
                          {day.fnEnabled && (
                            <div>FN: {formatTime(day.fnStartTime)} - {formatTime(day.fnEndTime)}</div>
                          )}
                          {day.anEnabled && (
                            <div>AN: {formatTime(day.anStartTime)} - {formatTime(day.anEndTime)}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent ? 'Edit Event' : 'Add New Event'}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent ? 'Update event information' : 'Create a new event'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Event Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ignite 2026"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Event description..."
                className="w-full h-20 px-3 py-2 rounded-md border border-input bg-background text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  required
                />
              </div>
            </div>

            {!selectedEvent && (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateEventDays}
                  disabled={!formData.startDate || !formData.endDate}
                >
                  Generate Event Days
                </Button>
                {formData.eventDays.length > 0 && (
                  <p className="text-sm text-gray-600">
                    {formData.eventDays.length} days generated
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {selectedEvent ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}