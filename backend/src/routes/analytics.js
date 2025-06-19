import { Hono } from 'hono'
import { authenticateToken } from '../middleware/auth.js'

const app = new Hono()

// Apply authentication middleware
app.use('*', authenticateToken)

// Get dashboard statistics
app.get('/dashboard', async (c) => {
  try {
    const user = c.get('user')
    const prisma = c.get('prisma')
    const stats = {}

    if (user.role === 'ADMIN') {
      // Admin dashboard statistics
      const [totalStudents, totalBrigades, totalBrigadeLeads, currentEvent] = await Promise.all([
        prisma.student.count({ where: { isActive: true } }),
        prisma.brigade.count({ where: { isActive: true } }),
        prisma.user.count({ where: { role: 'BRIGADE_LEAD', isActive: true } }),
        prisma.event.findFirst({
          where: { isActive: true },
          include: { eventDays: true }
        })
      ])

      // Today's attendance
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const todayEnd = new Date(today)
      todayEnd.setHours(23, 59, 59, 999)

      const todayAttendance = await prisma.attendanceRecord.count({
        where: {
          createdAt: {
            gte: today,
            lte: todayEnd
          },
          status: 'PRESENT'
        }
      })

      // Overall attendance percentage
      const totalAttendanceRecords = await prisma.attendanceRecord.count()
      const presentRecords = await prisma.attendanceRecord.count({
        where: { status: 'PRESENT' }
      })
      
      const overallAttendancePercentage = totalAttendanceRecords > 0 
        ? ((presentRecords / totalAttendanceRecords) * 100).toFixed(2)
        : 0

      stats.admin = {
        totalStudents,
        totalBrigades,
        totalBrigadeLeads,
        todayAttendance,
        overallAttendancePercentage,
        currentEvent: currentEvent ? {
          name: currentEvent.name,
          totalDays: currentEvent.eventDays.length
        } : null
      }

    } else if (user.role === 'BRIGADE_LEAD') {
      // Brigade lead dashboard statistics
      const brigades = await prisma.brigade.findMany({
        where: { leaderId: user.id },
        include: {
          students: { where: { isActive: true } }
        }
      })

      const studentIds = brigades.flatMap(b => b.students.map(s => s.id))
      
      const totalStudents = studentIds.length
      
      // Today's attendance for brigade students
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const todayEnd = new Date(today)
      todayEnd.setHours(23, 59, 59, 999)

      const todayAttendance = await prisma.attendanceRecord.count({
        where: {
          studentId: { in: studentIds },
          createdAt: {
            gte: today,
            lte: todayEnd
          },
          status: 'PRESENT'
        }
      })

      // Brigade attendance percentage
      const brigadeAttendanceRecords = await prisma.attendanceRecord.count({
        where: { studentId: { in: studentIds } }
      })
      
      const brigadePresentRecords = await prisma.attendanceRecord.count({
        where: { 
          studentId: { in: studentIds },
          status: 'PRESENT'
        }
      })

      const brigadeAttendancePercentage = brigadeAttendanceRecords > 0
        ? ((brigadePresentRecords / brigadeAttendanceRecords) * 100).toFixed(2)
        : 0

      stats.brigadeLead = {
        totalBrigades: brigades.length,
        totalStudents,
        todayAttendance,
        brigadeAttendancePercentage,
        brigades: brigades.map(b => ({
          id: b.id,
          name: b.name,
          studentCount: b.students.length
        }))
      }

    } else if (user.role === 'STUDENT') {
      // Student dashboard statistics
      const student = await prisma.student.findUnique({
        where: { userId: user.id },
        include: { brigade: true }
      })

      if (student) {
        const attendanceRecords = await prisma.attendanceRecord.findMany({
          where: { studentId: student.id },
          include: {
            eventDay: {
              include: { event: true }
            }
          }
        })

        const totalSessions = attendanceRecords.length
        const presentSessions = attendanceRecords.filter(r => r.status === 'PRESENT').length
        const attendancePercentage = totalSessions > 0 
          ? ((presentSessions / totalSessions) * 100).toFixed(2)
          : 0

        // Today's sessions
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const todayRecords = attendanceRecords.filter(r => {
          const recordDate = new Date(r.eventDay.date)
          recordDate.setHours(0, 0, 0, 0)
          return recordDate.getTime() === today.getTime()
        })

        stats.student = {
          studentInfo: {
            tempRollNumber: student.tempRollNumber,
            name: `${student.firstName} ${student.lastName}`,
            brigade: student.brigade?.name || 'No Brigade'
          },
          attendancePercentage,
          totalSessions,
          presentSessions,
          todaySessions: todayRecords.length,
          todayPresent: todayRecords.filter(r => r.status === 'PRESENT').length
        }
      }
    }

    return c.json(stats)
  } catch (error) {
    console.error('Get dashboard statistics error:', error)
    return c.json({ error: 'Failed to fetch dashboard statistics' }, 500)
  }
})

export default app