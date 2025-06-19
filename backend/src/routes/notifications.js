import { Hono } from 'hono'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'

const app = new Hono()

// Apply authentication middleware
app.use('*', authenticateToken)

// Get user notifications
app.get('/', async (c) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = c.req.query()
    const skip = (page - 1) * limit
    const user = c.get('user')
    const prisma = c.get('prisma')

    let whereClause = {
      OR: [
        { notification: { isGlobal: true } },
        { notification: { targetRole: user.role } },
        { userId: user.id }
      ]
    }

    if (unreadOnly === 'true') {
      whereClause.isRead = false
    }

    const [userNotifications, total] = await Promise.all([
      prisma.userNotification.findMany({
        where: whereClause,
        include: {
          notification: true
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.userNotification.count({ where: whereClause })
    ])

    return c.json({
      notifications: userNotifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    return c.json({ error: 'Failed to fetch notifications' }, 500)
  }
})

// Get unread count
app.get('/unread-count', async (c) => {
  try {
    const user = c.get('user')
    const prisma = c.get('prisma')
    
    const count = await prisma.userNotification.count({
      where: {
        userId: user.id,
        isRead: false,
        OR: [
          { notification: { isGlobal: true } },
          { notification: { targetRole: user.role } }
        ]
      }
    })

    return c.json({ count })
  } catch (error) {
    console.error('Get unread count error:', error)
    return c.json({ error: 'Failed to fetch unread count' }, 500)
  }
})

// Mark notification as read
app.put('/:id/read', async (c) => {
  try {
    const { id } = c.req.param()
    const user = c.get('user')
    const prisma = c.get('prisma')

    const userNotification = await prisma.userNotification.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!userNotification) {
      return c.json({ error: 'Notification not found' }, 404)
    }

    const updatedNotification = await prisma.userNotification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date()
      },
      include: {
        notification: true
      }
    })

    return c.json(updatedNotification)
  } catch (error) {
    console.error('Mark notification read error:', error)
    return c.json({ error: 'Failed to mark notification as read' }, 500)
  }
})

// Create notification (Admin only)
app.post('/', requireAdmin, async (c) => {
  try {
    const { title, message, type = 'INFO', targetRole, isGlobal = false, expiresAt } = await c.req.json()
    const prisma = c.get('prisma')

    if (!title || !message) {
      return c.json({ error: 'Title and message are required' }, 400)
    }

    const data = {
      title,
      message,
      type,
      targetRole,
      isGlobal
    }

    if (expiresAt) {
      data.expiresAt = new Date(expiresAt)
    }

    const notification = await prisma.notification.create({
      data
    })

    // Create user notifications for targeted users
    if (!isGlobal) {
      let targetUsers = []
      
      if (targetRole) {
        targetUsers = await prisma.user.findMany({
          where: { role: targetRole, isActive: true },
          select: { id: true }
        })
      }

      if (targetUsers.length > 0) {
        const userNotificationData = targetUsers.map(user => ({
          userId: user.id,
          notificationId: notification.id
        }))

        await prisma.userNotification.createMany({
          data: userNotificationData
        })
      }
    } else {
      // For global notifications, create for all active users
      const allUsers = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true }
      })

      const userNotificationData = allUsers.map(user => ({
        userId: user.id,
        notificationId: notification.id
      }))

      await prisma.userNotification.createMany({
        data: userNotificationData
      })
    }

    return c.json(notification, 201)
  } catch (error) {
    console.error('Create notification error:', error)
    return c.json({ error: 'Failed to create notification' }, 500)
  }
})

export default app