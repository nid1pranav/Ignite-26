import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const app = new Hono()

// Login
app.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400)
    }

    const prisma = c.get('prisma')
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        student: {
          include: {
            brigade: true
          }
        },
        brigadeLeadBrigades: true
      }
    })

    if (!user || !user.isActive) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      c.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        student: user.student,
        brigades: user.brigadeLeadBrigades
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ error: 'Login failed' }, 500)
  }
})

// Student login with roll number
app.post('/student-login', async (c) => {
  try {
    const { tempRollNumber, password } = await c.req.json()
    
    if (!tempRollNumber || !password) {
      return c.json({ error: 'Roll number and password are required' }, 400)
    }

    const prisma = c.get('prisma')
    const student = await prisma.student.findUnique({
      where: { tempRollNumber },
      include: {
        user: true,
        brigade: true
      }
    })

    if (!student || !student.user || !student.user.isActive) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    const isValidPassword = await bcrypt.compare(password, student.user.password)
    if (!isValidPassword) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    // Update last login
    await prisma.user.update({
      where: { id: student.user.id },
      data: { lastLogin: new Date() }
    })

    const token = jwt.sign(
      { userId: student.user.id, role: student.user.role },
      c.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    return c.json({
      token,
      user: {
        id: student.user.id,
        email: student.user.email,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        role: student.user.role,
        student: {
          ...student,
          user: undefined
        }
      }
    })
  } catch (error) {
    console.error('Student login error:', error)
    return c.json({ error: 'Login failed' }, 500)
  }
})

// Get current user
app.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('authorization')
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return c.json({ error: 'Access token required' }, 401)
    }

    const decoded = jwt.verify(token, c.env.JWT_SECRET)
    const prisma = c.get('prisma')
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        student: {
          include: {
            brigade: true
          }
        },
        brigadeLeadBrigades: true
      }
    })

    if (!user || !user.isActive) {
      return c.json({ error: 'User not found' }, 404)
    }

    return c.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      student: user.student,
      brigades: user.brigadeLeadBrigades
    })
  } catch (error) {
    console.error('Get user error:', error)
    return c.json({ error: 'Failed to get user information' }, 500)
  }
})

export default app