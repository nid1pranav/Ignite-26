import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { authenticateToken, requireAdminOrBrigadeLead, requireAdmin } from '../middleware/auth.js'

const app = new Hono()

// Apply authentication middleware
app.use('*', authenticateToken)

// Get all students (Admin) or brigade students (Brigade Lead)
app.get('/', async (c) => {
  try {
    const { page = 1, limit = 10, search, brigadeId } = c.req.query()
    const skip = (page - 1) * limit
    const user = c.get('user')
    const prisma = c.get('prisma')

    let whereClause = {}

    // Role-based filtering
    if (user.role === 'BRIGADE_LEAD') {
      const brigades = await prisma.brigade.findMany({
        where: { leaderId: user.id }
      })
      whereClause.brigadeId = { in: brigades.map(b => b.id) }
    }

    // Search functionality
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { tempRollNumber: { contains: search } },
        { email: { contains: search } }
      ]
    }

    // Brigade filter
    if (brigadeId) {
      whereClause.brigadeId = brigadeId
    }

    whereClause.isActive = true

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where: whereClause,
        include: {
          brigade: true,
          user: {
            select: { id: true, email: true, isActive: true, lastLogin: true }
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.student.count({ where: whereClause })
    ])

    return c.json({
      students,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    })
  } catch (error) {
    console.error('Get students error:', error)
    return c.json({ error: 'Failed to fetch students' }, 500)
  }
})

// Get single student
app.get('/:id', async (c) => {
  try {
    const { id } = c.req.param()
    const user = c.get('user')
    const prisma = c.get('prisma')

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        brigade: true,
        user: {
          select: { id: true, email: true, isActive: true, lastLogin: true, createdAt: true }
        },
        attendanceRecords: {
          include: {
            eventDay: {
              include: {
                event: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
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
        return c.json({ error: 'Access denied' }, 403)
      }
    }

    return c.json(student)
  } catch (error) {
    console.error('Get student error:', error)
    return c.json({ error: 'Failed to fetch student' }, 500)
  }
})

// Create student
app.post('/', requireAdminOrBrigadeLead, async (c) => {
  try {
    const { tempRollNumber, firstName, lastName, email, phone, brigadeId, createUserAccount } = await c.req.json()
    const user = c.get('user')
    const prisma = c.get('prisma')

    if (!tempRollNumber || !firstName || !lastName) {
      return c.json({ error: 'Roll number, first name, and last name are required' }, 400)
    }

    // Check if student already exists
    const existingStudent = await prisma.student.findUnique({
      where: { tempRollNumber }
    })

    if (existingStudent) {
      return c.json({ error: 'Student with this roll number already exists' }, 400)
    }

    // Validate brigade access for brigade leads
    if (user.role === 'BRIGADE_LEAD' && brigadeId) {
      const brigade = await prisma.brigade.findFirst({
        where: { id: brigadeId, leaderId: user.id }
      })
      
      if (!brigade) {
        return c.json({ error: 'Access denied to this brigade' }, 403)
      }
    }

    let userId = null
    
    // Create user account if requested
    if (createUserAccount && email) {
      const defaultPassword = await bcrypt.hash('student123', 10)
      const newUser = await prisma.user.create({
        data: {
          email,
          password: defaultPassword,
          role: 'STUDENT',
          firstName,
          lastName
        }
      })
      userId = newUser.id
    }

    const student = await prisma.student.create({
      data: {
        tempRollNumber,
        firstName,
        lastName,
        email,
        phone,
        brigadeId,
        userId
      },
      include: {
        brigade: true,
        user: {
          select: { id: true, email: true, isActive: true }
        }
      }
    })

    return c.json(student, 201)
  } catch (error) {
    console.error('Create student error:', error)
    return c.json({ error: 'Failed to create student' }, 500)
  }
})

// Update student
app.put('/:id', requireAdminOrBrigadeLead, async (c) => {
  try {
    const { id } = c.req.param()
    const updateData = await c.req.json()
    const user = c.get('user')
    const prisma = c.get('prisma')

    // Check if student exists and get permissions
    const existingStudent = await prisma.student.findUnique({
      where: { id },
      include: { brigade: true }
    })

    if (!existingStudent) {
      return c.json({ error: 'Student not found' }, 404)
    }

    // Check permissions for brigade leads
    if (user.role === 'BRIGADE_LEAD') {
      const brigades = await prisma.brigade.findMany({
        where: { leaderId: user.id }
      })
      const brigadeIds = brigades.map(b => b.id)
      
      if (!brigadeIds.includes(existingStudent.brigadeId)) {
        return c.json({ error: 'Access denied' }, 403)
      }
    }

    const student = await prisma.student.update({
      where: { id },
      data: updateData,
      include: {
        brigade: true,
        user: {
          select: { id: true, email: true, isActive: true }
        }
      }
    })

    return c.json(student)
  } catch (error) {
    console.error('Update student error:', error)
    return c.json({ error: 'Failed to update student' }, 500)
  }
})

// Delete student
app.delete('/:id', requireAdmin, async (c) => {
  try {
    const { id } = c.req.param()
    const prisma = c.get('prisma')

    const student = await prisma.student.findUnique({
      where: { id }
    })

    if (!student) {
      return c.json({ error: 'Student not found' }, 404)
    }

    // Soft delete
    await prisma.student.update({
      where: { id },
      data: { isActive: false }
    })

    return c.json({ message: 'Student deleted successfully' })
  } catch (error) {
    console.error('Delete student error:', error)
    return c.json({ error: 'Failed to delete student' }, 500)
  }
})

export default app