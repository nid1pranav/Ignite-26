import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'

// Import routes
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import studentRoutes from './routes/students.js'
import brigadeRoutes from './routes/brigades.js'
import eventRoutes from './routes/events.js'
import attendanceRoutes from './routes/attendance.js'
import notificationRoutes from './routes/notifications.js'
import analyticsRoutes from './routes/analytics.js'

// Import middleware
import { authenticateToken } from './middleware/auth.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors({
  origin: (origin) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://your-frontend-domain.pages.dev'
    ]
    return allowedOrigins.includes(origin) || origin?.endsWith('.pages.dev')
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

// Initialize Prisma with D1 adapter
app.use('*', async (c, next) => {
  const adapter = new PrismaD1(c.env.DB)
  const prisma = new PrismaClient({ adapter })
  c.set('prisma', prisma)
  await next()
})

// Health check
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: c.env.NODE_ENV || 'development'
  })
})

// Routes
app.route('/api/auth', authRoutes)
app.route('/api/users', userRoutes)
app.route('/api/students', studentRoutes)
app.route('/api/brigades', brigadeRoutes)
app.route('/api/events', eventRoutes)
app.route('/api/attendance', attendanceRoutes)
app.route('/api/notifications', notificationRoutes)
app.route('/api/analytics', analyticsRoutes)

// Error handling
app.onError(errorHandler)

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404)
})

export default app