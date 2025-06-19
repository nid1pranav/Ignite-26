import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'

const app = new Hono()

// Apply authentication middleware
app.use('*', authenticateToken)

// Get all users (Admin only)
app.get('/', requireAdmin, async (c) => {
  try {
    const { page = 1, limit = 10, role, search } = c.req.query()
    const skip = (page - 1) * limit
    const prisma = c.get('prisma')

    let whereClause = { isActive: true }

    if (role) {
      whereClause.role = role
    }

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } }
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
          student: {
            select: {
              tempRollNumber: true,
              brigade: {
                select: { name: true }
              }
            }
          },
          brigadeLeadBrigades: {
            select: { id: true, name: true }
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where: whereClause })
    ])

    return c.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    })
  } catch (error) {
    console.error('Get users error:', error)
    return c.json({ error: 'Failed to fetch users' }, 500)
  }
})

// Create user (Admin only)
app.post('/', requireAdmin, async (c) => {
  try {
    const { email, password, firstName, lastName, role } = await c.req.json()
    const prisma = c.get('prisma')

    if (!email || !password || !firstName || !lastName || !role) {
      return c.json({ error: 'All fields are required' }, 400)
    }

    if (password.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400)
    }

    if (!['ADMIN', 'BRIGADE_LEAD', 'STUDENT'].includes(role)) {
      return c.json({ error: 'Invalid role' }, 400)
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return c.json({ error: 'User with this email already exists' }, 400)
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    return c.json(user, 201)
  } catch (error) {
    console.error('Create user error:', error)
    return c.json({ error: 'Failed to create user' }, 500)
  }
})

// Change own password
app.put('/change-password', async (c) => {
  try {
    const { currentPassword, newPassword } = await c.req.json()
    const user = c.get('user')
    const prisma = c.get('prisma')

    if (!currentPassword || !newPassword) {
      return c.json({ error: 'Current password and new password are required' }, 400)
    }

    if (newPassword.length < 6) {
      return c.json({ error: 'New password must be at least 6 characters' }, 400)
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id }
    })

    const isValidPassword = await bcrypt.compare(currentPassword, userRecord.password)
    if (!isValidPassword) {
      return c.json({ error: 'Current password is incorrect' }, 400)
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    return c.json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('Change password error:', error)
    return c.json({ error: 'Failed to change password' }, 500)
  }
})

export default app