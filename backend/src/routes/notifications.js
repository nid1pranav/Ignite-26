import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { requireAdmin } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get user notifications
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const skip = (page - 1) * limit;

    let whereClause = {
      OR: [
        { notification: { isGlobal: true } },
        { notification: { targetRole: req.user.role } },
        { userId: req.user.id }
      ]
    };

    if (unreadOnly === 'true') {
      whereClause.isRead = false;
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
    ]);

    res.json({
      notifications: userNotifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread count
router.get('/unread-count', async (req, res) => {
  try {
    const count = await prisma.userNotification.count({
      where: {
        userId: req.user.id,
        isRead: false,
        OR: [
          { notification: { isGlobal: true } },
          { notification: { targetRole: req.user.role } }
        ]
      }
    });

    res.json({ count });
  } catch (error) {
    logger.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    const userNotification = await prisma.userNotification.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!userNotification) {
      return res.status(404).json({ error: 'Notification not found' });
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
    });

    res.json(updatedNotification);
  } catch (error) {
    logger.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', async (req, res) => {
  try {
    await prisma.userNotification.updateMany({
      where: {
        userId: req.user.id,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    logger.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Create notification (Admin only)
router.post('/', requireAdmin, [
  body('title').isLength({ min: 1 }).withMessage('Title is required'),
  body('message').isLength({ min: 1 }).withMessage('Message is required'),
  body('type').optional().isIn(['INFO', 'WARNING', 'ERROR', 'SUCCESS']),
  body('targetRole').optional().isIn(['ADMIN', 'BRIGADE_LEAD', 'STUDENT']),
  body('isGlobal').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, message, type = 'INFO', targetRole, isGlobal = false, expiresAt } = req.body;

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        targetRole,
        isGlobal,
        ...(expiresAt && { expiresAt: new Date(expiresAt) })
      }
    });

    // Create user notifications for targeted users
    if (!isGlobal) {
      let targetUsers = [];
      
      if (targetRole) {
        targetUsers = await prisma.user.findMany({
          where: { role: targetRole, isActive: true },
          select: { id: true }
        });
      }

      if (targetUsers.length > 0) {
        const userNotificationData = targetUsers.map(user => ({
          userId: user.id,
          notificationId: notification.id
        }));

        await prisma.userNotification.createMany({
          data: userNotificationData
        });

        // Send real-time notifications
        targetUsers.forEach(user => {
          req.io.to(`user-${user.id}`).emit('new-notification', {
            notification,
            message: 'You have a new notification'
          });
        });
      }
    } else {
      // For global notifications, create for all active users
      const allUsers = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true }
      });

      const userNotificationData = allUsers.map(user => ({
        userId: user.id,
        notificationId: notification.id
      }));

      await prisma.userNotification.createMany({
        data: userNotificationData
      });

      // Send real-time notifications to all users
      req.io.emit('new-notification', {
        notification,
        message: 'You have a new notification'
      });
    }

    logger.info(`Notification created: ${title} by ${req.user.email}`);
    res.status(201).json(notification);
  } catch (error) {
    logger.error('Create notification error:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Get all notifications (Admin only)
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: {
              userNotifications: true
            }
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.count({ where: { isActive: true } })
    ]);

    res.json({
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Get all notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Delete notification (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Soft delete
    await prisma.notification.update({
      where: { id },
      data: { isActive: false }
    });

    logger.info(`Notification deleted: ${notification.title} by ${req.user.email}`);
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    logger.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export default router;