import { Hono } from 'hono'
import { authenticateToken, requireAdminOrBrigadeLead } from '../middleware/auth.js'

const app = new Hono()

// Apply authentication middleware
app.use('*', authenticateToken)

// Get attendance records
app.get('/', async (c) => {
  try {
    const { eventDayId, brigadeId, session, page = 1, limit = 50 } = c.req.query()
    const skip = (page - 1) * limit
    const user = c.get('user')
    const prisma = c.get('prisma')

    let whereClause = {}

    // Role-based filtering
    if (user.role === 'BRIGADE_LEAD') {
      const brigades = await prisma.brigade.findMany({
        where: { leaderId: user.id }
      })
      const brigadeIds = brigades.map(b => b.id)
      
      whereClause.student = {
        brigadeId: { in: brigadeIds }
      }
    } else if (user.role === 'STUDENT') {
      whereClause.student = {
        userId: user.id
      }
    }

    // Filters
    if (eventDayId) {
      whereClause.eventDayId = eventDayId
    }
    if (session) {
      whereClause.session = session
    }
    if (brigadeId && user.role === 'ADMIN') {
      whereClause.student = {
        brigadeId: brigadeId
      }
    }

    const [records, total] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where: whereClause,
        include: {
          student: {
            include: {
              brigade: true
            }
          },
          eventDay: {
            include: {
              event: true
            }
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.attendanceRecord.count({ where: whereClause })
    ])

    return c.json({
      records,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    })
  } catch (error) {
    console.error('Get attendance records error:', error)
    return c.json({ error: 'Failed to fetch attendance records' }, 500)
  }
})

// Mark attendance
app.post('/mark', requireAdminOrBrigadeLead, async (c) => {
  try {
    const { studentId, eventDayId, session, status = 'PRESENT' } = await c.req.json()
    const user = c.get('user')
    const prisma = c.get('prisma')

    if (!studentId || !eventDayId || !session) {
      return c.json({ error: 'Student ID, event day ID, and session are required' }, 400)
    }

    if (!['FN', 'AN'].includes(session)) {
      return c.json({ error: 'Invalid session' }, 400)
    }

    if (!['PRESENT', 'ABSENT', 'LATE'].includes(status)) {
      return c.json({ error: 'Invalid status' }, 400)
    }

    // Check if student exists and user has permission
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { brigade: true }
    })

    if (!student) {
      return c.json({ error: 'Student not found' }, 404)
    }

    // Check permissions for brigade leads
    if (user.role === 'BRIGADE_LEAD') {
      const brigades = await prisma.brigade.findMany({
        where: { leaderId: user.id }
      })
      const brigadeIds = brigades.map(b => b.id)
      
      if (!brigadeIds.includes(student.brigadeId)) {
        return c.json({ error: 'Access denied to this student' }, 403)
      }
    }

    // Check if event day exists and is active
    const eventDay = await prisma.eventDay.findUnique({
      where: { id: eventDayId }
    })

    if (!eventDay || !eventDay.isActive) {
      return c.json({ error: 'Event day not found or inactive' }, 404)
    }

    // Check session availability
    if (session === 'FN' && !eventDay.fnEnabled) {
      return c.json({ error: 'Forenoon session is not enabled for this day' }, 400)
    }
    if (session === 'AN' && !eventDay.anEnabled) {
      return c.json({ error: 'Afternoon session is not enabled for this day' }, 400)
    }

    // Create or update attendance record
    const attendanceRecord = await prisma.attendanceRecord.upsert({
      where: {
        studentId_eventDayId_session: {
          studentId,
          eventDayId,
          session
        }
      },
      update: {
        status,
        markedBy: user.id,
        markedAt: new Date()
      },
      create: {
        studentId,
        eventDayId,
        session,
        status,
        markedBy: user.id
      },
      include: {
        student: {
          include: {
            brigade: true
          }
        },
        eventDay: {
          include: {
            event: true
          }
        }
      }
    })

    return c.json(attendanceRecord)
  } catch (error) {
    console.error('Mark attendance error:', error)
    return c.json({ error: 'Failed to mark attendance' }, 500)
  }
})

// Bulk mark attendance
app.post('/bulk-mark', requireAdminOrBrigadeLead, async (c) => {
  try {
    const { studentIds, eventDayId, session, status = 'PRESENT' } = await c.req.json()
    const user = c.get('user')
    const prisma = c.get('prisma')

    if (!studentIds || !Array.isArray(studentIds) || !eventDayId || !session) {
      return c.json({ error: 'Student IDs array, event day ID, and session are required' }, 400)
    }

    // Verify all students exist and user has permission
    const students = await prisma.student.findMany({
      where: { 
        id: { in: studentIds },
        isActive: true
      },
      include: { brigade: true }
    })

    if (students.length !== studentIds.length) {
      return c.json({ error: 'Some students not found' }, 400)
    }

    // Check permissions for brigade leads
    if (user.role === 'BRIGADE_LEAD') {
      const brigades = await prisma.brigade.findMany({
        where: { leaderId: user.id }
      })
      const brigadeIds = brigades.map(b => b.id)
      
      const unauthorizedStudents = students.filter(s => !brigadeIds.includes(s.brigadeId))
      if (unauthorizedStudents.length > 0) {
        return c.json({ error: 'Access denied to some students' }, 403)
      }
    }

    // Check event day
    const eventDay = await prisma.eventDay.findUnique({
      where: { id: eventDayId }
    })

    if (!eventDay || !eventDay.isActive) {
      return c.json({ error: 'Event day not found or inactive' }, 404)
    }

    // Bulk create/update attendance records
    const attendanceData = studentIds.map(studentId => ({
      studentId,
      eventDayId,
      session,
      status,
      markedBy: user.id,
      markedAt: new Date()
    }))

    // Use transaction for bulk operations
    const results = await prisma.$transaction(
      attendanceData.map(data => 
        prisma.attendanceRecord.upsert({
          where: {
            studentId_eventDayId_session: {
              studentId: data.studentId,
              eventDayId: data.eventDayId,
              session: data.session
            }
          },
          update: {
            status: data.status,
            markedBy: data.markedBy,
            markedAt: data.markedAt
          },
          create: data
        })
      )
    )

    return c.json({ 
      message: `Attendance marked for ${results.length} students`,
      records: results
    })
  } catch (error) {
    console.error('Bulk mark attendance error:', error)
    return c.json({ error: 'Failed to mark bulk attendance' }, 500)
  }
})

export default app