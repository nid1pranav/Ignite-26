import { Hono } from 'hono'
import { authenticateToken, requireAdmin, requireAdminOrBrigadeLead } from '../middleware/auth.js'

const app = new Hono()

// Apply authentication middleware
app.use('*', authenticateToken)

// Get all brigades
app.get('/', async (c) => {
  try {
    const user = c.get('user')
    const prisma = c.get('prisma')
    
    let whereClause = { isActive: true }

    // Brigade leads can only see their own brigades
    if (user.role === 'BRIGADE_LEAD') {
      whereClause.leaderId = user.id
    }

    const brigades = await prisma.brigade.findMany({
      where: whereClause,
      include: {
        leader: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        students: {
          where: { isActive: true },
          select: { id: true, tempRollNumber: true, firstName: true, lastName: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Add student count manually since SQLite doesn't support _count with conditions
    const brigadesWithCount = brigades.map(brigade => ({
      ...brigade,
      _count: {
        students: brigade.students.length
      }
    }))

    return c.json(brigadesWithCount)
  } catch (error) {
    console.error('Get brigades error:', error)
    return c.json({ error: 'Failed to fetch brigades' }, 500)
  }
})

// Get single brigade
app.get('/:id', requireAdminOrBrigadeLead, async (c) => {
  try {
    const { id } = c.req.param()
    const user = c.get('user')
    const prisma = c.get('prisma')

    const brigade = await prisma.brigade.findUnique({
      where: { id },
      include: {
        leader: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        students: {
          where: { isActive: true },
          include: {
            user: {
              select: { id: true, email: true, isActive: true, lastLogin: true }
            }
          },
          orderBy: { tempRollNumber: 'asc' }
        }
      }
    })

    if (!brigade) {
      return c.json({ error: 'Brigade not found' }, 404)
    }

    // Check permission for brigade leads
    if (user.role === 'BRIGADE_LEAD' && brigade.leaderId !== user.id) {
      return c.json({ error: 'Access denied' }, 403)
    }

    return c.json(brigade)
  } catch (error) {
    console.error('Get brigade error:', error)
    return c.json({ error: 'Failed to fetch brigade' }, 500)
  }
})

// Create brigade (Admin only)
app.post('/', requireAdmin, async (c) => {
  try {
    const { name, leaderId } = await c.req.json()
    const prisma = c.get('prisma')

    if (!name) {
      return c.json({ error: 'Brigade name is required' }, 400)
    }

    // Check if brigade name already exists
    const existingBrigade = await prisma.brigade.findUnique({
      where: { name }
    })

    if (existingBrigade) {
      return c.json({ error: 'Brigade with this name already exists' }, 400)
    }

    // Validate leader if provided
    if (leaderId) {
      const leader = await prisma.user.findUnique({
        where: { id: leaderId, role: 'BRIGADE_LEAD', isActive: true }
      })

      if (!leader) {
        return c.json({ error: 'Invalid brigade leader' }, 400)
      }
    }

    const brigade = await prisma.brigade.create({
      data: { name, leaderId },
      include: {
        leader: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    })

    // Add empty student count
    const brigadeWithCount = {
      ...brigade,
      _count: {
        students: 0
      }
    }

    return c.json(brigadeWithCount, 201)
  } catch (error) {
    console.error('Create brigade error:', error)
    return c.json({ error: 'Failed to create brigade' }, 500)
  }
})

// Update brigade
app.put('/:id', requireAdmin, async (c) => {
  try {
    const { id } = c.req.param()
    const { name, leaderId } = await c.req.json()
    const prisma = c.get('prisma')

    const existingBrigade = await prisma.brigade.findUnique({
      where: { id }
    })

    if (!existingBrigade) {
      return c.json({ error: 'Brigade not found' }, 404)
    }

    // Check name uniqueness if name is being changed
    if (name && name !== existingBrigade.name) {
      const duplicateName = await prisma.brigade.findUnique({
        where: { name }
      })

      if (duplicateName) {
        return c.json({ error: 'Brigade with this name already exists' }, 400)
      }
    }

    // Validate leader if provided
    if (leaderId) {
      const leader = await prisma.user.findUnique({
        where: { id: leaderId, role: 'BRIGADE_LEAD', isActive: true }
      })

      if (!leader) {
        return c.json({ error: 'Invalid brigade leader' }, 400)
      }
    }

    const updateData = {}
    if (name) updateData.name = name
    if (leaderId !== undefined) updateData.leaderId = leaderId

    const brigade = await prisma.brigade.update({
      where: { id },
      data: updateData,
      include: {
        leader: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    })

    // Get student count
    const studentCount = await prisma.student.count({
      where: { brigadeId: id, isActive: true }
    })

    const brigadeWithCount = {
      ...brigade,
      _count: {
        students: studentCount
      }
    }

    return c.json(brigadeWithCount)
  } catch (error) {
    console.error('Update brigade error:', error)
    return c.json({ error: 'Failed to update brigade' }, 500)
  }
})

// Delete brigade (Admin only)
app.delete('/:id', requireAdmin, async (c) => {
  try {
    const { id } = c.req.param()
    const prisma = c.get('prisma')

    const brigade = await prisma.brigade.findUnique({
      where: { id }
    })

    if (!brigade) {
      return c.json({ error: 'Brigade not found' }, 404)
    }

    // Check if brigade has active students
    const studentCount = await prisma.student.count({
      where: { brigadeId: id, isActive: true }
    })

    if (studentCount > 0) {
      return c.json({ 
        error: 'Cannot delete brigade with active students. Please reassign or deactivate students first.' 
      }, 400)
    }

    // Soft delete
    await prisma.brigade.update({
      where: { id },
      data: { isActive: false }
    })

    return c.json({ message: 'Brigade deleted successfully' })
  } catch (error) {
    console.error('Delete brigade error:', error)
    return c.json({ error: 'Failed to delete brigade' }, 500)
  }
})

export default app