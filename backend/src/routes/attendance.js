import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { requireAdminOrBrigadeLead } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get attendance records
router.get('/', async (req, res) => {
  try {
    const { eventDayId, brigadeId, session, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    let whereClause = {};

    // Role-based filtering
    if (req.user.role === 'BRIGADE_LEAD') {
      const brigades = await prisma.brigade.findMany({
        where: { leaderId: req.user.id }
      });
      const brigadeIds = brigades.map(b => b.id);
      
      whereClause.student = {
        brigadeId: { in: brigadeIds }
      };
    } else if (req.user.role === 'STUDENT') {
      whereClause.student = {
        userId: req.user.id
      };
    }

    // Filters
    if (eventDayId) {
      whereClause.eventDayId = eventDayId;
    }
    if (session) {
      whereClause.session = session;
    }
    if (brigadeId && req.user.role === 'ADMIN') {
      whereClause.student = {
        brigadeId: brigadeId
      };
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
    ]);

    res.json({
      records,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Get attendance records error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

// Mark attendance
router.post('/mark', requireAdminOrBrigadeLead, [
  body('studentId').isLength({ min: 1 }).withMessage('Student ID is required'),
  body('eventDayId').isLength({ min: 1 }).withMessage('Event day ID is required'),
  body('session').isIn(['FN', 'AN']).withMessage('Invalid session'),
  body('status').optional().isIn(['PRESENT', 'ABSENT', 'LATE']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { studentId, eventDayId, session, status = 'PRESENT' } = req.body;

    // Check if student exists and user has permission
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { brigade: true }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check permissions for brigade leads
    if (req.user.role === 'BRIGADE_LEAD') {
      const brigades = await prisma.brigade.findMany({
        where: { leaderId: req.user.id }
      });
      const brigadeIds = brigades.map(b => b.id);
      
      if (!brigadeIds.includes(student.brigadeId)) {
        return res.status(403).json({ error: 'Access denied to this student' });
      }
    }

    // Check if event day exists and is active
    const eventDay = await prisma.eventDay.findUnique({
      where: { id: eventDayId }
    });

    if (!eventDay || !eventDay.isActive) {
      return res.status(404).json({ error: 'Event day not found or inactive' });
    }

    // Check session availability
    if (session === 'FN' && !eventDay.fnEnabled) {
      return res.status(400).json({ error: 'Forenoon session is not enabled for this day' });
    }
    if (session === 'AN' && !eventDay.anEnabled) {
      return res.status(400).json({ error: 'Afternoon session is not enabled for this day' });
    }

    // Check time constraints
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM format
    const currentDate = now.toDateString();
    const eventDate = eventDay.date.toDateString();

    if (currentDate === eventDate) {
      if (session === 'FN') {
        if (currentTime < eventDay.fnStartTime || currentTime > eventDay.fnEndTime) {
          return res.status(400).json({ 
            error: `Forenoon attendance can only be marked between ${eventDay.fnStartTime} - ${eventDay.fnEndTime}` 
          });
        }
      } else if (session === 'AN') {
        if (currentTime < eventDay.anStartTime || currentTime > eventDay.anEndTime) {
          return res.status(400).json({ 
            error: `Afternoon attendance can only be marked between ${eventDay.anStartTime} - ${eventDay.anEndTime}` 
          });
        }
      }
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
        markedBy: req.user.id,
        markedAt: new Date()
      },
      create: {
        studentId,
        eventDayId,
        session,
        status,
        markedBy: req.user.id
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
    });

    // Send real-time notification
    req.io.to(`user-${student.userId}`).emit('attendance-marked', {
      record: attendanceRecord,
      message: `Attendance marked for ${session} session`
    });

    logger.info(`Attendance marked: ${student.tempRollNumber} - ${session} - ${status} by ${req.user.email}`);
    res.json(attendanceRecord);
  } catch (error) {
    logger.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// Bulk mark attendance
router.post('/bulk-mark', requireAdminOrBrigadeLead, [
  body('eventDayId').isLength({ min: 1 }).withMessage('Event day ID is required'),
  body('session').isIn(['FN', 'AN']).withMessage('Invalid session'),
  body('studentIds').isArray().withMessage('Student IDs must be an array'),
  body('status').optional().isIn(['PRESENT', 'ABSENT', 'LATE']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { studentIds, eventDayId, session, status = 'PRESENT' } = req.body;

    // Verify all students exist and user has permission
    const students = await prisma.student.findMany({
      where: { 
        id: { in: studentIds },
        isActive: true
      },
      include: { brigade: true }
    });

    if (students.length !== studentIds.length) {
      return res.status(400).json({ error: 'Some students not found' });
    }

    // Check permissions for brigade leads
    if (req.user.role === 'BRIGADE_LEAD') {
      const brigades = await prisma.brigade.findMany({
        where: { leaderId: req.user.id }
      });
      const brigadeIds = brigades.map(b => b.id);
      
      const unauthorizedStudents = students.filter(s => !brigadeIds.includes(s.brigadeId));
      if (unauthorizedStudents.length > 0) {
        return res.status(403).json({ error: 'Access denied to some students' });
      }
    }

    // Check event day
    const eventDay = await prisma.eventDay.findUnique({
      where: { id: eventDayId }
    });

    if (!eventDay || !eventDay.isActive) {
      return res.status(404).json({ error: 'Event day not found or inactive' });
    }

    // Check time constraints (same as single mark)
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5);
    const currentDate = now.toDateString();
    const eventDate = eventDay.date.toDateString();

    if (currentDate === eventDate) {
      if (session === 'FN') {
        if (currentTime < eventDay.fnStartTime || currentTime > eventDay.fnEndTime) {
          return res.status(400).json({ 
            error: `Forenoon attendance can only be marked between ${eventDay.fnStartTime} - ${eventDay.fnEndTime}` 
          });
        }
      } else if (session === 'AN') {
        if (currentTime < eventDay.anStartTime || currentTime > eventDay.anEndTime) {
          return res.status(400).json({ 
            error: `Afternoon attendance can only be marked between ${eventDay.anStartTime} - ${eventDay.anEndTime}` 
          });
        }
      }
    }

    // Bulk create/update attendance records
    const attendanceData = studentIds.map(studentId => ({
      studentId,
      eventDayId,
      session,
      status,
      markedBy: req.user.id,
      markedAt: new Date()
    }));

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
    );

    // Send notifications to affected students
    students.forEach(student => {
      if (student.userId) {
        req.io.to(`user-${student.userId}`).emit('attendance-marked', {
          message: `Attendance marked for ${session} session`
        });
      }
    });

    logger.info(`Bulk attendance marked: ${studentIds.length} students - ${session} - ${status} by ${req.user.email}`);
    res.json({ 
      message: `Attendance marked for ${results.length} students`,
      records: results
    });
  } catch (error) {
    logger.error('Bulk mark attendance error:', error);
    res.status(500).json({ error: 'Failed to mark bulk attendance' });
  }
});

// Get attendance summary for event day
router.get('/summary/:eventDayId', async (req, res) => {
  try {
    const { eventDayId } = req.params;
    const { session } = req.query;

    let whereClause = { eventDayId };

    // Role-based filtering
    if (req.user.role === 'BRIGADE_LEAD') {
      const brigades = await prisma.brigade.findMany({
        where: { leaderId: req.user.id }
      });
      const brigadeIds = brigades.map(b => b.id);
      
      whereClause.student = {
        brigadeId: { in: brigadeIds }
      };
    }

    if (session) {
      whereClause.session = session;
    }

    const records = await prisma.attendanceRecord.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            brigade: true
          }
        }
      }
    });

    // Calculate statistics
    const totalRecords = records.length;
    const presentCount = records.filter(r => r.status === 'PRESENT').length;
    const absentCount = records.filter(r => r.status === 'ABSENT').length;
    const lateCount = records.filter(r => r.status === 'LATE').length;

    // Brigade-wise statistics
    const brigadeStats = {};
    records.forEach(record => {
      const brigadeName = record.student.brigade?.name || 'No Brigade';
      if (!brigadeStats[brigadeName]) {
        brigadeStats[brigadeName] = {
          total: 0,
          present: 0,
          absent: 0,
          late: 0
        };
      }
      brigadeStats[brigadeName].total++;
      brigadeStats[brigadeName][record.status.toLowerCase()]++;
    });

    res.json({
      summary: {
        totalRecords,
        presentCount,
        absentCount,
        lateCount,
        presentPercentage: totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(2) : 0
      },
      brigadeStats,
      records
    });
  } catch (error) {
    logger.error('Get attendance summary error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance summary' });
  }
});

export default router;