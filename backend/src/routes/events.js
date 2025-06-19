import { Hono } from 'hono'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'

const app = new Hono()

// Apply authentication middleware
app.use('*', authenticateToken)

// Get all events
app.get('/', async (c) => {
  try {
    const prisma = c.get('prisma')
    
    const events = await prisma.event.findMany({
      where: { isActive: true },
      include: {
        eventDays: {
          orderBy: { date: 'asc' }
        }
      },
      orderBy: { startDate: 'desc' }
    })

    return c.json(events)
  } catch (error) {
    console.error('Get events error:', error)
    return c.json({ error: 'Failed to fetch events' }, 500)
  }
})

// Get current active event
app.get('/current', async (c) => {
  try {
    const prisma = c.get('prisma')
    const now = new Date()
    
    const currentEvent = await prisma.event.findFirst({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now }
      },
      include: {
        eventDays: {
          orderBy: { date: 'asc' }
        }
      }
    })

    if (!currentEvent) {
      return c.json({ error: 'No active event found' }, 404)
    }

    // Find current day
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const currentDay = currentEvent.eventDays.find(day => {
      const eventDate = new Date(day.date)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate.getTime() === today.getTime()
    })

    return c.json({
      event: currentEvent,
      currentDay: currentDay || null
    })
  } catch (error) {
    console.error('Get current event error:', error)
    return c.json({ error: 'Failed to fetch current event' }, 500)
  }
})

// Get single event
app.get('/:id', async (c) => {
  try {
    const { id } = c.req.param()
    const prisma = c.get('prisma')

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        eventDays: {
          orderBy: { date: 'asc' }
        }
      }
    })

    if (!event) {
      return c.json({ error: 'Event not found' }, 404)
    }

    return c.json(event)
  } catch (error) {
    console.error('Get event error:', error)
    return c.json({ error: 'Failed to fetch event' }, 500)
  }
})

// Create event (Admin only)
app.post('/', requireAdmin, async (c) => {
  try {
    const { name, description, startDate, endDate, eventDays } = await c.req.json()
    const prisma = c.get('prisma')

    if (!name || !startDate || !endDate || !eventDays) {
      return c.json({ error: 'Name, start date, end date, and event days are required' }, 400)
    }

    // Validate date range
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (end <= start) {
      return c.json({ error: 'End date must be after start date' }, 400)
    }

    // Create event with days in transaction
    const event = await prisma.$transaction(async (prisma) => {
      const newEvent = await prisma.event.create({
        data: {
          name,
          description,
          startDate: start,
          endDate: end
        }
      })

      // Create event days
      const eventDayData = eventDays.map(day => ({
        eventId: newEvent.id,
        date: new Date(day.date),
        fnEnabled: day.fnEnabled !== false,
        anEnabled: day.anEnabled !== false,
        fnStartTime: day.fnStartTime || '09:00',
        fnEndTime: day.fnEndTime || '09:30',
        anStartTime: day.anStartTime || '14:00',
        anEndTime: day.anEndTime || '14:30'
      }))

      await prisma.eventDay.createMany({
        data: eventDayData
      })

      return prisma.event.findUnique({
        where: { id: newEvent.id },
        include: {
          eventDays: {
            orderBy: { date: 'asc' }
          }
        }
      })
    })

    return c.json(event, 201)
  } catch (error) {
    console.error('Create event error:', error)
    return c.json({ error: 'Failed to create event' }, 500)
  }
})

// Update event (Admin only)
app.put('/:id', requireAdmin, async (c) => {
  try {
    const { id } = c.req.param()
    const updateData = await c.req.json()
    const prisma = c.get('prisma')

    // Validate date range if both dates provided
    if (updateData.startDate && updateData.endDate) {
      const start = new Date(updateData.startDate)
      const end = new Date(updateData.endDate)
      
      if (end <= start) {
        return c.json({ error: 'End date must be after start date' }, 400)
      }
    }

    const data = { ...updateData }
    if (updateData.startDate) data.startDate = new Date(updateData.startDate)
    if (updateData.endDate) data.endDate = new Date(updateData.endDate)

    const event = await prisma.event.update({
      where: { id },
      data,
      include: {
        eventDays: {
          orderBy: { date: 'asc' }
        }
      }
    })

    return c.json(event)
  } catch (error) {
    console.error('Update event error:', error)
    return c.json({ error: 'Failed to update event' }, 500)
  }
})

// Delete event (Admin only)
app.delete('/:id', requireAdmin, async (c) => {
  try {
    const { id } = c.req.param()
    const prisma = c.get('prisma')

    const event = await prisma.event.findUnique({
      where: { id }
    })

    if (!event) {
      return c.json({ error: 'Event not found' }, 404)
    }

    // Check if event has attendance records
    const attendanceCount = await prisma.attendanceRecord.count({
      where: {
        eventDay: {
          eventId: id
        }
      }
    })

    if (attendanceCount > 0) {
      return c.json({ 
        error: 'Cannot delete event with attendance records. Please archive the event instead.' 
      }, 400)
    }

    // Soft delete
    await prisma.event.update({
      where: { id },
      data: { isActive: false }
    })

    return c.json({ message: 'Event deleted successfully' })
  } catch (error) {
    console.error('Delete event error:', error)
    return c.json({ error: 'Failed to delete event' }, 500)
  }
})

export default app