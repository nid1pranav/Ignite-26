import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { requireAdmin } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { isActive: true },
      include: {
        eventDays: {
          orderBy: { date: 'asc' }
        }
      },
      orderBy: { startDate: 'desc' }
    });

    res.json(events);
  } catch (error) {
    logger.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get current active event
router.get('/current', async (req, res) => {
  try {
    const now = new Date();
    
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
    });

    if (!currentEvent) {
      return res.status(404).json({ error: 'No active event found' });
    }

    // Find current day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const currentDay = currentEvent.eventDays.find(day => {
      const eventDate = new Date(day.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === today.getTime();
    });

    res.json({
      event: currentEvent,
      currentDay: currentDay || null
    });
  } catch (error) {
    logger.error('Get current event error:', error);
    res.status(500).json({ error: 'Failed to fetch current event' });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        eventDays: {
          orderBy: { date: 'asc' }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    logger.error('Get event error:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Create event (Admin only)
router.post('/', requireAdmin, [
  body('name').isLength({ min: 1 }).withMessage('Event name is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('eventDays').isArray().withMessage('Event days must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, startDate, endDate, eventDays } = req.body;

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) {
      return res.status(400).json({ error: 'End date must be after start date' });
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
      });

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
      }));

      await prisma.eventDay.createMany({
        data: eventDayData
      });

      return prisma.event.findUnique({
        where: { id: newEvent.id },
        include: {
          eventDays: {
            orderBy: { date: 'asc' }
          }
        }
      });
    });

    logger.info(`Event created: ${name} by ${req.user.email}`);
    res.status(201).json(event);
  } catch (error) {
    logger.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event (Admin only)
router.put('/:id', requireAdmin, [
  body('name').optional().isLength({ min: 1 }).withMessage('Event name cannot be empty'),
  body('startDate').optional().isISO8601().withMessage('Valid start date is required'),
  body('endDate').optional().isISO8601().withMessage('Valid end date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Validate date range if both dates provided
    if (updateData.startDate && updateData.endDate) {
      const start = new Date(updateData.startDate);
      const end = new Date(updateData.endDate);
      
      if (end <= start) {
        return res.status(400).json({ error: 'End date must be after start date' });
      }
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        ...updateData,
        ...(updateData.startDate && { startDate: new Date(updateData.startDate) }),
        ...(updateData.endDate && { endDate: new Date(updateData.endDate) })
      },
      include: {
        eventDays: {
          orderBy: { date: 'asc' }
        }
      }
    });

    logger.info(`Event updated: ${event.name} by ${req.user.email}`);
    res.json(event);
  } catch (error) {
    logger.error('Update event error:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Update event day
router.put('/days/:dayId', requireAdmin, [
  body('fnEnabled').optional().isBoolean(),
  body('anEnabled').optional().isBoolean(),
  body('fnStartTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format'),
  body('fnEndTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format'),
  body('anStartTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format'),
  body('anEndTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { dayId } = req.params;
    const updateData = req.body;

    const eventDay = await prisma.eventDay.update({
      where: { id: dayId },
      data: updateData,
      include: {
        event: true
      }
    });

    logger.info(`Event day updated: ${eventDay.date} by ${req.user.email}`);
    res.json(eventDay);
  } catch (error) {
    logger.error('Update event day error:', error);
    res.status(500).json({ error: 'Failed to update event day' });
  }
});

// Get event days
router.get('/:id/days', async (req, res) => {
  try {
    const { id } = req.params;

    const eventDays = await prisma.eventDay.findMany({
      where: { eventId: id, isActive: true },
      include: {
        _count: {
          select: {
            attendanceRecords: true
          }
        }
      },
      orderBy: { date: 'asc' }
    });

    res.json(eventDays);
  } catch (error) {
    logger.error('Get event days error:', error);
    res.status(500).json({ error: 'Failed to fetch event days' });
  }
});

// Delete event (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            eventDays: {
              where: {
                attendanceRecords: {
                  some: {}
                }
              }
            }
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if event has attendance records
    if (event._count.eventDays > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete event with attendance records. Please archive the event instead.' 
      });
    }

    // Soft delete
    await prisma.event.update({
      where: { id },
      data: { isActive: false }
    });

    logger.info(`Event deleted: ${event.name} by ${req.user.email}`);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    logger.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;